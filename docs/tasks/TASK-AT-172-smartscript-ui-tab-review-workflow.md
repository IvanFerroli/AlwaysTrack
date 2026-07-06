# TASK-AT-172 - SmartScript: aba na Scriptoteca e revisao humana

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-07-06
- source-of-truth: docs/tasks/TASK-AT-172-smartscript-ui-tab-review-workflow.md

## Modo
- mode: implementation

## Objetivo unico
Adicionar a aba `SmartScript` dentro da Scriptoteca com revisao humana simples para candidatos e snippets pessoais.

## Contexto minimo
SmartScript nasce em `Scriptoteca > SmartScript`, sem menu lateral proprio no MVP. A UI precisa expor apenas `Em uso`, `Gerados hoje` e `Em revisão`.

## Inputs
- `TASK-AT-170`
- `TASK-AT-171`
- `apps/web/src/views/script-library.tsx`

## Dependencias
- satisfeitas: `TASK-AT-170`, `TASK-AT-171`.
- em aberto: n/a.

## Alvos explicitos
1. `apps/web/src/views/script-library.tsx`
2. cliente API web da Scriptoteca
3. testes frontend/e2e relevantes

## Fora de escopo
- Redesenhar toda a Scriptoteca.
- Menu lateral proprio.
- Captura local.

## Checklist
1. Criar entrada/aba `SmartScript` na tela da Scriptoteca.
2. Exibir colunas ou filtros `Gerados hoje`, `Em revisão` e `Em uso`.
3. Acoes: Aprovar, Rejeitar, Editar, Enviar para revisao.
4. Suportar revisao numerada `1 sim`, `2 nao`, `3 editar`, `4 revisao`.
5. Mostrar trigger `:` e bloqueios de `/` com feedback claro.
6. Indicar que Espanso e export/runtime, nao fonte da verdade.
7. Preservar responsividade e densidade operacional.

## Acceptance Criteria
1. Atendente revisa candidatos sem sair da Scriptoteca.
2. Nenhum estado extra aparece visualmente.
3. Edicao de snippet `Em uso` cria proposta/revisao, nao altera diretamente.
4. Revisao numerada chama os mesmos endpoints dos botoes.
5. UI nao exibe raw logs.

## Definition of Done
1. UI conectada aos endpoints SmartScript.
2. Estados vazios/loading/error tratados.
3. E2E ou teste de browser cobre fluxo principal de decisao.

## Validacao
- comandos/checks: `npm run typecheck --workspace @alwaystrack/web`, `npm run test:e2e:api` ou Playwright especifico quando criado.
- revisao manual: importar fixture e decidir candidatos na tela.

## Evidencia esperada
- Prints ou descricoes de estados.
- Teste cobrindo aprovar/rejeitar/enviar para revisao.

## Riscos
- Poluir a Scriptoteca com controles demais.
- Criar divergencia entre botoes e revisao numerada.

## Blockers possiveis
- Cliente API web precisar extracao adicional.

## Retorno esperado
- resumo da UI
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Resultado
- Entregue aba `SmartScript` dentro da Scriptoteca, sem menu lateral proprio.
- UI lista `Gerados hoje`, `Em revisão` e `Em uso`, com acoes de aprovar, rejeitar, editar, revisar e revisao numerada.
- Export manual para Espanso aparece dentro da propria aba.
