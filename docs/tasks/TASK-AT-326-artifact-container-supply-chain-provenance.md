# TASK-AT-326 - Release: containers, artefatos e proveniencia de supply chain

## Metadata
- status: implementation-complete-ci-container-gate-pending
- owner: olympus_taskyfier
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-326-artifact-container-supply-chain-provenance.md

## Modo
- mode: implementation
- generation-mode: project-wide-readiness-coverage

## Capability
Release / Supply Chain

## Origem documental
- `docs/tasks/PROJECT-WIDE-READINESS-BACKLOG-2026-07-15.md`
- `docs/architecture/recent-test-doc-coverage-audit.md`
- Diretiva do usuario de 2026-07-15 para cobertura transversal e padronizacao do projeto.

## Objetivo unico
Produzir artefatos implantaveis, minimizados, escaneados, identificaveis e reversiveis.

## Contexto minimo
O AlwaysTrack cresceu para seis workspaces, infraestrutura local/deploy, integracoes externas e gates CaseFlow. Esta task fecha uma lacuna observada sem reabrir implementacoes concluidas nem substituir validacoes live existentes.

## Inputs
- Estado real do codigo, CI, testes, docs e manifests em 2026-07-15.
- Ledger canonico da `TASK-AT-308`, quando aplicavel.
- Evidencias anteriores devem ser classificadas como fake, local, production-like ou live.

## Dependencias
- satisfeitas: backlog CaseFlow materializado ate `TASK-AT-307` e auditoria transversal concluida.
- satisfeitas: TASK-AT-310 e TASK-AT-325; builds locais e manifesto rastreavel implementados.
- em aberto: build/smoke/SBOM/scan de containers no CI; TASK-AT-315 para thresholds de coverage.

## Alvos explicitos
1. Dockerfile.api
2. Dockerfile.web
3. deploy/**
4. .github/workflows/**

## Fora de escopo
- Declarar validacao live a partir de mocks, fixtures ou execucao local.
- Usar credenciais, dados pessoais ou sistemas externos sem ambiente autorizado.
- Refatoracao ampla sem relacao direta com os criterios desta task.

## Checklist de execucao
1. Buildar e smokar API, Web/Nginx, Host e pacote MV3 a partir de dist.
2. Usar runtime nao-root, imagens/pins imutaveis e health/readiness.
3. Gerar checksum, SBOM, scan, versao de protocolo e manifesto de compatibilidade.

## Acceptance Criteria
1. Artefatos possuem identidade imutavel e rastreavel ao commit.
2. Containers passam smoke e scan antes de promocao.
3. Rollback referencia pacote conhecido por hash e compatibilidade.

## Definition of Done
1. Alvos previstos foram criados ou atualizados com mudanca revisavel.
2. Validacoes automatizadas e manuais aplicaveis foram executadas e registradas.
3. Riscos residuais, blockers e classificacao da evidencia constam no retorno.

## Validacao
- comandos/checks: gate focado da superficie alterada, `npm run typecheck --workspaces --if-present`, `npm run repo:hygiene` e `git diff --check`.
- revisao manual: comparar resultado com o backlog transversal, o ledger e os gates existentes relacionados.

## Evidencia esperada
- Commit SHA, ambiente, data UTC, comandos, exit codes e arquivos alterados.
- Relatorio ou artefato sanitizado classificado como fake, local, production-like ou live.
- Owner, riscos residuais e proximo passo.

## Riscos
- Pinagem sem processo de atualizacao deixar componentes obsoletos.

## Blockers possiveis
- Ambiente production-like, Windows/WSL/Chrome ou credenciais autorizadas indisponiveis.
- Dependencia anterior ainda nao aprovada.
- Evidencia contem dado sensivel e precisa ser refeita com redaction.

## Proximo passo provavel
TASK-AT-327

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao e sua classificacao
- riscos, ressalvas e blockers
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task ou retornar bloqueio com evidencia objetiva.
- constraints: sem escopo novo, sem credenciais ou sistemas live sem autorizacao, sem promover rollout por inferencia.

## Resultado da execucao 2026-07-15
- API e Web receberam runtime nao-root, healthcheck e separacao build/runtime.
- Shared agora possui entrypoint runtime compilado; API inicia de `dist/src/main.js`.
- Workflow de candidato esta preparado para produzir pacotes Companion, imagens OCI, SBOM, scans e manifesto com commit/checksums/compatibilidade.
- Imagens base Node, Nginx e Redis estao fixadas por digest; Dependabot passou a acompanhar Docker para atualizacoes controladas. Promocao e publicacao externa permanecem fora do workflow.
- Evidencia local: build agregado, import runtime do Shared, inicio da API por `dist` com `/health` em porta isolada, validacao YAML e geracao do manifesto passaram. Docker nao esta disponivel neste host, portanto build/smoke/scan de imagem continuam pendentes de CI.
