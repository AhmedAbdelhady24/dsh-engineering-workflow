/**
 * engineering-recovery — v0.2.0 baseline (one-shot post-compaction reminder).
 *
 * This snapshot intentionally lacks v0.2.1 root/subagent isolation and durable
 * restart reconstruction. It is retained only for rollback comparison.
 */
import { createUserMessage } from './message.js';

export const name = 'engineering-recovery';
export const inject = [];

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

export function createRecoveryController({ createUserMessage: makeMessage }) {
  const pendingBySession = new Map();
  const delivered = new Set();
  let disposed = false;

  const onCompactionEnd = (session, event) => {
    if (disposed || !session || !event) return;
    if (event.type !== 'compaction/end') return;
    if (event.data?.error !== undefined) return;
    const compactionId = event.data?.compactionId;
    if (typeof compactionId !== 'string' || compactionId.length === 0) return;
    if (delivered.has(compactionId)) return;
    let queue = pendingBySession.get(session.id);
    if (queue === undefined) {
      queue = [];
      pendingBySession.set(session.id, queue);
    }
    if (!queue.includes(compactionId)) queue.push(compactionId);
  };

  const preStep = async ({ agent, signal }, next) => {
    const decision = await next();
    if (disposed || signal?.aborted || !agent?.session) return decision;
    const queue = pendingBySession.get(agent.session.id);
    if (queue === undefined || queue.length === 0) return decision;
    const compactionId = queue[0];
    let message;
    try {
      message = makeMessage({
        content: [{ type: 'text', text: REMINDER }],
        source: { kind: 'engineering-recovery', compactionId },
      });
    } catch {
      return decision;
    }
    if (decision?.kind !== 'reject' && Array.isArray(decision?.messages)) {
      queue.shift();
      if (queue.length === 0) pendingBySession.delete(agent.session.id);
      delivered.add(compactionId);
      return { ...decision, messages: [...decision.messages, message] };
    }
    try {
      agent.inbox.prepend('next-step', message);
    } catch {
      return decision;
    }
    queue.shift();
    if (queue.length === 0) pendingBySession.delete(agent.session.id);
    delivered.add(compactionId);
    return decision;
  };

  return {
    onCompactionEnd,
    preStep,
    dispose() {
      disposed = true;
      pendingBySession.clear();
      delivered.clear();
    },
    pending() {
      return [...pendingBySession.entries()].map(([sessionId, ids]) => [sessionId, [...ids]]);
    },
  };
}

export function apply(ctx, config = {}) {
  const enabled = config.enabled === true || process.env.DSH_ENGINEERING_RECOVERY_TEST === '1';
  if (!enabled) return;
  const controller = createRecoveryController({ createUserMessage });
  const onCompactionEnd = (session, event) => {
    try { controller.onCompactionEnd(session, event); } catch { /* advisory */ }
  };
  const onPreStep = (input, next) => controller.preStep(input, next);
  ctx.on('session/event', onCompactionEnd);
  ctx.on('agent/pre-step', onPreStep);
  ctx.effect(() => () => controller.dispose(), 'engineering-recovery lifecycle');
}
