# BondSBA Overnight USP Audit - Latest

Run time: 2026-05-11 17:47:00 EDT  
Scope: `https://bondsba.com` homepage, contractor submission readiness narrative, surety dashboard/readiness flow surfaces, checklist/report output positioning, saved packet flow boundaries, sign-in continuity, indexability signals, and lightweight auth/persistence security regression.

## Top 3 Findings by Severity

1. **Medium - fixed in this run: homepage structured-data route links pointed at non-canonical tool URLs.**  
   The homepage `CollectionPage` JSON-LD linked to `/sba-document-checklist` and `/sba-loan-calculator` instead of the crawlable landing URLs. Updated to `/sba-loan-documents` and `/sba-7a-calculator`, deployed live, and covered by regression assertions.

2. **Medium - confusing crawler signal remains on protected routes (mitigated).**  
   Auth-protected URLs still serve SPA shell HTML that contains homepage JSON-LD and default `<meta name="robots" content="index, follow">`, while response headers correctly send `X-Robots-Tag: noindex, nofollow`. This is mitigated, but mixed signals can delay Search Console cleanup.

3. **Low - handoff friction from SEO pages to gated tools.**  
   Public pages do a good job positioning the workflow, but some CTA transitions into gated workspaces can still feel abrupt without a stronger “what you get after sign-in” bridge.

## Persona USP Read (Clear + Believable?)

**Contractor-heavy brokers:** **Yes.** The USP is clear: cleaner packets, less underwriting bounce-back, practical ops queue cadence, and repeat workflow utility.

**Construction-focused CPAs / fractional CFOs:** **Mostly yes.** The value is believable on financial cleanup/readiness framing; adding a concrete “before/after packet quality” example would improve trust and repeat intent.

**Surety producers:** **Yes.** The surety triage/readiness framing is specific enough to be credible and aligned to daily producer workflow.

## Broken or Confusing Flow

- No hard blocking flow break found in this run on core public routes.
- Remaining confusion: protected route HTML still includes homepage schema + default robots meta in source, even though headers are correctly noindex.
- Public-to-gated transitions can use clearer expectation-setting before auth prompt.

## Likely Security Concern

- No new critical security regression observed in this pass.
- Auth boundaries remain active on protected endpoints/routes, and protected routes still emit `X-Robots-Tag: noindex, nofollow`.
- **Residual risk:** full authenticated cross-account owner-scope verification of saved packets was not re-run in this pass (you indicated cybersecurity verification is being handled on your side).

## Recommended Next Fixes

1. In Search Console, re-run **Validate fix** for unparsable structured data after this deploy, starting with the issue detail URLs.
2. Add a separate minimal HTML shell for protected routes (no JSON-LD, no indexable default robots meta) to remove mixed crawler signals entirely.
3. Add one anonymized sample readiness packet/report preview to increase trust for broker/CPA personas.
4. Add CTA bridge copy on public pages for gated tools (“sign in to save packets and restore queue state”).
5. Keep nightly JSON-LD parse checks across all crawlable pages as a release gate.

## Verification

- `npm test` passed (`5/5` suites).
- `npm run build` passed and generated `8` static SEO landing pages.
- Production deploy completed and aliased to `https://bondsba.com`  
  Deployment ID: `dpl_7oAmVs3R2ZX2Uv9JGGnnC2kqiUKF`.
- Live JSON-LD parse check succeeded across key public pages (no parse errors found).
- Homepage JSON-LD now points to crawlable document/calculator landing pages.

Overall: the USP is clear and believable for all three personas, and the indexing-related schema link mismatch is fixed and live. Residual risk is primarily crawler-signal consistency on auth-protected SPA routes and deeper owner-scope penetration testing (out of scope for this run).
