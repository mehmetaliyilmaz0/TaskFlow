# 06 README and Submission

## Why This Document Exists

A take-home project is judged twice:

1. by running the product
2. by reading how it is explained

A weak README can make a solid build look careless.

An inflated README can destroy trust.

A vague submission note can hide the strongest engineering decisions.

This document exists to ensure the project is:

- easy to run
- easy to understand
- easy to evaluate
- honest about scope
- technically credible under a 48-hour constraint

## Reviewer Mindset

The reviewer is likely scanning for:

- does the app work
- can I run it quickly
- what did the candidate prioritize
- are the technical decisions reasonable
- is the codebase organized
- did they understand tradeoffs
- did they overbuild or underdeliver

The README and submission should answer these questions with minimal effort from the reviewer.

## Core Communication Principles

## Be concrete

Avoid vague phrases like:

- "modern architecture"
- "optimized performance"
- "enterprise-ready"
- "scalable solution"

Unless they are immediately explained in concrete terms.

## Be honest

Do not claim:

- mobile drag is perfect
- collaboration exists
- accessibility is complete
- performance is optimized for very large workloads

if those claims are not true in the shipped project.

## Be intentional

Anything not implemented should be framed as a conscious scope decision, not as a silent omission.

## Be reviewer-friendly

The reviewer should be able to answer these quickly:

- where is the live app
- how do I log in or register
- what features exist
- what architecture decisions matter
- what was deferred and why

## Required Deliverables

At minimum, the repo and submission should include:

1. a working GitHub repository
2. a live deployed Vercel link
3. a clear README
4. environment setup instructions
5. architecture and tradeoff explanations
6. a short submission note

Optional but useful:

- screenshots
- a short GIF or video
- sample credentials, only if the reviewer should not create their own account

## README Structure

The README should follow this logical order:

1. project title
2. short project summary
3. live demo
4. feature summary
5. tech stack
6. architecture overview
7. data model summary
8. drag-and-drop design decisions
9. local setup instructions
10. environment variables
11. Supabase setup
12. tradeoffs and scope decisions
13. future improvements
14. reviewer notes

This order reduces reviewer friction.

## Recommended README Outline

## Title and One-Line Summary

Recommended shape:

```md
# TaskFlow

TaskFlow is a Trello-like Kanban board application built for a 48-hour take-home case. It supports user authentication, board/column/card management, and persistent drag-and-drop card ordering across columns.
```

This should immediately explain:

- what the product is
- why it exists
- what core capabilities matter

## Live Demo

Recommended shape:

```md
## Live Demo

- Live App: [Vercel Link]
- Repository: [GitHub Link]
```

If the app requires self-registration, say so clearly.

## Feature Summary

List only the shipped v1 functionality:

- user registration and login
- board creation and board listing
- column creation
- card creation
- card title and description editing
- same-column card reorder
- cross-column card movement
- ordering persistence after refresh
- responsive board layout for smaller screens

Do not list partially working features as complete.

## Tech Stack

The README should list:

- Next.js
- TypeScript
- Tailwind CSS
- Supabase Auth
- Supabase Postgres
- dnd-kit
- Vercel

Optional:

- one short sentence on why each major technology was chosen

## Architecture Overview

This should present the structure in plain engineering language.

Recommended structure:

```md
## Architecture Overview

The frontend is organized into route-level pages, reusable UI components, feature modules, shared mapping utilities, and a framework-agnostic drag-and-drop utility layer.

- `src/app/`: route-level orchestration
- `src/components/`: presentational and interaction components
- `src/features/`: domain-aware queries, actions, and feature modules
- `src/lib/`: shared utilities and Supabase setup
- `src/types/taskflow.ts`: canonical TaskFlow types
- `src/lib/taskflow/mappers.ts`: database-row to domain mapping layer
```

Then add one short explanatory paragraph:

> The goal of this structure was to keep page components thin, avoid leaking raw Supabase row shapes through the UI, and isolate the most error-prone logic - ordering and drag-and-drop - into utilities that are easier to reason about and test.

## Data Model Summary

Keep this short and readable.

