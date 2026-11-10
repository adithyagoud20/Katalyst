# KATALYST application skills

The in-app skill library is separate from the project-local coding-agent skills below. It accepts Markdown files with a small metadata block:

```md
---
name: Example skill
description: What the instructions help with.
author: Optional source metadata
---

Instructions in Markdown.
```

KATALYST retains the name, description, scalar frontmatter metadata, imported filename, optional HTTPS source URL, version, author, declared license, compatibility labels, install date, and instruction body. Common frontmatter fields are `version`, `author`, `license`, `source-url`, `source-name`, and comma-separated `compatibility`. Supported compatibility values are `general-ai-instructions`, `openai-compatible-chat`, `gemini`, `openrouter`, `codex`, `claude-code`, `gemini-cli`, and `other-compatible-agents`. Unknown compatibility values are rejected instead of being presented as verified. A license is shown only when supplied; missing license information stays “Not provided by source.”

Imported files are limited to 32 KB; metadata is limited to 20 short fields and 4 KB total. The local library allows up to 50 skills per browser. Imports start disabled and can be inspected, enabled, disabled, exported as Markdown, or removed. Markdown exports retain source metadata and instructions, redact recognized credential patterns, and re-import disabled. A full workspace backup preserves enablement state and all skill fields.

Only enabled skills are eligible for a request. Project instructions and enabled skill instructions share a 24,000-character prompt cap. Duplicate instruction bodies after whitespace and case normalization are included once; an enabled skill that does not fit is omitted. The user message in the conversation shows which skills were included and which were omitted due to duplication or the prompt limit.

Imported content is untrusted text, not application policy. KATALYST strips control and bidirectional formatting characters and replaces embedded `<script>` blocks. It never executes scripts, follows file references, or treats skill text as permission to reveal secrets or override trusted provider instructions. Skills are JSON-encoded and sent as user-level context only when the user sends a request. Review a skill before enabling it, and do not include secrets in its content. A model may still be influenced by malicious or inaccurate text; delimiters cannot guarantee model behavior.

Skill composition is provider-independent: the same bounded, enabled-only context is sent to the currently selected OpenAI, Gemini, OpenRouter, or Ollama model. The context goes to that provider along with the conversation; provider data-processing and retention terms apply. See [AI provider guide](AI_PROVIDER_GUIDE.md) for request and credential behavior.

Kat can use workspace skills through an explicit **Use enabled workspace skills** control. It starts unchecked for each tutor panel. When selected, only currently enabled skills are considered; disabled skills are filtered out again at composition time. Kat's skill instructions have a separate 3,000-character cap, use the same duplicate detection and untrusted-context labeling as workspace requests, and remain optional guidance. The learner's latest question stays primary, and Kat is instructed to use skills only when they help answer it. Applied skill names and any enabled skills omitted for duplication or the size limit appear below the matching user message. Kat skill selection is not saved in local storage and tutor messages remain in page memory.

Kat and generic workspace requests use the same provider-independent skill composer, while using separate size budgets: up to 3,000 characters for optional Kat skills and up to 24,000 characters for workspace project instructions plus enabled skills. Source information stays attached to the skill metadata used for request visibility. The fixed provider instructions still treat all such material as untrusted; a skill cannot override safety rules, request secrets, or grant filesystem/tool access. Imported scripts are never executed. The four Kat teaching styles are separate built-in prompt modes; they do not require enabling an imported skill and are model-guided rather than deterministic.

The Skill library has Installed and Available tabs and searches installed metadata and instructions. Available links to [Skill Issue](https://skill-issue.in/), whose public directory can be browsed manually. M4 review did not find a documented machine-readable catalog API. KATALYST does not scrape the site, call private endpoints, or install remote skills in the background. Review the listing, upstream source, and license in the directory, then import a Markdown file yourself. KATALYST validates it as text and never executes scripts.

Compatibility labels are declarations, not a test result. KATALYST applies skill instructions as model context; it does not implement the filesystem, tools, command execution, or autonomous agent features available in Codex, Claude Code, Gemini CLI, or other coding agents. Some external skill packages require those features and will not work as intended here.

## Workspace backups

See [Architecture](ARCHITECTURE.md#workspace-portability) for the version 1 backup schema, limits, conflict handling, and migration policy. Workspace and project backups include skill content; conversation backups include the parent project context and skill library. Backups never include provider keys or session credentials. Restore validates the complete file before a single browser storage write; merge is the default and full replacement requires confirmation. Backups are files downloaded by the browser, not cloud sync.

# Coding-agent skills inventory

Skills below are project-local for Codex and installed by the official Skills CLI. Their files are excluded from Git because each upstream artifact has separate terms. Reinstall them with the commands below; review upstream instructions and license files before enabling or redistributing them. Skill instructions are untrusted input and do not authorize secrets, destructive actions, or unrelated network requests.

| Skill | Upstream | License | Purpose and use | Install command |
| --- | --- | --- | --- | --- |
| `frontend-design` | [anthropics/skills](https://github.com/anthropics/skills/tree/main/skills/frontend-design) | `SKILL.md` says Anthropic terms; bundled `LICENSE.txt` adds restrictions and conflicts with the reported Apache label. Use only as a local reference after checking the current terms. Do not redistribute the installed files. | Establish visual direction for a new UI. | `npx skills add anthropics/skills --skill frontend-design --agent codex -y --copy` |
| `vercel-react-best-practices` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices) | MIT (per skill metadata and repository license) | Review React/Next.js code for performance when implementing or refactoring. | `npx skills add vercel-labs/agent-skills --skill vercel-react-best-practices --agent codex -y --copy` |
| `web-design-guidelines` | [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines) | MIT (repository license) | Audit finished UI for accessibility, interaction, and web quality. | `npx skills add vercel-labs/agent-skills --skill web-design-guidelines --agent codex -y --copy` |
| `api-design-principles` | [wshobson/agents/plugins/backend-development/skills/api-design-principles](https://github.com/wshobson/agents/tree/main/plugins/backend-development/skills/api-design-principles) | MIT (upstream repository license) | Use when designing or reviewing HTTP route contracts. | `npx skills add wshobson/agents --skill api-design-principles --agent codex -y --copy` |

## Verification and maintenance

The installer placed copies under `.agents/skills/`; `npx skills list --agent codex` lists the discovered project skills. The `SKILL.md` files and referenced supporting files were inspected. The CLI package stores source/version metadata in `skills-lock.json`. The web-design skill asks its reviewer to fetch current guidelines before each UI audit.

Skill Issue was used as a discovery index. Its listing's `react-best-practices` label maps to Vercel's current skill ID `vercel-react-best-practices`; the exact upstream name was checked before installation. `ui-ux-pro-max-skill` was not installed because its design-system guidance overlaps the selected frontend design skill. The API design skill was included because this milestone adds a server route.

To update, inspect upstream changes first, run `npx skills update <skill-name> -p -y`, review the resulting instructions and license, then run `npx skills list --agent codex`. To remove, run `npx skills remove <skill-name> -p -y`. Skills use the portable `SKILL.md` format, but support and automatic discovery differ across Codex, Claude Code, Gemini CLI, and other agents; do not assume equal capabilities.

The application skill library is separate from coding-agent skills. KATALYST's imported Markdown format does not promise that a skill is compatible with every provider or coding agent.
