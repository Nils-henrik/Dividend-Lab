# Prompt Standard v1.0

This document answers: **How should implementation requests be written?**

All future Cursor prompts for Dividend Lab should follow this engineering specification format. Consistent prompts produce consistent, reviewable results.

---

## Purpose

A well-written prompt should give an implementer (human or AI) enough context to:

- understand the product goal
- know what must not change
- identify affected files
- validate the result
- know when the task is complete

---

## Required Sections

Every implementation prompt should include these sections:

### 1. Title

A clear, scoped title.

Format: `Dividend Lab – [Feature/Area] [Version or Pass]`

Example: `Dividend Lab – Investor Identity Privacy Refinement v1.0`

### 2. Before Writing Any Code

List documentation that must be read first:

- `docs/README.md`
- relevant `docs/project/` documents
- relevant `docs/design/` documents
- relevant `docs/standards/` documents
- relevant `docs/ai/` documents

State explicit constraints (e.g. "do not modify application functionality", "documentation only").

### 3. Objective

One paragraph explaining what should exist when the task is done. Focus on outcome, not implementation.

### 4. Scope

What is included and what is explicitly excluded.

### 5. Requirements

Numbered or bulleted functional and non-functional requirements. Be specific enough to verify.

### 6. Constraints

Hard rules:

- preserve existing design unless stated
- no unrelated refactors
- no new dependencies unless justified
- no breaking changes unless approved

### 7. Files (Expected)

List files likely to be created or modified. Use "expected" language when uncertain.

### 8. Acceptance Criteria

Checklist that defines completion. Each item should be verifiable.

### 9. Deliverables

What the implementer should report after completion (summary, risks, validation results).

---

## Writing Style

- use complete sentences
- be direct and specific
- prefer product language over implementation jargon where possible
- state what must not happen, not only what must happen
- one task per prompt; split large work into phases
- version significant passes (v1.0, v1.1, Polish Pass)

Avoid:

- vague goals ("make it better")
- mixing unrelated tasks
- assuming historical context without referencing docs
- contradictory requirements

---

## Expectations

Implementers should:

1. read required documentation before editing
2. inspect existing code before creating new abstractions
3. reuse existing components
4. modify only necessary files
5. validate with TypeScript, ESLint and build when code changes
6. explain what changed, why and any risks

For large changes, explain the plan before implementation unless the prompt says to proceed immediately.

---

## Deliverables

After implementation, report:

1. summary of what changed
2. files created, modified or removed
3. validation results (lint, TypeScript, build)
4. risks or follow-up items
5. confirmation against acceptance criteria

---

## Acceptance Criteria Template

```markdown
## Acceptance Criteria

The task is complete only if:

- [ ] [Specific verifiable outcome]
- [ ] [Design preserved / specific UI behavior]
- [ ] [No unrelated changes]
- [ ] [Validation passes]
- [ ] [Documentation updated if required]
```

Every criterion must be testable. "Looks good" is not a criterion. "Sidebar expands on hover without layout shift" is.

---

## Example Prompt Skeleton

```markdown
# Dividend Lab – [Title] v1.0

## Before writing any code

Read: docs/README.md, docs/design/DESIGN_SYSTEM.md, docs/standards/UI_UX_STANDARD.md

Do not modify unrelated files.

## Objective

[One paragraph]

## Requirements

1. ...
2. ...

## Constraints

- Preserve existing design language
- No new dependencies

## Acceptance Criteria

- [ ] ...
- [ ] TypeScript and ESLint pass
- [ ] Production build succeeds

## Deliverables

1. Summary of changes
2. Risks
3. Validation results
```

---

## Final Rule

If a prompt cannot be verified against acceptance criteria, it is not ready to implement.
