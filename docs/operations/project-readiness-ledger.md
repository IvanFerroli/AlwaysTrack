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
| API (`@alwaystrack/api`) | Baseline deterministico, lifecycle/readiness, coverage, fuzz e OpenAPI P0 versionado. | Rotas legadas P1/P2 ainda nao estao no OpenAPI; Postgres production-like segue aberto. | api/core | AT-320 | Testes/contrato `local`; nao promove producao. |
| Web (`@alwaystrack/web`) | Suite unitaria/componentes, acessibilidade automatica, E2E por role e 8 baselines visuais. | Leitor de tela/zoom e compatibilidade fisica seguem manuais. | web/product | AT-312 manual, AT-334 | Browser Chromium `local/fake`; layout desktop/mobile sem overflow nos cenarios P0. |
| Shared (`@alwaystrack/shared`) | Contratos, enums, protocolo, coverage e reconexao alinhados a Extension/Host. | Topologia e restart reais ainda exigem host autorizado. | platform/contracts | AT-334 | Typecheck/testes `local`; sem promocao live. |
| Companion Extension MV3 (`@alwaystrack/companion-extension`) | Build, 108 testes e E2E unpacked Chromium com service worker/side panel/pairing/reconnect. | Content script nao declarado, token memory-only e TabRegistry sem wiring E2E. | companion/extension | AT-318 wiring, AT-334 | 11 checks Chromium `local/fake`; Windows/Chrome live pendente. |
| Companion Host (`@alwaystrack/companion-host`) | Host, pairing, protocolo e reconexao implementados/testados localmente; AT-317 concluida. | Falta prova Windows/WSL, firewall, suspend/resume e recuperacao no host alvo. | companion/host | AT-329, AT-334; gate operacional AT-293 | Testes `local`; rollout CaseFlow nao aprovado. |
| SmartScript Companion (`@alwaystrack/smartscript-companion`) | CLI/filesystem/Espanso cobertos em diretorio temporario e coverage ativo. | Clipboard/janela/Espanso Windows reais continuam manuais. | companion/smartscript | AT-334 | E2E `local/fake`; captura real nao inferida. |
| Dados, filas e storage | SQLite/storage local sao o contrato dev/demo; Redis roda em CI; adapter S3 existe. | Postgres, storage externo, concorrencia, backup/restore coordenado e Redis alvo nao foram provados em staging. | ops/platform | AT-320, AT-328, AT-329, AT-332; AT-149 bloqueada por infra | Migration/Redis `local`; Postgres/storage `production-like` e restore seguem abertos. |
| Integracoes e conectores externos | Matriz local cobre Google, Meta/WhatsApp, OpenAI, Gemini e providers fake com degradacao/redaction. | Sandbox/live continua pendente por provider e conector CaseFlow. | integrations + security | AT-321 sandbox/live, AT-334 | 53 testes `local/fake`; gates `PENDENTE_LIVE`. |
| Infra, CI e release | Contrato de seis workspaces, SAST/SCA/secrets/licencas, builds, artefatos nao-root e provenance local implementados. | Gate container CI/Docker e deploy final ainda nao foram observados neste host. | ops/platform + security | AT-326 CI/container, AT-320 | Evidencia `local`; sem candidato production-like. |
| Performance e observabilidade | SLO/alertas exercitados e matriz mixed/stress/spike/soak versionada. | Perfis pesados, recursos, Redis e soak production-like nao executados. | ops/observability | AT-323 production-like, AT-320 | Um VU/13 requests `local`; nao prova capacidade. |
| Documentacao, runbooks e evidencias | Integridade executavel, catalogo de runbooks e schema/pacote de evidencia ativos. | Revisao humana da apresentacao e aprovacoes externas continuam necessarias. | docs/operations | AT-335 auditada | 607 documentos e hygiene `local`. |
| Perifericos de uso | Chromium desktop/mobile, teclado/semantica automatica e visual P0 foram exercitados localmente. | Leitor de tela/zoom, Edge, Windows/WSL, VPN/firewall, clipboard, suspend/resume e monitores reais nao executados. | qa + companion/ops | AT-312 manual, AT-318 wiring, AT-334 | Browser `local/fake`; validacao fisica/live ausente. |
| Privacidade e governanca de dados | Inventario/RIPD documental e enforcement tenant-scoped de retencao/purge/direitos implementados localmente. | Aprovacao juridica/controlador e exercicio production-like continuam pendentes. | privacy + security | AT-327 legal; AT-328 production-like | Evidencia documental/local; nao libera dado real. |

## Decisoes separadas

| Fronteira | Snapshot atual | Caminho critico calculavel | Evidencia minima para mudar |
| --- | --- | --- | --- |
| Demo controlada local/offline | `GO-WITH-RISK`, somente com dados ficticios e sem integracao live. | Revalidar reset/seed, API/Web, roteiro e audit offline no commit apresentado. | Manifesto `local`/`fake`, comandos verdes, operador, UTC e fallback offline. |
| Rollout interno / CaseFlow | `NO-GO`. Auditorias AT-302 a AT-306 permanecem `audit-complete-no-go`; AT-307 e documental e bloqueada. | Fechar sequencialmente os gates live ja existentes, incluindo AT-293 e conectores; depois reauditar fases 1 a 5. | Evidencia `live` por host/conector/fase e aprovacao humana; fixtures nao contam. |
| Exposicao externa | `NO-GO`. Gate de seguranca vigente nao aprovou internet publica. | Infra alvo, AT-320, AT-325, AT-326, AT-329, AT-332 e AT-334; repetir gate de beta/exposicao no release candidato. | HTTPS/dominio, secrets, Postgres/storage, backup/restore, rollback, CI e smokes `production-like`/`live` aprovados. |

Estas decisoes foram formalizadas pela AT-335 e nao substituem a aprovacao dos owners dos gates.

## Dependencias reconciliadas
- AT-300 e AT-301 estao `completed`; nao sao dependencias abertas.
- AT-302 a AT-306 concluiram auditoria, mas o resultado operacional e `NO-GO`.
- AT-307 concluiu documentacao limitada; rollout e autonomia permanecem bloqueados.
- AT-308 a AT-311, AT-313 a AT-317, AT-319, AT-322, AT-325, AT-330, AT-331 e AT-333 estao concluidas conforme seus manifests.
- AT-312, AT-318, AT-321, AT-323, AT-324, AT-326, AT-327, AT-328, AT-329 e AT-332 possuem implementacao local/documental, mas preservam validacao manual, legal, sandbox, CI, production-like ou live pendente.
- AT-320 e AT-334 continuam planejadas e bloqueiam alegacoes production-like/live. AT-335 concluiu a auditoria com decisoes separadas, sem liberar rollout ou exposicao.

## Atualizacao
1. Atualizar uma linha apenas com fonte objetiva e manter a classe da evidencia.
2. Vincular task, commit, ambiente, UTC, operador, resultado e artefato com checksum conforme `evidence-manifest.schema.json`.
3. Nao converter task concluida em gate aprovado. Registrar a decisao na fronteira correspondente.
4. Em conflito, prevalecem runtime/CI observados e o gate especializado; abrir correcao documental em vez de promover status.

## Riscos residuais e proximo passo
- Risco imediato: wiring MV3 incompleto e ausencia de dados/compatibilidade production-like impedem promocao alem da demo local.
- Blockers externos: Postgres/storage/Redis alvo, Docker/CI observado, credenciais sandbox autorizadas, host Windows/WSL/Chrome/Edge e execucoes live.
- Proximo passo recomendado: executar checklist da demo no commit final; depois AT-320 e AT-334 antes de reabrir rollout/exposicao.
