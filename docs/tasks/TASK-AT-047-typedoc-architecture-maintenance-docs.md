# TASK-AT-047 - TypeDoc and architecture maintenance docs

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-06-09
- source-of-truth: docs/tasks/TASK-AT-047-typedoc-architecture-maintenance-docs.md

## Modo
- mode: documentation-foundation

## Objetivo unico
Criar documentacao tecnica transversal para que qualquer dev consiga entender, manter e evoluir o AlwaysTrack sem depender de memoria oral.

## Contexto minimo
O produto cresceu rapido e agora concentra auth Google, roles comerciais, DANFE, ranking, Wiki, FAQ, notificacoes, auditoria, seed/flush e legado SyLembra desligado por flag. Falta uma camada de documentacao gerada e curada que explique contratos, fluxos, limites e pontos de extensao.

## Alvos explicitos
1. Adicionar TypeDoc no monorepo para `services/api/src`, `apps/web/src` e `packages/shared`.
2. Criar scripts `docs:api` ou equivalente para gerar documentacao local.
3. Documentar publicamente apenas APIs internas seguras: services, handlers, contratos compartilhados e helpers reutilizaveis.
4. Criar `docs/architecture/` com visao de runtime, dominios, ownership, dados e fluxos principais.
5. Criar mapas transversais:
   - Auth/sessao/Google login.
   - Tenancy/organizacao/roles.
   - DANFE upload/extracao/revisao/ranking.
   - Wiki/FAQ/notificacoes/auditoria.
   - Seed/flush/local dev.
6. Definir padrao minimo de doc comments para funcoes exported e services publicos.

## Fora de escopo
- Reescrever toda documentacao manual antiga.
- Gerar docs de codigo privado trivial.
- Expor secrets, credenciais, exemplos reais de cliente ou dumps de banco.

## Acceptance Criteria
1. `npm run docs:api` gera documentacao TypeDoc sem erro.
2. Dev novo consegue localizar o fluxo DANFE -> ranking em ate 5 minutos lendo `docs/architecture`.
3. Services e contratos principais tem comentarios curtos e uteis.
4. README ou runbook aponta para docs geradas e docs curadas.
5. CI ou check documental falha se TypeDoc quebrar em exports publicos.

## Validacao
- `npm run docs:api`
- `npm run check`
- Revisao manual de um dev: seguir um fluxo de manutencao usando apenas docs.

## Execucao 2026-06-09
- TypeDoc adicionado com escopo restrito para contratos compartilhados, services principais e componente operacional web.
- `docs:api` e `check:docs` criados; `test:all` agora roda `check` + TypeDoc.
- `docs/architecture/` criado com runtime, dominios, mapa de manutencao e fluxos transversais.
- Comentarios TypeDoc curtos adicionados aos contratos centrais de notas, Wiki, FAQ e notificacoes.
- Pendente proposital: expandir comentarios finos conforme novos services forem tocados.

## Riscos
- TypeDoc pode gerar ruido demais; restringir escopo.
- Comentarios podem virar documentacao morta; preferir explicar contratos e invariantes, nao codigo obvio.
