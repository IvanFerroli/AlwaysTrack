# TASK-AT-392 - RBAC, tenancy e auditoria de Escalas SAC

## Metadata
- status: completed-local-validation
- owner: olympus_taskyfier
- last-updated: 2026-07-18
- source-of-truth: docs/tasks/TASK-AT-392-sac-scheduling-rbac-tenancy-audit.md

## Modo
- mode: implementation

## Objetivo unico
Estender a matriz SAC com permissoes de consultar, configurar, oferecer, trocar, aprovar e sobrescrever Escalas por self/time/organizacao.

## Contexto minimo
TASK-AT-364 cobre Pausas, Performance e Campanhas. Escalas adicionam alteracao de jornada, aprovacao e dados pessoais operacionais que exigem menor privilegio e trilha propria.

## Dependencias
- satisfeitas: TASK-AT-364 e TASK-AT-391.
- em aberto: politica de aprovacao de dobra e troca.

## Alvos explicitos
1. Matriz canonica Shared e documentacao de seguranca.
2. Helpers de escopo temporal self/team/organization.
3. Taxonomia de auditoria para regras, turnos, excecoes e decisoes.

## Fora de escopo
- RBAC configuravel por usuario.
- Expor calendario nominal de outro time a SAC.

## Checklist
1. Definir `schedule.readOwn`, `readTeam`, `manageTeam`, `offer`, `swap`, `approve` e `override` ou equivalentes.
2. Limitar SUPERVISOR ao time e periodo de membership aplicavel.
3. Reservar override organizacional e configuracao global a GESTOR/ADMIN conforme matriz.
4. Aplicar maker-checker a pedido que altera a propria carga quando exigido.
5. Redigir auditoria sem perder antes/depois, regra e ator.

## Acceptance Criteria
1. SAC consulta e negocia apenas a propria escala e ofertas elegiveis.
2. SUPERVISOR nao aprova nem edita fora do proprio time/competencia.
3. Toda decisao sensivel valida tenant no service, nao apenas na rota.
4. Eventos permitem reconstruir alteracao sem registrar segredo ou nota livre integral.

## Validacao
- comandos/checks: testes access policy positivos/negativos, anti-IDOR, typecheck Shared/API/Web e `git diff --check`.
- revisao manual: matriz role x acao x time x estado x periodo.

## Riscos
- Membership atual conceder acesso indevido a escala historica de outro time.

## Proximo passo provavel
TASK-AT-393

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: nenhuma rota de Escalas sem helper canonico de escopo.
