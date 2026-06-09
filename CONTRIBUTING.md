# Contributing to AlwaysTrack

## Primeira hora
1. `npm install`
2. `npm run setup`
3. `npm run check`
4. Leia `docs/architecture/README.md`.
5. Leia `docs/testing/strategy.md`.

## Comandos
- `npm run up`: sobe API, web e Prisma Studio.
- `npm run setup`: aplica schema e seed local.
- `npm run db:flush:local`: recria banco local.
- `npm run check`: lint, typecheck e testes Vitest.
- `npm run test:unit`: testes rapidos de services/helpers.
- `npm run test:integration`: fluxo operacional principal.
- `npm run test:regression`: bugs protegidos de notas, Wiki, FAQ e notificacoes.
- `npm run test:e2e`: Playwright com navegador real.
- `npm run docs:api`: TypeDoc.
- `npm run db:test:migrations`: migrations em SQLite temporario vazio e seedado.
- `npm run perf:smoke`: Artillery local.
- `npm run repo:hygiene`: impede artefatos locais rastreados.

## Antes de PR
- Rode o menor teste que cobre sua mudanca.
- Rode `npm run check` antes de commitar.
- Se mudou contrato, rode `npm run docs:api`.
- Se mudou UI/navegacao, rode `npm run test:e2e`.
- Se mudou schema/seed, rode `npm run db:test:migrations`.
- Descreva risco, rollback e evidencia.

## Branch, release e rollback
- Branches devem partir de `main`.
- Commits devem ser pequenos e sem artefatos locais.
- Deploy app-only pode voltar por revert/deploy anterior.
- Deploy com migration precisa de backup e plano de restore.
