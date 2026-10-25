# ADR 0001: Skill Execution Contract and Evidence Verification

## Status
Accepted

## Context
When coding agents are given complex tasks, they frequently have access to specialized modular skills (such as Test-Driven Development, Domain Modeling, Deep Module Design, Socratic Grilling, and Systematic Debugging). 

A major failure mode in autonomous coding is **Skill Hallucination**:
The agent mentions a skill in conversation or claims to follow TDD, but in practice writes the implementation first, invents unverified assumptions, or skips the discipline entirely.

To ensure genuine engineering rigor, the workflow orchestrator must mandate explicit verification and runtime execution evidence rather than mere passive awareness.

## Decision
We enforce the **Skill Execution Contract** across all `execute` operations:

1. **Task-to-Skill Consideration Matrix**: Before taking action, the agent must evaluate the task archetype against specialized skills (e.g. `grill-with-docs`, `domain-modeling`, `codebase-design`, `tdd`, `diagnosing-bugs`, `Ponytail`).
2. **Verification of Availability**: The agent must verify whether the selected skill is installed in the current host environment.
3. **Explicit Host Invocation**: The agent must explicitly invoke the skill through the host's supported mechanism (e.g., slash command, skill loading, or prompt directive).
4. **Execution Evidence & Ledger Recording**: The agent must report hard runtime evidence (commands executed, test logs, exit codes, git diffs).
5. **Considered vs. Invoked vs. Blocked Reporting**: Completion reports must strictly distinguish between skills that were *considered*, skills that were *actively invoked*, and skills that were *blocked/unavailable*.

## Consequences
- Prevents agents from claiming adherence to methodologies without proof.
- Keeps implementations minimal and verifiable.
- Makes specialist skills actively contribute to the workflow rather than existing as inert configuration items.