Recommended content:

- `boards`: owned by one authenticated user
- `columns`: belong to a board and are ordered by `position`
- `cards`: belong to a column and are ordered by `position`

Call out the ownership chain explicitly:

- `user -> board -> column -> card`

Explain that:

- Supabase Row Level Security is enabled
- access to columns and cards is inherited through board ownership
- ordering is persisted in numeric `position` fields rather than array indices

## Drag-and-Drop Design Decisions

This section should justify both `dnd-kit` and the persistence model.

Recommended points:

- `dnd-kit` was chosen because it is flexible, actively maintained, and better aligned with modern React than older drag-and-drop libraries
- the UI updates optimistically for responsiveness
- the backend persists only the final `column_id` and `position` on drag end
- order is stored with gap-based numeric positions such as `1000`, `2000`, `3000`
- midpoint insertion handles most moves without rewriting an entire column
- dense positions fall back to local column reindexing only when necessary

This section should make it obvious that the implementation was deliberate.

## Local Setup Instructions

Make setup easy to follow.

Recommended structure:

```md
## Local Setup

1. Clone the repository
2. Install dependencies
3. Create a `.env.local` file
4. Add the required Supabase environment variables
5. Run the SQL migration in Supabase
6. Start the development server

```bash
git clone <repo-url>
cd TaskFlow
npm install
npm run dev
```
```

## Environment Variables

Only list values that are actually required.

Current expected shape:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

If server-side secrets are later required, the README must add them explicitly instead of assuming them.

## Supabase Setup

The README should reflect the current repo layout.

Recommended steps:

1. create a Supabase project
2. open the SQL Editor
3. run the migration from `supabase/migrations/20260423120000_taskflow_schema.sql`
4. confirm that the `boards`, `columns`, and `cards` tables exist
5. confirm that Row Level Security policies are enabled

Do not hide manual database setup steps.

## Tradeoffs and Scope Decisions

This section is mandatory.

Recommended structure:

- robust authentication and private-board access control were prioritized
- the relational model was kept intentionally small: `boards`, `columns`, `cards`
- drag-and-drop persistence was prioritized over richer board features
- column drag-and-drop was deferred
- realtime collaboration and sharing were deferred
- comments, tags, due dates, assignees, and activity history were deferred
- mobile-respectful usability was prioritized over advanced mobile drag polish

Frame this as engineering judgment, not apology.

Good framing:

> I intentionally deferred collaboration, richer card metadata, and column drag-and-drop in order to keep the core Kanban flow, ordering persistence, and access-control model reliable within the 48-hour constraint.

## Future Improvements

Keep this realistic and short.

Recommended items:

- column drag-and-drop
- collaborative or shared boards
- comments and activity history
- tags and due dates
- improved mobile drag interactions
- more comprehensive automated tests around DnD edge cases

Do not turn this into a long wish list.

## Reviewer Notes

This section is strongly recommended.

The README should give the reviewer a fast evaluation path:

1. register a new account
2. create a board
3. add several columns
4. add cards in multiple columns
5. reorder cards within one column
6. move a card into another column
7. refresh the page and verify the order is preserved

This makes the core value of the project easy to verify.

## README Tone Guidelines

The README should sound like:

- clear professional engineering communication
- concise technical explanation
- restrained confidence

It should not sound like:

- a startup landing page
- a student report
- an internal architecture RFC

## What Not to Say

Avoid claims like:

- "enterprise-grade"
- "fully scalable"
- "highly optimized"
- "production-ready in every aspect"
- "best-in-class UX"
- "seamless experience across all devices"

These reduce credibility unless deeply proven.

Also avoid:

- long personal narratives
- excuses
- overexplaining obvious framework choices

## Screenshots and GIFs

Screenshots are optional but useful.

If included, the best candidates are:

1. boards page
2. board detail page
3. card detail dialog
4. drag-and-drop interaction

If a GIF is easy to produce, a short drag-and-drop demo is high value.

Do not add a large screenshot gallery.

## Repository Hygiene Requirements

Before submission, ensure:

