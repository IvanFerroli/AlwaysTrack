# TASK-AT-336 - Runtime local: setup inteligente e hub completo de apresentacao

## Metadata
- status: completed-local-validation
- owner: olympus_orchestrator
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-336-intelligent-up-presentation-hub.md

## Modo
- mode: implementation
- generation-mode: user-directed-taskification

## Capability
Developer Experience / Presentation Runtime

## Origem documental
- Diretiva do usuario de 2026-07-15 para tornar `npm run up` idempotente e abrir no navegador todas as superficies demonstraveis.
- Revisao conjunta de olympus_taskyfier e olympus_orchestrator sobre o startup existente.

## Objetivo unico
Transformar `npm run up` em uma entrada local inteligente que prepare apenas o necessario, reutilize servicos saudaveis e apresente app, documentacao e evidencias navegaveis por HTTP.

## Requisitos fechados
1. Nao encerrar processos desconhecidos para liberar portas.
2. Nao aplicar migration ou seed em banco remoto sem opt-in explicito.
3. Instalar dependencias e regenerar TypeDoc, coverage e Playwright somente quando ausentes ou desatualizados.
4. Servir artefatos por HTTP em `127.0.0.1`, com allowlist e bloqueio de traversal/symlink.
5. Exibir coverage dos seis workspaces, Playwright, TypeDoc, carga e documentacao operacional.
6. Abrir todas as superficies disponiveis por padrao, com modos `--hub-only` e `--no-open`.
7. Propagar o opt-out de browser ao Artillery e aguardar readiness real antes da apresentacao.
8. Tratar SIGINT e SIGTERM encerrando somente processos pertencentes a sessao atual.

## Acceptance Criteria
1. Segunda execucao sem mudancas reutiliza dependencias, artefatos e servicos saudaveis.
2. `--setup-only` nao encerra processos em execucao.
3. Relatorios sao acessiveis por URLs HTTP e `.env`/paths fora da allowlist retornam 404.
4. O hub distingue artefato ausente, desatualizado e atualizado.
5. Porta configuravel da API permanece alinhada ao proxy Web, health, carga e hub.
6. Testes automatizados cobrem HTML, freshness, allowlist, symlink, catalogo de abas e launchers Linux/macOS/Windows/WSL.

## Fora de escopo
- Iniciar Companion Host sem allowed origin configurada.
- Carregar automaticamente a extensao em perfil Chrome pessoal.
- Tratar evidencia local como prontidao production-like ou live.

## Resultado
- Servidor e dashboard implementados em `scripts/local-workbench.mjs`.
- Orquestracao idempotente e segura integrada em `scripts/start-all.js`.
- Proxy Vite passou a derivar o alvo da mesma configuracao da API.
- Testes focados incluidos no gate raiz por `npm run test:startup`.
- Smoke real abriu 28 abas HTTP e retornou 200 para todos os destinos; `.env` e traversal retornaram 404.
- O comportamento de abertura em massa foi posteriormente substituido pela central integrada da `TASK-AT-349`; `--open-all` preserva o diagnostico legado.
- Segunda execucao pulou TypeDoc, coverage e Playwright atuais e reutilizou API, Web, Studio e Hub.
- `setup-only` preservou os mesmos PIDs nas quatro portas e o guard de banco remoto falhou antes do Prisma.
- Coverage agregado dos seis workspaces concluiu depois de reconciliar o baseline incremental da API e adicionar regressao dos uploads Web.

## Validacao
- `npm run test:startup`
- `node --check scripts/start-all.js`
- `npm run check`
- smoke real de `npm run up` com reutilizacao de servicos e verificacao HTTP da bancada
- revisao visual do hub no Chromium desktop e mobile

## Riscos residuais
- Abertura automatica depende de browser associado no sistema operacional.
- Validacao fisica em Windows/WSL/Edge continua pertencendo a TASK-AT-334.

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: manter o startup local fail-closed para banco remoto e conflitos de porta.
- constraints: nao automatizar credenciais, provider live ou perfil pessoal de navegador.
