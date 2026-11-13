# Design Direction

KATALYST is an engineering learning environment for focused, distraction-free technical study. Its visual identity provides a high-contrast modern engineering workspace with crisp typographic hierarchy, deep graphite code editors, and responsive layouts that look clean and purposeful in both Light and Dark modes.

The curriculum map, lesson reader, unified multi-language Playground, and contextual Kat AI tutor form the core surfaces. Path objectives, module structures, checkpoint challenges, runnable code snippets, and evidence-based progress give each screen a subject-specific engineering focus.

---

## Design Tokens

### Light Mode

| Role | Token | Value | Purpose |
| --- | --- | --- | --- |
| App canvas | `--surface-canvas` / `--canvas` | `#f8fafc` | Base background behind panels and shell |
| Primary surface | `--surface-primary` / `--paper` | `#ffffff` | Content cards, reading pane, active panels |
| Secondary surface | `--surface-secondary` | `#f1f5f9` | Toolbars, navigation headers, sidebars |
| Border subtle | `--border-subtle` / `--line` | `#e2e8f0` | Dividers and card contours |
| Border strong | `--border-strong` / `--line-strong` | `#cbd5e1` | Inputs, selected states, and focus rings |
| Main text | `--text-primary` / `--ink` | `#0f172a` | High-contrast body text and headings (ratio > 14:1) |
| Secondary text | `--text-secondary` | `#334155` | Explanations, metadata, and lesson descriptions |
| Accent primary | `--accent-primary` | `#2563eb` | Precision blue for highlights, active tabs, and focus |
| Accent hover | `--accent-hover` | `#1d4ed8` | Accent hover state |
| Action button | `--action-primary-bg` | `#2563eb` | Precision blue CTA background (5.21:1 contrast with white text) |
| Action button hover | `--action-primary-hover` | `#1d4ed8` | Precision blue CTA hover state |
| Code surface | `--surface-code` | `#0d1117` | CodeMirror editor and terminal background |
| Code header | `--surface-code-header` | `#161b22` | Editor and terminal toolbar background |

### Dark Mode

| Role | Token | Value | Purpose |
| --- | --- | --- | --- |
| App canvas | `--surface-canvas` / `--canvas` | `#0b0e14` | Deep obsidian base canvas |
| Primary surface | `--surface-primary` / `--paper` | `#111620` | Cards, reading panel, active tab content |
| Secondary surface | `--surface-secondary` | `#161c28` | Navigation bar, header strips, toolbars |
| Border subtle | `--border-subtle` / `--line` | `#263042` | Crisp division lines with no muddy brown casts |
| Border strong | `--border-strong` / `--line-strong` | `#374151` | Subtle elevation and active border outlines |
| Main text | `--text-primary` / `--ink` | `#f8fafc` | Maximum contrast white text (ratio > 15:1) |
| Secondary text | `--text-secondary` | `#cbd5e1` | Crisp muted text (ratio > 9:1 against primary surface) |
| Accent primary | `--accent-primary` | `#3b82f6` | Precision blue for active states, indicators, and focus rings |
| Accent hover | `--accent-hover` | `#60a5fa` | Accent hover state |
| Action button | `--action-primary-bg` | `#3b82f6` | Precision blue action button with dark text (5.18:1 contrast) |
| Action button hover | `--action-primary-hover` | `#60a5fa` | Precision blue action button hover state |
| Code surface | `--surface-code` | `#0d1117` | Consistent dark graphite editor & terminal canvas |
| Code header | `--surface-code-header` | `#161b22` | Toolbar surface with subtle border separation |

---

## Unified Multi-Language Playground

The **Playground** provides a unified engineering sandbox accessible from the main navigation rail:
- **Language Switcher Bar**: Learners select between active runtimes:
  - **C (C11)**: Compiled and executed locally in-browser via Wasmer WebAssembly.
  - **Python (3.12)**: Interpreted and executed locally in-browser via Pyodide WebAssembly.
  - **JavaScript (ES2024)** & **Circuits (SPICE)**: Extensible runtime slots marked with "Coming Soon" badges.
- **Independent Storage**: C drafts persist bounded records to `katalyst.c.playground.v1`, and Python drafts persist to `katalyst.python.playground.v1`.
- **Dynamic Syntax Highlighting**: CodeMirror 6 updates language grammars dynamically via Compartments without unmounting or losing editor focus.
- **Unified Standard Input / Output**: Stdin detection prompts for input when standard input functions (`scanf`, `input()`, `sys.stdin`) are detected, supporting EOF fallback and real-time output streams.

---

## Type and Layout

- Body copy uses the local system sans-serif stack (`Inter`, `ui-sans-serif`, `system-ui`) for maximum rendering performance and zero network font waterfalls.
- Editorial Georgia headings provide an academic tone without sacrificing hierarchy.
- The 3-column learning workspace integrates:
  1. **Course Map / Lesson Content**: Step-by-step concepts, objectives, and checkpoints.
  2. **Code Workspace / Playground**: Monospace code editor with line numbers, syntax highlighting, and stdin/stdout terminal.
  3. **Kat AI Drawer**: Context-aware tutoring with lesson alignment and real-time code awareness.
- Fully responsive across desktop (1440px), laptop (1280px), tablet (768px), and mobile (375px) viewports with accessible drawer navigation.
