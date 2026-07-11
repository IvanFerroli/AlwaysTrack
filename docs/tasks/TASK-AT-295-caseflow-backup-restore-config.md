# TASK-AT-295 - CaseFlow: export, backup e restore de regras, fluxos e configuracoes

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-295-caseflow-backup-restore-config.md

## Modo
- mode: ops
- generation-mode: corrective-spec-breakdown

## Capability
Operations / Backup Restore

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 24.2, 28 Fase 5, 30

## Objetivo unico
Definir export/backup/restore para regras heuristicas, fluxos versionados, configuracoes de conectores e instalacao local sem incluir cookies ou segredos externos.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-244`, `TASK-AT-263`, `TASK-AT-294`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-244`, `TASK-AT-263`, `TASK-AT-294`.

## Alvos explicitos
1. docs/operations/companion-backup-restore-runbook.md
2. services/api/src/core/case-flow/export.service.ts

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.

## Checklist de execucao
1. Mapear dados exportaveis e proibidos.
2. Definir restore seguro com auditoria.
3. Cobrir configs de conectores e regras.

## Acceptance Criteria
1. Backup nao contem cookies, senhas ou tokens de sistemas externos.
2. Restore preserva versoes e auditoria.
3. Rollback de configuracao fica documentado.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: typecheck/testes do workspace afetado quando esta task for executada; nesta rodada, revisao documental do manifesto.
- revisao manual: comparar a task contra SPEC secoes 24.2, 28 Fase 5, 30 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Export virar vazamento de PII.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-296`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
