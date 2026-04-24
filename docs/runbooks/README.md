# RUNBOOK Surface

## Objetivo
Padronizar procedimentos operacionais repetiveis com passos verificaveis e evidencia.

## Quando usar
- rotina operacional recorrente;
- validacao de entrega;
- troubleshooting ou resposta a incidente.

## Convencao minima
- ID: `RUNBOOK-###`
- Arquivo por runbook: `RUNBOOK-###-<slug>.md`
- Base inicial: `docs/runbooks/_template.md`

## Campos obrigatorios
- `status`
- `owner`
- `last-updated`
- `source-of-truth`

## Fora de escopo
- spec de arquitetura;
- task manifest;
- texto narrativo sem passos operacionais.

## Navegacao operacional atual
- iniciar em `GET /` para visualizar o indice de rotas.
- usar `GET /workspace` para executar fluxos operacionais de ponta a ponta.
