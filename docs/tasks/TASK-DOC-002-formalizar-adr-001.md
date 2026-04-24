# TASK-DOC-002 - Formalizar ADR-001 de governanca documental

## Metadata
- status: completed
- owner: olympus-taskyfier
- last-updated: 2026-04-23
- source-of-truth: docs/tasks/TASK-DOC-002-formalizar-adr-001.md

## Modo
- mode: documental
- generation-mode: pipeline kickoff

## Capability
- formalizacao transversal de engenharia

## Origem documental
- doc/Consolidado Canonico do Projeto Olympus Climb (Base Vigente).pdf
- docs/README.md
- docs/operations/engineering-pipeline-protocol.md
- docs/operations/taskyfier-memory.md

## Objetivo unico
Materializar a primeira ADR oficial (`ADR-001`) para consolidar a governanca documental ja adotada no projeto, sem abrir escopo funcional de produto.

## Contexto minimo
As superficies vivas em `docs/` e o protocolo de pipeline ja existem, mas ainda nao ha ADR formalizada. Isso mantem lacuna em rastreabilidade de decisao arquitetural.

## Inputs
- estado atual em `docs/operations/taskyfier-memory.md`
- convencoes de ADR em `docs/adr/_template.md`
- decisao operacional ja registrada em `docs/README.md`

## Dependencias
- satisfeitas:
  - superficies vivas em `docs/` materializadas
  - protocolo do pipeline definido em `docs/operations/engineering-pipeline-protocol.md`
  - scaffold macro minimo do repositorio materializado
- em aberto:
  - specs minimas obrigatorias apos primeira ADR

## Alvos explicitos
1. docs/adr/ADR-001-governanca-documental-operacional.md
2. docs/tasks/TASK-DOC-002-execution.md
3. docs/tasks/TASK-DOC-002-verification.md
4. docs/operations/taskyfier-memory.md
5. docs/operations/orchestrator-state.md
6. docs/operations/docs-formalizer-state.md
7. docs/operations/task-verifier-state.md

## Fora de escopo
- implementar logica funcional de produto
- criar runtime real, integracoes ou contratos de dominio
- escrever spec funcional completa

## Checklist
1. Criar ADR-001 com metadata, contexto, decisao, alternativas e consequencias.
2. Rotea-la via Orchestrator para `olympus-docs-formalizer` em `execution artifact mode`.
3. Registrar execution report e verification report em `docs/tasks/`.
4. Atualizar memoria macro e states operacionais aplicaveis.

## Acceptance Criteria
1. Existe arquivo `docs/adr/ADR-001-governanca-documental-operacional.md` com estrutura completa do template.
2. A ADR-001 formaliza apenas decisoes ja vigentes (docs como fonte viva, `docs/adr/` como superficie de ADR, sem escopo funcional).
3. Existem `execution report` e `verification report` materiais em `docs/tasks/`.
4. Updates de `docs/operations` foram aplicados e validados no ciclo.

## Definition of Done
1. Task classificada pelo Task Verifier como `aprovado` ou `aprovado com ressalvas`.
2. Evidencias observaveis registradas no execution report.
3. Memoria do Taskyfier atualizada com resultado do ciclo e proximo passo.

## Validacao
- comandos/checks:
  - `test -f docs/adr/ADR-001-governanca-documental-operacional.md`
  - `test -f docs/tasks/TASK-DOC-002-execution.md`
  - `test -f docs/tasks/TASK-DOC-002-verification.md`
  - `rg -n "status: accepted|source-of-truth|docs/adr/" docs/adr/ADR-001-governanca-documental-operacional.md`
- revisao manual:
  - confirmar ausencia de escopo funcional de produto
  - confirmar aderencia ao canonic e ao protocolo

## Evidencia esperada
- conteudo integral da ADR-001 materializado
- execution report com artefatos e checks observaveis
- verification report com classificacao final e justificativa

## Riscos
- ambiguidade semantica entre "decisao ja adotada" e "decisao nova"
- regressao de disciplina caso o ciclo pare no package sem verificacao

## Blockers possiveis
- falta de base canonica suficiente para consolidar a decisao em ADR
- impossibilidade de escrita direta em arquivos-alvo

## Proximo passo provavel
Derivar task minima para SPEC-001 usando ADR-001 aceita como base.

## Feedback obrigatorio de retorno
- a ADR-001 formalizada esta suficiente para destravar SPEC-001?
- houve qualquer extrapolacao de escopo fora do documental?

## Handoff formal para Orchestrator
- handoff_to: olympus-orchestrator
- task_package: TASK-DOC-002
- execution_expectation:
  - task executada ou bloqueada
  - evidencia material
  - validacao pelo Task Verifier
  - updates sugeridos/aplicados em docs/operations
  - proximo passo recomendado
- constraints:
  - sem escopo funcional novo
  - sem implementacao de produto
  - manter compact docs-first mode
