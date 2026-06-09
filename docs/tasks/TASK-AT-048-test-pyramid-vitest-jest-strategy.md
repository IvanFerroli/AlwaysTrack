# TASK-AT-048 - Test pyramid and runner strategy

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-06-09
- source-of-truth: docs/tasks/TASK-AT-048-test-pyramid-vitest-jest-strategy.md

## Modo
- mode: quality-foundation

## Objetivo unico
Formalizar e ampliar a piramide de testes do AlwaysTrack, evitando duplicacao confusa entre Vitest e Jest e deixando claro onde cada tipo de teste entra.

## Contexto minimo
Hoje o repo usa Vitest no backend. O pedido menciona Jest e "wright"; tecnicamente, a recomendacao e manter Vitest para unit/integration de TypeScript, avaliar Jest apenas se houver dependencia concreta, e adicionar Playwright para e2e/browser. A plataforma precisa ficar manutenvivel e confiavel para mudancas frequentes.

## Alvos explicitos
1. Criar `docs/testing/strategy.md` com matriz:
   - Unit: services, parsers, policies, helpers.
   - Integration: API + Prisma + SQLite test DB.
   - Contract: request/response e schemas compartilhados.
   - E2E: Playwright no app real.
   - Regression: bugs de DANFE/ranking/Wiki/FAQ.
   - Migration/rollback: banco e seed.
   - Load: Artillery.
2. Decidir runner oficial para unit/integration: Vitest ou Jest.
3. Se Jest for adotado, justificar custo e escopo; se nao, documentar Vitest como padrao.
4. Definir naming convention: `*.test.ts`, `*.integration.test.ts`, `*.e2e.ts`, `*.regression.test.ts`.
5. Criar scripts separados:
   - `test:unit`
   - `test:integration`
   - `test:regression`
   - `test:e2e`
   - `test:all`
6. Separar testes rapidos de gates lentos.

## Fora de escopo
- Escrever todos os testes da plataforma nesta task.
- Trocar runner so por preferencia.

## Acceptance Criteria
1. Existe estrategia documentada e aprovada no repo.
2. Scripts de teste separados funcionam e sao usados no README/runbooks.
3. CI diferencia gate rapido de gate completo.
4. Dev sabe onde colocar um teste novo sem perguntar.

## Validacao
- `npm run test:unit`
- `npm run test:integration`
- `npm run check`

## Execucao 2026-06-09
- Vitest mantido como runner oficial para unit, integracao e regressao.
- Jest nao foi adotado para evitar duplicacao de runner sem necessidade concreta.
- Scripts criados: `test:unit`, `test:integration`, `test:regression`, `test:e2e`, `test:all`.
- `test:e2e` ficou como alias temporario ate a implementacao Playwright da `TASK-AT-049`.
- Artillery documentado como ferramenta preferida de carga para `TASK-AT-051`.

## Riscos
- Dois runners sem necessidade aumentam manutencao.
- Testes lentos podem matar produtividade se entrarem no gate errado.
