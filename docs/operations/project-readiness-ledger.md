# Project Readiness Ledger

## Metadata
- status: active
- owner: olympus_orchestrator
- last-updated: 2026-07-15
- source-of-truth: docs/operations/project-readiness-ledger.md
- related-task: docs/tasks/TASK-AT-308-canonical-project-readiness-ledger.md

## Finalidade e regras
Este ledger reconcilia componente, risco, owner, task, dependencia, gate e evidencia. O status de uma task informa entrega de escopo; nao equivale a aprovacao de demo, rollout ou exposicao externa.

Classificacoes de evidencia permitidas:

| Classe | O que prova | O que nao prova |
| --- | --- | --- |
| `fake` | Comportamento deterministico com fixtures, paginas sinteticas ou provider fake. | Integracao, credencial, navegador, host ou dado real. |
| `local` | Execucao no checkout/CI com dependencias locais ou conteinerizadas. | Equivalencia com producao ou operacao sustentada. |
| `production-like` | Execucao em ambiente isolado equivalente ao alvo, com configuracao e dependencias representativas. | Operacao live, salvo gate que aceite explicitamente essa classe. |
| `live` | Execucao humana autorizada no ambiente alvo, com UTC, operador e artefatos redigidos. | Outros ambientes, conectores ou releases nao registrados. |

`completed`, `audit-complete-no-go` e `documentation-complete-rollout-blocked` sao preservados conforme os manifests. Nenhuma evidencia `fake` ou `local` promove gate que exige `production-like` ou `live`.

## Inventario canonico

| Superficie | Estado reconciliado | Risco/gap principal | Owner | Tasks/dependencias abertas | Gate e evidencia atual |
| --- | --- | --- | --- | --- | --- |
| API (`@alwaystrack/api`) | Implementada, com testes amplos locais. | Baseline raiz reportado como instavel por fixture temporal; contrato HTTP nao versionado. | api/core | AT-309, AT-310, AT-316, AT-322 | `npm run check`; evidencia `local`; nao promove producao. |
| Web (`@alwaystrack/web`) | Implementada, typecheck/build e smoke Playwright existentes; contrato uniforme esta no worktree. | Sem suite unitaria/de componentes; excecao auditavel aponta AT-311 e expira em 2026-08-15. Acessibilidade e regressao visual formais tambem faltam. | web/product | AT-309, AT-310, AT-311 a AT-315 | CI smoke `local`; validacao visual real segue pendente. |
| Shared (`@alwaystrack/shared`) | Contratos compilam; testes de protocolo/reconexao da AT-317 estao concluidos localmente. | Contrato precisa permanecer alinhado a Extension/Host e ainda nao prova topologia real. | platform/contracts | AT-309, AT-310; AT-317 `completed` | Typecheck/teste `local`; sem promocao de gate live. |
| Companion Extension MV3 (`@alwaystrack/companion-extension`) | Build e testes Vitest locais; contrato de reconexao AT-317 concluido; demo CaseFlow offline disponivel. | Falta E2E com extensao carregada, service worker e perfil Chrome reais. | companion/extension | AT-318, AT-334 | Fixtures `fake` e testes `local`; gates Windows/Chrome continuam `PENDENTE_LIVE`. |
| Companion Host (`@alwaystrack/companion-host`) | Host, pairing, protocolo e reconexao implementados/testados localmente; AT-317 concluida. | Falta prova Windows/WSL, firewall, suspend/resume e recuperacao no host alvo. | companion/host | AT-329, AT-334; gate operacional AT-293 | Testes `local`; rollout CaseFlow nao aprovado. |
| SmartScript Companion (`@alwaystrack/smartscript-companion`) | CLI e pipeline local existem. | Cobertura rasa de CLI, filesystem, Espanso e lifecycle real. | companion/smartscript | AT-319, AT-322, AT-334 | Testes/smoke `local`; captura real nao deve ser inferida. |
| Dados, filas e storage | SQLite/storage local sao o contrato dev/demo; Redis roda em CI; adapter S3 existe. | Postgres, storage externo, concorrencia, backup/restore coordenado e Redis alvo nao foram provados em staging. | ops/platform | AT-320, AT-328, AT-329, AT-332; AT-149 bloqueada por infra | Migration/Redis `local`; Postgres/storage `production-like` e restore seguem abertos. |
| Integracoes e conectores externos | Contratos, hardening e fixtures cobrem caminhos conhecidos. | Google, Meta, OpenAI e conectores CaseFlow exigem sandbox/live por provider; nenhum smoke live CaseFlow foi registrado. | integrations + security | AT-321, AT-324, AT-334; gates live preexistentes | Mocks/fixtures `fake` e checks locais; cada conector mantem gate `PENDENTE_LIVE`. |
| Infra, CI e release | CI valida setup, check, docs, migrations, hygiene, Playwright smoke e Redis. Dockerfiles e compose de exemplo existem. | CI nao garante todos os builds, SAST/SCA/secrets/licencas completos, proveniencia ou deploy final. | ops/platform + security | AT-310, AT-313, AT-325, AT-326, AT-332 | CI `local`; sem artefato candidato `production-like`. |
| Performance e observabilidade | Metricas HTTP/Prisma, Artillery e relatorios locais existem. | Sem carga mista/1000 usuarios production-like, SLO exercitado, alertas E2E ou soak. | ops/observability | AT-323, AT-324 | Smoke `local`; prova de capacidade continua aberta. |
| Documentacao, runbooks e evidencias | Arquitetura, catalogo de runbooks (AT-331), demo e auditorias CaseFlow existem. | Integridade automatica de links/status continua aberta. | docs/operations | AT-330; AT-331 `completed`; AT-333 nesta entrega | Revisao documental `local`; schema de evidencia definido pela AT-333. |
| Perifericos de uso | Desktop/mobile aparecem no Playwright; checklists cobrem OS, navegador, rede, clipboard e intervencoes. | Matriz real de browser, Windows/WSL, VPN/firewall, teclado, clipboard, suspend/resume e acessibilidade nao executada. | qa + companion/ops | AT-312 a AT-314, AT-318, AT-334 | Checklist documental; validacao `live` ausente. |
| Privacidade e governanca de dados | Redaction, inventario LGPD e RIPD documental da AT-327 existem. | Aprovacao juridica/controlador e enforcement de retencao, purge e direitos do titular continuam pendentes. | privacy + security | AT-327 `documentation-complete-legal-approval-pending`; AT-328 | Evidencia documental/local parcial; nao libera dado real. |

