# Task Execution Log

- **Task ID**: `{{TASK_ID}}`
- **Objective**: {{TASK_OBJECTIVE}}
- **Started**: {{START_TIMESTAMP_UTC}}
- **Status**: {{STATUS}} <!-- IN_PROGRESS | COMPLETED | BLOCKED | REVISED -->
- **Target Branch**: `{{TARGET_BRANCH}}`
- **Base Commit**: `{{BASE_COMMIT_SHA}}`

---

## 1. Milestones & Vertical Slices

| # | Milestone Description | Acceptance Criteria | Status | Verification Command |
| :-: | :--- | :--- | :-: | :--- |
| 1 | {{SLICE_1_DESCRIPTION}} | {{SLICE_1_CRITERIA}} | [x] | `{{SLICE_1_CMD}}` |
| 2 | {{SLICE_2_DESCRIPTION}} | {{SLICE_2_CRITERIA}} | [ ] | `{{SLICE_2_CMD}}` |
| 3 | {{SLICE_3_DESCRIPTION}} | {{SLICE_3_CRITERIA}} | [ ] | `{{SLICE_3_CMD}}` |

---

## 2. Skills & Capabilities Invoked

- **Specialist Skills Considered**:
  - `{{SKILL_CONSIDERED_1}}` (Trigger: {{TRIGGER_REASON}})
  - `{{SKILL_CONSIDERED_2}}` (Trigger: {{TRIGGER_REASON}})
- **Specialist Skills Actively Invoked**:
  - `{{SKILL_INVOKED_1}}` (Method: {{INVOCATION_METHOD}}, Evidence: {{EVIDENCE_REF}})
- **Skills Missing / Blocked (Fallbacks Applied)**:
  - {{NONE_OR_SKILL_NAME_AND_FALLBACK}}

---

## 3. Chronological Session Execution History

### [{{TIMESTAMP}}] Phase: {{PHASE_NAME}}
- **Action**: {{DESCRIPTION_OF_ACTION}}
- **Files Modified**:
  - `{{PATH_TO_FILE}}` ({{CHANGE_SUMMARY}})
- **Test Executed**: `{{TEST_COMMAND}}`
  - Result: `{{RESULT_SUMMARY}}` (Exit: {{EXIT_CODE}})
- **Review Notes**: {{REVIEW_NOTES_OR_NONE}}

---

## 4. Current Blockers & Open Items

- [ ] {{OPEN_ITEM_1}}
- [ ] {{OPEN_ITEM_2}}

---

## 5. Next Unfinished Action

- `{{NEXT_ACTION_DESCRIPTION}}`
