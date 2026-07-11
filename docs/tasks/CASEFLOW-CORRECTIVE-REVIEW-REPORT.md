# CASEFLOW-CORRECTIVE-REVIEW-REPORT

## Metadata
- status: corrective-review-materialized
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/CASEFLOW-CORRECTIVE-REVIEW-REPORT.md
- spec: `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`

## A. Resumo da rodada
- estado anterior: primeira derivacao em chat com 89 tasks (`TASK-AT-194` a `TASK-AT-282`) e materializacao parcial local ate `TASK-AT-212`.
- o que foi revisado: as 9 lacunas tecnicas, dependencias, riscos, conectores, testes, recuperacao operacional e materializacao.
- total de tasks antes: 89.
- total de tasks depois: 114 (`TASK-AT-194` a `TASK-AT-307`).
- tasks adicionadas: 25 liquidas, incluindo spike Windows/WSL/Chrome, topologia de confianca, reconciliacao incremental, overrides humanos, testes estruturais e recuperacao operacional.
- tasks removidas: 0 de cobertura funcional; a antiga task ampla de API minima foi substituida por tasks menores.
- tasks divididas: API CaseFlow, conectores de Loggi/J&T/Correios/Lancador em parser/runtime, mensagens/testes, fluxo/testes e rollout gates.
- tasks fundidas: nenhuma correcao fundiu escopos; a rodada preferiu explicitar dependencias.
- tasks renumeradas: proposta nao materializada depois de `TASK-AT-199` foi reordenada; os arquivos parciais `TASK-AT-194` a `TASK-AT-212` foram preservados em `.tmp/caseflow-corrective-backup-20260711/` e regenerados.
- tasks reordenadas: `TASK-AT-195` e `TASK-AT-196` agora antecedem scaffolding/runtime; `TASK-AT-222` e `TASK-AT-223` antecedem qualquer escrita; rollout gates foram movidos para depois das protecoes.

