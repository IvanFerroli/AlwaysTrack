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

## Regra
Runbook bom e executavel por alguem que nao participou da implementacao. Se depender de contexto oral, ainda nao esta pronto.