## Decisoes separadas

| Fronteira | Snapshot atual | Caminho critico calculavel | Evidencia minima para mudar |
| --- | --- | --- | --- |
| Demo controlada local/offline | `GO-WITH-RISK`, somente com dados ficticios e sem integracao live. | Revalidar reset/seed, API/Web, roteiro e audit offline no commit apresentado; AT-309 remove a instabilidade conhecida do gate raiz. | Manifesto `local`/`fake`, comandos verdes, operador, UTC e fallback offline. |
| Rollout interno / CaseFlow | `NO-GO`. Auditorias AT-302 a AT-306 permanecem `audit-complete-no-go`; AT-307 e documental e bloqueada. | Fechar sequencialmente os gates live ja existentes, incluindo AT-293 e conectores; depois reauditar fases 1 a 5. | Evidencia `live` por host/conector/fase e aprovacao humana; fixtures nao contam. |
| Exposicao externa | `NO-GO`. Gate de seguranca vigente nao aprovou internet publica. | Infra alvo, AT-320, AT-325, AT-326, AT-329, AT-332 e AT-334; repetir gate de beta/exposicao no release candidato. | HTTPS/dominio, secrets, Postgres/storage, backup/restore, rollback, CI e smokes `production-like`/`live` aprovados. |

Estas decisoes sao um snapshot reconciliado, nao substituem a decisao final da AT-335 nem a aprovacao dos owners dos gates.

## Dependencias reconciliadas
- AT-300 e AT-301 estao `completed`; nao sao dependencias abertas.
- AT-302 a AT-306 concluiram auditoria, mas o resultado operacional e `NO-GO`.
- AT-307 concluiu documentacao limitada; rollout e autonomia permanecem bloqueados.
- AT-308 e a base deste ledger. Entre AT-309 e AT-335, prevalece cada manifest: AT-317 e AT-331 estao `completed`; AT-327 esta documentalmente concluida com aprovacao legal pendente; AT-309/310 continuam `planned` mesmo com implementacao concorrente observada no worktree; AT-333 pode concluir quando pacote/schema e validacoes estiverem registrados.
- AT-330 continua `planned`; portanto integridade automatica de links, comandos e status e risco residual, nao pre-condicao para usar o formato de evidencia da AT-333.

## Atualizacao
1. Atualizar uma linha apenas com fonte objetiva e manter a classe da evidencia.
2. Vincular task, commit, ambiente, UTC, operador, resultado e artefato com checksum conforme `evidence-manifest.schema.json`.
3. Nao converter task concluida em gate aprovado. Registrar a decisao na fronteira correspondente.
4. Em conflito, prevalecem runtime/CI observados e o gate especializado; abrir correcao documental em vez de promover status.

## Riscos residuais e proximo passo
- Risco imediato: o gate raiz pode continuar vermelho ate AT-309, e Web/Shared nao possuem cobertura uniforme.
- Blockers externos: infraestrutura production-like, credenciais autorizadas, host Windows/WSL/Chrome e execucoes live.
- Proximo passo recomendado: AT-309 para baseline deterministico; em paralelo, AT-330 para tornar a reconciliacao documental executavel.
