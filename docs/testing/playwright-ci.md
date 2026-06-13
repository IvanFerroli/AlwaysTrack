# Playwright e CI

## Metadata
- status: active
- owner: quality-maintainers
- last-updated: 2026-06-13
- source-of-truth: docs/testing/playwright-ci.md

## Comandos
- Smoke rapido de CI: `npm run test:e2e:smoke`
- Suite completa local: `npm run test:e2e`
- Fluxos API pelo Playwright: `npm run test:e2e:api`

## Ambiente local
O Playwright precisa das bibliotecas nativas do Chromium. Se a execucao falhar com erro como `libnspr4.so: cannot open shared object file`, a causa e dependencia de sistema ausente, nao regressao do produto.

Use:

```bash
npx playwright install --with-deps chromium
```

Em ambientes sem permissao para instalar pacotes do sistema, rode a suite em container/CI ou instale manualmente as dependencias listadas por:

```bash
npx playwright install-deps chromium --dry-run
```

## CI
O workflow `.github/workflows/check.yml` instala Chromium com `--with-deps` e executa apenas o smoke desktop (`tests/e2e/app-smoke.spec.ts`). A suite completa continua disponivel para validacao local/manual quando houver mudanca de fluxo profundo.

Artefatos de falha ficam em:
- `test-results/e2e-artifacts`: traces, videos e screenshots configurados pelo Playwright.
- `playwright-report`: relatorio HTML.

## Interpretacao de falhas
- Erro de biblioteca nativa ou browser ausente: validar `npx playwright install --with-deps chromium`.
- Timeout no `webServer`: investigar `scripts/start-e2e.js`, migracao isolada, seed e portas `3334`/`5174`.
- Falha de seletor ou expectativa: tratar como regressao de UI/fluxo e abrir trace do artefato.
