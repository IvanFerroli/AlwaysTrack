# Tasks

## Objetivo
Registrar entregas pequenas, executaveis, rastreaveis e validaveis do AlwaysTrack atual.

## Quando usar
- quebrar uma spec aceita em uma entrega pequena;
- definir alvo, DoD, validacao e evidencia;
- orientar execucao sem abrir escopo.

## Convencao minima
- ID: `TASK-<TRACK>-###`
- Arquivo: `TASK-<TRACK>-###-<slug>.md`
- Template: `docs/tasks/_template.md`

Tracks sao definidos por projeto. Nao herdar tracks de outro projeto sem necessidade.

## Tasks ativas
Este diretorio guarda apenas:
- `ROADMAP.md`: plano ativo e proxima decisao;
- `EXEC-*`: evidencias de execucao da transicao;
- `_template.md`: modelo para novas tasks.

As tasks historicas `TASK-*` da V1 SyLembra ficam em `docs/archive/sylembra/tasks/` e nao sao backlog atual.

## Tracks
Novas tracks devem nascer do escopo AlwaysTrack atual. Se uma track historica for reutilizada, declare explicitamente por que ela ainda se aplica.

## Sequencia
Ver `docs/tasks/ROADMAP.md`. Se precisar consultar a sequencia antiga da SyLembra, use `docs/archive/sylembra/tasks/` como historico, nao como plano.

## Campos obrigatorios
- `status`
- `owner`
- `last-updated`
- `source-of-truth`

## Fora de escopo
- task grande com varios objetivos;
- implementacao sem validacao;
- registro narrativo sem artefato esperado.