## B. Resultado por ponto da auditoria
| Ponto | Status | Correcao realizada | Task IDs | Dependencias | Arquivos |
| ----- | ------ | ------------------ | -------- | ------------ | -------- |
| 1 | corrigido | Adicionado spike antecipado Windows + WSL + Chrome e dependencia de runtime sobre ele. | TASK-AT-195 | 194 | docs/tasks/TASK-AT-195-windows-wsl-chrome-topology-spike.md |
| 2 | corrigido | Adicionada topologia de autenticacao/confianca e protocolo cruzado Extensao/Host/API. | TASK-AT-196, TASK-AT-201, TASK-AT-212, TASK-AT-283 | 195,197,211 | docs/tasks/TASK-AT-196-caseflow-auth-trust-topology.md; docs/tasks/TASK-AT-201-cross-component-protocol-contract.md; docs/tasks/TASK-AT-212-host-alwaystrack-api-client-trust.md |
| 3 | corrigido | Adicionada reconciliacao incremental de plano, historico de revisoes e UI estavel. | TASK-AT-248, TASK-AT-253, TASK-AT-292 | 247,225-228 | docs/tasks/TASK-AT-248-caseflow-incremental-plan-reconciliation.md; docs/tasks/TASK-AT-253-progressive-plan-stability-ui.md |
| 4 | corrigido | Adicionadas APIs/servicos de evidencia manual, conflito manual, correcao de fluxo, undo e metricas. | TASK-AT-225, TASK-AT-226, TASK-AT-227, TASK-AT-228 | 218,219,221,224 | docs/tasks/TASK-AT-225-manual-evidence-api.md; docs/tasks/TASK-AT-226-manual-conflict-resolution-api.md; docs/tasks/TASK-AT-227-flow-classification-override-api.md; docs/tasks/TASK-AT-228-human-override-undo-metrics.md |
| 5 | corrigido | API minima foi dividida; firewall/testes negativos foram movidos antes de escrita; gates dependem de protecoes. | TASK-AT-222 a TASK-AT-224, TASK-AT-242, TASK-AT-250, TASK-AT-251, TASK-AT-261, TASK-AT-280 a TASK-AT-305 | 199,221,222,223 | docs/tasks/TASK-AT-222-action-firewall-enforcement.md; docs/tasks/TASK-AT-224-caseflow-case-evidence-conflict-api.md; docs/tasks/TASK-AT-305-rollout-phase-4-drafts-rollback-gate.md |
| 6 | corrigido | Dependencias dos conectores foram normalizadas; Loggi depende de EvidenceFact, nao do runtime Rastreio. | TASK-AT-229 a TASK-AT-282, especialmente TASK-AT-269 e TASK-AT-270 | 200,207,208,213,218,220,222,223,263 | docs/tasks/TASK-AT-270-loggi-readonly-runtime.md |
| 7 | corrigido | Criadas tasks explicitas para testes estruturais de fluxo, mensagem e conectores. | TASK-AT-246, TASK-AT-259, TASK-AT-286, TASK-AT-287, TASK-AT-292 | 245,257,258,263 | docs/tasks/TASK-AT-246-serviceflow-structural-validation-tests.md; docs/tasks/TASK-AT-259-message-structural-tests.md; docs/tasks/TASK-AT-286-connector-fixture-parser-test-harness.md |
| 8 | corrigido | Adicionadas recuperacao operacional, reidratacao, restart, retry, dedupe, update/rollback e backup/restore. | TASK-AT-293, TASK-AT-294, TASK-AT-295, TASK-AT-300 | 195,211,214,248,250 | docs/tasks/TASK-AT-293-operational-recovery-protocol.md; docs/tasks/TASK-AT-294-extension-companion-install-update-rollback.md; docs/tasks/TASK-AT-295-caseflow-backup-restore-config.md |
| 9 | corrigido | Backlog foi materializado em arquivos formais, ROADMAP e memoria foram atualizados, e este relatorio foi criado. | TASK-AT-194 a TASK-AT-307 | n/a | docs/tasks/TASK-AT-194-*.md a docs/tasks/TASK-AT-307-*.md; docs/tasks/ROADMAP.md; docs/operations/taskyfier-memory.md; docs/tasks/CASEFLOW-CORRECTIVE-REVIEW-REPORT.md |

## C. Evidencias detalhadas

### Ponto 1 - corrigido
- correcao: Adicionado spike antecipado Windows + WSL + Chrome e dependencia de runtime sobre ele.
- tasks responsaveis: TASK-AT-195
- dependencias principais: 194
- arquivos: docs/tasks/TASK-AT-195-windows-wsl-chrome-topology-spike.md
- criterios relacionados: cada task possui Acceptance Criteria propria e menciona a cobertura de SPEC no campo Origem documental.
- teste/validacao relacionado: quando runtime ainda nao existe, a task exige revisao manual; quando aplicavel, ha task de qualidade explicita ou check future do workspace afetado.
- risco mitigado: a lacuna deixa de ficar implicita e passa a ter dono, ordem e arquivo formal.

### Ponto 2 - corrigido
- correcao: Adicionada topologia de autenticacao/confianca e protocolo cruzado Extensao/Host/API.
- tasks responsaveis: TASK-AT-196, TASK-AT-201, TASK-AT-212, TASK-AT-283
- dependencias principais: 195,197,211
- arquivos: docs/tasks/TASK-AT-196-caseflow-auth-trust-topology.md; docs/tasks/TASK-AT-201-cross-component-protocol-contract.md; docs/tasks/TASK-AT-212-host-alwaystrack-api-client-trust.md
- criterios relacionados: cada task possui Acceptance Criteria propria e menciona a cobertura de SPEC no campo Origem documental.
- teste/validacao relacionado: quando runtime ainda nao existe, a task exige revisao manual; quando aplicavel, ha task de qualidade explicita ou check future do workspace afetado.
- risco mitigado: a lacuna deixa de ficar implicita e passa a ter dono, ordem e arquivo formal.

