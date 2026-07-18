# Auditorias formais de rollout CaseFlow

## Escopo e regra de decisao

Registro documental das auditorias `TASK-AT-302` a `TASK-AT-307`, realizado em 2026-07-12 contra a SPEC, os manifests, o ROADMAP e as evidencias versionadas. Esta pasta nao aprova rollout, nao muda o estado das tasks e nao substitui validacao humana autorizada.

Fixtures, paginas fake, seeds, testes offline, mocks e health fake nunca contam como evidencia de producao ou smoke live. Na ausencia de evidencia live registrada, o resultado obrigatorio e `PENDENTE_LIVE`; dependencia `planned` ou gate anterior sem aprovacao bloqueia a fase.

## Matriz requisito, evidencia, resultado e blocker

| Task/fase | Requisito auditado | Evidencia atual | Resultado | Blocker |
| --- | --- | --- | --- | --- |
| AT-302 / Fase 1 | intake, Rastreio, evidencias, resumo, protocolo seguro, anti dado cruzado, SLO, recuperacao e comparacao manual; sem escrita | demo e fixtures offline; implementacoes AT-236/237/283/293 e AT-284/291 concluidas; gates live/manuais pendentes | **NO-GO** | comparacao manual, seguranca do protocolo, recuperacao e validacao live ausentes |
| AT-303 / Fase 2 | heuristica, fluxo versionado, stepper, Scriptoteca, copy-only e estabilidade incremental; sem draft/escrita | implementacao e testes documentados nas AT-243/246/248/252/253/259/262; gate anterior nao aprovado | **NO-GO** | AT-302 `NO-GO`; fluxo guiado live e estabilidade operacional nao demonstrados |
| AT-304 / Fase 3 | Yampi, OMIE Filial/Pharma, Loggi, J&T e Correios/Reversa com isolamento, health, drift e retry | runtimes, fixtures/harness e checklist existem; AT-265/267/268/270/272/274 aguardam live; nenhum smoke live executado | **NO-GO** | todos os smokes autenticados permanecem `PENDENTE_LIVE` |
| AT-305 / Fase 4 | firewall, testes negativos, auditoria, rollback, recuperacao e drafts explicitos sem confirmar | firewall/testes, drafts, deteccao manual, recuperacao e runbooks versionados; gates live pendentes | **NO-GO** | recuperacao, drafts e rollback live pendentes; AT-304 `NO-GO` |
| AT-306 / Fase 5 | metricas, drift, cache, retries, performance, docs, backup e DoD macro operacional | artefatos, testes locais e recuperacao implementados; gate live da AT-293 e fases 1-4 pendentes | **NO-GO** | cadeia de gates bloqueada, recuperacao live pendente e DoD macro sem evidencia live completa |
| AT-307 / futura | core extensivel a executor futuro limitado, preservando firewall e ferramentas permitidas | contratos de caso, fluxo, scripts, capabilities, gates e conectores estao documentados | **READINESS DOCUMENTAL LIMITADA / ROLLOUT BLOQUEADO** | AT-306 `NO-GO`; validacao apenas estrutural; nenhum agente ou executor implementado |

## GO/NO-GO por fase

| Fase | Decisao em 2026-07-12 | Condicao para reauditoria |
| --- | --- | --- |
| 1 - Shadow mode | **NO-GO** | concluir validacoes live/manuais de AT-236/237/283/293 e anexar comparacao manual autorizada |
| 2 - Fluxo guiado | **NO-GO** | obter GO da Fase 1 e demonstrar fluxo guiado incremental no ambiente autorizado |
| 3 - Cobertura consultiva | **NO-GO** | executar checklist live de cada conector implementado |
| 4 - Rascunhos | **NO-GO** | validar AT-280/281/282/293, firewall, recuperacao e rollback em ambiente autorizado |
| 5 - Hardening | **NO-GO** | obter GO de todas as fases anteriores e fechar DoD macro com evidencia operacional |
| Futura - executor limitado | **BLOQUEADA** | nova decisao formal apos hardening; readiness atual nao autoriza implementacao nem rollout |

## Pendencias live explicitas

- `PENDENTE_LIVE`: shadow do caso simples e comparacao com decisao manual, sem mensagens externas.
- `PENDENTE_LIVE`: pairing, protocolo local, sessao autenticada, captcha/2FA, suspensao/retomada e firewall Windows.
- `PENDENTE_LIVE`: smoke individual de AlwaysChat, Rastreio, Yampi, OMIE Filial, OMIE Pharma, Loggi, J&T e Correios/Reversa.
- `PENDENTE_LIVE`: isolamento de timeout/falha, drift, retry controlado e ausencia de dado cruzado em ambiente autorizado.
- `PENDENTE_LIVE`: rollback de extensao, Host e configuracao, seguido de recuperacao do mesmo `caseId`/`runId`.
- `PENDENTE_LIVE`: drafts explicitamente acionados sem `SEND_MESSAGE`, `SUBMIT`, `CREATE_ORDER` ou confirmacao.
- `PENDENTE_LIVE`: DoD macro, logs redigidos, metricas/SLO e uso diario sustentado.

## Relatorios

- [AT-302 - Fase 1](TASK-AT-302-audit.md)
- [AT-303 - Fase 2](TASK-AT-303-audit.md)
- [AT-304 - Fase 3](TASK-AT-304-audit.md)
- [AT-305 - Fase 4](TASK-AT-305-audit.md)
- [AT-306 - Fase 5](TASK-AT-306-audit.md)
- [AT-307 - readiness futura](TASK-AT-307-audit.md)
- [AT-415 - Escalas, Pausas e Avisos recorrentes](TASK-AT-415-audit.md)
