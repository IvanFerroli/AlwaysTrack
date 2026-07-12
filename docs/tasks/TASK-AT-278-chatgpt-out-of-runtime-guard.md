# TASK-AT-278 - CaseFlow: ChatGPT fora do runtime inicial

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-278-chatgpt-out-of-runtime-guard.md

## Modo
- mode: documentation
- generation-mode: corrective-spec-breakdown

## Capability
Security / No AI Dependency

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 4.4, 20.12, 33

## Objetivo unico
Criar guardas documentais e de teste para garantir que o core inicial funcione sem IA, ChatGPT ou chave externa.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-194`, `TASK-AT-238`, `TASK-AT-257`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-194`, `TASK-AT-238`, `TASK-AT-257`.

## Alvos explicitos
1. docs/architecture/caseflow-architecture.md
2. services/api/src/core/case-flow/heuristics/

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Registrar IA como tarefa futura separada.
2. Garantir ausencia de env/key obrigatoria para heuristica e mensagens.
3. Documentar que ChatGPT segue uso livre externo, nao runtime.

## Acceptance Criteria
1. Sem chave de IA, o fluxo principal funciona.
2. Nenhuma rota CaseFlow chama provedor externo.
3. Docs explicam limite de ChatGPT.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: n/a para task documental; quando houver codigo em rodada futura, rodar typecheck/testes do workspace afetado.
- revisao manual: comparar a task contra SPEC secoes 4.4, 20.12, 33 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Dependencia invisivel de tokens.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-279`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
