# Docs

## Finalidade
`docs/` e a superficie viva de engenharia. Ela separa o pipeline reutilizavel da instancia do projeto atual para reduzir contexto obrigatorio e manter rastreabilidade.

## Superficies ativas
- `docs/pipeline/`: protocolo agnostico de desenvolvimento agentico.
- `docs/project/`: estado, decisoes e proximas fatias do projeto atual.
- `docs/adr/`: decisoes arquiteturais aceitas.
- `docs/specs/`: especificacoes executaveis por capacidade.
- `docs/tasks/`: plano ativo, execucoes recentes e template para novas tasks.
- `docs/runbooks/`: procedimentos operacionais repetiveis.
- `docs/operations/`: estado operacional ativo e auditorias da transicao atual.
- `docs/archive/`: documentos historicos que nao sao contrato ativo do starter.

Tasks historicas da V1 SyLembra ficam em `docs/archive/sylembra/tasks/`. Elas nao sao backlog ativo.

## Ordem de leitura recomendada
1. `docs/project/README.md`
2. `docs/pipeline/README.md`
3. `docs/pipeline/bootstrap.md`
4. `docs/pipeline/protocol.md`
5. `docs/pipeline/documentation-budget.md`
6. Artefatos especificos em `docs/specs/`, `docs/tasks/`, `docs/adr/` ou `docs/runbooks/`

## Convencoes minimas
- ADR: `ADR-###`
- SPEC: `SPEC-###`
- TASK: `TASK-<TRACK>-###`
- RUNBOOK: `RUNBOOK-###`

Campos obrigatorios em artefatos canonicos:
- `status`
- `owner`
- `last-updated`
- `source-of-truth`

## Regra de leveza
O chat deve carregar resumo operacional. O detalhe duravel vai para arquivo. Cada novo documento precisa dizer:
- por que existe;
- que decisao ou execucao sustenta;
- qual evidencia valida;
- quando deve ser atualizado ou aposentado.
