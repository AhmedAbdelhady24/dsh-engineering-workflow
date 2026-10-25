/**
 * engineering-recovery — one-shot post-compaction recovery reminder.
 *
 * Observes successful compaction session events and injects at most one
 * advisory user message per compaction ID at the next agent/pre-step.
 *
 * Root agents are identified through the live DSH Agent registry
 * (`ctx.agents.roots()`), not through assumptions about the session header.
 * Subagents are never injected even though their successful compaction events
 * may pass the queue listener.
 *
 * After a restart, pending successful compactions are reconstructed from the
 * native session log. The recovery user message itself is the durable
 * acknowledgement: a compaction/end with a matching engineering-recovery
 * user/message source is not delivered again.
 *
 * The native compaction engine is never called or modified.
 */
import { createUserMessage } from './message.js';

export const name = 'engineering-recovery';
export const inject = ['agents'];

const REMINDER = [
  'A compaction checkpoint has completed.',
  '',
  'Before continuing:',
  '1. If `.dsh/checkpoints/<session-id>.md` exists, read the Task Recovery Ledger first.',
  '2. Reconcile the ledger against actual Git status, the current diff and current test evidence.',
  '3. Continue from the last verified unfinished step. Do not repeat completed code changes.',
  '4. Do not treat the summary as proof that tests passed; verify before claiming completion.',
  '5. If the ledger is missing or stale, use the native summary and current files as the recovery basis.',
].join('\n');

/**
 * Create the recovery controller independently of a running Host so the queue,
 * durable-log reconstruction and delivery rules can be exercised by tests.
 *
 * @param {object} options
 * @param {(input: {content: Array<{type: string, text: string}>, source: object}) => object} options.createUserMessage
 * @param {(agent: object) => boolean} [options.isRootAgent] live root-agent predicate
 * @returns {{onCompactionEnd: Function, preStep: Function, dispose: Function, pending: Function, reconstruct: Function}}
 */
