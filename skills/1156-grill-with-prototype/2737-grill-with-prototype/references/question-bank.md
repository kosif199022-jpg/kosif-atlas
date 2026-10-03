# Question bank

Parsed by `scripts/grill.py next`: `## Section` headers, then `- **ID** question — *Default:* hint`.
IDs are stable; `ledger.asked` records which have been used. The agent rephrases each for
the product at hand and always offers a concrete recommended default. Order within a
section is the usual priority; sections map to phases (Frame → Shape → Grill → Contract).

Adapted from the `wbs-prd` interview sequence plus the questions a live prototype needs
(brand, navigation, entities, first journey). Extract into the shared `requirements-grill`
skill once stable.

## Frame

- **F1** What is the single-sentence objective: who is this for and what changes for them once it exists? — *Default:* draft one from the name and let the owner correct it
- **F2** Who acts in the product, and who receives or observes the result? Name each actor. — *Default:* one primary user plus an admin, unless the product is clearly single-actor
- **F3** What existing product is this most like, and where does it deliberately differ? — *Default:* name the obvious exemplar and one difference
- **F4** How does the product reach its users: SaaS with accounts, a hosted web app for one organisation, a local or harness-driven tool, or something else? — *Default:* whichever the exemplar uses; this decides auth, billing and settings screens
- **F5** Brand feel in three words, and any colours, fonts or products whose look it should borrow? — *Default:* calm, confident, plain; blue brand, neutral surfaces, system sans
- **F6** What is explicitly out of scope for this version? — *Default:* payments, notifications, integrations and native apps until a journey needs them
- **F7** What observable result would make the whole product a success for the owner? — *Default:* one primary journey completed end to end by a real user

## Shape

- **S1** What are the main things the product is about: the nouns a user creates, browses or manages, and a few realistic example names for each? — *Default:* derive two or three entities from the objective, with fields the screens obviously need
- **S2** Which journey should work first, from trigger to the result the user can see? — *Default:* the shortest path from landing to the core value moment
- **S3** Does a first-time visitor land on a marketing page, or straight into the app? — *Default:* landing page for SaaS and content; straight in for internal tools
- **S4** Top navigation or a sidebar, and which four or five destinations belong there? — *Default:* topbar for public products, sidebar for dense internal tools
- **S5** Must users sign in, and how: email and password, magic link, single sign-on, or none? — *Default:* email plus one SSO button; none for a content site
- **S6** For the primary list screen, is it cards or a table, and which filters and sort matter? — *Default:* cards for visual entities, table for records; two or three filter chips
- **S7** What does the detail screen of the core entity show, and which actions sit on it? — *Default:* media, key facts, one primary action, one secondary
- **S8** Which forms does the first journey need, and which fields are required on each? — *Default:* the minimum fields that make the record meaningful
- **S9** Is there a dashboard or overview, and which three numbers must be on it? — *Default:* one per core entity plus a trend chart, for internal tools only
- **S10** Which settings can the user change themselves? — *Default:* profile, notifications, and one product-specific preference
- **S11** What should each empty state say and offer when there is no data yet? — *Default:* one sentence plus the primary action

## Grill

- **G1** For each journey: what information enters, what state changes, and what does the user get back? — *Default:* propose the flow from the prototype and ask what is wrong
- **G2** What demonstration, test or artifact would convince you each result is real? — *Default:* the smallest observable demo, named per requirement
- **G3** What happens on invalid, unavailable, duplicate, unsafe or partial input, and what must the user see in each case? — *Default:* inline validation, a retry path, and no silent loss of what was typed
- **G4** What is the riskiest product or integration assumption, and what evidence would make you revise the plan? — *Default:* the assumption the first journey rests on
- **G5** Which results are required now, which later, and which are out of scope? — *Default:* everything on the first journey is now; the rest is later
- **G6** Are there deadlines, irreversible decisions, migrations or compatibility promises that affect order? — *Default:* none
- **G7** Which external behaviour may still change, and who would be affected? — *Default:* none yet
- **G8** Any mandated or prohibited technologies, or systems and data that must be preserved or integrated? — *Default:* none; derive the stack later from the repository
- **G9** Hard non-functional constraints: performance targets, security, privacy, compliance, accessibility? — *Default:* WCAG AA, no personal data beyond what the journey needs
- **G10** What quality evidence must pass before any result is accepted: tests, lint, typecheck, review? — *Default:* an automated test per requirement plus lint
- **G11** What data model or ownership rule must the system enforce that no single screen shows? — *Default:* propose the entity relations implied by the spec

## Contract

- **C1** Does the requirements ledger, read top to bottom, describe the product you asked for, with the right priorities and nothing missing? — *Default:* present the ledger and ask for corrections, not approval of structure
- **C2** Which open assumptions are you happy to leave to the build, and which must be settled first? — *Default:* leave technical assumptions open; settle any that change what the user sees
