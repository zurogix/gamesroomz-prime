# Gamesroomz Prime Conversion Portal

Internal Next.js application for assessing and planning conversion of existing Unity games to the Gamesroomz Prime tabletop platform.

## V1 goals

- Guided technical assessment for existing games
- Reuse / Modify / Rewrite / New classification
- Bubble Shooter PvP reference assessment
- Prime-specific coverage: Android, 16:9 tabletop, two vertical P1/P2 playfields, simultaneous multi-touch
- Gamesroomz account/session/result/launcher integration planning
- Developer conversion-plan template for every major workstream
- Mandatory conversion vs optional enhancement separation
- Person-day estimates, dependencies and technical risk
- Automatic management summary explaining what "redo" means
- Browser-local autosave for the first prototype

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Current data model

V1 intentionally uses local browser storage so the assessment workflow can be validated before locking the backend schema.

Next iteration:
1. Supabase persistence
2. Authentication / developer access
3. Multiple game assessments
4. Versioned submissions and review workflow
5. Comparison dashboard across all 15 games
6. PDF/export support

## Conversion workflow

1. Complete the technical assessment.
2. Classify each area as Reuse, Modify, Rewrite or New.
3. Sync findings into the Conversion Plan.
4. Developer documents the proposed implementation, reusable components, changed components, deliverable, dependencies, risk and effort.
5. Generate the Management Summary.
6. Separate mandatory Prime conversion work from optional enhancements before approval.
