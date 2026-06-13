# EXEC-AT-079 - Busca global simples

## Metadata
- task: TASK-AT-079
- status: completed
- executor: olympus_orchestrator
- completed-at: 2026-06-12

## Entrega
Busca global inicial para localizar entidades centrais do AlwaysTrack sem introduzir motor externo.

## Mudancas
- Novo endpoint `GET /v1/search?q=...&limit=...`.
- Resultados agrupados por notas/DANFEs, vendedores, campanhas, Wiki e FAQ.
- Escopo respeita usuario vendedor, administradores/supervisores e organizacao atual.
- Header web ganhou campo de busca com popover agrupado e link para a tela relevante.
- Testes unitarios cobrem parsing, agrupamento de resultados e escopo de vendedor.

## Arquivos principais
- `services/api/src/core/search/search.service.ts`
- `services/api/src/core/search/search.handlers.ts`
- `services/api/src/core/search/search.service.test.ts`
- `services/api/src/app.ts`
- `apps/web/src/main.tsx`
- `apps/web/src/styles.css`

## Validacao
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run test --workspace @alwaystrack/api -- search.service.test.ts`

## Risco residual
- Busca ainda e textual/SQL simples, sem ranking semantico; suficiente para MVP interno e demonstracao.
