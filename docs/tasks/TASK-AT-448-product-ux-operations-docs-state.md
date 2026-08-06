# TASK-AT-448 - Runbook, estado operacional e protocolo de evidencia Product UX

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-448-product-ux-operations-docs-state.md

## Modo
- mode: ops
- generation-mode: canonical-specialist-breakdown

## Capability
Product UX / Operations and Evidence Governance

## Origem documental
- `docs/tasks/PRODUCT-UX-SPECIALIST-BACKLOG-2026-08-05.md`
- ADR/spec de `TASK-AT-440`.
- Contratos de `TASK-AT-442` e `TASK-AT-443`.
- Harness, skill, agente e evals de `TASK-AT-444` a `TASK-AT-447`.

## Objetivo unico
Formalizar como ativar, operar, diagnosticar e encerrar o especialista Product UX, incluindo ciclo de vida, retencao e proveniencia da evidencia visual.

## Contexto minimo
A capacidade cruza browser local, seed, autenticacao, artefatos visuais, roteamento e handoffs. Sem runbook e estado operacional explicitos, falhas podem parecer pareceres validos, artefatos sensiveis podem persistir e o ownership entre agentes pode se perder.

## Inputs
- Contratos publicos e de evidencia aprovados.
- Comandos reais do harness e da malha Olympus.
- Codigos de sucesso, blocker e rejeicao definidos.
- Resultados do gate adversarial de `TASK-AT-447`.

## Dependencias
- satisfeitas: padrao de runbooks e memoria operacional do repositorio.
- em aberto: `TASK-AT-440` a `TASK-AT-447`.

## Alvos explicitos
1. Runbook futuro `product-ux-runbook.md` no diretório `docs/operations/`.
2. Estado futuro `product-ux-state.md` no diretório `docs/operations/`.
3. Mapa de ativacao, troubleshooting, ownership e escalonamento.
4. Politica operacional de armazenamento, sanitizacao, retencao e descarte da evidencia.

## Fora de escopo
- Alterar agente, skill, harness, UI do AlwaysTrack ou suites de teste.
- Persistir credenciais, cookies, tokens, PII ou screenshots nao sanitizados.
- Declarar o especialista pronto antes dos pilotos e do gate final.

## Checklist de execucao
1. Documentar prechecks de app, API, seed, browser, role, rota, estado e viewport.
2. Documentar comandos de captura, leitura de manifesto, troubleshooting e cleanup seguro.
3. Mapear `CAPTURED`, `REFERENCE_REQUIRED`, `VISUAL_ACQUISITION_BLOCKED`, `SENSITIVE_ARTIFACT_REJECTED` e `STALE_EVIDENCE` para acoes operacionais.
4. Definir quando rotear a Critic, Contracts, Docs, Runtime, Quality, Verifier ou humano.
5. Definir estado de ativacao, versoes compativeis e historico de mudancas.
6. Definir retencao minima, redaction, evidencias descartaveis e artefatos auditaveis.
7. Incluir recuperacao para falha de browser, dependencia nativa, seed, autenticacao e rota.

## Acceptance Criteria
1. Um operador novo consegue reproduzir prechecks, captura e cleanup apenas com o runbook.
2. Cada codigo de resultado possui causa, proxima acao, owner e criterio de reexecucao.
3. Falha de aquisicao visual permanece fail-closed e nunca autoriza parecer visual baseado apenas em codigo.
4. O estado operacional separa `draft`, `evaluation-ready`, `pilot-ready`, `active`, `degraded` e `disabled`, ou equivalentes aprovados.
5. Retencao e sanitizacao impedem persistencia de secrets e PII e possuem verificacao objetiva.
6. O runbook preserva a fronteira: Product UX audita/especifica/revisa; Runtime implementa; Quality e Verifier validam/aceitam.

## Definition of Done
1. Runbook e estado operacional versionados e revisados.
2. Comandos e caminhos documentados foram exercitados contra a versao corrente.
3. Nenhuma instrucao depende de conhecimento oral ou fallback silencioso.

## Validacao
- comandos/checks: smoke documental dos comandos, `npm run check:docs`, `npm run repo:hygiene` e `git diff --check`.
- revisao manual: dry-run de ativacao, blocker, sanitizacao, escalonamento e cleanup por outro operador.

## Evidencia esperada
- Runbook executavel, matriz de codigos/acoes e registro de dry-run.
- Estado atual com versoes de agente, skill, contratos, harness e evals.

## Riscos
- Runbook divergir dos comandos reais.
- Retencao indefinida acumular artefatos sensiveis ou obsoletos.
- Estado `degraded` ser interpretado como permissao para fail-open.

## Blockers possiveis
- Comandos do harness ou roteamento ainda instaveis.
- Politica de retencao sem owner humano quando houver evidencia real autorizada.

## Proximo passo provavel
`TASK-AT-449`

## Feedback obrigatorio de retorno
- documentos criados ou atualizados
- comandos exercitados
- estados e codigos cobertos
- riscos de privacidade e operacao
- recomendacao para pilotos

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: rotear a formalizacao operacional sem alterar runtime e devolver dry-run reproduzivel.
- constraints: sem ativacao final, sem captura sensivel, sem fallback visual por leitura de codigo e sem implementar UX no AlwaysTrack.
