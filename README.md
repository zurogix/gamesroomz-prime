# Gamesroomz Prime Conversion Portal

Internal Next.js application for assessing and planning conversion of existing Unity games to the Gamesroomz Prime tabletop platform.

## V1 goals

- Guided technical assessment for existing games
- Reuse / Extend / Refactor / Rewrite / New / Remove classification
- Bubble Shooter PvP reference assessment
- Prime-specific coverage: Android, 16:9 tabletop, two vertical P1/P2 playfields, simultaneous multi-touch
- Gamesroomz account/session/result/launcher integration planning
- Developer conversion-plan template for every major workstream
- Mandatory conversion vs optional enhancement separation
- Person-day estimates, dependencies and technical risk
- Automatic management summary explaining what "redo" means
- Accounts created by the product team (no sign-up), one shared assessment per game, saved versions

## Setup

### Environment variables

Copy `.env.example` to `.env.local` for local development, and set the same values in Vercel
(Project → Settings → Environment Variables). Never commit real values.

| Variable | Where it comes from | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API | **Server only** — used to create accounts and set temporary passwords; never exposed to the browser |
| `DATABASE_URL` | Supabase → Database → Connection string, transaction pooler | Port `6543`, add `?pgbouncer=true` |
| `DIRECT_URL` | Supabase → Database → Connection string, session pooler | Port `5432`; used by migrations |
| `PRIME_BOOTSTRAP_PRODUCT_EMAIL` | Your choice | The first product user; their profile is created on first login |

### Supabase dashboard

- **Authentication → Sign In / Providers → Email:** keep Email enabled and turn **Allow new users to sign up off**.
  Accounts are created by the product team on the **Team** page; the portal sends no emails.
- **Database:** all portal tables live in the `prime` Postgres schema and are accessed only by the server through
  Prisma, which checks the user's role on every request. **Do not add `prime` to the exposed schemas** in the Data API
  settings: the tables have no row-level security policies for browser access.

### First sign-in

1. Create the first product account in the Supabase dashboard: **Authentication → Users → Add user**, with the email
   in `PRIME_BOOTSTRAP_PRODUCT_EMAIL`, a password, and **Auto confirm user** ticked.
2. When they sign in, the portal creates their profile with the **product** role.
3. They create everyone else's account on the **Team** page (**Create account**): name, email, role and a temporary
   password (use **Generate**). No email is sent — the page shows the email and temporary password once, to share
   privately. On first sign-in the new user must choose their own password before they can do anything else.
   If the email already has a Supabase user (e.g. added in the dashboard), that user is linked and given the
   temporary password.
4. Forgotten passwords: product uses **Reset password** on the Team page, which shows a new temporary password once.
   Everyone can change their own password from **Change password** in the user menu.
   Nobody gets access automatically.

### Database migrations

Migrations live in `prisma/migrations` and **apply automatically on each Vercel deploy**: the `vercel-build` script
runs `prisma generate && prisma migrate deploy && next build`, and `prisma migrate deploy` only applies migrations
that have not been applied yet. Do not run `prisma db push` or `prisma db seed` against the shared database.

### Run locally

```bash
npm install          # also runs prisma generate
npm run dev          # http://localhost:3000
npm test             # unit tests (no database needed)
npm run build
```

## Data model

Each game has one assessment, stored as JSON in Postgres with an optimistic-locking version: if someone else saved
first, the portal stops autosaving and asks you to reload instead of overwriting. Every status change saves a
version that can be exported as Markdown from the Management Summary. Deletes are soft (`deletedAt`).

Roles: **product** can change everything at any stage. **Developers** can edit
discovery answers and the developer / team only while discovery is in progress, the engine comparison while findings
or the plan are open, and the plan and its confirmations only while the plan is in progress. The save API rejects
anything else with 403.

A draft saved in the browser by the earlier, local-only version can be imported from the games list after signing in.

## Conversion workflow

Four stages, shown as a progress line at the top of each game ("Step 1: Discovery"):

1. **Discovery (A–I)** — the product team creates the developer's account; the developer answers the discovery form and
   submits it (Discovery in progress → Discovery submitted — under review). Product then publishes findings or
   reopens discovery for follow-up questions.
2. **Findings & options** — product publishes findings; the developer responds, including the Multiplayer Engine 2.0
   comparison. Product then opens the plan (Findings & options — open for comments → Conversion plan in progress).
3. **Conversion plan** — pre-filled workstreams the developer confirms or edits, then submits with the confirmations
   (→ Plan submitted — under review). Product agrees the plan or requests changes.
4. **Summary** — the Management Summary, open to developers once the plan is agreed (→ Plan agreed). Product can
   reopen the plan.

Only stages the workflow has reached are shown; later stages are hidden completely. The product team can switch on
"Preview upcoming stages" in the sidebar footer (remembered per browser) to see later stages, marked "Preview".
