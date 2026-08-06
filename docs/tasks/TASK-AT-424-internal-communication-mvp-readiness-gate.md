# TASK-AT-424 - Gate do MVP de Comunicação Interna

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-424-internal-communication-mvp-readiness-gate.md

## Modo
- mode: verification
- priority: P1
- generation-mode: initiative-breakdown

## Capability
InternalCommunication / MVP Readiness

## Origem documental
- `TASK-AT-417` a `TASK-AT-423`.

## Problema
Um chat visualmente funcional pode ainda falhar em isolamento de tenant, ordenação, unread, idempotência, privacidade, carga de canal geral ou acessibilidade.

## Objetivo único
Emitir decisão reproduzível de prontidão para demo e piloto interno do MVP textual de Comunicação Interna.

## Contexto mínimo
O gate não implementa features; ele classifica evidências e impede que aceite visual compense falha de tenancy, privacidade ou integridade.

## Inputs
- Entregas/evidências das `TASK-AT-417` a `TASK-AT-423`.
- Harnesses de seed, API, Web, E2E, acessibilidade e carga.
- Ambiente alvo e sign-offs definidos.

## Escopo
1. Seed determinístico com duas organizações, equipes, geral, directs e groups.
2. Jornada E2E de envio, recebimento, paginação, leitura, notification target e moderação.
3. Matriz anti-IDOR e membership atual/histórico.
4. Teste de fanout/carga limitado e polling concorrente.
5. Verificação de acessibilidade, mobile e ausência de conteúdo em logs.
6. Decisões separadas para demo local e piloto interno.

## Fora de escopo
- Corrigir gaps dentro do gate sem task de follow-up.
- Aprovar presença, realtime, anexos ou rich interactions.
- Declarar rollout externo por evidência local.

## Arquivos ou domínios candidatos
- `services/api/src/core/` — testes futuros da Comunicação.
- `apps/web/test/` — testes futuros da view de Comunicação.
- `tests/` — E2E futuro de Comunicação.
- `services/api/prisma/seed.ts`.
- `docs/demo/` — roteiro futuro do MVP de Comunicação.

## Requisitos funcionais
1. Demo cobre os quatro tipos de conversa e retomada de histórico.
2. Resultados distinguem funcionalidade aprovada, waiver e blocker.
3. Falha de notificação não impede persistência/consulta da mensagem.
4. Indisponibilidade transitória não duplica envio no retry.

## Requisitos de permissão, tenant e auditoria
1. Matriz inclui leitura, envio, criação, membership, moderação e deep link.
2. Cross-tenant/cross-team não vaza preview, nome ou participantes.
3. Logs/telemetria são inspecionados para conteúdo privado.
4. Evidência de moderação preserva requestId e redaction.

## Checklist de execução
1. Preparar seed e matriz de jornadas.
2. Executar suites funcionais/negativas/carga/a11y.
3. Inspecionar logs, auditoria e fallbacks.
4. Classificar evidências por ambiente.
5. Emitir ledger, decisão e follow-ups.

## Critérios de aceite
1. Requisito -> task -> teste -> evidência está completo para o MVP.
2. Todos os invariantes P0 passam ou recebem waiver com owner/prazo.
3. Demo e piloto recebem decisões independentes `GO`, `GO-WITH-RISK` ou `NO-GO`.
4. Fase 2 permanece explicitamente fora da declaração de prontidão.

## Testes esperados
- Suites API/Web/E2E, anti-IDOR, carga bounded e acessibilidade.
- `npm run check`, `npm run check:docs`, `npm run repo:hygiene` e `git diff --check`.
- Revisão manual desktop/mobile e inspeção de logs.

## Riscos
- Aceitar polling/fanout sem medir volume representativo.
- Usar seed de um único tenant e não detectar isolamento fraco.

## Dependências
- satisfeitas: harnesses de qualidade, coverage e E2E existentes.
- em aberto: `TASK-AT-417` a `TASK-AT-423` concluídas e ambiente alvo definido.

## Blockers possíveis
- Falha P0 de tenant/membership/idempotência.
- Ausência de política mínima de moderação/privacidade.

## Definição de pronto
1. Ledger de evidências e decisão assinada por produto, engenharia e segurança.
2. Blockers possuem owner e follow-up; nenhum gap é ocultado.
3. Roteiro de demo é reproduzível sem dados reais.

## Evidência esperada
- Manifesto com commit, ambiente, data, comandos/exit codes e classificação local/production-like.
- Capturas e relatório de segurança/carga.

## Próximo passo provável
`TASK-AT-425` somente após priorização humana da fase 2.

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar gate sem corrigir silenciosamente escopo.
- constraints: demo local não autoriza rollout externo.
