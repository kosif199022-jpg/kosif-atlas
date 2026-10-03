# Discovery Loop

Uncover enough context to write a concrete use case by targeting four
gaps. Pick the gap that is currently least clear and ask one focused
question; do not ask more than one question per turn.

- **What's happening now?** Current situation, trigger, surrounding work.
- **Who's involved?** People and systems participating → actors.
- **What should change?** The desired actor action or system response → flow.
- **What does success look like?** The observable outcome the actor expects.

Follow the conversation naturally. Stop probing a gap once it is
concrete enough to draft a use case at the right level of abstraction
(see the **Abstraction discipline** section of the `usecase`
authoring contract).

## Actor capture

When the conversation reveals a new actor (person or system the use
case will name in the `Actors` section):

1. Confirm with the user — name, type (`person` / `system`), short
   description, and the privilege level the actor needs for this use
   case if relevant.
2. Locate the project's actors registry — the actors authoring
   contract is bundled with `spectrack mustread --type usecase --side
   issue`. Resolve the page path with
   `spectrack prd_path actors`.
3. If the actor is already on the registry, reuse the canonical name
   verbatim across this and future use case issues.
4. If the actor is missing, pick a canonical name that fits the
   registry's naming conventions and list it in the use case issue
   body's `Actors` section; do not write identity into the issue
   body. The wrap-up `usecase-reviewer` surfaces the
   missing-from-registry alignment as a `review` item.

**Do not edit the actors page from this skill** — the skill's
surface is issue-only.

## Anti-patterns

- Asking two or three questions at once because they feel related.
  Pick the most load-bearing one.
- Drilling into implementation ("which database?", "REST or
  WebSocket?"). Those belong in `spec`, `architecture`, or
  implementation tasks, not in use case discovery.
- Naming actors by their job title alone ("the user") when the
  privilege level or the specific role matters for what they can do
  in the flow.
