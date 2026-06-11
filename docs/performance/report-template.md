# AlwaysTrack Performance Report Template

## Metadata
- mode: smoke | 1000
- commit:
- target:
- captured-at:
- operator:

## Environment
- API instances:
- DB engine/version:
- Redis/BullMQ:
- external providers mocked or disabled:
- seed user:

## Commands
- `SEED_ADMIN_PASSWORD=... npm run perf:smoke:report -- --target=<api-url>`
- `SEED_ADMIN_PASSWORD=... npm run perf:1000:report -- --target=<stage-api-url>`

## SLO
- p95 API read <= 500 ms in target environment.
- p95 critical write <= 1000 ms.
- HTTP error rate < 1%.
- Memory must not grow without bound.

## Results
- Artillery JSON:
- Artillery HTML:
- Diagnostics before:
- Diagnostics after:
- p95 read:
- HTTP error rate:
- throughput:
- CPU/memory notes:

## Decision
- PASS | FAIL | INCONCLUSIVE

## Notes
- Local smoke reports validate script health only.
- Only stage/prod-like reports can close the 1000-user gate.
