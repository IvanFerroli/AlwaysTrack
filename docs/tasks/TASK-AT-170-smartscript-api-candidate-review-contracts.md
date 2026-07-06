# TASK-AT-170 - SmartScript: APIs de candidatos e revisao

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-07-06
- source-of-truth: docs/tasks/TASK-AT-170-smartscript-api-candidate-review-contracts.md

## Modo
- mode: implementation

## Objetivo unico
Criar endpoints autenticados do SmartScript dentro da Scriptoteca para importar, listar, editar e decidir candidatos/snippets.

## Contexto minimo
O companion local precisa enviar candidatos processados para o AlwaysTrack, e a UI precisa operar os estados `Gerados hoje`, `Em revisão` e `Em uso` sem criar modulo independente.

## Inputs
- `TASK-AT-168`
- `TASK-AT-169`
- `services/api/src/core/script-library/script-library.handlers.ts`
- `services/api/src/core/script-library/script-library.service.ts`

## Dependencias
- satisfeitas: `TASK-AT-168`, `TASK-AT-169`.
- em aberto: n/a.

## Alvos explicitos
1. `services/api/src/core/script-library/`
2. rotas `/v1/script-library/smartscript/*`
3. testes de service/handler

## Fora de escopo
- UI web.
- Companion local.
- Export Espanso.

## Checklist
1. Endpoint para importar ate 10 candidatos por processamento.
2. Endpoint para listar por estado visual.
3. Endpoint para editar candidato/snippet em revisao.
4. Endpoint para aprovar como `Em uso`.
5. Endpoint para rejeitar.
6. Endpoint para enviar para `Em revisão`.
7. Rollover de `Gerados hoje` para `Em revisão` quando novo processamento for importado.
8. Validacao runtime e permissoes por owner/organizacao.

## Acceptance Criteria
1. Import com mais de 10 candidatos e rejeitado ou truncado conforme contrato explicito.
2. Apenas dono ve seus candidatos pessoais.
3. Snippet `Em uso` nao e alterado diretamente; edicao vira proposta/revisao.
4. Estados retornados pela API mapeiam para os tres estados visiveis.
5. Payload malformado retorna 400 generico.

## Definition of Done
1. Rotas implementadas e testadas.
2. Contratos compartilhados atualizados.
3. Auditoria basica conectada quando aplicavel.

## Validacao
- comandos/checks: `npm run test --workspace @alwaystrack/api -- script-library`, `npm run typecheck --workspace @alwaystrack/api`.
- revisao manual: chamadas API simulando import e decisao.

## Evidencia esperada
- Testes de import/list/decide/edit/reject.
- Amostra de resposta sem raw logs.

## Riscos
- Duplicar fluxo de sugestoes canonicas.
- Permitir update direto de snippet ativo.

## Blockers possiveis
- Ajuste fino de nomes de estado interno.

## Retorno esperado
- resumo dos endpoints
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Resultado
- Entregues endpoints `/v1/script-library/smartscript/items`, `/import`, `/items/:id/decision` e `/export/espanso`.
- Import limita ate 10 candidatos, aplica rollover de `Gerados hoje` para `Em revisão` e preserva escopo por owner/organizacao.
- Decisao cobre aprovar, rejeitar, editar e enviar para revisao.
