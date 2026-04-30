# Tasks

## Objetivo
Registrar entregas pequenas, executaveis, rastreaveis e validaveis.

## Quando usar
- quebrar uma spec aceita em uma entrega pequena;
- definir alvo, DoD, validacao e evidencia;
- orientar execucao sem abrir escopo.

## Convencao minima
- ID: `TASK-<TRACK>-###`
- Arquivo: `TASK-<TRACK>-###-<slug>.md`
- Template: `docs/tasks/_template.md`

Tracks sao definidos por projeto. Evite herdar tracks de outro projeto sem necessidade.

## Tracks deste projeto
- `DOC`: intake, decisoes e planejamento.
- `SCF`: scaffold e base do monolito modular.
- `QLT`: qualidade, testes e gates.
- `DAT`: modelo de dados e migrations.
- `AUD`: auditoria.
- `AUT`: autenticacao, roles e acesso.
- `ORG`: organizacoes, unidades e setores.
- `USR`: usuarios administrativos.
- `PRO`: profissionais.
- `LIC`: licencas e status.
- `FIL`: documentos, storage e upload.
- `NOT`: notificacoes, jobs, Meta e webhooks.
- `FAQ`: FAQ e suporte via `wa.me`.
- `UX`: app shell e telas base.
- `DSH`: dashboard operacional.
- `RPT`: relatorios e exportacao.
- `IMP`: importacao em massa e carga inicial.
- `DEP`: ambiente, deploy e operacao.
- `REL`: fechamento de V1 e apresentacao.

## Sequencia
Ver `docs/tasks/ROADMAP.md`.

## Campos obrigatorios
- `status`
- `owner`
- `last-updated`
- `source-of-truth`

## Fora de escopo
- task grande com varios objetivos;
- implementacao sem validacao;
- registro narrativo sem artefato esperado.
