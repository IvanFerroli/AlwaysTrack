# TASK-AT-162 - Banner visual de homologacao beta-local

## Metadata
- status: proposed
- owner: olympus_orchestrator
- last-updated: 2026-06-19
- source-of-truth: docs/tasks/TASK-AT-162-beta-local-banner.md

## Modo
- mode: implementation

## Objetivo unico
Exibir banner de homologacao para todos os usuarios quando ambiente beta-local estiver ativo.

## Contexto minimo
O beta nao substitui processos oficiais. Todo usuario deve visualizar que esta em ambiente local/controlado de homologacao.

## Inputs
- Decisao congelada: banner para todos quando beta ativo.
- Env definida em `TASK-AT-161`.

## Dependencias
- satisfeitas: decisao de produto.
- em aberto: nome final da env de beta.

## Alvos explicitos
1. `apps/web/src`
2. `.env.example`
3. docs/runbook beta

## Fora de escopo
- Criar sistema de ambientes complexo.
- Alterar tema global inteiro.

## Checklist
1. Expor modo beta ao frontend.
2. Criar banner visivel e nao intrusivo.
3. Texto sugerido: "Ambiente Beta Fechado - Uso exclusivo para homologacao interna."
4. Garantir exibicao para todas as roles.
5. Garantir que nao aparece quando beta desligado.

## Acceptance Criteria
1. Banner aparece para SAC, VENDEDOR, FINANCEIRO, SUPERVISOR, GESTOR e ADMIN no beta.
2. Banner nao aparece fora do beta.
3. Banner nao quebra layout mobile/desktop.

## Definition of Done
1. Banner implementado.
2. Typecheck web passando.
3. Print/checklist manual por role.

## Validacao
- comandos/checks: `npm run typecheck --workspace @alwaystrack/web`.
- revisao manual: ativar/desativar env.

## Evidencia esperada
- Print ou descricao do banner.
- Env documentada.

## Riscos
- Banner cobrir controles importantes.
- Texto parecer producao oficial.

## Blockers possiveis
- Env de beta nao definida.

## Retorno esperado
- resumo curto do banner
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
