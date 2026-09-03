# Taskyfier Memory

## Metadata
- status: active
- owner: olympus_taskyfier
- last-updated: 2026-09-02
- source-of-truth: docs/operations/taskyfier-memory.md

## Estado atual
- Backlog formal ativo foi limpo ate `TASK-AT-101` antes desta rodada.
- `TASK-AT-121`: completed. `npm run up` virou bancada local completa de estudo/apresentacao.
- `TASK-AT-122`: completed. Auditoria recente de testes/docs criada.
- Backlog formal aberto: `TASK-AT-074`, bloqueada por prints reais.
- Padrao solicitado pelo usuario: quando ele pedir pipeline, usar Taskyfier + Orchestrator como fluxo padrao mesmo sem mencao `@` funcional.

## Frente de correcao pontual (SAC/Busca)
- Duplicatas externas descartadas: T-2522/T-3137 foram consolidadas em T-2315; T-2513/T-3146 foram consolidadas em T-2317 (`TASK-AT-451`).
- T-2315 concluida: Scriptoteca e Fluxos sincronizam/restauram o estado previsto no contrato de query string, com fallback de permissao. Metadados preservados da duplicata mais completa: GA, 3 SP e integracao GitHub.
- `TASK-AT-451`/T-2317 concluida em 2026-09-02. Os hrefs de `campaigns`/`faq`/`scripts` usam `campaignId`/`threadId`/`scriptId`, e os consumidores revelam o alvo autorizado mesmo com filtros conflitantes ou IDs sucessivos.
- Decisao de produto registrada: um deep link novo tem prioridade sobre filtros visuais atuais. Back/Forward permanece fora do escopo.
- Seguranca/fallback: FAQ e Scriptoteca mantem filtros de tenancy/visibilidade no backend; alvo ausente ou proibido cai para a listagem autorizada sem revelar sua existencia.
- Colisao de rota resolvida: `/faq?organizationId=...` permanece publica e `/faq?threadId=...` e interna/autenticada.
- Proxima task recomendada: nenhuma nesta frente; reportar conclusao e commits na daily.

## Regras para proximas taskificacoes
1. Nao reabrir tasks concluidas sem motivo explicito.
2. Follow-ups tecnicos devem ficar listados ate o usuario priorizar.
3. Coverage, infra de deploy, validacao runtime completa e anexos auditaveis sao bons candidatos futuros, mas nao estao ativos.


## Frente CaseFlow Engine + AlwaysTrack Companion
- Fonte canonica: `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`.
- Backlog corretivo materializado de `TASK-AT-194` a `TASK-AT-307` em 2026-07-11.
- Relatorio de revisao externa: `docs/tasks/CASEFLOW-CORRECTIVE-REVIEW-REPORT.md`.
- Implementacao local avancou ate `TASK-AT-307`; rollout segue `NO-GO` por gates live/manuais e nao deve ser promovido por evidencia fake/local.
- Gate antecipado obrigatorio: `TASK-AT-195-windows-wsl-chrome-topology-spike.md` antes de implementar extensao/host dependentes de Windows + WSL + Chrome.
- Nenhuma implementacao, dependencia, credencial ou scraping real foi executado nesta rodada.

## Frente transversal de prontidao e padronizacao
- Fonte canonica: `docs/tasks/PROJECT-WIDE-READINESS-BACKLOG-2026-07-15.md`.
- Backlog materializado de `TASK-AT-308` a `TASK-AT-335` em 2026-07-15.
- Escopo: testes, coverage, carga, resiliência, acessibilidade, visual, contratos, integracoes, seguranca, LGPD, supply chain, operacao, docs, evidencias e compatibilidade.
- Proxima task recomendada: `TASK-AT-308-canonical-project-readiness-ledger.md`.
- P0 tecnico imediatamente posterior: `TASK-AT-309`, pois a suite agregada possui uma fixture temporal expirada e Shared nao participa do gate raiz.
- Gates live CaseFlow existentes devem ser reutilizados; nao gerar tasks duplicadas para substituir homologacao externa.
- Esta rodada foi exclusivamente documental e nao alterou runtime ou dependencias.