### Ponto 3 - corrigido
- correcao: Adicionada reconciliacao incremental de plano, historico de revisoes e UI estavel.
- tasks responsaveis: TASK-AT-248, TASK-AT-253, TASK-AT-292
- dependencias principais: 247,225-228
- arquivos: docs/tasks/TASK-AT-248-caseflow-incremental-plan-reconciliation.md; docs/tasks/TASK-AT-253-progressive-plan-stability-ui.md
- criterios relacionados: cada task possui Acceptance Criteria propria e menciona a cobertura de SPEC no campo Origem documental.
- teste/validacao relacionado: quando runtime ainda nao existe, a task exige revisao manual; quando aplicavel, ha task de qualidade explicita ou check future do workspace afetado.
- risco mitigado: a lacuna deixa de ficar implicita e passa a ter dono, ordem e arquivo formal.

### Ponto 4 - corrigido
- correcao: Adicionadas APIs/servicos de evidencia manual, conflito manual, correcao de fluxo, undo e metricas.
- tasks responsaveis: TASK-AT-225, TASK-AT-226, TASK-AT-227, TASK-AT-228
- dependencias principais: 218,219,221,224
- arquivos: docs/tasks/TASK-AT-225-manual-evidence-api.md; docs/tasks/TASK-AT-226-manual-conflict-resolution-api.md; docs/tasks/TASK-AT-227-flow-classification-override-api.md; docs/tasks/TASK-AT-228-human-override-undo-metrics.md
- criterios relacionados: cada task possui Acceptance Criteria propria e menciona a cobertura de SPEC no campo Origem documental.
- teste/validacao relacionado: quando runtime ainda nao existe, a task exige revisao manual; quando aplicavel, ha task de qualidade explicita ou check future do workspace afetado.
- risco mitigado: a lacuna deixa de ficar implicita e passa a ter dono, ordem e arquivo formal.

### Ponto 5 - corrigido
- correcao: API minima foi dividida; firewall/testes negativos foram movidos antes de escrita; gates dependem de protecoes.
- tasks responsaveis: TASK-AT-222 a TASK-AT-224, TASK-AT-242, TASK-AT-250, TASK-AT-251, TASK-AT-261, TASK-AT-280 a TASK-AT-305
- dependencias principais: 199,221,222,223
- arquivos: docs/tasks/TASK-AT-222-action-firewall-enforcement.md; docs/tasks/TASK-AT-224-caseflow-case-evidence-conflict-api.md; docs/tasks/TASK-AT-305-rollout-phase-4-drafts-rollback-gate.md
- criterios relacionados: cada task possui Acceptance Criteria propria e menciona a cobertura de SPEC no campo Origem documental.
- teste/validacao relacionado: quando runtime ainda nao existe, a task exige revisao manual; quando aplicavel, ha task de qualidade explicita ou check future do workspace afetado.
- risco mitigado: a lacuna deixa de ficar implicita e passa a ter dono, ordem e arquivo formal.

### Ponto 6 - corrigido
- correcao: Dependencias dos conectores foram normalizadas; Loggi depende de EvidenceFact, nao do runtime Rastreio.
- tasks responsaveis: TASK-AT-229 a TASK-AT-282, especialmente TASK-AT-269 e TASK-AT-270
- dependencias principais: 200,207,208,213,218,220,222,223,263
- arquivos: docs/tasks/TASK-AT-270-loggi-readonly-runtime.md
- criterios relacionados: cada task possui Acceptance Criteria propria e menciona a cobertura de SPEC no campo Origem documental.
- teste/validacao relacionado: quando runtime ainda nao existe, a task exige revisao manual; quando aplicavel, ha task de qualidade explicita ou check future do workspace afetado.
- risco mitigado: a lacuna deixa de ficar implicita e passa a ter dono, ordem e arquivo formal.

