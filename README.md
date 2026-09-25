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
- Invite-only accounts, one shared assessment per game, saved versions

## Setup

### Environment variables

Copy `.env.example` to `.env.local` for local development, and set the same values in Vercel
(Project → Settings → Environment Variables). Never commit real values.

| Variable | Where it comes from | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API | Public |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API | Public |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API | **Server only** — used to send invites; never exposed to the browser |
| `DATABASE_URL` | Supabase → Database → Connection string, transaction pooler | Port `6543`, add `?pgbouncer=true` |
| `DIRECT_URL` | Supabase → Database → Connection string, session pooler | Port `5432`; used by migrations |
| `NEXT_PUBLIC_SITE_URL` | The production URL, e.g. `https://<prod domain>` | Used in invite emails |
| `PRIME_BOOTSTRAP_PRODUCT_EMAIL` | Your choice | The first product user; their profile is created on first login |

### Supabase dashboard

- **Authentication → Sign In / Providers → Email:** keep Email enabled and turn **Allow new users to sign up off**.
  Access is invite-only: people are invited from **Team** in the portal.
- **Authentication → URL Configuration:** set **Site URL** to `NEXT_PUBLIC_SITE_URL`, and add these **Redirect URLs**
  (and the same for any preview domain you use):
  - `https://<prod domain>/auth/set-password`
  - `https://<prod domain>/auth/callback`
- **Database:** all portal tables live in the `prime` Postgres schema and are accessed only by the server through
  Prisma, which checks the user's role on every request. **Do not add `prime` to the exposed schemas** in the Data API
  settings: the tables have no row-level security policies for browser access.
- **Emails:** the default invite and reset templates work as they are. The links land on `/auth/set-password`, which
  signs the user in and asks them to choose a password.

### First sign-in

1. Create the first user in Supabase (**Authentication → Users → Add user**, or send them an invite) with the email
   in `PRIME_BOOTSTRAP_PRODUCT_EMAIL`.
2. When they sign in, the portal creates their profile with the **product** role.
3. They can then invite everyone else from **Team**. Nobody else gets access automatically.

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

Roles: **product** can change everything, including Prime targets and the "Changes requested" and "Agreed" statuses;
**developer** fills in discovery and the plan.

A draft saved in the browser by the earlier, local-only version can be imported from the games list after signing in.

## Conversion workflow

1. The product team records the Prime targets.
2. The developer answers the discovery form, noting what still needs checking.
3. Each workstream is classified as Reuse, Extend, Refactor, Rewrite, New or Remove.
4. The developer documents the proposed implementation, components, deliverable, dependencies, risk and effort, and
   compares the Multiplayer Engine 2.0 paths.
5. The Management Summary shows the scope profile; optional enhancements are kept separate before the plan is agreed.
