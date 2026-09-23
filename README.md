# Gamesroomz Prime Conversion Portal

Internal Next.js application for assessing the conversion of an existing mobile Bubble Shooter PvP game to two local players on one Prime tabletop.

## Assessment workflow

1. Confirm the Prime hardware, Unity/SDK baseline, seating/layout, platform contract and performance targets in **Overview**. Unconfirmed targets keep the report preliminary.
2. Answer **24 focused questions** across eight sections. Choose one action: **Reuse**, **Modify**, **Rewrite**, **New** or **Not applicable**. Add a brief finding supported by a code inspection, specification or device test. **Needs investigation** and **Awaiting specification** stay unresolved.
3. In **Conversion Plan**, review the linked findings and document each workstream's reason, required work, acceptance outcome, dependencies, risk and estimate. Supporting component detail is optional. Actions and risks start unassessed.
4. Enter effort **once per workstream**. Include implementation and developer testing; put shared system testing in QA and fixes in their owning workstreams. Do not include the same tasks in both architecture and controllers/input/networking. Keep optional enhancements separate from mandatory scope.
5. Review **Management Summary** for required changes, evidence, acceptance outcomes, dependencies, risk, mandatory effort and optional effort. There is no weighted “Minor Conversion” or “Near-Complete Rebuild” verdict. Adding platform support does not establish that the game needs rewriting.
6. Confirm the completed assessment before marking it submitted. This prototype records status locally; it does not authenticate developers or approvers.

## Estimate and review rules

- Blank effort means **not estimated**, rather than zero. Zero is accepted for verified reuse; Modify/Rewrite/New require a positive estimate.
- Not applicable requires an exclusion reason, explicit review and zero effort. It contributes no effort.
- Unknown requirements, missing evidence, incomplete plans and conflicting Reuse/N/A decisions block submission/approval.
- Plan review and developer confirmations are invalidated by edits. Target changes invalidate all workstream reviews; question changes invalidate the linked workstream's review.
- Copying assessment findings fills only empty plan rationale fields. It never overwrites authored rationale, selects a blanket action, or adds question-level estimates.
- Totals remain preliminary until target requirements, findings and all workstreams are complete. Person-days are effort, not calendar duration or a validated project quote.

## Saved drafts

Data remains local to the browser. The current storage key is `gamesroomz-prime-assessment-v2`.

On first use, a v1 draft is migrated without overwriting the original key. Game details, workstream notes and positive estimates are retained. Changed questions get new IDs; classifications, risk and approval are cleared for fresh review. The full earlier draft can be downloaded from Overview. The v2 draft also retains that reference. Reloading a v2 draft preserves its answers and valid review state.

## Development

```bash
npm ci
npm run dev
npm run typecheck
npm test
npm run build
```

Open `http://localhost:3000`. The project declares Node 20.x. Tests use Node's test runner and TypeScript to load the actual assessment logic; they cover completeness, estimates, scope consistency and migration.

## Next iterations

- Shared database persistence and authenticated roles
- Multiple game assessments
- Versioned submissions and independent review
- Cross-game comparison and report exports