### Ponto 7 - corrigido
- correcao: Criadas tasks explicitas para testes estruturais de fluxo, mensagem e conectores.
- tasks responsaveis: TASK-AT-246, TASK-AT-259, TASK-AT-286, TASK-AT-287, TASK-AT-292
- dependencias principais: 245,257,258,263
- arquivos: docs/tasks/TASK-AT-246-serviceflow-structural-validation-tests.md; docs/tasks/TASK-AT-259-message-structural-tests.md; docs/tasks/TASK-AT-286-connector-fixture-parser-test-harness.md
- criterios relacionados: cada task possui Acceptance Criteria propria e menciona a cobertura de SPEC no campo Origem documental.
- teste/validacao relacionado: quando runtime ainda nao existe, a task exige revisao manual; quando aplicavel, ha task de qualidade explicita ou check future do workspace afetado.
- risco mitigado: a lacuna deixa de ficar implicita e passa a ter dono, ordem e arquivo formal.

### Ponto 8 - corrigido
- correcao: Adicionadas recuperacao operacional, reidratacao, restart, retry, dedupe, update/rollback e backup/restore.
- tasks responsaveis: TASK-AT-293, TASK-AT-294, TASK-AT-295, TASK-AT-300
- dependencias principais: 195,211,214,248,250
- arquivos: docs/tasks/TASK-AT-293-operational-recovery-protocol.md; docs/tasks/TASK-AT-294-extension-companion-install-update-rollback.md; docs/tasks/TASK-AT-295-caseflow-backup-restore-config.md
- criterios relacionados: cada task possui Acceptance Criteria propria e menciona a cobertura de SPEC no campo Origem documental.
- teste/validacao relacionado: quando runtime ainda nao existe, a task exige revisao manual; quando aplicavel, ha task de qualidade explicita ou check future do workspace afetado.
- risco mitigado: a lacuna deixa de ficar implicita e passa a ter dono, ordem e arquivo formal.

### Ponto 9 - corrigido
- correcao: Backlog foi materializado em arquivos formais, ROADMAP e memoria foram atualizados, e este relatorio foi criado.
- tasks responsaveis: TASK-AT-194 a TASK-AT-307
- dependencias principais: n/a
- arquivos: docs/tasks/TASK-AT-194-*.md a docs/tasks/TASK-AT-307-*.md; docs/tasks/ROADMAP.md; docs/operations/taskyfier-memory.md; docs/tasks/CASEFLOW-CORRECTIVE-REVIEW-REPORT.md
- criterios relacionados: cada task possui Acceptance Criteria propria e menciona a cobertura de SPEC no campo Origem documental.
- teste/validacao relacionado: quando runtime ainda nao existe, a task exige revisao manual; quando aplicavel, ha task de qualidade explicita ou check future do workspace afetado.
- risco mitigado: a lacuna deixa de ficar implicita e passa a ter dono, ordem e arquivo formal.

### Revisao olympus_orchestrator
- cobertura: todos os 9 pontos possuem status corrigido com task e arquivo concreto.
- dependencias circulares: nenhuma circular foi intencionalmente criada; gates de rollout dependem de protecoes anteriores, nao o inverso.
- rollout prematuro: Fases 1 a 4 dependem de protocolo seguro, anti dado cruzado, performance, recovery, drift/health e firewall conforme aplicavel.
- escrita antes de firewall: primeira task de escrita e `TASK-AT-280`, posterior a `TASK-AT-222` e `TASK-AT-223`.
- conectores acoplados indevidamente: Loggi foi corrigido para depender de EvidenceFact normalizado (`TASK-AT-218`) e nao de Rastreio runtime.

### Revisao olympus_runtime_builder
- viabilidade Windows/WSL/Chrome: `TASK-AT-195` e pre-requisito antes de host/extensao; riscos de loopback, firewall, IP WSL, suspensao e reconexao foram antecipados.
- autenticacao e confianca: `TASK-AT-196`, `TASK-AT-201`, `TASK-AT-212` e `TASK-AT-283` separam Extensao, Host, API e instalacao local.
- reconexao e recuperacao: `TASK-AT-293` cobre reidratacao e restart; `TASK-AT-294` cobre update/rollback.
- runtime nao implementado: esta rodada materializa tasks/documentos, sem host real, extensao real, scraping ou credenciais.

