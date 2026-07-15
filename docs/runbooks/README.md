# Runbooks

## Objetivo
Registrar procedimentos repetiveis que reduzem erro operacional.

## Quando usar
- setup local;
- deploy;
- migracao;
- validacao recorrente;
- incidente ou recuperacao.

## Convencao minima
- ID: `RUNBOOK-###`
- Arquivo: `RUNBOOK-###-<slug>.md`
- Template: `docs/runbooks/_template.md`

## Indice atual
- `RUNBOOK-001-ambiente-local.md`: setup e operacao local.
- `RUNBOOK-002-deploy-producao-jobs.md`: deploy e jobs de producao.
- `RUNBOOK-003-beta-fechado-tailscale.md`: homologacao beta-local via Tailscale e allowlist nominal.
- `RUNBOOK-004-smartscript-local-companion.md`: operacao local do SmartScript Companion.
- `RUNBOOK-005-caseflow-companion-recovery.md`: recuperacao, drift, update/rollback e restore do CaseFlow Companion.
- `RUNBOOK-006-api-runtime-lifecycle.md`: probes, drain e shutdown gracioso da API.

## Catalogo operacional completo
| Dominio | Procedimento canonico | Owner primario | Owner secundario | Revisao/exercicio |
| --- | --- | --- | --- | --- |
| Ambiente local e demo | `RUNBOOK-001-ambiente-local.md` | platform-maintainers | demo-owner | antes de cada apresentacao |
| Deploy, jobs e cron | `RUNBOOK-002-deploy-producao-jobs.md` | platform-maintainers | api-maintainers | a cada release |
| Beta fechado/Tailscale | `RUNBOOK-003-beta-fechado-tailscale.md` | security-maintainers | platform-maintainers | antes de cada janela beta |
| SmartScript local | `RUNBOOK-004-smartscript-local-companion.md` | script-library-maintainers | platform-maintainers | trimestral e antes de rollout |
| CaseFlow/Companion recovery | `RUNBOOK-005-caseflow-companion-recovery.md` | companion-maintainers | caseflow-maintainers | a cada versao e trimestral |
| Lifecycle da API | `RUNBOOK-006-api-runtime-lifecycle.md` | platform-maintainers | api-maintainers | a cada release |
| Backup/restore principal | `../operations/backup-restore-runbook.md` | data-maintainers | platform-maintainers | restore mensal; RPO/RTO trimestral |
| Backup/restore Companion | `../operations/companion-backup-restore-runbook.md` | companion-maintainers | caseflow-maintainers | trimestral |
| Migration/rollback | `../operations/migration-rollback-runbook.md` | data-maintainers | api-maintainers | antes de migration produtiva |
| Postgres/storage readiness | `../operations/production-postgres-storage-readiness.md` | data-maintainers | platform-maintainers | antes de exposicao externa |
| Incidente de seguranca | `../operations/security-incident-runbook.md` | security-maintainers | platform-maintainers | tabletop trimestral |
| Segredos | `../operations/security-secrets-runbook.md` | security-maintainers | platform-maintainers | trimestral e em rotacao |
| Monitoramento/alertas | `../operations/security-monitoring-alerts.md` | security-maintainers | api-maintainers | mensal |
| Companion local/topologia | `../operations/companion-local-runbook.md` e `../operations/companion-topology-gate.md` | companion-maintainers | platform-maintainers | por maquina/perfil suportado |
| Update/rollback Companion | `../operations/companion-update-rollback-runbook.md` | companion-maintainers | platform-maintainers | por release |
| Drift de conectores | `../operations/connector-drift-runbook.md` | connector-maintainers | companion-maintainers | por alerta/drift |
| Live smoke de conectores | `../operations/connector-live-smoke-checklists.md` | connector-maintainers | operations-owner | antes de promover conector |

Documentos de auditoria, relatorios e manifests de task nao sao runbooks. Entram como evidencia ou fonte, mas nao substituem um procedimento executavel.

## Ciclo de vida
1. `draft`: ainda nao pode ser usado como gate.
2. `active`: revisado pelos owners e executavel no ambiente declarado.
3. `exercise-overdue`: procedimento valido, mas exercicio periodico vencido.
4. `deprecated`: substituido, com link para o sucessor.

Mudanca de comando destrutivo, dependencia, topologia, owner ou rollback exige revisao imediata. O owner primario mantem o procedimento; o secundario deve conseguir executa-lo sem contexto oral.

## Regra
Runbook bom e executavel por alguem que nao participou da implementacao. Se depender de contexto oral, ainda nao esta pronto.
