# Facilitator notes — Day 4 EventHub starter

For trainers only. Delegates should use `README.md` and `USER_GUIDE.md`, plus the challenge brief you hand out.

## Alignment sources

- Challenge product brief: `/cursor/stores/self/docs/day4-eventhub-brief.md`
- Micro alignment (skills / agents / exceptions / human control): `/cursor/stores/self/docs/day4-micro-alignment.md`
- Elite agents PDF: `/cursor/stores/self/docs/QABAIDSGC-M-Build-Elite-AI-Agent-Teams.pdf`

## Day 4 flow (summary)

1. **Understand** — Repository Discovery Report on this starter  
2. **Specify** — Feature Spec including unanswered questions  
3. **Plan** — UI / API / domain / persistence / tests breakdown  
4. **Skills** — teams choose reusable skills (assess what and why)  
5. **Agent team** — justified roles, boundaries, human-owned decisions  
6. **Implement** — group bookings + waitlists; keep individual booking green  
7. **Trainer event cards** — mid-day facilitation prompts (below)  
8. **Independent validation** — validator must not silently fix production code  
9. **Human release decision**

Micro learning journey (design team → implement roles → connect handoffs → exceptions → retain human control) follows QABAIDSGC-M; Day 4 applies it to **EventHub**, not remediation or observability labs.

## What this starter provides

- Working individual booking (browse, capacity, book, cancel, my bookings)
- React → Node → SQLite; `npm install` && `npm run dev`
- Seeded events/sessions with varied capacity and existing bookings
- 40 automated tests as regression bait
- Explicit TODOs for groups/waitlists — **no** partial implementations

## Ambiguities — do not pre-answer

Hold stakeholder answers until teams **CLARIFY**:

| Topic | Do not volunteer |
| --- | --- |
| Partial availability (e.g. 20 capacity, 17 booked, request 4) | Groups stay together / never partially allocate — reveal only when asked |
| Waitlist fairness (3 free; queue 4, 1, 5) | Order vs first-that-fits — reveal only when asked |
| Explainability of waitlist allocation | Teams must design how stakeholders see *why* |

Point teams at the brief; resist solving the product for them.

## Mid-day event cards (facilitation prompts only)

These are **trainer interventions**, not in-app features. Use verbally or as printed cards.

1. **Cancellation skip behaviour** — A cancellation frees seats that could promote someone from the waitlist. Prompt: who gets promoted, and what evidence shows why someone was skipped?  
2. **Race overbooking** — Concurrent booking requests near capacity. Prompt: can the system over-allocate? What test proves it cannot?  
3. **Agent scope creep** — An agent starts “helpfully” implementing unrelated UI polish or changing individual-booking rules. Prompt: which exception route (CLARIFY / ESCALATE / REVISE / STOP) and who owns the decision?

Do not ship these as product toggles in the starter.

## Facilitator check before Day 4

- [ ] `npm install` && `npm test` pass on a clean machine (Node 22+)
- [ ] `npm run dev` serves UI + API; seed data visible
- [ ] Challenge brief and assessment criteria ready for handout
- [ ] Skills/agents are **not** pre-seeded with the solution
- [ ] Plan at least one REVISE and one ESCALATE/STOP exercise
- [ ] Human decision artefact is typed by a named person

## Handing to delegates

Zip or clone `docs/day4-starter/`. Tell them: product works; extend per brief; existing tests are the contract for individual booking; ask stakeholders when rules are unclear.
