# BondSBA Practical Extension Plan (Excel-First)

## Objective
Build a practical Excel companion that fits existing broker, CPA, and surety team workflows instead of replacing them.

## Who Uses It
- Entry-level coordinator: tracks missing docs and follow-up dates.
- Analyst/associate: triages readiness and flags risk.
- Producer/broker: prioritizes market-ready submissions.
- Construction CPA/fractional CFO: validates financial packet quality.
- C-level executive: monitors cycle time and team throughput.

## Practical MVP (Phase 1)
1. Excel queue template with fixed columns:
   - `Submission ID`, `Company`, `Lane`, `Missing Items`, `Readiness`, `Owner`, `Next Follow-Up`, `Notes`
2. Task-pane Office Add-in (Excel):
   - Read selected row(s)
   - Send selected data to BondSBA API
   - Return `Readiness`, `Top Follow-Ups`, and `Next Action`
3. Write-back to worksheet:
   - Update `Readiness`, `Missing Items`, `Next Follow-Up`, `Last Reviewed`

## Phase 2 (Team Scale)
1. Bulk row processing from a worksheet table.
2. Role-based filters:
   - Coordinator queue
   - Analyst queue
   - Producer queue
   - Executive dashboard rows only
3. Export packet links:
   - Saved readiness report URL
   - Checklist output URL

## Phase 3 (Executive Operations)
1. Weekly scorecard sheet:
   - Avg days from intake to ready
   - % ready on first pass
   - Backlog by owner
2. Auto-generated weekly summary note for leadership review.

## Technical Notes
- Recommended platform: Office Add-ins (Excel task pane + Excel JavaScript API).
- Keep all calculations and auth-protected analysis in BondSBA APIs.
- Keep Excel as the operational front door and BondSBA as the analysis engine.

## Security and Governance
- OAuth-based user auth (same as BondSBA web app).
- Owner-scoped data only.
- Audit fields on every write-back (`reviewed_by`, `reviewed_at`).
- No local storage of sensitive financial files inside add-in cache.

## Why This Is Practical
- No process shock: teams keep using spreadsheets they already run.
- Immediate value: fewer manual status updates and cleaner handoffs.
- Clear upgrade path from template-only to automated underwriting operations.
