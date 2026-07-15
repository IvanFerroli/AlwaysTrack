# TASK-AT-312 - Web e Companion: regressao de acessibilidade e teclado

## Metadata
- status: implementation-complete-manual-validation-pending
- owner: olympus_orchestrator
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-312-accessibility-keyboard-regression.md

## Modo
- mode: implementation
- generation-mode: project-wide-readiness-coverage

## Capability
Testing / Accessibility

## Origem documental
- `docs/tasks/PROJECT-WIDE-READINESS-BACKLOG-2026-07-15.md`
- `docs/architecture/recent-test-doc-coverage-audit.md`
- Diretiva do usuario de 2026-07-15 para cobertura transversal e padronizacao do projeto.

## Objetivo unico
Estabelecer gate de acessibilidade para teclado, foco, semantica, contraste e leitores de tela nas jornadas criticas.

## Contexto minimo
O AlwaysTrack cresceu para seis workspaces, infraestrutura local/deploy, integracoes externas e gates CaseFlow. Esta task fecha uma lacuna observada sem reabrir implementacoes concluidas nem substituir validacoes live existentes.

## Inputs
- Estado real do codigo, CI, testes, docs e manifests em 2026-07-15.
- Ledger canonico da `TASK-AT-308`, quando aplicavel.
- Evidencias anteriores devem ser classificadas como fake, local, production-like ou live.

## Dependencias
- satisfeitas: backlog CaseFlow materializado ate `TASK-AT-307`, auditoria transversal e `TASK-AT-311` concluidas.
- em aberto: validacoes manuais coordenadas por `TASK-AT-314` e `TASK-AT-334`.

## Alvos explicitos
1. apps/web/src/**
2. apps/companion-extension/src/side-panel/**
3. tests/e2e/accessibility.spec.ts

## Fora de escopo
- Declarar validacao live a partir de mocks, fixtures ou execucao local.
- Usar credenciais, dados pessoais ou sistemas externos sem ambiente autorizado.
- Refatoracao ampla sem relacao direta com os criterios desta task.

## Checklist de execucao
1. Automatizar regras detectaveis e documentar verificacoes manuais.
2. Testar ordem de foco, dialogos, menus, tabelas, feedback de erro e side panel.
3. Cobrir zoom e prefers-reduced-motion sem sobreposicao de conteudo.

## Acceptance Criteria
1. Jornadas P0 passam no scanner automatizado sem violacao critica.
2. Toda acao essencial e operavel por teclado.
3. Excecoes possuem owner, justificativa e prazo.

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
- Tratar scanner automatico como conformidade completa.

## Blockers possiveis
- Ambiente production-like, Windows/WSL/Chrome ou credenciais autorizadas indisponiveis.
- Dependencia anterior ainda nao aprovada.
- Evidencia contem dado sensivel e precisa ser refeita com redaction.

## Proximo passo provavel
TASK-AT-313

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao e sua classificacao
- riscos, ressalvas e blockers
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task ou retornar bloqueio com evidencia objetiva.
- constraints: sem escopo novo, sem credenciais ou sistemas live sem autorizacao, sem promover rollout por inferencia.

## Resultado da implementacao

- Gate Web deterministico cobre nomes acessiveis, formularios, IDs, referencias ARIA, tabs, tabelas e contraste critico.
- Notificacoes suportam abertura por teclado, Escape e retorno de foco.
- Tabs do editor e do CaseFlow suportam setas, Home e End com roving `tabIndex` e paineis associados.
- Web e side panel possuem foco visivel e contrato de movimento reduzido.
- Side panel anuncia diagnosticos, atualizacoes, copia e intervencoes com semantica e atomicidade explicitas.
- Nenhuma dependencia, script npm, threshold de coverage ou configuracao Vitest foi adicionada; a TASK-AT-315 mantem ownership desses gates.
- Evidencia local: `docs/testing/TASK-AT-312-accessibility-evidence.md`.

## Estado dos criterios

1. Scanner local das jornadas P0 sem violacao critica: atendido em ambiente local/JSDOM.
2. Acoes essenciais cobertas por operacao de teclado: atendido pelos testes determinísticos Web e pelos contratos/testes do side panel.
3. Excecoes com owner, justificativa e prazo: registradas na evidencia.

## Pendencias nao promoviveis

- Leitor de tela real e arvore de acessibilidade de browser dependem da matriz da `TASK-AT-334`.
- Reflow em zoom 200%/400% depende da regressao visual da `TASK-AT-314`.
- A task nao pode receber status `completed` antes dessas evidencias manuais; esta execucao proibiu browser/live/credenciais.
