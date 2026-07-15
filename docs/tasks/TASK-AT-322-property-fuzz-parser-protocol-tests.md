# TASK-AT-322 - Robustez: property testing e fuzzing de parsers e protocolos

## Metadata
- status: completed
- owner: olympus_orchestrator
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-322-property-fuzz-parser-protocol-tests.md

## Modo
- mode: implementation
- generation-mode: project-wide-readiness-coverage

## Capability
Testing / Robustness

## Origem documental
- `docs/tasks/PROJECT-WIDE-READINESS-BACKLOG-2026-07-15.md`
- `docs/architecture/recent-test-doc-coverage-audit.md`
- Diretiva do usuario de 2026-07-15 para cobertura transversal e padronizacao do projeto.

## Objetivo unico
Encontrar falhas com entradas truncadas, extremas, duplicadas e estruturalmente inesperadas.

## Contexto minimo
O AlwaysTrack cresceu para seis workspaces, infraestrutura local/deploy, integracoes externas e gates CaseFlow. Esta task fecha uma lacuna observada sem reabrir implementacoes concluidas nem substituir validacoes live existentes.

## Inputs
- Estado real do codigo, CI, testes, docs e manifests em 2026-07-15.
- Ledger canonico da `TASK-AT-308`, quando aplicavel.
- Evidencias anteriores devem ser classificadas como fake, local, production-like ou live.

## Dependencias
- satisfeitas: backlog CaseFlow materializado ate `TASK-AT-307`, auditoria transversal, `TASK-AT-108`, `TASK-AT-286` e `TASK-AT-317`.
- complementar: `TASK-AT-283` possui implementacao automatizada concluida e gate manual de topologia pendente; esta task nao promove essa evidencia a live.

## Alvos explicitos
1. packages/shared/src/connectors/**/*.test.ts
2. services/companion-host/src/security/**/*.test.ts
3. services/api/src/core/validation/**/*.test.ts

## Fora de escopo
- Declarar validacao live a partir de mocks, fixtures ou execucao local.
- Usar credenciais, dados pessoais ou sistemas externos sem ambiente autorizado.
- Refatoracao ampla sem relacao direta com os criterios desta task.

## Checklist de execucao
1. [x] Gerar Unicode, HTML, JSON, tamanhos limite e ordenacoes variadas.
2. [x] Cobrir uploads, parsers externos, schemas HTTP e protocolo Companion.
3. [x] Persistir seeds minimos de qualquer falha encontrada como regressao.

## Acceptance Criteria
1. [x] Suites possuem seeds reproduziveis (`0x0322c0de`, `0x0322f00d`, `0x0322a11c`, `0x0322b10b`) e timeout de 5 segundos.
2. [x] Entradas invalidas falham fechadas sem crash ou ecoar os valores sinteticos.
3. [x] Casos minimos de regressao permanecem nos testes: getter hostil, JSON truncado, assinatura truncada, MIME divergente, duplicatas e limites exatos.

## Definition of Done
1. [x] Alvos previstos no ownership desta rodada foram criados ou atualizados com mudanca revisavel.
2. [x] Validacoes automatizadas e revisao manual aplicaveis foram executadas e registradas.
3. [x] Riscos residuais, blockers e classificacao da evidencia constam neste manifesto.

## Implementacao
- `packages/shared/src/connectors/property-fuzz.test.ts` exercita oito parsers externos com 400 entradas JSON bounded e o protocolo Companion com 500 entradas, truncamentos e objetos hostis.
- `services/api/src/core/validation/property-fuzz.test.ts` exercita os schemas HTTP com 500 entradas e uploads com 1.000 buffers sinteticos, incluindo assinaturas truncadas.
- Parsers de conectores limitam strings a 8.192 caracteres e colecoes a 100 itens.
- O parser JSON Companion limita payload a 64 KiB, strings de handshake a 1.024 caracteres e versoes anunciadas a 8; `safeParse` converte getters/proxies hostis em falha fechada.
- A seguranca de transporte do Companion Host permanece coberta pela `TASK-AT-283`; por ownership explicito, nenhum arquivo do Host foi alterado nesta rodada.

## Evidencia de execucao
- ambiente: local, Linux, Node.js; somente dados sinteticos, sem credenciais, rede externa ou sistemas live.
- classificacao: `local/fake`.
- data UTC: `2026-07-15T11:52:02Z`.
- gate Shared focado: 29 testes aprovados em 4 arquivos.
- gate API focado: 26 testes aprovados em 3 arquivos.
- commit SHA: atribuido pelo orchestrator no handoff de integracao e push.
- comandos finais e seus exit codes sao registrados no retorno operacional.

## Validacao
- comandos/checks: gate focado da superficie alterada, `npm run typecheck --workspaces --if-present`, `npm run repo:hygiene` e `git diff --check`.
- revisao manual: comparar resultado com o backlog transversal, o ledger e os gates existentes relacionados.

## Evidencia esperada
- Commit SHA, ambiente, data UTC, comandos, exit codes e arquivos alterados.
- Relatorio ou artefato sanitizado classificado como fake, local, production-like ou live.
- Owner, riscos residuais e proximo passo.

## Riscos
- Mitigado: geradores possuem profundidade, cardinalidade, iteracoes, seeds e timeout fixos.
- Residual: fuzzing deterministico local nao substitui fuzzing nativo prolongado nem o gate manual de topologia da `TASK-AT-283`.

## Blockers possiveis
- Nenhum blocker para a cobertura automatizada desta task.
- Ambiente production-like, Windows/WSL/Chrome e credenciais nao foram usados e nao sao inferidos como validados.

## Proximo passo provavel
TASK-AT-323

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao e sua classificacao
- riscos, ressalvas e blockers
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task ou retornar bloqueio com evidencia objetiva.
- constraints: sem escopo novo, sem credenciais ou sistemas live sem autorizacao, sem promover rollout por inferencia.