- `.env.local` is gitignored
- no secrets are committed
- no large unused files remain
- no dead experimental folders remain
- no placeholder pages remain
- no console spam is left in critical flows
- `package.json` is clean
- the README matches the shipped implementation

## Submission Message Goals

The submission note should do four things:

1. share the links
2. summarize what was built
3. highlight technical priorities
4. frame scope decisions clearly

It should stay short.

The README carries the deeper detail.

## Recommended Submission Note Structure

The submission message should contain:

- greeting
- project links
- a short summary
- a few bullets on engineering decisions
- a short closing

## Recommended Submission Message Template

Use English by default unless the reviewer explicitly expects Turkish.

Recommended English template:

```text
Hello,

I completed the TaskFlow project. You can find the live demo and GitHub repository below:

Live Demo: [Vercel Link]
GitHub Repo: [GitHub Link]

TaskFlow is a Trello-like Kanban application that supports authentication, board/column/card management, and drag-and-drop card movement within and across columns. To ensure ordering remains consistent after refresh, I persisted card order using a numeric `position` field in the database.

My main implementation priorities were:
- a reliable drag-and-drop core flow
- durable ordering persistence
- a clean relational data model
- a reviewer-friendly architecture within the 48-hour scope

I intentionally prioritized the stability of the core experience over broader feature coverage. The README includes setup instructions, architecture decisions, and tradeoffs.

Thank you for your time.
```

If the process explicitly asks for Turkish communication, translate the same structure instead of changing the content.

## Reviewer-Facing Engineering Narrative

Across the README and submission, the narrative should be:

> I understood the core of the assignment, made deliberate tradeoffs, implemented the critical interaction reliably, and kept the architecture clean enough to explain.

That is the intended reviewer conclusion.

## "What We Chose Not to Build" Framing

Bad framing:

> I did not have time to build sharing, collaboration, comments, due dates, activity logs, and more.

Better framing:

> I intentionally deferred collaboration, richer card metadata, and activity history in order to keep the core drag-and-drop flow, persistence model, and access-control path reliable within the 48-hour constraint.

This sounds like engineering judgment rather than unfinished work.

## Truthfulness Rules

Everything in the README and submission must obey:

## No aspirational claims as facts

If something is partial, say it is limited.

## No fake roadmap commitments

Do not imply future work is already half-built unless it is.

## No hidden manual steps

If setup requires manual SQL execution or auth configuration, say so directly.

## No exaggerated mobile claims

Say:

- responsive layout

Not:

- perfect mobile drag-and-drop experience

## README Acceptance Criteria

The README is acceptable only if:

- a reviewer can run or inspect the project without confusion
- implemented features are clearly separated from deferred features
- architecture decisions are explained in plain engineering language
- setup instructions are correct
- live links are visible near the top
- the README does not oversell the app

## Final Pre-Submission Checklist

Before sending anything, verify:

## Product

- live Vercel link works
- register works
- login works
- create board works
- create column works
- create card works
- edit card works
- same-column reorder works
- cross-column move works
- refresh preserves order

## Repo

- README is updated
- no secrets are committed
- latest code is pushed
- repo and branch naming are clean

## Communication

- submission links are correct
- the README matches the shipped implementation
- no feature is overstated

## AI Agent Prompt for README

When it is time to draft the README, use a prompt like:

```text
Write the README for a project called TaskFlow.

Context:
- It is a 48-hour take-home project
- It is a Trello-like Kanban board
- Stack: Next.js, TypeScript, Tailwind CSS, Supabase Auth/Postgres, dnd-kit, Vercel
- Implemented features: authentication, board creation, column creation, card creation/editing, drag-and-drop within and across columns, persistent ordering across refreshes
- Deferred features: realtime collaboration, sharing, comments, tags, due dates, assignees, activity history, column drag-and-drop

Requirements:
- keep the tone professional and concise
- do not invent features
- explain why dnd-kit was chosen
- explain why position-based ordering was chosen
- explain the tradeoffs made under the 48-hour constraint
- include setup instructions and environment variables
- include a reviewer notes section

Output the README in Markdown only.
```
