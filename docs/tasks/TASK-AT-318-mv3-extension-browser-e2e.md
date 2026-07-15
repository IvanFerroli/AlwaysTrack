# TASK-AT-318 - Extensao MV3: E2E em Chromium com Host controlado

## Metadata
- status: implementation-complete-runtime-wiring-pending
- owner: olympus_taskyfier
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-318-mv3-extension-browser-e2e.md

## Modo
- mode: implementation
- generation-mode: project-wide-readiness-coverage

## Capability
Testing / Browser Extension

## Origem documental
- `docs/tasks/PROJECT-WIDE-READINESS-BACKLOG-2026-07-15.md`
- `docs/architecture/recent-test-doc-coverage-audit.md`
- Diretiva do usuario de 2026-07-15 para cobertura transversal e padronizacao do projeto.

## Objetivo unico
Validar a extensao carregada de verdade, incluindo service worker, content scripts, side panel, pairing e reconexao.

## Contexto minimo
O AlwaysTrack cresceu para seis workspaces, infraestrutura local/deploy, integracoes externas e gates CaseFlow. Esta task fecha uma lacuna observada sem reabrir implementacoes concluidas nem substituir validacoes live existentes.

## Inputs
- Estado real do codigo, CI, testes, docs e manifests em 2026-07-15.
- Ledger canonico da `TASK-AT-308`, quando aplicavel.
- Evidencias anteriores devem ser classificadas como fake, local, production-like ou live.

## Dependencias
- satisfeitas: backlog CaseFlow materializado ate `TASK-AT-307` e auditoria transversal concluida.
- em aberto: TASK-AT-317, TASK-AT-292.

## Alvos explicitos
1. tests/e2e/companion-extension/**
2. apps/companion-extension/**
3. services/companion-host/src/diagnostics/**

## Fora de escopo
- Declarar validacao live a partir de mocks, fixtures ou execucao local.
- Usar credenciais, dados pessoais ou sistemas externos sem ambiente autorizado.
- Refatoracao ampla sem relacao direta com os criterios desta task.

## Checklist de execucao
1. Subir Chromium com extensao unpacked e Host fake/controlado.
2. Cobrir install, permissoes, tab registry, intake, guided flow, suspend/resume e reconnect.
3. Capturar falhas sem persistir HTML, cookie, token ou screenshot sensivel.

## Acceptance Criteria
1. O bundle MV3 e exercitado no navegador, nao apenas por DOM fake.
2. Pairing, side panel e reconexao passam ponta a ponta.
3. Permissoes fora da allowlist e falhas de Host degradam com seguranca.

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
- Dependencias nativas do navegador tornarem o CI instavel.

## Blockers possiveis
- Ambiente production-like, Windows/WSL/Chrome ou credenciais autorizadas indisponiveis.
- Dependencia anterior ainda nao aprovada.
- Evidencia contem dado sensivel e precisa ser refeita com redaction.

## Proximo passo provavel
TASK-AT-319

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao e sua classificacao
- riscos, ressalvas e blockers
- proximo passo recomendado

## Evidencia de implementacao

- ambiente: Ubuntu 24.04, Node 24, Chromium Playwright 1228, extensao unpacked.
- execucao: `2026-07-15T12:25:48Z`, base Git `e7d5537862cbe80daac6131db964bebd2c45920e`;
  sem commit por restricao explicita do handoff.
- classificacao: `local/fake`; nenhum sistema externo, credencial ou dado real foi usado.
- Host: servidor WebSocket controlado em `127.0.0.1:38472`, com tokens e identidades sinteticos.
- superficies exercitadas: manifest e permissoes, service worker MV3, side panel em origem
  `chrome-extension://`, intent do fluxo guiado, pairing, rotacao de token, queda do Host,
  backoff/reconnect, rejeicao terminal, suspend/resume e reparo manual.
- privacidade: o runner nao persiste trace, video, screenshot, HTML, cookie ou token; a saida
  do protocolo reduz tokens a classe `pairing` ou `reconnect`.

Comandos locais:

```bash
npm run build --workspace @alwaystrack/companion-extension
LD_LIBRARY_PATH=/tmp/alwaystrack-playwright-libs/root/usr/lib/x86_64-linux-gnu \
  node scripts/mv3-extension-e2e.mjs
npm run typecheck --workspace @alwaystrack/companion-extension
npm run test --workspace @alwaystrack/companion-extension
npm run repo:hygiene
git diff --check
```

Resultados: build, typecheck, higiene, integridade documental e `git diff --check` com
exit code 0; 108 testes Vitest passaram; runner Chromium repetido 3 vezes, com 11 checks
em cada execucao e nenhuma flake observada.

## Lacunas objetivas encontradas

1. `content-scripts/index.js` e produzido pelo build, mas `manifest.json` nao declara
   `content_scripts`; por isso intake real em uma pagina nao e alcancavel nesta versao.
2. O token de reconexao existe apenas na memoria do service worker. Reiniciar o worker
   exige novo pairing e impede afirmar reconexao transparente apos suspend/resume.
3. `TabRegistry` nao esta conectado ao service worker atual; sua cobertura permanece
   unitaria, nao E2E em navegador.
4. Side panel foi aberto diretamente pela URL da extensao. O clique real no action icon
   e o comportamento visual acoplado ao perfil Chrome exigem gate manual/production-like.

Essas lacunas nao foram contornadas alterando manifest ou Host de producao, em respeito ao
ownership desta rodada. A task fica implementada no maior escopo local viavel, mas nao deve
ser promovida a validacao `live` nem considerada integralmente concluida ate o wiring acima.

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task ou retornar bloqueio com evidencia objetiva.
- constraints: sem escopo novo, sem credenciais ou sistemas live sem autorizacao, sem promover rollout por inferencia.
