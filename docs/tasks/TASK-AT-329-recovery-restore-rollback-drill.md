# TASK-AT-329 - Operacao: ensaio de restore, recuperacao e rollback coordenado

## Metadata
- status: implementation-complete-production-like-validation-pending
- owner: olympus_taskyfier
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-329-recovery-restore-rollback-drill.md

## Modo
- mode: verification
- generation-mode: project-wide-readiness-coverage

## Capability
Operations / Recovery

## Origem documental
- `docs/tasks/PROJECT-WIDE-READINESS-BACKLOG-2026-07-15.md`
- `docs/architecture/recent-test-doc-coverage-audit.md`
- Diretiva do usuario de 2026-07-15 para cobertura transversal e padronizacao do projeto.

## Objetivo unico
Executar recuperacao isolada de banco, storage, configuracao, Host e Extension com RPO/RTO medidos.

## Contexto minimo
O AlwaysTrack cresceu para seis workspaces, infraestrutura local/deploy, integracoes externas e gates CaseFlow. Esta task fecha uma lacuna observada sem reabrir implementacoes concluidas nem substituir validacoes live existentes.

## Inputs
- Estado real do codigo, CI, testes, docs e manifests em 2026-07-15.
- Ledger canonico da `TASK-AT-308`, quando aplicavel.
- Evidencias anteriores devem ser classificadas como fake, local, production-like ou live.

## Dependencias
- satisfeitas: backlog CaseFlow materializado ate `TASK-AT-307` e auditoria transversal concluida.
- em aberto: TASK-AT-149, TASK-AT-150, TASK-AT-293, TASK-AT-294, TASK-AT-295, TASK-AT-326.

## Alvos explicitos
1. docs/operations/recovery-drills/**
2. docs/operations/backup-restore-runbook.md
3. docs/runbooks/RUNBOOK-005-caseflow-companion-recovery.md

## Fora de escopo
- Declarar validacao live a partir de mocks, fixtures ou execucao local.
- Usar credenciais, dados pessoais ou sistemas externos sem ambiente autorizado.
- Refatoracao ampla sem relacao direta com os criterios desta task.

## Checklist de execucao
1. Restaurar backup em ambiente autorizado e validar integridade.
2. Testar rollback para artefatos por hash e compatibilidade de protocolo.
3. Recuperar caso/run sem duplicar acao ou vazar credencial.

## Acceptance Criteria
1. RPO e RTO observados sao registrados com ambiente e operador.
2. Integridade referencial, arquivos e configuracoes sao reconciliados.
3. Falha no ensaio bloqueia alegacao de prontidao produtiva.

## Definition of Done
1. Alvos previstos foram criados ou atualizados com mudanca revisavel.
2. Validacoes automatizadas e manuais aplicaveis foram executadas e registradas.
3. Riscos residuais, blockers e classificacao da evidencia constam no retorno.

## Validacao
- comandos/checks: gate focado da superficie alterada, `npm run typecheck --workspaces --if-present`, `npm run repo:hygiene` e `git diff --check`.
- revisao manual: comparar resultado com o backlog transversal, o ledger e os gates existentes relacionados.

## Implementacao local
- `scripts/recovery/restore-drill.mjs` executa o drill e emite evidencia JSON sanitizada.
- `scripts/recovery/restore-drill-core.mjs` isola snapshot, checksums, restore, reconciliacao, rollback e gates RPO/RTO em recursos temporarios.
- `tests/recovery/restore-drill.test.mjs` cobre caminho GO e falha fechada para adulteracao, incompatibilidade, objetivo perdido e raiz insegura.
- `docs/operations/recovery-drills/local-coordinated-restore-drill.md` define operacao e fronteira local/production-like.
- `docs/operations/recovery-drills/TASK-AT-329-local-evidence.md` registra a evidencia reproduzivel sem persistir dados do drill.

## Estado de aceite
1. RPO e RTO sao medidos automaticamente com timestamps UTC, ambiente e operador sintetico identificados no relatorio.
2. SQLite, relacionamentos CaseFlow, storage, configuracao e protocolo Companion sao reconciliados antes da promocao.
3. Checksum, protocolo, banco ou objetivo invalido encerram o ensaio com prontidao `BLOCKED` e sem promocao.
4. A evidencia e estritamente `local/fake`; restore production-like/live permanece pendente e nao pode ser inferido.

## Evidencia esperada
- Commit SHA, ambiente, data UTC, comandos, exit codes e arquivos alterados.
- Relatorio ou artefato sanitizado classificado como fake, local, production-like ou live.
- Owner, riscos residuais e proximo passo.

## Riscos
- Ensaio afetar ambiente real ou usar backup com dados nao sanitizados.

## Blockers possiveis
- Ambiente production-like, Windows/WSL/Chrome ou credenciais autorizadas indisponiveis.
- Dependencia anterior ainda nao aprovada.
- Evidencia contem dado sensivel e precisa ser refeita com redaction.

## Proximo passo provavel
TASK-AT-330

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao e sua classificacao
- riscos, ressalvas e blockers
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task ou retornar bloqueio com evidencia objetiva.
- constraints: sem escopo novo, sem credenciais ou sistemas live sem autorizacao, sem promover rollout por inferencia.