## Frentes de Comunicacao Interna e Treinamento
- Fonte canonica: `docs/tasks/INTERNAL-COMMUNICATION-TRAINING-BACKLOG-2026-08-05.md`.
- Backlog materializado de `TASK-AT-417` a `TASK-AT-439` em 2026-08-05; esta rodada foi exclusivamente documental.
- Comunicacao usa bounded context independente. `AlwaysChat` permanece nome do conector externo e nao pode ser reutilizado para o novo produto.
- MVP de Comunicacao: REST + polling limitado, mensagens textuais, historico, read state/unread e notificacoes tipadas. Realtime/presenca, anexos e interacoes avancadas sao fase 2.
- Treinamento reutiliza `ServiceFlowVersion`, grafo e helpers puros, mas persiste em `TrainingAttempt` propria. Nunca gravar treino em `ServiceFlowSession` ou metricas/eventos operacionais.
- Tentativas, enrollments e resultados permanecem pinados a versao/snapshot publicado; republicacao nao reescreve historico.
- Caminho critico Comunicacao: `TASK-AT-417` -> `418` -> `419` -> `420` -> `421` -> `422` -> `423` -> `424`.
- Caminho critico Treinamento: `TASK-AT-428` -> `429` -> `430` -> `431` -> `432` -> `433` -> `434` -> (`435` e `436`) -> `437`.
- Proximas tasks recomendadas: aprovar em paralelo os contratos documentais `TASK-AT-417` e `TASK-AT-428`; nao antecipar migrations.
- Decisoes humanas abertas: acesso/moderacao/retencao de DMs; criacao de grupos/canais; infraestrutura/presenca; responsaveis e visibilidade de resultados; score/tentativas/feedback; membership dinamico; review de resposta aberta; provider/retencao de midia.

## Especialista Product UX Olympus
- Fonte canonica: `docs/tasks/PRODUCT-UX-SPECIALIST-BACKLOG-2026-08-05.md`.
- Backlog materializado de `TASK-AT-440` a `TASK-AT-450` em 2026-08-05; esta rodada e exclusivamente documental e nao implementa agente, skill, harness, routing ou UX no AlwaysTrack.
- Decisao assumida: versao completa local-first, com um agente `olympus_product_ux` e um skill package multimodo `olympus-product-ux` para `audit`, `interaction-spec` e `advisory-review`.
- Fronteira obrigatoria: Product UX audita, especifica e revisa; Runtime Builder implementa; Quality Builder materializa/mede testes; Task Verifier emite aceite independente.
- Aquisicao visual autonoma e capacidade de primeira classe quando app, seed, login, role, rota, estado, viewport e browser forem reproduziveis.
- Falha de browser, seed, autenticacao, rota, estado, viewport ou sanitizacao retorna `VISUAL_ACQUISITION_BLOCKED`; leitura de codigo/build nunca vira fallback visual silencioso.
- Gate obrigatorio inclui golden cases, forward evals selados, casos adversariais, pilotos reais e classificacao independente por superficie.
- Blocker tecnico conhecido: `TASK-AT-358` registrou Chromium local indisponivel por ausencia de `libnspr4.so`; a task `AT-444` deve tratar diagnostico e falha fechada antes de qualquer claim visual.
- Referencia humana continua obrigatoria para Figma/concorrente/identidade alvo, bug exclusivo de ambiente externo, tela protegida ou escolha entre alternativas de produto validas.
- Caminho critico: `TASK-AT-440` -> `441` -> `442` -> `443` -> `444` -> `445` -> `446` -> `447` -> `448` -> `449` -> `450`.
- Atualizacao 2026-08-06: `TASK-AT-440` a `TASK-AT-450` concluidas. Blocker do libnspr4/libnss3 resolvido (pacote reinstalado, Chromium local voltou a funcionar). Gate final independente (`docs/testing/product-ux-final-readiness-gate-2026-08-06.md`) classificou `GO-WITH-RISK` por superficie para uso supervisionado (`pilot-ready`) e `NO-GO` para lifecycle `active` irrestrito.
- Residual unico que bloqueia `active`: rotacao selada forward tem apenas 3 dos 9 slots reservados (`FWD-AUD-02`, `FWD-SPEC-03`, `FWD-REV-01` feitos; faltam `FWD-AUD-01`, `FWD-AUD-03`, `FWD-SPEC-01`, `FWD-SPEC-02`, `FWD-REV-02`, `FWD-REV-03`). `run-evals.mjs` recusa certificar `lane: forward` abaixo de 9/9 por design.
- Atualizacao 2026-09-02: 6 slots forward restantes executados de fato (execucao + avaliacao cega, ver secao "Retomada do fechamento Product UX — execucao 2026-09-02" acima) e fix de envelope de `FWD-SPEC-03` aplicado/testado; certificacao CLI 9/9 pausada por decisao do usuario antes de concluir, nao por bloqueio tecnico. Achado real: os 3 slots aceitos em agosto nao passam no scorer deterministico quando testados pela primeira vez. Proxima task recomendada, se e quando o usuario priorizar retomar: normalizar as 6 novas observations ao schema, resolver o achado de re-scoring dos 3 slots antigos e dos 3 casos novos com premissa nao-sustentada, so entao rodar `run-evals.mjs --lane forward` real. Uso supervisionado (task-backed, aceite humano) continua liberado, sem mudanca de `pilot-ready`.

