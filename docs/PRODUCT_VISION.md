# Product vision

KATALYST is a technical learning studio for curious builders. It helps people explore software, hardware, circuits, systems, data, AI, and visual media through structured courses and interactive browser tools. Programming is one part of the studio, not the product's entire identity.

## First learner experience

Learning Home introduces the shared loop—explore a subject, learn through lessons and labs, and connect ideas through practice. It provides a resume action, a small set of featured tracks, progress telemetry based on recorded activity, and direct access to all published courses and the Playground. An animated technical figure links the course fields without implying that every subject is a compiler exercise.

Learners can inspect course details and start from the same course area. Lesson pages focus on the current explanation and let learners open the relevant tools or Kat as needed. Course completion, exercise verification, and other progress indicators are reported only when the app has evidence for them. Exercises that are not graded are described as practice rather than assessment.

## Product principles

- Represent the breadth of the learning catalog honestly and leave room for new disciplines.
- Lead with structured learning and practical exploration rather than a generic chat prompt.
- Keep one coherent, accessible interface across subjects, with tools selected for the course at hand.
- Make progress explicit and evidence-based; conversation activity is not lesson completion or mastery.
- Keep curriculum data separate from provider conversations and keep provider adapters replaceable.
- Treat imported instructions and model output as untrusted; they never grant access to secrets or tools.
- Keep guest use available and explain where local, account, and provider data lives.
- Preserve local control and describe provider charges, data handling, and product limitations plainly.

## Main areas

1. Learning Home and animated multi-discipline pipeline
2. Explore Learning Paths and course details
3. My Learning, Practice Lab, and Progress
4. Subject-specific browser labs and Playground
5. AI Tutor (Kat)
6. Settings and secondary workspace tools

## Guest use and accounts

KATALYST can be used as a guest. Guest workspace and learning records remain in the browser until the user clears or exports them. Optional accounts use one `/login` page for email/password, Google sign-in, account creation, and password recovery when configured by the operator. Terms and Privacy acceptance is required to use sign-in and account creation. Settings contains account status, sync choices, data export, sign-out, and account deletion controls; it does not contain a second authentication form.

Account data sync starts only after sign-in and an explicit migration or account-copy choice. Snapshots are validated and protected by Supabase Row Level Security. API keys entered by a learner are transient and are excluded from account snapshots. Server provider credentials stay on the server and are used only by server-side routes. Guest, account-service, AI-provider, and browser-runtime boundaries are described in [Security](SECURITY.md) and [Deployment](DEPLOYMENT.md).

## MVP boundaries

The MVP provides real published course material, browser-based learning tools, local progress, optional account sync, and optional provider-backed AI tutoring. It does not claim that all content is exhaustive, that every practice response is graded, or that model answers are authoritative. Course-specific runtimes and their limits are described in the application and security documentation. A public deployment still needs an identified operator, production Supabase and provider configuration, applicable legal contact details, and operational review of quotas, privacy, retention, and abuse controls.
