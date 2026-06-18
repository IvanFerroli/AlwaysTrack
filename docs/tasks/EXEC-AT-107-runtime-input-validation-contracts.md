# EXEC-AT-107 - Runtime input validation contracts

## Metadata
- task: docs/tasks/TASK-AT-107-runtime-input-validation-contracts.md
- executor: olympus_orchestrator
- date: 2026-06-17
- mode: implementation
- status: approved-with-notes

## Scope
Small first implementation slice for reusable runtime input validation and selected critical parsers.

## In Scope
- Reusable local helper in `services/api/src/core/validation/input-validation.ts`.
- Safe 400 handling for validation errors in selected auth/users/sales/wiki/faq handlers.
- Runtime contracts and bounds for selected parsers in auth, users, sales documents, wiki and FAQ.
- Architecture convention in `docs/architecture/api-input-validation.md`.
- Focused malformed-payload tests.

## Out Of Scope
- Full API rewrite.
- OpenAPI generation.
- Frontend changes.
- `docs/tasks/ROADMAP.md`.

## Artifacts
- `services/api/src/core/validation/input-validation.ts`
- `services/api/src/core/validation/input-validation.test.ts`
- `services/api/src/core/auth/auth.service.ts`
- `services/api/src/core/auth/auth.handlers.ts`
- `services/api/src/core/users/users.service.ts`
- `services/api/src/core/users/users.handlers.ts`
- `services/api/src/core/sales-documents/sales-documents.service.ts`
- `services/api/src/core/sales-documents/sales-documents.handlers.ts`
- `services/api/src/core/wiki/wiki.service.ts`
- `services/api/src/core/wiki/wiki.handlers.ts`
- `services/api/src/core/faq/faq.service.ts`
- `services/api/src/core/faq/faq.handlers.ts`
- `docs/architecture/api-input-validation.md`

## Validation Evidence
- `npm run test --workspace @alwaystrack/api -- validation` - passed, 7 tests.
- `npm run test --workspace @alwaystrack/api -- auth.service.test.ts users.service.test.ts faq.service.test.ts wiki.service.test.ts sales-documents.service.test.ts validation` - passed, 98 tests.
- `npm run typecheck --workspace @alwaystrack/api` - passed.

## Malformed Cases Covered
- Auth login rejects non-string password.
- User creation rejects scope arrays over 100 items.
- Sales filters reject `pageSize > 100`.
- Sales review rejects negative item quantity.
- Wiki page rejects content over 20,000 chars.
- FAQ thread rejects tag arrays over 20 items.
- Generic validation response returns 400 without echoing payload values.

## Regression Risks
- Touched parsers now reject malformed present fields instead of silently ignoring them.
- Clients sending invalid enum values, negative numbers or oversized strings will now receive 400.
- Unknown fields remain ignored for compatibility; strict allowlists are still future work.

## Remaining Work
- Migrate announcements, script library, organizations and other parser-heavy modules.
- Add endpoint-level API tests for selected mutating routes if broader e2e/API test harness is expanded.
- Consider a schema library only if OpenAPI or richer cross-service schema reuse becomes necessary.