## Taskificação do audit web ativo — 2026-09-02
- Fonte: `UXREQ-ALWAYSTRACK-ACTIVE-AUDIT-20260902-001`; audit lido integralmente e findings deduplicados contra `TASK-AT-001..453`, incluindo `452/453` untracked e o estado corrente de ROADMAP/memory.
- Novas tasks: `TASK-AT-454` (gate humano para destino dos papéis comerciais), `TASK-AT-455` (primeiro viewport da navegação mobile), `TASK-AT-456` (overflow mobile de Configurações) e `TASK-AT-457` (semântica acessível de checklist Markdown).
- `UX-001` não foi fundido à cadeia `TASK-AT-362`/`381`: ela assume sunset, enquanto a autoridade aceita ainda conflita com `SPEC-AT-001`/`TASK-AT-351`. `TASK-AT-454` não implementa uma hipótese; exige decisão de PO.
- `UX-002`/`003` são follow-ups específicos das baselines concluídas `TASK-AT-351`/`314`; `UX-004` não é coberto pela entrega ampla `TASK-AT-312` nem pelas matrizes `385`/`411`.
- Evidências PNG do audit permanecem advisory, transitórias e não promovíveis. Tasks `455`/`456`/`457` exigem nova aquisição task-backed.
- Ordem: solicitar `454` em paralelo; tecnicamente executar `456` -> `457` -> `455`. Primeira task roteável sem gate humano: `TASK-AT-456`.
- Esta rodada é somente documental: nenhum código de produto, Asana, commit ou push foi alterado/executado.

