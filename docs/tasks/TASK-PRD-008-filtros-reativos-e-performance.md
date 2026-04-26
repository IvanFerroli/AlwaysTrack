# TASK-PRD-008 - Filtros reativos e performance de navegação

## Metadata
- status: completed-with-remarks
- owner: olympus-taskyfier
- last-updated: 2026-04-26
- source-of-truth: docs/tasks/TASK-PRD-008-filtros-reativos-e-performance.md

## Modo
- mode: runtime

## Objetivo unico
Acelerar experiência de filtragem e reduzir ruído visual no dashboard com atualização mais responsiva e estado de filtro consistente.

## Contexto minimo
Com volume maior de vagas, a UX de filtros pode ficar lenta/confusa. Precisamos manter clareza operacional sem sacrificar performance.

## Inputs
- `apps/web/src/features/dashboard/render-dashboard.ts`
- `apps/web/src/features/dashboard/load-dashboard.ts`
- `services/api/src/features/match/match.handlers.ts`

## Dependencias
- satisfeitas: TASK-UX-003, TASK-MCH-002
- em aberto: n/a

## Alvos explicitos
1. Adicionar modo opcional de auto-apply (debounced) para busca textual `q`.
2. Exibir contagem de opções por filtro (quando disponível) sem quebrar o modo atual.
3. Evitar re-render desnecessário de controles customizados em navegação de paginação.
4. Garantir consistência de estado em refresh/back-forward do navegador.

## Fora de escopo
- trocar stack frontend;
- reescrever dashboard completo;
- mover filtros para outra rota.

## Checklist
1. Introduzir debounce no campo `q` com fallback para submit manual.
2. Revisar script dos dropdowns para minimizar custo por interação.
3. Adicionar micro-métricas de tempo de filtro no console debug (somente dev).
4. Cobrir cenários com 200+ vagas renderizadas.

## Acceptance Criteria
1. Digitação em `q` não causa travamento perceptível.
2. Estado de filtros permanece coerente após paginação e refresh.
3. Controles continuam acessíveis e removíveis por chip.

## Definition of Done
1. UX mais rápida em carga real.
2. Evidência comparativa de tempo/interação antes vs depois.

## Validacao
- comandos/checks:
  - `npm run typecheck`
  - `npm run lint`
- revisao manual:
  - teste de uso com batch grande (>=200 vagas) em `/`.

## Evidencia esperada
- vídeo/print curto do fluxo com filtros ativos;
- registro comparativo de latência percebida.

## Riscos
- excesso de automação em filtros confundir usuário;
- debounce agressivo atrasar feedback.

## Blockers possiveis
- limitação do ambiente para simular volume alto de vagas;
- conflitos com scripts inline existentes.

## Feedback obrigatorio de retorno
- qual tempo médio de resposta de filtro ficou após ajustes?
- auto-apply ficou habilitado por padrão ou opcional?
