# AlwaysTrack Testing Strategy

## Metadata
- status: active
- owner: quality-maintainers
- last-updated: 2026-06-09
- source-of-truth: docs/testing/strategy.md

## Objetivo
Definir onde cada tipo de teste entra no AlwaysTrack para manter velocidade de desenvolvimento, confianca operacional e manutencao por novos devs.

## Decisao de runner
Vitest e o runner padrao para unit, integration e regression tests em TypeScript.

Jest nao sera adotado agora. O projeto ja usa Vitest, a suite esta verde, e adicionar Jest duplicaria configuracao, mocks e padroes sem ganho concreto. Jest so deve ser reavaliado se uma dependencia futura exigir APIs ou ecossistema que Vitest nao cubra bem.

Playwright sera o runner de browser/e2e na `TASK-AT-049`.

Artillery sera a ferramenta preferida de carga HTTP na `TASK-AT-051`. BullMQ nao e ferramenta de carga; BullMQ entra para filas, backpressure e jobs pesados na `TASK-AT-052`.

## Piramide de testes

| Camada | Runner | Escopo | Nomenclatura | Gate |
| --- | --- | --- | --- | --- |
| Unit | Vitest | parsers, policies, helpers, services pequenos | `*.test.ts` | `npm run test:unit` |
| Integration | Vitest | service + Prisma mock/test DB + fluxos multi-service | `*.integration.test.ts` ou e2e service atual | `npm run test:integration` |
| Regression | Vitest | bugs ja encontrados: DANFE, ranking, Wiki, FAQ, notificacoes | `*.regression.test.ts` ou arquivos focados | `npm run test:regression` |
| Browser E2E | Playwright | login, UI real, fluxos criticos | `*.e2e.ts` | `npm run test:e2e` depois da `TASK-AT-049` |
| Migration/Rollback | Vitest + scripts Prisma | banco vazio, banco seedado, backup/restore | `*.migration.test.ts` | `TASK-AT-050` |
| Load | Artillery | 1000 usuarios, latencia, throughput e erro | `*.artillery.yml` | `TASK-AT-051` |

## Scripts atuais
- `npm run test:unit`: roda testes Vitest rapidos excluindo `src/core/quality`.
- `npm run test:integration`: roda o fluxo operacional principal service-level.
- `npm run test:regression`: roda suites que protegem notas, Wiki, FAQ e notificacoes.
- `npm run test:e2e`: roda Playwright com ambiente isolado.
- `npm run test:all`: roda `check` e docs TypeDoc.
- `npm run check`: gate rapido atual de lint/typecheck/test.
- `npm run check:docs`: gera TypeDoc e falha se a documentacao tecnica quebrar.

## O que testar primeiro
1. Invariante de tenancy: usuario nunca ve organizacao alheia.
2. Role e permissao: ADMIN/GESTOR/SAC/FINANCEIRO/VENDEDOR/SUPERVISOR.
3. Fluxo DANFE: upload, extracao, dedupe, review, ranking e extrato.
4. Wiki/FAQ: slug, revisao, comentario, promocao e backlink.
5. Notificacoes: destinatario, dedupe, read/unread e link interno.
6. Google login: estado OAuth, dominio permitido, sessao e fallback.
7. Migration/rollback quando schema mudar.

## Quando criar cada tipo
- Unit: sempre que uma regra couber em funcao/service isolado.
- Integration: quando duas ou mais camadas precisam provar contrato.
- Regression: sempre que um bug real for corrigido.
- Browser E2E: quando a UI ou navegacao for parte do risco.
- Load: antes de promessa de escala, depois de estabilizar dados e observabilidade.

## Regras de manutencao
1. Teste rapido fica no gate de PR.
2. Teste caro fica em gate completo ou manual documentado.
3. Teste deve criar seu proprio estado.
4. Nao depender de provider externo real no CI.
5. Nome do teste deve dizer o comportamento protegido.
6. Snapshot so entra quando revisar diferenca for simples.
7. Bug sem teste de regressao deve ser excecao, nao padrao.

## Proximas tasks conectadas
- `TASK-AT-049`: ampliar o smoke Playwright para fluxos profundos de DANFE, Wiki, FAQ, notificacoes e usuarios.
- `TASK-AT-050`: migration/rollback tests.
- `TASK-AT-051`: Artillery load gate.
- `TASK-AT-052`: BullMQ backpressure tests.