## Execução TASK-AT-455 (Orchestrator, execução overnight autônoma) — 2026-09-03
- Terceira e última task técnica do pacote do audit web ativo (após `456`/`457`, ambas `completed-with-risk`). Execução autônoma overnight, sem checkpoint humano intermediário; ver "Fechamento" em `docs/tasks/TASK-AT-455-mobile-navigation-first-viewport.md` para o relato completo com evidência.
- Implementação: `expandedNavGroup` deixa de ser reaberto automaticamente ao selecionar/entrar direto em um filho quando o viewport está no breakpoint mobile (`isMobileNavViewport()`, `<= 860px`, o mesmo breakpoint de `styles.css`); grupo/filho ativos continuam identificáveis (classe `active`, `aria-current="page"` ao reabrir) e o toggle por touch/Enter/Space com `aria-expanded` coerente foi preservado. Nenhuma mudança de CSS foi necessária — a causa raiz era só o estado JS reabrindo a árvore, não layout. Nenhuma mudança em top nav desktop, deep link ou permissão; overflow de `TASK-AT-456` (Configurações) não foi reaberto (`.form-panel`/`.table-scroll` intocados).
- Achado real durante a implementação: uma primeira versão com dois `useEffect` (um deles resincronizando `expandedNavGroup` já no mount) introduziu um flake real e mensurável na suíte Vitest completa (~29% dos runs falhando em `navigation-roles.test.tsx`/`bootstrap-session-roles.test.tsx`, causado por um `setState` redundante durante o double-invoke do `StrictMode`). Diagnosticado por bisecção com múltiplas rodadas completas da suíte (baseline 13/13 limpo vs. 2/7 falhas com a versão inicial); a correção final usa um único `useEffect` que só faz `setState` reagindo a um evento real de `matchMedia` `change` (nunca durante o mount), e reconfirmou 13/13 rodadas limpas depois.
- Validação: Vitest completo 173/173 (3 casos novos em `navigation-roles.test.tsx` cobrindo colapso mobile/reabertura/`aria-current`/breakpoint); Web typecheck e build aprovados; `git diff --check` limpo. Playwright focal (`visual-responsive-web.mobile.spec.ts`, projeto mobile) 8/10 com os 4 casos novos (SAC 390x844 com toggle touch+teclado, Administração 390x844, smoke geométrico 320x700, baseline desktop) passando; os 2 restantes (`login remains usable` e `CaseFlow backup controls`) falham igualmente em `main` sem nenhuma mudança minha (confirmado via `git stash`/rerun), portanto pré-existentes e fora de escopo. As mesmas 3 falhas em `critical-role.mobile.spec.ts`/`support-operations.mobile.spec.ts` e as 7 falhas em `critical-role.desktop.spec.ts`/`support-operations.desktop.spec.ts`/`support-scheduling.desktop.spec.ts`/`commercial-browser.spec.ts` também foram reproduzidas idênticas em `main` puro — nenhuma delas foi causada ou corrigida por esta task.
- Risco residual honesto (não coberto, `manual-needed`, no mesmo padrão de `456`/`457`): teclado completo/ordem de foco fora do toggle não exercitados; zoom 200%, orientação landscape e tecnologia assistiva real não disponíveis neste host; em 320x700 o `.top-nav`/`.topbar-account` do próprio topbar (elemento pré-existente, fora do escopo de `expandedNavGroup`) ainda empurra o primeiro bloco útil (`.operational-filters`) para baixo da dobra em pelo menos uma superfície testada (Usuários/Times) — a árvore de navegação lateral (escopo real desta task) permanece compacta e sem overflow nos dois viewports, mas o critério de aceite 1 (conteúdo útil no primeiro viewport) só foi validado e fechado para 390x844, não para 320x700; registrado como achado, não como decisão de produto arbitrária.
- Arquivo solto mencionado pelo usuário (`tests/e2e/task-at-457-orca-manual.desktop.spec.ts`) não existe neste working tree (nem em `git log --all`); nada para incluir ou excluir do commit.
- Pacote do audit `TASK-AT-454` a `457` está tecnicamente completo: `454` segue bloqueada por decisão humana explícita (não retomada); `455`/`456`/`457` `completed-with-risk`.

## Taskificação do audit complementar de uploads — 2026-09-03
- Fonte: `UXREQ-ALWAYSTRACK-COMPLEMENTARY-AUDIT-20260903-001`; audit lido integralmente e deduplicado contra todos os 455 manifests existentes entre `TASK-AT-001..457` (gaps históricos `022`/`167`), incluindo estado corrente de ROADMAP/memory.
- Novas tasks: `TASK-AT-458` (picker Markdown sem controle invisível), `TASK-AT-459` (erro/retry do upload Markdown), `TASK-AT-460` (gate humano picker-only versus drop híbrido), `TASK-AT-461` (tabpanel de Escalas no vazio) e `TASK-AT-462` (overflow CaseFlow Backup 360px).
- Dedupe: `101/108/146/150/151` continuam canônicas para upload/backend/segurança/storage; o novo pacote é somente o delta UX. `TASK-AT-153` trata reordenação, não upload. `312/411` não corrigem o ramo sem painel de Escalas.
- `TASK-AT-455` não foi reaberta: C05 era residual preexistente registrado como fora de escopo, portanto ganhou task focal `462`. `TASK-AT-456/457` permanecem concluídas; Configurações passou a geometria e checklist Markdown não regrediu.
- CSV de profissionais, licença pública e DANFE permanecem fluxos independentes; nenhum foi fundido. DANFE continua subordinado à decisão comercial `TASK-AT-454`.
- Ordem: solicitar `460` em paralelo; tecnicamente executar `459` -> `458` -> `461` -> `462`. Primeira task técnica: `TASK-AT-459`.
- PNGs/record do audit seguem advisory, transitórios e não promovíveis; aceite futuro exige aquisição task-backed.
- Rodada exclusivamente documental: nenhum produto, Asana, commit ou push foi alterado/executado.
