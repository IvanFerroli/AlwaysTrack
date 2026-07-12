# TASK-AT-259 - Mensagens: testes estruturais e snapshots

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-259-message-structural-tests.md

## Modo
- mode: quality
- generation-mode: corrective-spec-breakdown

## Capability
Scriptoteca / Message Tests

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 27.3 e auditoria corretiva ponto 7

## Objetivo unico
Criar testes explicitos para placeholders, blocos opcionais, fallback, snapshots, canal, undefined, dados entre casos, revisao usada e recompilacao apos evidencia nova.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-257`, `TASK-AT-258`, `TASK-AT-248`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-257`, `TASK-AT-258`, `TASK-AT-248`.

## Alvos explicitos
1. services/api/src/core/case-flow/messages.test.ts
2. tests/fixtures/caseflow/messages/

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Testar placeholder obrigatorio ausente.
2. Testar recompilacao quando evidencia nova muda plano.
3. Testar que dados de outro caseId nao entram na mensagem.

## Acceptance Criteria
1. Snapshots sao revisaveis e estaveis.
2. Mensagem recompilada carrega nova revisao.
3. Script e revisao usados sao auditaveis.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secoes 27.3 e auditoria corretiva ponto 7 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Testes de mensagem ficarem diluidos em outras suites.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-260`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
