# TASK-SCF-001 - Materializar scaffold base de workspaces

## Metadata
- status: completed
- owner: olympus-taskyfier
- last-updated: 2026-04-23
- source-of-truth: docs/tasks/TASK-SCF-001-workspaces-base-scaffold.md

## Modo
- mode: scaffolding
- generation-mode: pipeline kickoff

## Capability
- formalizacao transversal de engenharia

## Origem documental
- doc/Consolidado Canonico do Projeto Olympus Climb (Base Vigente).pdf
- docs/operations/engineering-pipeline-protocol.md
- docs/operations/taskyfier-memory.md
- docs/adr/ADR-001-governanca-documental-operacional.md

## Objetivo unico
Materializar scaffold minimo de codigo para os workspaces (`apps`, `services`, `packages`) com configuracao base previsivel, sem implementar funcionalidade de produto.

## Contexto minimo
A estrutura macro ja existe, mas ainda nao ha superficie de codigo inicial para executar ciclos de engenharia com previsibilidade.

## Inputs
- estrutura atual do repositorio
- `package.json` raiz com workspaces definidos
- guardrails canonicos de nao abrir escopo funcional

## Dependencias
- satisfeitas:
  - ADR-001 aceita
  - pipeline operacional ativo
  - pastas macro existentes
- em aberto:
  - SPEC-001 minima para orientar evolucao funcional futura

## Alvos explicitos
1. package.json
2. tsconfig.base.json
3. apps/web/package.json
4. apps/web/tsconfig.json
5. apps/web/src/main.ts
6. services/api/package.json
7. services/api/tsconfig.json
8. services/api/src/main.ts
9. packages/shared-types/package.json
10. packages/shared-types/tsconfig.json
11. packages/shared-types/src/index.ts
12. docs/tasks/TASK-SCF-001-execution.md
13. docs/tasks/TASK-SCF-001-verification.md
14. docs/operations/taskyfier-memory.md
15. docs/operations/orchestrator-state.md
16. docs/operations/scaffolding-builder-state.md
17. docs/operations/task-verifier-state.md

## Fora de escopo
- logica funcional de produto
- runtime real
- integracoes externas
- contratos de dominio

## Checklist
1. Criar scaffold minimo em `apps/web`, `services/api` e `packages/shared-types`.
2. Adicionar configuracao raiz minima para typecheck em workspaces.
3. Registrar execution report e verification report.
4. Atualizar estados operacionais aplicaveis.

## Acceptance Criteria
1. Cada workspace alvo possui `package.json`, `tsconfig.json` e arquivo `src` minimo.
2. Root possui `tsconfig.base.json` e scripts de `typecheck/build` sem acoplar funcionalidade.
3. Nenhum artefato inclui logica de negocio.
4. Execution e verification reports existem em `docs/tasks/`.

## Definition of Done
1. Task classificada como `aprovado` ou `aprovado com ressalvas`.
2. Scaffold observavel no repositorio com arquivos reais.
3. States de operacao atualizados para continuidade.

## Validacao
- comandos/checks:
  - `test -f tsconfig.base.json`
  - `test -f apps/web/src/main.ts`
  - `test -f services/api/src/main.ts`
  - `test -f packages/shared-types/src/index.ts`
  - `rg -n "\"typecheck\"|\"build\"" package.json`
- revisao manual:
  - confirmar ausencia de logica funcional

## Evidencia esperada
- arquivos de scaffold materializados
- execution report com checks observaveis
- verification report com classificacao final

## Riscos
- adicionar boilerplate desnecessario
- introduzir acoplamento prematuro entre workspaces

## Blockers possiveis
- falha de escrita em arquivos
- inconsistencia de naming de workspace

## Proximo passo provavel
Derivar task pequena de quality para validar lint/typecheck baseline.

## Feedback obrigatorio de retorno
- scaffold esta pequeno e util para iniciar codigo sem abrir funcionalidade?
- houve qualquer extrapolacao fora do escopo estrutural?

## Handoff formal para Orchestrator
- handoff_to: olympus-orchestrator
- task_package: TASK-SCF-001
- execution_expectation:
  - task executada ou bloqueada
  - evidencia material
  - validacao pelo Task Verifier
  - updates sugeridos/aplicados em docs/operations
  - proximo passo recomendado
- constraints:
  - sem escopo funcional novo
  - sem runtime real
  - manter compact docs-first mode
