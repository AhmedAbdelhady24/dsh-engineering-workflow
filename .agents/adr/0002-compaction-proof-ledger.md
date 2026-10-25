# ADR 0002: Compaction-Proof Engineering Ledger

## Status
Accepted

## Context
Coding agents operate under finite LLM context windows. In long-running development tasks, the host environment compacts, truncates, or summarizes earlier messages to free tokens. 

This causes **Post-Compaction Amnesia**:
- The agent forgets architectural decisions made in earlier turns.
- The agent duplicates already completed work.
- The agent undoes previously fixed bugs or violates newly established invariants.

## Decision
We enforce persistent, repository-resident ledger files (`TASK_LOG.md` and `RECOVERY_LEDGER.md`):

1. **State Preservation**: Every session state, test baseline, active branch, and incremental milestone is written to disk.
2. **Deterministic Checkpoints**: Checkpoints are updated after every verified task slice.
3. **Reconciliation Protocol**: Upon session resumption or detected context compaction, the agent must inspect `RECOVERY_LEDGER.md` before performing any write operations.
4. **Zero Redundant Work**: The agent reconciles disk status with the ledger to resume immediately from the last incomplete item without re-running finished steps.

## Consequences
- Long-running multi-turn sessions remain stable and resilient.
- Human developers can inspect progress asynchronously via markdown documents.
- Context compaction becomes a non-destructive event.
