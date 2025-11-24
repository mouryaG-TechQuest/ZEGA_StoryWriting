# Project Documentation Hub

This folder centralizes business-ready documentation. Original markdown guides remain untouched for traceability. After validation, we can archive or remove superseded files.

## Index
- Architecture: VISUAL_ARCHITECTURE.md, ARCHITECTURE.md
- Quick Start: QUICKSTART.md (superseded by START_HERE_ONE_CLICK.md) -> See ./GUIDES/quick-start-consolidated.md
- Features: FEATURES_UPDATE.md, FEATURES_UPDATED.md
- Authentication: AUTHENTICATION_SECURITY_GUIDE.md, AUTHENTICATION_IMPLEMENTATION_SUMMARY.md
- Media & Storage: IMAGE_STORAGE_GUIDE.md
- Timeline: TIMELINE_FEATURE_GUIDE.md, TIMELINE_QUICKSTART.md
- Characters: CHARACTER_FEATURE_QUICKSTART.md, CHARACTER_MODEL_VALIDATION_UPDATE.md
- Performance: PERFORMANCE_OPTIMIZATION_SUMMARY.md, OPTIMIZATION_QUICK_GUIDE.md

## Consolidation Plan
1. Keep originals for 1 review cycle.
2. Merge overlapping content into focused guides under docs/GUIDES.
3. Mark deprecated originals with a header `DEPRECATED: Consolidated in docs/`.
4. Remove deprecated after approval.

## Business Readiness Checklist
See `BUSINESS_READINESS.md` for deployment, security, resilience, and validation steps.

## Smoke & Regression
Scripts: `scripts/frontend-smoke.mjs` and `scripts/duplicate-audit.mjs` (to be added) automate basic verification.

## Next Actions
- Run duplicate audit.
- Complete consolidation pass.
- Confirm removal of legacy Backend/ folder.
