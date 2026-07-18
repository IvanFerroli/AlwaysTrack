# TASK-AT-371 - Overrides auditados de pausas SAC

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-371-sac-pause-audited-overrides.md

## Modo
- mode: implementation

## Objetivo unico
Permitir excecoes autorizadas de slot/capacidade com justificativa, impacto e trilha imutavel.

## Contexto minimo
Operacoes reais exigem excecao, mas um override invisivel tornaria a capacidade minima apenas decorativa.

## Dependencias
- satisfeitas: TASK-AT-364 e TASK-AT-369.
- em aberto: n/a.

## Alvos explicitos
1. API de criar/revogar override.
2. Registro de antes/depois, regra violada e impacto de cobertura.
3. UI administrativa de confirmacao reforcada e historico.

## Fora de escopo
- Override automatico por fallback.
- Alterar retroativamente a politica versionada.

## Checklist
1. Exigir permissao, motivo estruturado e nota limitada.
2. Calcular capacidade antes/depois e destacar breach.
3. Exigir confirmacao adicional quando ficar abaixo do minimo.
4. Revogar por novo evento compensatorio, nunca delete/update destrutivo.
5. Emitir metrica e auditoria correlacionadas.

## Acceptance Criteria
1. SAC e roles sem permissao nao criam override por UI ou API.
2. Todo override explica quem, quando, por que, qual regra e qual impacto.
3. Revogacao preserva o evento original e o estado resultante.
4. Overlap e dashboard distinguem reserva normal de override.

## Validacao
- comandos/checks: testes RBAC/anti-IDOR/auditoria, Web e `git diff --check`.
- revisao manual: forcar breach, confirmar aviso e revogar.

## Riscos
- Nota livre conter dado pessoal ou segredo operacional.

## Proximo passo provavel
TASK-AT-372

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: override sempre explicito, raro e mensuravel.
