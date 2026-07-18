# TASK-AT-414 - Documentacao de Escalas, Notificacoes e Avisos

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-414-scheduling-notification-announcement-docs.md

## Modo
- mode: documentation

## Objetivo unico
Estender TASK-AT-388 com arquitetura, dicionario temporal, API e runbooks da nova frente.

## Contexto minimo
Gestao precisa configurar regras sem ler codigo; operadores precisam diagnosticar escala stale, Pausa conflitada, notificacao sem alvo e recorrencia atrasada.

## Dependencias
- satisfeitas: TASK-AT-388 e TASK-AT-391 a TASK-AT-413.
- em aberto: resultados do rehearsal da TASK-AT-415.

## Alvos explicitos
1. Arquitetura/domains e dicionario de estados/precedencia.
2. Matriz RBAC, OpenAPI/eventos e ajuda operacional.
3. Runbooks de materializacao, cobertura, scheduler, fallback e rollback.

## Fora de escopo
- Declarar alerta/rollout live sem evidencia.
- Duplicar regra executavel em texto divergente.

## Checklist
1. Explicar base, efetiva, excecao, dobra, extra, oferta/troca e aprovacao.
2. Explicar subordinacao/remarcacao de Pausa e cobertura stale.
3. Explicar notification targets, fallback e ausencia de preferencias.
4. Explicar overlay patterns e criterios de acessibilidade.
5. Explicar recorrencia 14/29, timezone, vigencia, edicao futura e catch-up.
6. Catalogar flags, jobs, troubleshooting, ownership e evidencias.

## Acceptance Criteria
1. Gestor configura regra/recorrencia sem ambiguidade de timezone/estado.
2. Operador diagnostica falha sem editar banco manualmente.
3. API/exemplos refletem contratos reais e RBAC.
4. `check:docs` passa sem excecao nova injustificada.

## Validacao
- comandos/checks: `npm run check:docs`, contract tests e `git diff --check`.
- revisao manual: walkthrough por gestor e operador que nao implementaram a frente.

## Riscos
- Documentar o dia 29 antes de produto fechar a semantica de fevereiro.

## Proximo passo provavel
TASK-AT-415

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: documentar somente decisoes aprovadas e runtime real.

