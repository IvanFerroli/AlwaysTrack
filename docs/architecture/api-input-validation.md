# API Input Validation

## Status
- owner: olympus_orchestrator
- last-updated: 2026-06-17
- scope: API runtime input validation contracts

## Convention
New or touched API inputs should pass through a parser before reaching service logic. The parser should use `services/api/src/core/validation/input-validation.ts` for runtime checks that TypeScript cannot provide for external JSON.

Use the local helper before adding a schema dependency. It supports:
- object payload validation via `parseObjectPayload`;
- bounded strings via `optionalString`;
- booleans via `optionalBoolean`;
- canonical enums via `optionalEnum`;
- bounded integers/numbers via `optionalInteger` and `optionalNumber`;
- bounded arrays via `optionalArray` and `optionalStringArray`.

Handlers that call these parsers must catch `InputValidationError` and return:

```json
{ "ok": false, "error": { "code": "INVALID_INPUT", "message": "Invalid request payload." } }
```

Do not echo invalid field values, submitted JSON, passwords, tokens, stack traces, or parser issue details to the client. Field-level details may be logged later only if sanitized and explicitly needed.

## Bounds Applied In First Slice
- `page` must be an integer `>= 1` where touched.
- `pageSize` must be an integer from `1` to `100` where touched.
- Users scope arrays are capped at 100 IDs; each ID is capped at 80 chars.
- FAQ and Wiki tag arrays are capped at 20 items; each tag input is capped at 40 chars.
- Sales review item arrays are capped at 200 items.
- Wiki content is capped at 20,000 chars; FAQ/wiki/comment note fields use smaller field-specific caps.
- Sales monetary cent fields are non-negative integers capped at 1,000,000,000.

## Covered Parsers
- `auth/login`: email and password shape/length.
- `users`: create, update, profile, password reset.
- `sales-documents`: filters, campaign payloads, review/manual correction payloads.
- `wiki`: page, edit request, decision note, presence, filters.
- `faq`: admin FAQ payloads, public help payload, thread/comment/reaction payloads, filters.

## Pattern For New Endpoints
1. Keep parser functions close to the domain service.
2. Reject malformed present fields; continue ignoring unknown fields unless the endpoint needs a strict allowlist.
3. Use shared canonical lists for enums when available, for example `userRoles`, `salesDocumentStatuses`, and `campaignStatuses`.
4. Apply field length and array caps at the parser boundary.
5. Add at least one malformed-payload test for new parser behavior.
6. Catch `InputValidationError` in the handler and send the generic 400 response.

## Remaining Work
- Migrate announcements, script library, organizations, documents, notifications, imports and reports parsers in later small slices.
- Decide later whether helper-level schemas are enough or whether a dependency such as Zod is justified for OpenAPI generation.
