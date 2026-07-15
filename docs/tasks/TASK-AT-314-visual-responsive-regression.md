# TASK-AT-314 - UI: regressao visual e responsiva das superficies criticas

## Metadata
- status: completed
- owner: olympus_runtime_builder
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-314-visual-responsive-regression.md

## Modo
- mode: implementation
- generation-mode: project-wide-readiness-coverage

## Capability
Testing / Visual

## Origem documental
- `docs/tasks/PROJECT-WIDE-READINESS-BACKLOG-2026-07-15.md`
- `docs/architecture/recent-test-doc-coverage-audit.md`
- Diretiva do usuario de 2026-07-15 para cobertura transversal e padronizacao do projeto.

## Objetivo unico
Detectar quebras visuais, overflow e sobreposicoes nas telas usadas diariamente e na apresentacao.

## Contexto minimo
O AlwaysTrack cresceu para seis workspaces, infraestrutura local/deploy, integracoes externas e gates CaseFlow. Esta task fecha uma lacuna observada sem reabrir implementacoes concluidas nem substituir validacoes live existentes.

## Inputs
- Estado real do codigo, CI, testes, docs e manifests em 2026-07-15.
- Ledger canonico da `TASK-AT-308`, quando aplicavel.
- Evidencias anteriores devem ser classificadas como fake, local, production-like ou live.

## Dependencias
- satisfeitas: backlog CaseFlow materializado ate `TASK-AT-307` e auditoria transversal concluida.
- em aberto: TASK-AT-313.

## Alvos explicitos
1. tests/e2e/visual/**
2. playwright.config.ts
3. docs/testing/visual-regression.md

## Fora de escopo
- Declarar validacao live a partir de mocks, fixtures ou execucao local.
- Usar credenciais, dados pessoais ou sistemas externos sem ambiente autorizado.
- Refatoracao ampla sem relacao direta com os criterios desta task.

## Checklist de execucao
1. Definir snapshots deterministicos por viewport e tema suportado.
2. Cobrir Web, side panel e estados com maior risco de layout.
3. Estabelecer processo de revisao e atualizacao consciente de baseline.

## Acceptance Criteria
1. Telas P0 possuem baseline versionado e estavel.
2. Overflow e sobreposicao bloqueiam o gate visual.
3. Atualizacao de snapshot exige evidencia revisada.

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
- Snapshots ruidosos por fontes, animacoes ou dados variaveis.

## Blockers possiveis
- Ambiente production-like, Windows/WSL/Chrome ou credenciais autorizadas indisponiveis.
- Dependencia anterior ainda nao aprovada.
- Evidencia contem dado sensivel e precisa ser refeita com redaction.

## Proximo passo provavel
TASK-AT-315

## Implementacao local de 2026-07-15
- oito baselines light versionados para login Web, CaseFlow Admin, Fluxos SAC, navegacao recolhida e Companion side panel;
- fixture visual deterministica com animacao, transicao, caret, fonte e scroll estabilizados;
- assercoes bloqueantes de overflow horizontal, controles fora do viewport e sobreposicao de regioes criticas;
- bundle local da extensao servido ao Chromium com `chrome.runtime` sintetico, sem instalar a extensao nem acessar host externo;
- processo de revisao consciente, triagem e atualizacao seletiva documentado em `docs/testing/visual-regression.md`.

## Evidencia local de 2026-07-15
- ambiente: Linux, Chromium Playwright, NSS/NSPR em `/tmp/alwaystrack-playwright-libs`, SQLite temporario e seed sintetico;
- classificacao: `local/fake`; nenhuma credencial, PII, provider ou sistema live foi usado;
- commit SHA: registrado pelo orchestrator no fechamento desta entrega;
- `npm run typecheck --workspaces --if-present`: passou nos seis workspaces;
- `npm run repo:hygiene`: passou, incluindo licencas, contratos de qualidade e busca de artefatos sensiveis;
- matriz final: oito testes passaram para login, Web autenticado desktop/mobile e Companion `320px`/`600px`;
- revisao manual: oito PNGs inspecionados; atalhos desktop quebram linha sem corte, a navegacao mobile e rolavel e o conteudo critico aparece na primeira tela.

## Regressao encontrada e corrigida
O primeiro ciclo encontrou overflow horizontal preexistente:

| Viewport | Largura do documento | Resultado |
| --- | --- | --- |
| 1440px desktop | 2187px | topbar e workspace excedem o viewport |
| 1024px desktop recolhido | 1993px | recolher a sidebar nao contem a topbar |
| 390px mobile SAC | 608px | sidebar e workspace excedem o viewport |
| 360px mobile CaseFlow | 629px | sidebar encobre o workspace e intercepta o clique em Backup |

O CSS passou a permitir quebra dos atalhos desktop, reflow das acoes e busca, coluna unica dos Fluxos e navegacao mobile horizontal alcancavel. Nenhuma tolerancia, skip ou excecao escondeu a regressao. As assercoes geometricas rodam antes do pixel diff e os quatro baselines afetados foram atualizados somente depois de revisao visual.

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao e sua classificacao
- riscos, ressalvas e blockers
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task ou retornar bloqueio com evidencia objetiva.
- constraints: sem escopo novo, sem credenciais ou sistemas live sem autorizacao, sem promover rollout por inferencia.