## D. Grafo e caminho critico revisados
- tarefas do caminho critico: `TASK-AT-194`, `TASK-AT-195`, `TASK-AT-196`, `TASK-AT-197`, `TASK-AT-198`, `TASK-AT-199`, `TASK-AT-200`, `TASK-AT-201`, `TASK-AT-202`, `TASK-AT-210`, `TASK-AT-211`, `TASK-AT-212`, `TASK-AT-216`, `TASK-AT-217`, `TASK-AT-218`, `TASK-AT-219`, `TASK-AT-220`, `TASK-AT-221`, `TASK-AT-222`, `TASK-AT-223`, `TASK-AT-224`, `TASK-AT-229`, `TASK-AT-230`, `TASK-AT-231`, `TASK-AT-233`, `TASK-AT-234`, `TASK-AT-235`, `TASK-AT-236`.
- primeiro vertical slice: `TASK-AT-229`, `TASK-AT-230`, `TASK-AT-231`, `TASK-AT-232`, `TASK-AT-233`, `TASK-AT-234`, `TASK-AT-235`, `TASK-AT-236`, `TASK-AT-237`.
- tasks paralelizaveis: 203-209 Extensao apos contratos; 210-215 Host apos contratos/topologia; 238-243 Heuristica em paralelo com parte de UI/admin apos Evidence; 264/266/269/271/273/275 parsers em paralelo apos registry; 286/287 qualidade de conectores apos parsers.
- gates de rollout: `TASK-AT-302`, `TASK-AT-303`, `TASK-AT-304`, `TASK-AT-305`, `TASK-AT-306`.
- ponto em que escrita passa a ser permitida: depois de `TASK-AT-222` enforcement, `TASK-AT-223` regressao negativa, `TASK-AT-261` API de copy e `TASK-AT-262` copy-only; primeira escrita e `TASK-AT-280`.
- ponto em que cada conector pode entrar: parsers apos `TASK-AT-263`; runtimes read-only apos orchestrator/protocolo/tab/intervencao/evidence/ledger/firewall; drafts somente apos `TASK-AT-222` e `TASK-AT-223`.
- dependencias do spike Windows/WSL/Chrome: `TASK-AT-195` depende de `TASK-AT-194` e antecede `TASK-AT-196`, `TASK-AT-202`, `TASK-AT-203`, `TASK-AT-210`, `TASK-AT-211`, `TASK-AT-293` e `TASK-AT-294`.

## E. Matriz de dependencia dos conectores
| Conector | Parser | Runtime | Orquestrador | Tab Registry | Intervencao | Evidence | Ledger | Firewall | Health/Drift |
| -------- | ------ | ------- | ------------ | ------------ | ----------- | -------- | ------ | -------- | ------------ |
| AlwaysChat | TASK-AT-229 | TASK-AT-230 | TASK-AT-213 | TASK-AT-207 | TASK-AT-208 | TASK-AT-218 | TASK-AT-220 | TASK-AT-199, TASK-AT-222 | TASK-AT-288, TASK-AT-289 |
| Rastreio | TASK-AT-233 | TASK-AT-234 | TASK-AT-213 | TASK-AT-207 | TASK-AT-208 | TASK-AT-218 | TASK-AT-220 | TASK-AT-199, TASK-AT-222 | TASK-AT-288, TASK-AT-289 |
| Yampi | TASK-AT-264 | TASK-AT-265 | TASK-AT-213 | TASK-AT-207 | TASK-AT-208 | TASK-AT-218 | TASK-AT-220 | TASK-AT-199, TASK-AT-222 | TASK-AT-288, TASK-AT-289 |
| OMIE Filial | TASK-AT-266 | TASK-AT-267 | TASK-AT-213 | TASK-AT-207 | TASK-AT-208 | TASK-AT-218 | TASK-AT-220 | TASK-AT-199, TASK-AT-222 | TASK-AT-288, TASK-AT-289 |
| OMIE Matriz/Pharma | TASK-AT-266 | TASK-AT-268 | TASK-AT-213 | TASK-AT-207 | TASK-AT-208 | TASK-AT-218 | TASK-AT-220 | TASK-AT-199, TASK-AT-222 | TASK-AT-288, TASK-AT-289 |
| Loggi | TASK-AT-269 | TASK-AT-270 | TASK-AT-213 | TASK-AT-207 | TASK-AT-208 | TASK-AT-218 | TASK-AT-220 | TASK-AT-199, TASK-AT-222 | TASK-AT-288, TASK-AT-289 |
| J&T VIP | TASK-AT-271 | TASK-AT-272 | TASK-AT-213 | TASK-AT-207 | TASK-AT-208 | TASK-AT-218 | TASK-AT-220 | TASK-AT-199, TASK-AT-222 | TASK-AT-288, TASK-AT-289 |
| Correios/Reversa | TASK-AT-273 | TASK-AT-274 | TASK-AT-213 | TASK-AT-207 | TASK-AT-208 | TASK-AT-218 | TASK-AT-220 | TASK-AT-199, TASK-AT-222 | TASK-AT-288, TASK-AT-289 |
| Lancador | TASK-AT-275 | TASK-AT-276, TASK-AT-281, TASK-AT-282 | TASK-AT-213 | TASK-AT-207 | TASK-AT-208 | TASK-AT-218 | TASK-AT-220 | TASK-AT-199, TASK-AT-222, TASK-AT-223 | TASK-AT-288, TASK-AT-289 |

