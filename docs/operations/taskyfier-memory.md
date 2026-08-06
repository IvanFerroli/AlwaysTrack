# Taskyfier Memory

## Metadata
- status: active
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/operations/taskyfier-memory.md

## Estado atual
- Backlog formal ativo foi limpo ate `TASK-AT-101` antes desta rodada.
- `TASK-AT-121`: completed. `npm run up` virou bancada local completa de estudo/apresentacao.
- `TASK-AT-122`: completed. Auditoria recente de testes/docs criada.
- Backlog formal aberto: `TASK-AT-074`, bloqueada por prints reais.
- Padrao solicitado pelo usuario: quando ele pedir pipeline, usar Taskyfier + Orchestrator como fluxo padrao mesmo sem mencao `@` funcional.

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
- Proxima task recomendada: `TASK-AT-440-product-ux-specialist-canonical-boundaries.md`; nao antecipar criacao do agente ou routing.
