# TASK-AT-194 - CaseFlow: arquitetura, fronteiras e nao objetivos

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-194-caseflow-architecture-boundaries.md

## Modo
- mode: documentation
- generation-mode: corrective-spec-breakdown

## Capability
CaseFlow Engine / Architecture

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 1 a 6, 31 a 33

## Objetivo unico
Formalizar a arquitetura macro da frente CaseFlow Engine + AlwaysTrack Companion, preservando Core, Companion Host, extensao Chromium, conectores e nao objetivos.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: n/a.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: n/a.

## Alvos explicitos
1. docs/architecture/caseflow-architecture.md
2. docs/tasks/ROADMAP.md

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Mapear as quatro camadas e suas responsabilidades.
2. Registrar acoes proibidas, Slack manual, IA fora do core inicial e agente futuro fora do escopo.
3. Relacionar os blocos A a K da SPEC ao caminho de tasks.

## Acceptance Criteria
1. A arquitetura separa Core, Host, Extensao e Conectores.
2. Nao objetivos e acoes proibidas estao explicitos.
3. A task nao implementa runtime.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: n/a para task documental; quando houver codigo em rodada futura, rodar typecheck/testes do workspace afetado.
- revisao manual: comparar a task contra SPEC secoes 1 a 6, 31 a 33 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Comecar implementacao antes de firmar fronteiras.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-195`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
