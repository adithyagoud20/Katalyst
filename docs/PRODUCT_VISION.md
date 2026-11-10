# Product vision

KATALYST is an AI-powered engineering learning platform for students. It helps learners build understanding through structured paths, readable lessons, practical checkpoints, and a configurable AI tutor. **KATALYST is the learning product; model providers are teaching infrastructure.**

## First learner experience

The app opens on Learning Home. Students can explore published courses, inspect their learning outcomes and lessons, enroll, study the examples, ask Kat for lesson-aware help, and explicitly mark lessons complete. The current catalog has one published course: C Programming Foundations, with thirteen authored lessons. Practice Lab collects the selected course's exercises and suggested answers; lesson checkpoints remain separate self-checks. My Learning and Progress reflect only a student's saved enrollment and completion actions; KATALYST does not invent progress, scores, streaks, or mastery.

The first course is a beginner foundation, not a complete C reference. It covers a first compiled program, variables and types, input/output, operators, decisions, loops, functions, arrays, strings, pointers, structures and unions, file handling, and one integrated exercise. Its duration is not estimated yet. On wide screens, a lesson keeps its explanation, connected C11 editor/playground, and Kat tutor visible together. Students can edit, compile to WebAssembly, provide input, inspect diagnostics, and run code in the browser. On smaller screens, Learn, Code, and Kat tabs keep the same lesson state available. The Practice Lab does not grade answers.

## Audience

- Engineering students learning programming and technical subjects.
- Students who want structured material and practice with a model provider they choose.
- Educators and contributors who can help author and review transparent curriculum content.

## Product principles

- Lead with learning paths, lessons, and practice rather than an empty chat composer.
- Teach one understandable idea at a time and show real curriculum structure.
- Make progress explicit and evidence-based; conversation activity is not learning completion.
- Keep curriculum data separate from provider conversations and keep provider adapters replaceable; Cloudflare Workers AI is the default hosted provider, not a product dependency.
- Keep imported instructions and model output untrusted; they never grant access to secrets or tools.
- Ship usable learner flows before adding mastery engines or broad course catalogs.
- Preserve local control and be clear about provider charges, data handling, and limitations.

## Main sections

1. Learning Home and integrated Learn / Code / Kat lesson workspace
2. Explore Learning Paths
3. My Learning
4. Practice Lab
5. Progress
6. AI Tutor (Kat)
7. Settings

Projects, generic conversations, and the skill library remain available in the secondary Workspace tools area. The current provider integrations and backup workflows remain supported while the product grows around learning.

## Guest workspace and personal activity (M8)

KATALYST remains usable without registration. A guest can study, compile and run C in the browser, use a configured provider, and keep workspace and learning activity locally. The appearance controls offer Light, Dark, and System themes with a comfortable/compact reading density. Conversation management includes rename, pin, move, confirmed delete, and a local transcript download. The Progress dashboard summarizes actual lesson activity, saved projects/conversations, and recorded AI requests. AI token totals appear only when a provider reports usage; the app does not estimate cost. These local dashboards begin recording from this release and do not invent prior history.

The current account entry is an explicit future-service notice. Authentication, account profiles, guest migration, cross-device progress, workspace synchronization, hosted backups, and public share links require a future backend and remain unavailable. Guests are told that data stays in the current browser and may not transfer automatically.

## Current boundaries

M6, M7, M8, and M12 provide a published course catalog rendered through a reusable lesson workspace, local enrollment and manually recorded lesson completion, lesson-aware Kat requests through the selected server-side provider, and distinct self-check checkpoints and practice exercises. The current catalog has one published C course. Kat can receive the current C source, recent diagnostics, and output only when the learner asks for help; editing or running code alone does not send it. Enabled workspace skills are optional and require an explicit tutor control; disabled skills are excluded. The current question remains primary, and course, lesson, editor, and skill text remains untrusted user context. Progress lives separately in this browser and is not part of the current workspace backup format. AI activity and preferences are separately versioned local records and are not included in backups. Tutor turns live only in page memory. Kat offers four presentation modes—Concept teacher, Socratic tutor, Practical mentor, and Exam coach—but their behavior is model-guided rather than a deterministic teaching engine. Cloudflare Workers AI is the initial hosted default; OpenAI, Gemini, OpenRouter, and local Ollama remain selectable, with no automatic provider fallback.

The C playground is intentionally narrow: it runs bounded C11 programs in a browser-local WebAssembly sandbox, not arbitrary native code or imported scripts. Kat receives playground source only after an explicit code-help action, within bounded context. Automated assessment, answer grading, topic mastery, adaptive sequencing, account, cloud sync, instructor console, and multi-user isolation are not implemented. The Practice Lab does not evaluate answers. These are later product decisions, not implied capabilities.

## Non-goals

- Generic AI chat as the primary KATALYST experience.
- Autonomous agent swarms, task delegation, or complex orchestration.
- Running scripts from imported skills or sending playground code to a provider automatically.
- Fabricated course breadth, outcomes, statistics, or student progress.
- A hosted multi-user service before authentication, abuse controls, and storage are designed.
- Claims that API inference is free or that a model subscription includes API access.