## F. Ordem das capacidades de escrita
1. contrato: `TASK-AT-199` define capabilities e firewall de acao.
2. enforcement: `TASK-AT-222` implementa validacao central de capabilities.
3. testes negativos: `TASK-AT-223` prova que envio, submit, drag, Slack post, status change, pedido final, reversa e ticket ficam proibidos.
4. primeira capability de escrita: `TASK-AT-280`, INSERT_DRAFT no AlwaysChat com clique explicito.
5. primeiro rascunho AlwaysChat: `TASK-AT-280`, posterior a API de mensagens/copy e auditoria.
6. primeiro rascunho Lancador: `TASK-AT-281`, posterior a consulta read-only `TASK-AT-276`, firewall e testes negativos.
7. rollout: `TASK-AT-305` libera Fase 4 apenas se rollback, recuperacao, firewall e regressao estiverem verdes.

## G. Reconciliacao incremental
- task que implementa: `TASK-AT-248`.
- task que testa/valida em E2E: `TASK-AT-292`; estabilidade visual em `TASK-AT-253`.
- como plano e atualizado: novas evidencias/conflitos/overrides disparam reexecucao da heuristica e comparacao com plano anterior.
- como passo atual e preservado: o reconciliador invalida apenas ramos afetados e mantem passo/choices quando ainda validos.
- como mudanca de recomendacao e apresentada: `TASK-AT-253` adiciona aviso/banner sem pular interface.
- como escolha humana prevalece: overrides de `TASK-AT-225` a `TASK-AT-228` tem precedencia e sao preservados no reconciliador.

## H. Overrides humanos
- evidencia manual: `TASK-AT-225`, origem MANUAL, motivo, auditoria e reavaliacao posterior.
- conflito manual: `TASK-AT-226`, chosenFactId, reason, fatos originais preservados.
- correcao de fluxo: `TASK-AT-227`, fluxo sugerido versus escolhido, motivo e feedback de regra.
- auditoria: `TASK-AT-221` e usada como base; cada override tem evento auditavel.
- reexecucao: `TASK-AT-248` recomputa plano apos override.
- desfazer: `TASK-AT-228` cobre undo sem apagar historico.
- metricas: `TASK-AT-228` e `TASK-AT-290` contabilizam correcoes para melhoria de regras.

