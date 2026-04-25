# TASK Surface

## Objetivo
Registrar manifests de task pequena, executavel, rastreavel e validavel.

## Quando usar
- quebrar uma spec aceita em entrega pequena;
- definir objetivo unico, alvo, DoD, validacao e evidencia;
- orientar execucao disciplinada sem abrir escopo.

## Convencao minima
- ID: `TASK-<TRACK>-###`
- Arquivo por task: `TASK-<TRACK>-###-<slug>.md`
- Tracks em uso: `DOC`, `SCF`, `QLT`, `CTR`, `RTM`, `SCR`, `PRD`
- Base inicial: `docs/tasks/_template.md`

## Campos obrigatorios
- `status`
- `owner`
- `last-updated`
- `source-of-truth` quando a task introduzir ou alterar decisao operacional/canonica

## Fora de escopo
- backlog generico sem alvo;
- task grande com multiplos modos sem quebra;
- implementacao sem validacao definida.
