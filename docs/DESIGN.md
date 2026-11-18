# Design Direction

KATALYST is a technical learning studio for curious builders. Its visual language needs to make software, hardware, circuits, data, AI, and creative tools feel like parts of one place. The Home screen presents one learning loop and one shared visual system instead of treating programming as the whole product.

The interface uses a quiet, high-contrast canvas, fine borders, compact labels, and clear content hierarchy. One geometric K mark is defined in `src/components/brand-mark.tsx` and reused throughout the app and its SVG icon. Branding is not configurable in Settings.

## Theme tokens

The final semantic theme layer is at the end of `src/app/globals.css`. It intentionally follows the rest of the stylesheet so older component declarations cannot override the selected theme.

| Role | Light | Dark |
| --- | --- | --- |
| Canvas | `#fafafa` | `#09090b` |
| Cards and panels | `#ffffff` | `#111216` |
| Secondary surfaces and inputs | `#f4f5f7` / `#f1f5f9` | `#18181d` |
| Borders | `#e4e4e7` | `rgba(255, 255, 255, 0.08)` |
| Primary text | `#09090b` | `#fafafa` |
| Body text | `#18181b` | `#e4e4e7` |
| Muted text | `#3f3f46` | `#a1a1aa` |
| Accent | `#2563eb` | `#38bdf8` |

The dark Home canvas adds a faint 24px dot grid. Dark panels use near-black graphite surfaces and hairline borders. Focus and hover states use the accent tokens. Theme values are semantic so the same component works in Light, Dark, and System modes.

## Type and motion

Geist is the application sans-serif and JetBrains Mono is used for compact indexes, status labels, and technical metrics. Headings use tight tracking; normal content favors readable line lengths and strong body contrast. Motion is brief and communicates state or flow. The animated Home diagram respects `prefers-reduced-motion`.

## Home and navigation

Learning Home combines a concise introduction, a reusable resume action, a featured-track grid, mastery telemetry, and direct links into the course catalog and Playground. Its animated SVG shows one path from exploration through lessons and labs to ideas in action, with an interactive constellation spanning the published learning fields. The diagram does not imply that every course runs in a compiler or that AI requests execute locally.

Course details expand beside the course list so learners can inspect outcomes and start from the same location. Lessons keep their navigation controls compact while the theory, optional tools, and Kat tutor occupy the available workspace. The tutor and compiler can be opened or closed independently.

## Settings and responsive behavior

Settings uses the full workspace width. Tables retain readable cell padding, sticky headers, and a pinned final action column when a table must scroll horizontally. Account settings show account state and data controls; authentication itself lives on the single `/login` page.

The shell adapts its navigation and provider/model controls to narrow screens without horizontal overflow. Interactive controls remain keyboard reachable, have visible focus, and use labels that describe their action. Color is not the only indicator of state.

## Playground and lessons

The Playground opens with a launcher grid. Selecting a tool reveals one focused lab and a compact switcher; dedicated hardware and circuit simulators avoid unrelated tabs. Programming runtimes execute in their documented browser environments. Browser execution does not mean that every AI request is local: AI prompts go through the selected provider route when the learner sends them.

The lesson reader prioritizes theory and lets learners open the compiler or Kat when needed. Course and lesson content is authored separately from presentation components; progress remains separate from course source data.