export function createRecoveryController({
  createUserMessage: makeMessage,
  isRootAgent = () => true,
}) {
  const pendingBySession = new Map();
  const delivered = new Set();
  const initialized = new Set();
  let disposed = false;

  const queue = (sessionId, compactionId) => {
    if (delivered.has(compactionId)) return;
    let ids = pendingBySession.get(sessionId);
    if (ids === undefined) {
      ids = [];
      pendingBySession.set(sessionId, ids);
    }
    if (!ids.includes(compactionId)) ids.push(compactionId);
  };

  const onCompactionEnd = (session, event) => {
    if (disposed || !session || !event) return;
    if (event.type !== 'compaction/end') return;
    if (event.data?.error !== undefined) return;
    const compactionId = event.data?.compactionId;
    if (typeof compactionId !== 'string' || compactionId.length === 0) return;
    queue(session.id, compactionId);
  };

  /**
   * Reconstruct only successful compactions that have no durable recovery
   * acknowledgement. Partial start/summary events without a successful end are
   * ignored. This runs once per root Session in a process.
   */
  const reconstruct = (session) => {
    if (disposed || initialized.has(session.id)) return;
    initialized.add(session.id);
    if (typeof session.seq !== 'number' || typeof session.eventAt !== 'function') return;

    const ends = [];
    const acknowledged = new Set();
    try {
      for (let seq = 0; seq < session.seq; seq += 1) {
        const event = session.eventAt(seq);
        if (event?.type === 'compaction/end' && event.data?.error === undefined) {
          const id = event.data?.compactionId;
          if (typeof id === 'string' && id.length > 0) ends.push(id);
        }
        if (
          event?.type === 'user/message'
          && event.data?.source?.kind === 'engineering-recovery'
          && typeof event.data.source.compactionId === 'string'
        ) {
          acknowledged.add(event.data.source.compactionId);
        }
      }
    } catch {
      // A log read failure must never disturb the native step.
      return;
    }

    for (const compactionId of ends) {
      if (!acknowledged.has(compactionId)) queue(session.id, compactionId);
    }
  };

  const preStep = async ({ agent, signal }, next) => {
    if (disposed || !agent?.session) return next();
    if (!isRootAgent(agent)) {
      // A subagent may compact independently. Its advisory reminder must not
      // leak into that child or into a parent.
      pendingBySession.delete(agent.session.id);
      return next();
    }

    // Reconstruct before the step so a post-restart root can recover even
    // when the next admitted step is its first work after resumption.
    reconstruct(agent.session);
    const decision = await next();
    if (disposed || signal?.aborted) return decision;

    const sessionId = agent.session.id;
    const ids = pendingBySession.get(sessionId);
    if (ids === undefined || ids.length === 0) return decision;

    // Drain every pending successful compaction ID at this safe step. Delivering
    // only ids[0] can strand reminders when several compactions occur inside one
    // step and the turn ends before another pre-step.
    const messages = [];
    const deliveredIds = [];
    for (const compactionId of [...ids]) {
      try {
        messages.push(makeMessage({
          content: [{ type: 'text', text: REMINDER }],
          source: { kind: 'engineering-recovery', compactionId },
        }));
        deliveredIds.push(compactionId);
      } catch {
        // Keep that ID pending; do not disturb the native step.
      }
    }
    if (messages.length === 0) return decision;

    const removeDelivered = () => {
      for (const compactionId of deliveredIds) {
        const index = ids.indexOf(compactionId);
        if (index !== -1) ids.splice(index, 1);
        delivered.add(compactionId);
      }
      if (ids.length === 0) pendingBySession.delete(sessionId);
    };

    // Deliver in the accepted current step when the loop exposes its messages.
    // Fall back to the durable next-step inbox for rejected/empty decisions.
    if (decision?.kind !== 'reject' && Array.isArray(decision?.messages)) {
      removeDelivered();
      return { ...decision, messages: [...decision.messages, ...messages] };
    }

    const queued = [];
    try {
      for (const message of messages) {
        agent.inbox.prepend('next-step', message);
        queued.push(message.source.compactionId);
      }
    } catch {
      // Remove only the IDs whose messages reached the inbox; the remainder
      // stays pending for the next safe step.
      for (const compactionId of queued) {
        const index = ids.indexOf(compactionId);
        if (index !== -1) ids.splice(index, 1);
        delivered.add(compactionId);
      }
      if (ids.length === 0) pendingBySession.delete(sessionId);
      return decision;
    }
    removeDelivered();
    return decision;
  };

  return {
    onCompactionEnd,
    reconstruct,
    preStep,
    dispose() {
      disposed = true;
      pendingBySession.clear();
      delivered.clear();
      initialized.clear();
    },
    pending() {
      return [...pendingBySession.entries()].map(([sessionId, ids]) => [sessionId, [...ids]]);
    },
  };
}

export function apply(ctx, config = {}) {
  const enabled = config.enabled === true || process.env.DSH_ENGINEERING_RECOVERY_TEST === '1';
  if (!enabled) return;

  const agentId = (candidate) => candidate?.id ?? candidate?.agent?.id;
  const isRootAgent = (agent) => {
    try {
      const roots = ctx.agents.roots();
      return roots.some((root) => agentId(root) === agentId(agent));
    } catch {
      return false;
    }
  };

  const controller = createRecoveryController({ createUserMessage, isRootAgent });
  const onCompactionEnd = (session, event) => {
    try {
      controller.onCompactionEnd(session, event);
    } catch {
      // Recovery is advisory; never disturb session handling.
    }
  };
  const onPreStep = (input, next) => controller.preStep(input, next);

  ctx.on('session/event', onCompactionEnd);
  ctx.on('agent/pre-step', onPreStep);
  ctx.effect(() => () => controller.dispose(), 'engineering-recovery lifecycle');
}
