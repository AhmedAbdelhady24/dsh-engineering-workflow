/**
 * Local copy of the installed DSH 0.2.1-rc.3 createUserMessage contract.
 *
 * A profile-local bundle cannot reliably resolve @deepseek-ai/dsh-llm from its
 * real package path, so this keeps the same message shape: a cloned input with
 * a fresh identity, role "user", and a deeply frozen result.
 */
import { randomUUID } from 'node:crypto';

function deepFreeze(value) {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value;
  for (const child of Object.values(value)) deepFreeze(child);
  return Object.freeze(value);
}

export function createUserMessage(input) {
  return deepFreeze(structuredClone({
    ...input,
    id: randomUUID(),
    role: 'user',
  }));
}
