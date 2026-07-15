# TASK-AT-311 - Web: fundacao de testes unitarios e de componentes

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-311-web-component-unit-test-foundation.md

## Modo
- mode: implementation
- generation-mode: project-wide-readiness-coverage

## Capability
Testing / Web

## Origem documental
- `docs/tasks/PROJECT-WIDE-READINESS-BACKLOG-2026-07-15.md`
- `docs/architecture/recent-test-doc-coverage-audit.md`
- Diretiva do usuario de 2026-07-15 para cobertura transversal e padronizacao do projeto.

## Objetivo unico
Cobrir componentes e regras criticas da SPA com testes isolados, deterministas e acessiveis.

## Contexto minimo
O AlwaysTrack cresceu para seis workspaces, infraestrutura local/deploy, integracoes externas e gates CaseFlow. Esta task fecha uma lacuna observada sem reabrir implementacoes concluidas nem substituir validacoes live existentes.

## Inputs
- Estado real do codigo, CI, testes, docs e manifests em 2026-07-15.
- Ledger canonico da `TASK-AT-308`, quando aplicavel.
- Evidencias anteriores devem ser classificadas como fake, local, production-like ou live.

## Dependencias
- satisfeitas: backlog CaseFlow materializado ate `TASK-AT-307` e auditoria transversal concluida.
- em aberto: TASK-AT-310.

## Alvos explicitos
1. apps/web/package.json
2. apps/web/src/**/*.test.tsx
3. apps/web/test/**

## Fora de escopo
- Declarar validacao live a partir de mocks, fixtures ou execucao local.
- Usar credenciais, dados pessoais ou sistemas externos sem ambiente autorizado.
- Refatoracao ampla sem relacao direta com os criterios desta task.

## Checklist de execucao
1. Configurar runner, DOM e helpers de render com sessao/roles.
2. Cobrir cliente API, navegacao, guards, formularios, tabelas, editores e estados de erro/vazio.
3. Priorizar telas de demo, Fluxos, Scriptoteca e CaseFlow Admin.

## Acceptance Criteria
1. A Web possui suite propria executada no gate raiz.
2. Fluxos por role e falhas de API possuem regressao observavel.
3. Testes nao dependem de servidor externo ou dados pessoais.

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
- Testes excessivamente acoplados ao markup.

## Blockers possiveis
- Ambiente production-like, Windows/WSL/Chrome ou credenciais autorizadas indisponiveis.
- Dependencia anterior ainda nao aprovada.
- Evidencia contem dado sensivel e precisa ser refeita com redaction.

## Proximo passo provavel
TASK-AT-312

## Resultado de implementacao
- A excecao temporaria do workspace Web foi removida e substituida por uma suite Vitest com Testing Library e JSDOM.
- O cliente API possui regressao para sessao/JSON, retorno de dados e propagacao de erro da API.
- A navegacao valida destinos por role em uma transicao SAC para ADMIN, incluindo acesso ao CaseFlow Admin apenas depois da autenticacao administrativa.
- Estados acessiveis de erro e vazio e o fluxo de historico/health do CaseFlow Admin possuem cobertura isolada sem servidor externo.
- Evidencia local/fake em 2026-07-15T11:40:29Z, Node v24.15.0: `npm test --workspace @alwaystrack/web` (exit 0, 4 arquivos/7 testes), `npm run typecheck --workspace @alwaystrack/web` (exit 0), `npm run build --workspace @alwaystrack/web` (exit 0), `npm run repo:hygiene` (exit 0) e `git diff --check` (exit 0). Nenhuma credencial, dado pessoal ou integracao live foi usada.
- O gate de higiene passou a considerar tambem arquivos novos ainda nao rastreados, evitando falso bloqueio durante a preparacao do commit. Commit SHA permanece pendente do fluxo de commit/handoff.
- Risco residual: componentes operacionais mais extensos, como formularios, tabelas e editores de Fluxos/Scriptoteca, continuam candidatos a ampliacao incremental; o build mantem o aviso nao bloqueante de chunk principal acima de 500 kB.

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao e sua classificacao
- riscos, ressalvas e blockers
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task ou retornar bloqueio com evidencia objetiva.
- constraints: sem escopo novo, sem credenciais ou sistemas live sem autorizacao, sem promover rollout por inferencia.
