# TASK-AT-224 - CaseFlow API: casos, evidencias e conflitos

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-224-caseflow-case-evidence-conflict-api.md

## Modo
- mode: implementation
- generation-mode: corrective-spec-breakdown

## Capability
CaseFlow Core / API

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secao 23

## Objetivo unico
Implementar apenas as rotas iniciais de caso, intake, facts e conflicts, sem resolve, plan, step select ou copy.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-217`, `TASK-AT-218`, `TASK-AT-219`, `TASK-AT-220`, `TASK-AT-221`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-217`, `TASK-AT-218`, `TASK-AT-219`, `TASK-AT-220`, `TASK-AT-221`.

## Alvos explicitos
1. services/api/src/core/case-flow/case-flow.handlers.ts
2. services/api/src/app.ts

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Criar POST/GET/PATCH cases.
2. Criar intake/facts/conflicts.
3. Aplicar auth, role, organization e redaction.
4. Criar ingestao batch/bulk de facts para conectores progressivos.
5. Exigir idempotency key por `connectorRunId + factKey + sourceReference`.
6. Definir retry seguro e rate-limit especifico para Companion.

## Acceptance Criteria
1. API inicial nao inclui superficies dependentes de heuristica, plano, passos ou mensagens.
2. Fatos e conflitos retornam por caseId correto.
3. Rotas respeitam seguranca existente do AlwaysTrack.
4. Ingestao progressiva evita duplicar facts em retry.
5. Rate-limit do Companion nao bloqueia indevidamente cinco conectores concorrentes em caso simples.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secao 23 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- API grande demais antecipar componentes futuros.
- Eventos progressivos baterem no rate limit padrao de interacao.
- Retry de conector duplicar fatos sem idempotencia.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-225`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
