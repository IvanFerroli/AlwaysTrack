# TASK-AT-328 - Privacidade: enforcement de retencao, purge e direitos do titular

## Metadata
- status: completed-local-validation
- owner: olympus_taskyfier
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-328-privacy-retention-lifecycle-enforcement.md

## Modo
- mode: implementation
- generation-mode: project-wide-readiness-coverage

## Capability
Security / Privacy Runtime

## Origem documental
- `docs/tasks/PROJECT-WIDE-READINESS-BACKLOG-2026-07-15.md`
- `docs/architecture/recent-test-doc-coverage-audit.md`
- Diretiva do usuario de 2026-07-15 para cobertura transversal e padronizacao do projeto.

## Objetivo unico
Transformar politicas de retencao e exclusao em controles operacionais testados e auditaveis.

## Contexto minimo
O AlwaysTrack cresceu para seis workspaces, infraestrutura local/deploy, integracoes externas e gates CaseFlow. Esta task fecha uma lacuna observada sem reabrir implementacoes concluidas nem substituir validacoes live existentes.

## Inputs
- Estado real do codigo, CI, testes, docs e manifests em 2026-07-15.
- Ledger canonico da `TASK-AT-308`, quando aplicavel.
- Evidencias anteriores devem ser classificadas como fake, local, production-like ou live.

## Dependencias
- satisfeitas: backlog CaseFlow materializado ate `TASK-AT-307` e auditoria transversal concluida.
- em aberto: TASK-AT-221, TASK-AT-327.

## Alvos explicitos
1. services/api/src/core/case-flow/audit.ts
2. services/api/src/core/jobs/**
3. docs/operations/privacy-lifecycle-runbook.md

## Fora de escopo
- Declarar validacao live a partir de mocks, fixtures ou execucao local.
- Usar credenciais, dados pessoais ou sistemas externos sem ambiente autorizado.
- Refatoracao ampla sem relacao direta com os criterios desta task.

## Checklist de execucao
1. Agendar purge de diagnosticos, conversas, cache e dados expirados.
2. Implementar solicitacoes autorizadas com isolamento por tenant.
3. Registrar execucao redigida, dry-run, falha, retry e reconciliacao.

## Acceptance Criteria
1. Politicas documentadas possuem mecanismo executavel.
2. Purge e direitos do titular possuem testes positivos e anti-IDOR.
3. Falha parcial nao apaga alem do escopo nem perde trilha de auditoria.

## Definition of Done
1. Alvos previstos foram criados ou atualizados com mudanca revisavel.
2. Validacoes automatizadas e manuais aplicaveis foram executadas e registradas.
3. Riscos residuais, blockers e classificacao da evidencia constam no retorno.

## Validacao
- comandos/checks: gate focado da superficie alterada, `npm run typecheck --workspaces --if-present`, `npm run repo:hygiene` e `git diff --check`.
- revisao manual: comparar resultado com o backlog transversal, o ledger e os gates existentes relacionados.

## Evidencia esperada
- Commit SHA, ambiente, data UTC, comandos, exit codes e arquivos alterados.
- Relatorio ou artefato sanitizado classificado como fake, local, production-like ou live.
- Owner, riscos residuais e proximo passo.

## Riscos
- Exclusao irreversivel fora do tenant ou sem backup permitido.

## Blockers possiveis
- Ambiente production-like, Windows/WSL/Chrome ou credenciais autorizadas indisponiveis.
- Dependencia anterior ainda nao aprovada.
- Evidencia contem dado sensivel e precisa ser refeita com redaction.

## Proximo passo provavel
TASK-AT-329

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao e sua classificacao
- riscos, ressalvas e blockers
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task ou retornar bloqueio com evidencia objetiva.
- constraints: sem escopo novo, sem credenciais ou sistemas live sem autorizacao, sem promover rollout por inferencia.

## Evidencia de implementacao
- concluido-em: 2026-07-15T11:40:03Z
- ambiente: local, sem credenciais, Redis ou banco externo
- classificacao: local
- base-commit: `564fe34510091d937490ae2271b586709696854c`
- controles: dry-run default; execucao tenant-scoped; conversa minima anonimizada; diagnosticos removidos; cache persistido inexistente documentado; exclusao com dois admins do tenant; auditoria redigida; retry idempotente.
- seguranca: anti-IDOR retorna `not_found` sem consultar fora do tenant; falha parcial preserva marcador inicial e eventos sanitizados por alvo.
- purge real: nao executado.

## Validacao executada
- `npm run test --workspace @alwaystrack/api -- --run src/core/case-flow/audit.test.ts src/core/jobs/privacy-lifecycle.jobs.test.ts` - exit 0, 15 testes.
- `npm run typecheck --workspace @alwaystrack/api` - exit 0.
- `npm run typecheck --workspaces --if-present` - exit 0, 6 workspaces.
- `npm run repo:hygiene` - exit 0.
- `git diff --check` - exit 0.
- validacao production-like/live: nao executada por restricao explicita.

## Risco residual e blocker
- Aprovacao formal do controlador/juridico da TASK-AT-327 continua pendente e bloqueia execute com dados reais.
- Agendamento depende do scheduler da plataforma/deploy; o entrypoint executavel e o contrato de dedupe foram entregues sem editar manifests ou workflows.
- Conversa e persistida como `EvidenceFact conversation.*`, nao em tabela propria; cache de conteudo CaseFlow nao possui persistencia no schema atual.
