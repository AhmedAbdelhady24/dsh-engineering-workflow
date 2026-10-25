import assert from 'node:assert/strict';
import test from 'node:test';
import { createRecoveryController, apply } from '../recovery/index.js';
import { createUserMessage } from '../recovery/message.js';

const session = (id, delegationDepth = 0) => ({ id, header: { delegationDepth } });
const event = (compactionId, error) => ({
  type: 'compaction/end',
  data: { compactionId, sourceCommandId: undefined, error },
});
const accept = () => ({ kind: 'accept', messages: [] });
const reject = () => ({ kind: 'reject', messages: [] });

function harness(sessionId = 'session-a', isRoot = true) {
  const controller = createRecoveryController({
    createUserMessage,
    isRootAgent: () => isRoot,
  });
  const inbox = [];
  const agent = {
    session: session(sessionId),
    inbox: { prepend: (queue, message) => inbox.push({ queue, message }) },
  };
  return { controller, agent, inbox };
}

test('1. successful manual compaction queues one reminder', async () => {
  const { controller, agent } = harness();
  controller.onCompactionEnd(agent.session, event('manual-1'));
  const decision = await controller.preStep({ agent, signal: {} }, accept);
  assert.equal(decision.messages.length, 1);
  assert.equal(decision.messages[0].source.kind, 'engineering-recovery');
  assert.equal(decision.messages[0].source.compactionId, 'manual-1');
  assert.equal(decision.messages[0].role, 'user');
});

test('2. successful automatic 50% compaction queues one reminder', async () => {
  const { controller, agent } = harness();
  controller.onCompactionEnd(agent.session, event('auto-50'));
  const decision = await controller.preStep({ agent, signal: {} }, accept);
  assert.equal(decision.messages.length, 1);
  assert.match(decision.messages[0].content[0].text, /compaction checkpoint/i);
});

test('3. failed compaction does not queue a reminder', async () => {
  const { controller, agent } = harness();
  controller.onCompactionEnd(agent.session, event('failed-1', 'summary failed'));
  const decision = await controller.preStep({ agent, signal: {} }, accept);
  assert.equal(decision.messages.length, 0);
  assert.equal(controller.pending().length, 0);
});

test('4. multiple compaction IDs are drained exactly once', async () => {
  const { controller, agent } = harness();
  controller.onCompactionEnd(agent.session, event('multi-1'));
  controller.onCompactionEnd(agent.session, event('multi-2'));
  const first = await controller.preStep({ agent, signal: {} }, accept);
  const second = await controller.preStep({ agent, signal: {} }, accept);
  assert.equal(first.messages.length, 2);
  assert.deepEqual(
    first.messages.map((message) => message.source.compactionId).sort(),
    ['multi-1', 'multi-2'],
  );
  assert.equal(second.messages.length, 0);
  assert.equal(controller.pending().length, 0);
});

test('5. repeated delivery of the same event is deduplicated', async () => {
  const { controller, agent } = harness();
  controller.onCompactionEnd(agent.session, event('repeat-1'));
  controller.onCompactionEnd(agent.session, event('repeat-1'));
  const first = await controller.preStep({ agent, signal: {} }, accept);
  const second = await controller.preStep({ agent, signal: {} }, accept);
  assert.equal(first.messages.length, 1);
  assert.equal(second.messages.length, 0);
});

test('6. session isolation is preserved', async () => {
  const { controller, agent } = harness();
  const other = { session: session('session-b'), inbox: { prepend: () => { throw new Error('unexpected'); } } };
  controller.onCompactionEnd(agent.session, event('session-a-id'));
  controller.onCompactionEnd(other.session, event('session-b-id'));
  const a = await controller.preStep({ agent, signal: {} }, accept);
  const b = await controller.preStep({ agent: other, signal: {} }, accept);
  assert.equal(a.messages[0].source.compactionId, 'session-a-id');
  assert.equal(b.messages[0].source.compactionId, 'session-b-id');
});

test('7. canceled pre-step does not deliver and retains the reminder', async () => {
  const { controller, agent } = harness();
  controller.onCompactionEnd(agent.session, event('cancel-1'));
  const aborted = { aborted: true };
  const canceled = await controller.preStep({ agent, signal: aborted }, accept);
  assert.equal(canceled.messages.length, 0);
  assert.equal(controller.pending().length, 1);
  const delivered = await controller.preStep({ agent, signal: { aborted: false } }, accept);
  assert.equal(delivered.messages.length, 1);
});

test('8. restart/resume with no in-memory queue does not inject', async () => {
  const old = harness();
  old.controller.onCompactionEnd(old.agent.session, event('restart-1'));
  old.controller.dispose();
  const fresh = harness();
  const decision = await fresh.controller.preStep({ agent: fresh.agent, signal: {} }, accept);
  assert.equal(decision.messages.length, 0);
  assert.equal(fresh.controller.pending().length, 0);
});

