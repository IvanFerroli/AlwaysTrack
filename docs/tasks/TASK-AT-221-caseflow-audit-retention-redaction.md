# TASK-AT-221 - CaseFlow Core: auditoria, retencao e redaction

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-221-caseflow-audit-retention-redaction.md

## Modo
- mode: implementation
- generation-mode: corrective-spec-breakdown

## Capability
CaseFlow Core / Audit and Privacy

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 24.2, 25.2, 25.3

## Objetivo unico
Definir e implementar auditoria minima, mascaramento de logs e politicas de retencao para casos, conversas, diagnosticos e cache.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-216`, `TASK-AT-217`, `TASK-AT-218`, `TASK-AT-220`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-216`, `TASK-AT-217`, `TASK-AT-218`, `TASK-AT-220`.

## Alvos explicitos
1. services/api/src/core/case-flow/audit.ts
2. docs/security/companion-threat-model.md

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Nao logar CPF completo, cartao, token, cookie, senha, conversa completa ou HTML bruto.
2. Registrar hash, identificador mascarado, status, duracao, conector, erro e versao.
3. Preparar delete case e retencao automatica.

## Acceptance Criteria
1. Eventos principais sao auditados sem PII bruta.
2. Retencao segue fatos/resumo mantidos, conversa configuravel, diagnostico 7 dias e cache minutos.
3. Screenshots seguem desativadas por padrao.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secoes 24.2, 25.2, 25.3 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Logs virarem vazamento de atendimento real.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-222`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
