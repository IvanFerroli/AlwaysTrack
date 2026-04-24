# DOCS - OLYMPUS CLIMB

## Fonte viva
- `docs/` e a fonte viva e canonica de documentacao operacional e de engenharia.
- `doc/` permanece como arquivo historico (PDFs legados).

## Decisao operacional de superficie ADR
- ADRs devem ser registradas em `docs/adr/`.
- `docs/decisions/` nao e superficie ativa neste ciclo.
- Nao criar `docs/decisions/` sem revisao canonica formal.

## Mapa minimo de superficies
- `docs/adr/`: registros de decisao arquitetural (ADRs).
- `docs/specs/`: especificacoes executaveis por capacidade/eixo.
- `docs/tasks/`: manifests de task executavel.
- `docs/runbooks/`: procedimentos operacionais de rotina, validacao e incidente.
- `docs/operations/`: estado vivo dos kits e memoria operacional.

## Mapa de rotas web (vivo)
- `GET /`: dashboard de navegacao e indice central de rotas (web + api).
- `GET /workspace`: superficie operacional completa (ingestao, approvals, applications, CV analyzer).
- toda acao `POST` da interface web redireciona para `GET /workspace` com feedback de status.

## Convencoes minimas
- IDs:
  - ADR: `ADR-###`
  - SPEC: `SPEC-###`
  - TASK: `TASK-###`
  - RUNBOOK: `RUNBOOK-###`
- Campos de governanca obrigatorios em todo artefato:
  - `status`
  - `owner`
  - `last-updated`
  - `source-of-truth`

## Regra de escopo
- Esta superficie organiza formalizacao.
- Nao e local para implementar funcionalidade de produto.