## I. Recuperacao operacional
- reconexao: `TASK-AT-205`, `TASK-AT-211`, `TASK-AT-293`.
- reidratacao: `TASK-AT-293`, por caseId/sessionId.
- restart de extensao, host e WSL: `TASK-AT-195`, `TASK-AT-293`, `TASK-AT-294`.
- retry individual: `TASK-AT-214`, `TASK-AT-220`, `TASK-AT-289`, `TASK-AT-293`.
- deduplicacao: `TASK-AT-214` e `TASK-AT-293`.
- suspensao do notebook: `TASK-AT-195` e `TASK-AT-294`.
- atualizacao e rollback: `TASK-AT-294` e gate `TASK-AT-305`.
- backup/restore: `TASK-AT-295`.
- retomar apos login/captcha: `TASK-AT-208`, `TASK-AT-272`, `TASK-AT-274`, `TASK-AT-293`.

## J. Materializacao
- arquivos de task criados: `TASK-AT-194` a `TASK-AT-307` em `docs/tasks/`.
- arquivos alterados: `docs/tasks/ROADMAP.md`, `docs/operations/taskyfier-memory.md`.
- roadmap atualizado: sim, secao `Fase I - CaseFlow Engine + AlwaysTrack Companion`.
- matriz de cobertura: esta neste relatorio, secoes B, C e E, alem do campo Origem documental de cada task.
- relatorio: `docs/tasks/CASEFLOW-CORRECTIVE-REVIEW-REPORT.md`.
- itens somente em mensagem: nenhum item da decomposicao corretiva; a execucao de codigo/runtime permanece futura por restricao desta rodada.
- backup de materializacao parcial anterior: `.tmp/caseflow-corrective-backup-20260711/`.

## K. Lacunas residuais
- O spike `TASK-AT-195` ainda precisa ser executado em ambiente real Windows + WSL + Chrome para validar a hipotese de loopback/firewall/suspensao.
- Smoke live de conectores exige credenciais/sessoes reais e fica fora desta rodada; coberto como checklist em `TASK-AT-287`.
- Nenhum runtime foi implementado nesta rodada; as tasks de implementacao continuam planned.
- Decisoes humanas futuras: porta local padrao, UX final de pairing, politica final de retencao da conversa integral e estrategia de update da extensao.
- Riscos nao eliminados: DOM drift de terceiros, captcha/login frequentes, desempenho em maquina local, e mudancas no Chrome/MV3.
- Itens conscientemente adiados: executor agentic, IA generativa, automacao de Slack, submit/geracao de pedido/reversa/ticket e integracoes oficiais.

## L. Revisao final incorporada em 2026-07-11
- `olympus_orchestrator` confirmou que a faixa completa da frente deve ser `TASK-AT-194` a `TASK-AT-307`, nao `TASK-AT-194` a `TASK-AT-282`; a sequencia 283-307 e parte obrigatoria da cobertura de seguranca, performance, testes, rollout, rollback e prontidao agentic.
- `TASK-AT-195` foi ajustada para tratar Windows/WSL/Chrome como gate verificavel do ambiente local atual, nao requisito universal de produto; se falhar, a task deve registrar alternativa local-first.
- `TASK-AT-202` foi reforcada para incluir package metadata, `tsconfig`, scripts `build/typecheck/test`, escolha de bundler da extensao, integracao com `npm run up` e politica de lockfile antes da extensao compilavel.
- `TASK-AT-216` foi reforcada para listar todas as entidades da SPEC, incluindo `HeuristicRuleVersion`, `CaseFlowPlanTransition`, `CompanionInstallation`, `ConnectorDefinition`, migration Prisma versionada, rollback/reversal e gate de migracao.
- `TASK-AT-212` foi reforcada para cobrir emissao, rotacao, revogacao, middleware/guard API-side, anti-injecao local e rate-limit proprio para o Companion.
- `TASK-AT-224` foi reforcada para incluir ingestao batch/bulk de facts, idempotency key por `connectorRunId + factKey + sourceReference`, retry seguro e rate-limit especifico.
- `TASK-AT-233` foi reforcada para explicitar `movimentacoes`, `reenvios` e `entrega` no parser do Rastreio no Lancador.
- `TASK-AT-244` e `TASK-AT-249` foram reforcadas contra o risco atual de `updateServiceFlow` apagar/recriar steps, exigindo migration/adaptador, preservacao de sessoes existentes e testes de compatibilidade linear -> grafo.