test('9/10. missing or stale ledger is referenced, not read or assumed', async () => {
  const { controller, agent } = harness();
  controller.onCompactionEnd(agent.session, event('ledger-1'));
  const decision = await controller.preStep({ agent, signal: {} }, accept);
  const text = decision.messages[0].content[0].text;
  assert.match(text, /Task Recovery Ledger/);
  assert.match(text, /Git status/);
  assert.match(text, /current test evidence/);
  assert.match(text, /last verified unfinished step/);
  assert.match(text, /Do not repeat completed code changes/);
});

test('11. no recursive compaction or background/timer API is used', async () => {
  const { controller, agent } = harness();
  controller.onCompactionEnd(agent.session, event('norec-1'));
  await controller.preStep({ agent, signal: {} }, accept);
  assert.equal(typeof controller.compactNow, 'undefined');
  assert.equal(typeof controller.setTimeout, 'undefined');
});

test('12. plugin applies real lifecycle hooks only, disabled by default', () => {
  const events = [];
  const ctx = {
    on: (name, handler) => events.push({ name, handler }),
    effect: (factory, label) => {
      assert.equal(label, 'engineering-recovery lifecycle');
      const dispose = factory();
      assert.equal(typeof dispose, 'function');
      dispose();
    },
    logger: { warn: () => {} },
  };
  apply(ctx, {});
  assert.deepEqual(events, []);
  apply(ctx, { enabled: true });
  assert.deepEqual(events.map((e) => e.name), ['session/event', 'agent/pre-step']);
});

test('inbox fallback delivers through agent.inbox.prepend for rejected decisions', async () => {
  const { controller, agent, inbox } = harness();
  controller.onCompactionEnd(agent.session, event('inbox-1'));
  const decision = await controller.preStep({ agent, signal: {} }, reject);
  assert.equal(decision.kind, 'reject');
  assert.equal(inbox.length, 1);
  assert.equal(inbox[0].queue, 'next-step');
  assert.equal(inbox[0].message.source.compactionId, 'inbox-1');
  assert.equal(inbox[0].message.role, 'user');
});

test('root/subagent isolation uses durable delegationDepth', async () => {
  const root = harness('root-session', true);
  const child = harness('child-session', false);
  root.controller.onCompactionEnd(root.agent.session, event('root-compaction'));
  child.controller.onCompactionEnd(child.agent.session, event('child-compaction'));
  const childDecision = await child.controller.preStep({ agent: child.agent, signal: {} }, accept);
  const rootDecision = await root.controller.preStep({ agent: root.agent, signal: {} }, accept);
  assert.equal(childDecision.messages.length, 0);
  assert.equal(child.controller.pending().length, 0);
  assert.equal(rootDecision.messages.length, 1);
  assert.equal(rootDecision.messages[0].source.compactionId, 'root-compaction');
});

test('restart reconstruction recovers a successful compaction with no acknowledgement', async () => {
  const log = [
    { type: 'compaction/start', data: { compactionId: 'restart-id' } },
    { type: 'compaction/summary', data: { compactionId: 'restart-id' } },
    event('restart-id'),
  ];
  const restartedSession = {
    id: 'restart-session',
    header: { delegationDepth: 0 },
    seq: log.length,
    eventAt: (seq) => log[seq],
  };
  const controller = createRecoveryController({ createUserMessage });
  const agent = {
    session: restartedSession,
    inbox: { prepend: () => { throw new Error('unexpected inbox path'); } },
  };
  const decision = await controller.preStep({ agent, signal: {} }, accept);
  assert.equal(decision.messages.length, 1);
  assert.equal(decision.messages[0].source.compactionId, 'restart-id');
  assert.equal(controller.pending().length, 0);
});

test('restart reconstruction does not duplicate a durably acknowledged compaction', async () => {
  const log = [
    event('acked-id'),
    {
      type: 'user/message',
      data: { source: { kind: 'engineering-recovery', compactionId: 'acked-id' } },
    },
  ];
  const restartedSession = {
    id: 'acked-session',
    header: { delegationDepth: 0 },
    seq: log.length,
    eventAt: (seq) => log[seq],
  };
  const controller = createRecoveryController({ createUserMessage });
  const agent = { session: restartedSession, inbox: { prepend: () => {} } };
  const decision = await controller.preStep({ agent, signal: {} }, accept);
  assert.equal(decision.messages.length, 0);
});

test('partial compaction logs without a successful end do not queue', async () => {
  const log = [
    { type: 'compaction/start', data: { compactionId: 'partial-id' } },
    { type: 'compaction/summary', data: { compactionId: 'partial-id' } },
  ];
  const partialSession = {
    id: 'partial-session',
    header: { delegationDepth: 0 },
    seq: log.length,
    eventAt: (seq) => log[seq],
  };
  const controller = createRecoveryController({ createUserMessage });
  const agent = { session: partialSession, inbox: { prepend: () => {} } };
  const decision = await controller.preStep({ agent, signal: {} }, accept);
  assert.equal(decision.messages.length, 0);
  assert.equal(controller.pending().length, 0);
});
