# DivBrain Chat UX v1

Goal: make the existing `/brain` interaction feel like a modern AI chat while preserving the current server action, persistence, guardrails, sources, Cost Guard and Luna provider.

## Interaction contract

- Enter submits when the composer has non-whitespace content and no response is already pending.
- Shift+Enter inserts a newline.
- IME composition Enter must never submit.
- The submitted user message is rendered optimistically before the server action completes.
- While the server action is pending, the transcript shows a lightweight `DivBrain tänker…` state.
- The composer clears after capture of the submitted FormData, so the user can begin drafting the next message without risking loss of the submitted payload.
- The transcript scrolls to the newest optimistic/persisted content.
- Once the persisted user message is present in the refreshed transcript, the optimistic duplicate is hidden.

## Visual direction

- Keep DivLab branding; do not clone ChatGPT assets or branding.
- Use a centered conversational reading column.
- User messages may remain compact right-aligned bubbles.
- Assistant messages should read as content in the conversation rather than heavy card-within-card UI.
- Composer should feel like a floating/sticky rounded prompt box with a compact circular send control.

## Non-goals

- No provider/model changes.
- No streaming-token implementation in this version.
- No database/RLS changes.
- No changes to financial guardrails or Learning retrieval.
