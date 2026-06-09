# TASK-AT-026 - Commercial flow upload smoke

## Metadata
- status: completed
- owner: product-builder
- last-updated: 2026-06-04
- source-of-truth: docs/tasks/TASK-AT-026-commercial-flow-upload-smoke.md
- execution-target: EXEC-AT-024

## Modo
- mode: verification

## Objetivo unico
Adicionar cobertura smoke/e2e minima do fluxo comercial com upload XML/PDF ate revisao, ranking e extratos, sem depender de provedores externos reais.

## Contexto minimo
O fluxo comercial ja possui upload de DANFE, extracao deterministica de XML/PDF textual, revisao, ranking/campanhas/dashboard/extratos e smoke `npm run smoke:beta-local`. `EXEC-AT-024` adicionou cobertura e2e/service para proteger a jornada comercial principal com XML/PDF sem provedores externos reais.

## Inputs
- `services/api/src/core/sales-documents/*`
- `services/api/src/core/quality/main-flow.e2e.test.ts`
- `scripts/smoke-beta-local.js`
- `docs/tasks/TASK-AT-016-seller-danfe-upload.md`
- `docs/tasks/TASK-AT-018-sales-document-review.md`
- `docs/tasks/TASK-AT-019-ranking-campaigns-mvp.md`
- `docs/tasks/TASK-AT-021-sales-statements-mvp.md`
- `docs/tasks/TASK-AT-028-danfe-deterministic-extraction.md`

## Dependencias
- satisfeitas: upload autenticado, extracao deterministica XML/PDF textual, review, ranking, campanhas, dashboard e extratos MVP.
- em aberto: nenhuma para o escopo MVP desta task.

## Entregue
- `services/api/src/core/quality/main-flow.e2e.test.ts` cobre upload XML NF-e e PDF textual com parser deterministico.
- O teste valida criacao de nota em `PENDING_REVIEW`, aprovacao de nota XML e inclusao apenas de nota aprovada em ranking e extratos.
- Storage, Prisma e parsing PDF ficam mockados em memoria; nenhum provider externo real e exigido.
- `docs/tasks/EXEC-AT-024-commercial-flow-upload-smoke.md` registra evidencias e risco residual.

## Alvos explicitos
1. E2E/service smoke que faz login comercial deterministico.
2. Upload de XML NF-e local e validacao de `PENDING_REVIEW` com provider deterministico.
3. Upload de PDF textual local e validacao de extracao sem IA externa.
4. Revisao/aprovacao de ao menos uma nota com itens.
5. Conferencia de ranking, campanha/snapshot quando aplicavel, dashboard e extratos considerando apenas nota aprovada.
6. Comando smoke local ou teste e2e documentado em `EXEC-AT-024`.

## Fora de escopo
- Playwright/browser full e2e se o harness atual for apenas API.
- Chamadas reais a OpenAI, Gemini, Google, Meta ou storage externo.
- Cobrir todos os roles em matriz completa.
- Reescrever seed comercial ou remover fixtures SyLembra.
- Refatorar ranking, campanhas, dashboard ou extratos alem do necessario para testar.

## Checklist
1. Localizar o menor harness existente entre `main-flow.e2e.test.ts` e `smoke-beta-local`.
2. Criar fixtures pequenas de XML NF-e e PDF textual validas para o parser deterministico.
3. Fazer upload autenticado como vendedor ou usuario comercial equivalente.
4. Confirmar status, campos fiscais principais, itens e logs/auditoria quando ja disponiveis no contrato.
5. Aprovar a nota com perfil autorizado.
6. Consultar ranking, dashboard e extratos para garantir que a nota aprovada entra e notas nao aprovadas ficam fora.
7. Registrar evidencias em `EXEC-AT-024`.

## Acceptance Criteria
1. O check falha se upload XML deixar de criar nota extraida em `PENDING_REVIEW`.
2. O check falha se upload PDF textual deixar de usar caminho deterministico/fake local.
3. O check falha se nota aprovada nao aparecer em ranking e extratos.
4. O check falha se nota ainda pendente aparecer em ranking ou extratos.
5. A validacao roda sem secrets e sem provedores externos reais.

## Definition of Done
1. Existe cobertura automatizada pequena para XML e PDF textual no fluxo comercial.
2. `npm run smoke:beta-local` ou comando de teste indicado passa localmente.
3. `EXEC-AT-024` documenta comando, resultado, fixtures usadas e riscos residuais.
4. O escopo comercial principal fica protegido sem alterar runtime alem do necessario.

## Validacao
- comandos/checks: `npm run test --workspace @alwaystrack/api -- main-flow.e2e.test.ts`, `npm run smoke:beta-local`
- revisao manual: conferir que fixtures sao locais, pequenas e nao contem dados sensiveis; conferir que nenhum provider externo real foi exigido.

## Evidencia esperada
- Saida do teste/e2e com XML e PDF textual passando.
- Registro de status `PENDING_REVIEW` apos extracao e `APPROVED` apos revisao.
- Ranking/extratos/dashboard refletindo apenas documentos aprovados.
- `EXEC-AT-024` com resumo curto e proximo passo.

## Riscos
- Fixture PDF textual fragil pode quebrar por alteracao pequena no parser.
- Smoke muito amplo pode ficar lento ou duplicar testes de service ja existentes.
- Reusar seed legado pode mascarar falhas se os asserts nao isolarem documentos criados no teste.

## Blockers possiveis
- Harness atual nao suporta upload binario/multipart sem ajuste pequeno.
- Parser deterministico exige formato de PDF textual dificil de representar em fixture minima.
- Dados seedados nao incluem vendedor/grupo adequado para o ator escolhido.

## Retorno esperado
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
