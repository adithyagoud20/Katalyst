# Design direction

KATALYST is an engineering learning environment for focused study. Its visual identity keeps the deep-green navigation, warm paper surfaces, restrained signal color, system sans body text, and editorial Georgia headings. Learning structure—not provider controls or a blank composer—sets the page hierarchy.

The curriculum map, lesson, and connected C playground are the main visual objects. Path objectives, module structure, checkpoint prompts, worked code, and evidence-based progress give each screen a subject-specific purpose. The playground carries a lesson example into an editable source file, accepts program input, and returns the learner to the same lesson. Projects, general chat, skills, and provider configuration remain accessible as workspace tools.

## Tokens

| Role | Token | Value |
| --- | --- | --- |
| App canvas | --canvas | #F5F5F1 |
| Primary surface | --paper | #FFFEFA |
| Main text | --ink | #202D2B |
| Workspace sidebar | --forest | #183D37 |
| Signal | --signal | #DB6947 |
| Secondary signal | --blue | #496981 |

## Type and layout

Body and control copy use the local system sans stack to avoid fetching fonts. Editorial Georgia headings create an academic tone without changing the underlying app palette. Desktop uses a fixed deep-green navigation rail; small screens turn it into an accessible slide-in menu. Lessons use a readable content column with a curriculum map and contextual Kat drawer. The C playground uses an editor and output console sized for the work, monospace code, direct run/stop states, visible compiler diagnostics, and input controls. Code and tables can scroll within their own boundaries on narrow screens.

~~~text
┌─────────────────────────┬──────────────────────────────────────────────┐
│ Learning Home           │ Learn by understanding                       │
│ Explore Learning Paths  │ C source code → compile → run                 │
│ My Learning             │                                              │
│ Practice Lab            │ C Programming Foundations                    │
│ Progress                │ Continue a real lesson or begin the path      │
│ AI Tutor · Settings     │ Practice and recent activity                  │
│                         │                                              │
│ Workspace tools         │                                              │
│ Workspace · Skills      │                                              │
└─────────────────────────┴──────────────────────────────────────────────┘
~~~

## Interaction principles

- Lead with real learning content; new learners get a clear first path, not fabricated statistics.
- Mark progress only from explicit enrollment and lesson completion actions.
- Keep tutor mode, model provider, and curriculum visible without turning the lesson into ordinary chat.
- Let a learner open a lesson's C example in the playground and return through a breadcrumb or browser history without losing the local draft.
- Keep credential setup explicit and separate from the coding agent's account.
- Let people inspect a skill before enabling it and show which skills travel with a workspace request.
- Use visible focus, semantic controls, live request errors, and reduced motion.
- On mobile, keep the learning navigation temporary and let code, tables, and curriculum maps scroll inside their own regions.
