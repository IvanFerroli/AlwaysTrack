# TASK-AT-464 - File step contratual no harness Product UX

## Metadata
- status: completed-with-risk
- pipeline: DONE — implementado, validado pelo Quality Builder (PASS-WITH-NOTES) e aprovado com notas por Task Verifier fresh (2026-09-03); smoke real ADVISORY_CAPTURED (transitório, descartável); scripts locais são git-ignored por design (padrão TASK-AT-444) — superfície durável = suíte rastreada 24/24 + fixture pinada + runbook
- classified-by: olympus-taskyfier run #2 (2026-09-03) — reconciliação do audit repo-wide `docs/testing/product-ux-repo-wide-audit-2026-09-03.md`, finding `ATUX-012` (HIST-013; runbook:88-96; pré-requisito de ferramenta, Grupo M.6). Único doc novo materializado por este finding; owner é o Runtime Builder (harness-owner do runbook), não task de produto
- owner: Runtime Builder (harness)
- verifier: Task Verifier fresh
- last-updated: 2026-09-03
- source-of-truth: docs/tasks/TASK-AT-464-product-ux-harness-file-step.md
- mode: evidence-infrastructure
- priority: P1
- severity: low para o produto / blocker para evidência
- confidence: high (contrato do harness verificado no HEAD `3088088a`)
- estimated-effort: 3-5h
- execution-order: 6 — recomendado logo após `TASK-AT-458`; desbloqueia o fechamento visual de `TASK-AT-459` (ATUX-005) e futura evidência de drop (condicionada a TASK-AT-460)

## Objetivo único
Acrescentar ao harness Product UX um step contratual determinístico de seleção de arquivo (file input), com fixture sintética versionada e sem PII real, preservando o contrato fail-closed e a allowlist de steps do adapter vigente.

## Contexto e evidência referenciada
O runbook (`docs/operations/product-ux-runbook.md`) lista os steps aceitos pelo adapter: `goto`, `login-role`, `open-navigation`, `click-role`, `wait-role`, `press-role`, `fill-label`, `select-label`, `check-label` — nenhum step de seleção de arquivo. Consequência verificada pelo audit: estados de upload (loading/erro/recuperação, ATUX-005) são inacessíveis à evidência task-backed. O normalizador rejeita qualquer step fora da allowlist com `UNSAFE_STEP` e proíbe `evaluate`/script arbitrário (`visual-harness-lib.mjs`, `normalizeStep` ~linha 354 e ~linha 408); o executor aplica o switch em `capture.mjs` (~linhas 122–166).

## Alvos explícitos
1. `.agents/skills/olympus-product-ux/scripts/visual-harness-lib.mjs` — normalização/allowlist do novo step (validação estrita de alvo e fixture).
2. `.agents/skills/olympus-product-ux/scripts/capture.mjs` — execução do novo step (ex.: `set-file-label` via mecanismo nativo de `setInputFiles`; sem `evaluate`, sem script arbitrário).
3. `.agents/skills/olympus-product-ux/scripts/visual-harness.test.mjs` — testes de aceite e de rejeição fail-closed.
4. `tests/product-ux/fixtures/` — fixture sintética determinística + cenário exemplo.
5. `docs/operations/product-ux-runbook.md` — atualizar a lista de steps do adapter e as restrições correspondentes (único doc de operação tocado).
6. Scripts de validação do lane, somente se referenciarem tipos de step (`validate-evidence.mjs` / `validate-advisory-capture.mjs`).

## Requisitos contratuais (não negociáveis)
- Fixture sintética determinística: arquivo pequeno com bytes fixos, versionado no repo ou gerado de forma determinística; nenhum dado pessoal real, nenhuma credencial.
- O novo step entra na allowlist com validação estrita (alvo por label/aria do controle ou do input de arquivo; arquivo restrito às fixtures da allowlist); continuar rejeitando `evaluate`, script arbitrário, query/fragment em navegação, URL externa e role fora da allowlist.
- Invariantes preservados: primeiro step `goto`/`login-role`; último step `wait-role`; viewports 320–1920 x 568–1200; loopback 3334/5174; SQLite temporário + seed sintético; `expectedTerminalCondition` obrigatória.

## Escopo
1. Implementar o step na allowlist + executor + normalizador conforme os alvos explícitos.
2. Criar a fixture sintética e ao menos um cenário exemplo exercendo o upload do `MarkdownEditor` em um consumidor real (ex.: Wiki), com terminal condition observável do estado pós-upload.
3. Cobrir aceite e rejeições fail-closed nos testes do harness.
4. Atualizar o runbook (lista de steps + restrições).
5. Provar com aquisição task-backed real do cenário exemplo (pacote validado).

## Fora de escopo
- Implementar drag-and-drop no produto (decisão humana `TASK-AT-460`) ou qualquer código de produto (`.tsx`, CSS, API).
- Alterar portas, roles allowlistadas, política de dirty worktree ou retenção de evidência.
- Promover/consumir qualquer PNG advisory do audit.
- Garantir por antecipação o cenário de erro do upload: só é materializável se existir caminho determinístico de rejeição no runtime fake (candidato honesto: fixture com magic bytes/tamanho que o endpoint rejeite pelas regras vigentes de `TASK-AT-146`); verificar em execução e, se não existir, registrar como limitação sem inventar hook de produto.

## Dependências
- satisfeitas: harness ativo (`TASK-AT-444`), runbook vigente, roles/seed sintéticos, lane pipeline operacional.
- em aberto (não bloqueia este step, condiciona o cenário exemplo): composição com o patch de `TASK-AT-459` (em voo no lane de implementação) para capturar também o estado de erro real; se 459 ainda não estiver em `main`, o cenário de erro fica adiando-se, mas o step e o cenário de sucesso não dependem dele.

## Critérios de aceite
1. O novo step é aceito pelo normalizador quando conforme e rejeitado com `UNSAFE_STEP`/fail-closed quando fora do contrato (sem abrir exceção para script arbitrário).
2. Fixture sintética determinística, pequena, sem PII, versionada; nenhum arquivo arbitrário do host é aceito pelo step.
3. Cenário exemplo captura seleção de arquivo + upload real no `MarkdownEditor` com terminal condition observável, em worktree limpa, com pacote validado pelo CLI do lane.
4. Testes do harness cobrem o aceite e as rejeições; suíte existente do harness não regride.
5. Runbook atualizado e consistente com o implementado (mesma allowlist, mesmas restrições).
6. `git diff --check` limpo.

## Validação
- Testes do harness (`visual-harness.test.mjs`) + preflight/capture/validação do lane com o cenário exemplo.
- Verificação de que nenhuma allowlist existente foi afrouxada (diff auditável dos validadores).

## Riscos
- Aceitar arquivo arbitrário ou path do host romperia a sanitização — mitigado por allowlist de fixtures.
- `setInputFiles` em input invisível pode contornar o dialog nativo; o step prova o contrato de upload, não a affordance do dialog (limitação a registrar).
- Colisão de trabalho com o lane em voo: este task package toca apenas harness/fixture/runbook — nenhum arquivo do patch de 459/458.

## Limitações
- Evidência continua fake/loopback; o step não prova comportamento do dialog nativo do browser nem interação touch real.
- O estado de erro do upload (ATUX-005) só terá evidência visual após 459 estar em `main` e existir caminho determinístico de rejeição no runtime fake.

## Definição de pronto
- Cenários de upload são capturáveis de forma determinística pelo lane task-backed; registry do audit pode transitar `ATUX-012` para resolvido (com evidência), e o fechamento visual de `TASK-AT-459`/`ATUX-005` fica desbloqueado.

## Verificação independente final — 2026-09-03
- veredito: `approved-with-notes`. Verificação fresh e independente (Task Verifier sem participação na implementação), re-derivada de leitura estática dos scripts git-ignored, da suíte rastreada, dos diffs e dos gates re-executados nesta data. HEAD `eb0d22a1`; implementação não commitada (dirty worktree, smoke autorizado pelo Orchestrator). Verification ID: `VER-TASK-AT-464-20260903-001`; execution related: smoke advisory `UXREQ-FILE-STEP-SMOKE-20260903-002` (attempt `-001` = registro BLOCKED, descartável, sem valor de evidência).
- escopo confirmado: `git status --short` mostra como superfície rastreada exatamente os 4 arquivos reivindicados (2 modificados: runbook +17 linhas, `tests/product-ux/visual-harness.test.mjs` +85/−0; 2 novos: `tests/product-ux/fixtures/wiki-upload-scenario.json` e `tests/product-ux/fixtures/files/wiki-attachment.png`, 136 bytes). `tests/product-ux/evals`, `apps/`, `services/`, `packages/`: limpos. Não-rastreados extras (`.claude/` de 2026-08-06, doc TASK-AT-453 de 2026-09-02, HANDOFF de 2026-09-03 14:28) precedem os artefatos desta execução (19:59–20:29) e pertencem a outros lanes — não atribuídos a esta task. Scripts em `.agents/skills/olympus-product-ux/scripts/` confirmados git-ignored (`/.agents/`); verificados por leitura estática + suíte rastreada + contrato do runbook.
- AC1 atendido: `normalizeStep` aceita `set-file-label` com chaves exatamente `{type,label,fixture,exact}` (`assertAllowedKeys`), fixture restrita a `SAFE_FILE_FIXTURE_NAMES` (`UNSAFE_FILE_FIXTURE`), e o `default` segue `UNSAFE_STEP` proibindo evaluate/script arbitrário. Todos os branches de rejeição pré-existentes permanecem no mesmo switch, verificados no código: `UNSAFE_NAVIGATION` (goto sem query/fragment/traversal/URL externa/`//`), `UNSAFE_ROLE` (login-role e locator steps), `UNSAFE_KEY` (press-role), `SENSITIVE_INPUT` (fill/select-label).
- AC2 atendido: allowlist-only — `SAFE_FILE_FIXTURES` pinado (sha256 `ae52fe47be085f8c08c1975052313f677dbb182ca2a64abc347e7c825c806854`, 136 bytes; `sha256sum` local confere); `resolveFileFixture` aplica `assertNoSymlinkSegments` (`SYMLINK_REJECTED`), `MISSING_FILE_FIXTURE` e `FIXTURE_MISMATCH` (tamanho + sha256 a cada uso); executor aplica `chooser.setFiles({name,mimeType,buffer})` somente com os bytes pinados — nenhum path do host entra no fluxo. Testes provam rejeição de `secrets.zip`, `../../../../etc/passwd`, `/etc/passwd`, fixture desconhecida e campo extra `path` (`UNSUPPORTED_FIELD`).
- AC3 atendido com desvios autorizados (rulings (b) e (c) abaixo): cenário `wiki-image-upload-desktop` captura seleção de arquivo + upload real no `MarkdownEditor` (Wiki) com terminal condition observável `img wiki-attachment.png is visible`; smoke `-002` = `ADVISORY_CAPTURED` e validator = `valid-advisory-record` com request id casando. Letra do AC desviada em dois pontos documentados: worktree dirty (não limpa — inevitável com implementação não commitada; autorização registrada no próprio registro em `freshness.reasons`) e validação pelo CLI advisory (não pacote pipeline canonical). Substância do AC cumprida; primeira aquisição pipeline task-backed pós-commit fica como superfície natural de revalidação (observação iii abaixo), sem enfraquecimento de critério.
- AC4 atendido: suíte 24/24 (21→24; diff com zero deleções — expectativas pré-existentes intactas; 3 testes novos cobrem aceite, sanitização de report e rejeições fail-closed, incluindo `NON_DETERMINISTIC_START` e `MISSING_TERMINAL_CONDITION` com o step novo).
- AC5 atendido: runbook +17 linhas aditivas e consistentes com o implementado (lista de steps com `set-file-label`; parágrafo contratual do step alinhado ao código, incluindo a limitação do dialog nativo; linha de mapeamento de erro com `UNSAFE_FILE_FIXTURE`/`MISSING_FILE_FIXTURE`/`FIXTURE_MISMATCH`; nota de privacidade da fixture). Nenhum afrouxamento: restrições pré-existentes mantidas textualmente.
- AC6 atendido: `git diff --check` limpo.
- gates executados nesta verificação: `node --test tests/product-ux/visual-harness.test.mjs` = 24/24, exit 0; `validate-advisory-capture.mjs --record …-002 --request-id UXREQ-FILE-STEP-SMOKE-20260903-002` = `valid-advisory-record` (`ADVISORY_CAPTURED`, classification `fake`, 1 cenário/1 artefato, `reusable:false`/`promotable:false`), exit 0; leak scan do registro `-002`: nenhuma ocorrência de `buffer`, `base64`, `fixtures/files`, `/home/`, `REPO_ROOT`, `data:image`; `setupSteps` contém apenas `{type:"set-file-label", label:"Imagem", fixture:"wiki-attachment.png", exact:true}` (nome lógico, sem path/bytes).
- desvio (a) ACEITO: targeting por `getByRole("button")` no controle acessível + `page.waitForEvent("filechooser")` registrado antes do clique + `chooser.setFiles` em forma buffer. Dentro do intent da task: o alvo citava `setInputFiles` como exemplo ("ex.:") e as exigências nominais eram "sem evaluate, sem script arbitrário" — cumpridas; e é a única via real dado o input `aria-hidden`/sem nome de TASK-AT-458. Dentro do posture de segurança: alvo role-based com nome allowlistado, fixture pinada, chooser interceptado no protocolo do Playwright (não automação de dialog de SO); limitação honesta já registrada no runbook.
- desvio (b) ACEITO: colisão strict-mode confirmada por leitura de código — `openPrimaryNavigationItem`/`expandPrimaryNavigationGroup` usam `getByRole("button", { name })` com match substring case-insensitive (`tests/e2e/helpers.ts:87-96`); o item direto "Dashboard" renderiza `<small>{description}</small>` dentro do botão com descrição "Capacidade e qualidade do SAC" (`apps/web/src/main.tsx:516`, render 4546-4558), logo seu nome acessível contém "SAC" e colide com o grupo "SAC" (`main.tsx:538`) na sidebar desktop. `goto /wiki` é workaround legítimo para defeito pré-existente de nomenclatura; corrigi-lo é mudança de produto, fora de escopo. ROUTING obrigatório: a ambiguidade de nomes acessíveis da navegação primária (colisões substring e `unnamed-interactive` observados) deve ser taskificada como finding próprio — não pode desaparecer.
- desvio (c) ACEITO: smoke em dirty worktree com autorização explícita do Orchestrator; registro `-002` documenta em `freshness.reasons` ("Dirty workspace was explicitly authorized; commit SHA alone does not reproduce rendered source") com `freshness.status: same-request-only`. Sem afrouxamento de gate: `validateSourceRevision` falha `DIRTY_WORKTREE_NOT_AUTHORIZED` sem a flag `--allow-dirty-worktree`.
- desvio (d) ACEITO como fora de escopo, COM GATE DE NÃO-PERDA: finding ambiental reportado (tsx watch da API derruba o listener ~4s uma vez por boot; `stopOwnedProcess` mata apenas o PID filho direto — SIGTERM→SIGKILL, sem kill de grupo — enquanto `start-e2e.js` spawna netos sob tsx watch/vite, potencialmente órfãos) é plausível e consistente com o código (`visual-harness-lib.mjs:1328-1376`; `services/api/package.json` `dev: tsx watch`) e com o registro `-001` (`ADVISORY_ACQUISITION_BLOCKED`, setup error digest; `-002` passou no retry). Antes desta verificação NÃO havia registro durável; fica registrado aqui e deve ser taskificado (owner sugerido: Runtime Builder; alvos: `start-e2e.js`/`stopOwnedProcess` — kill de grupo de processo + tolerância de readiness ao drop de listener pós-boot). Não bloqueia esta task.
- ruling de evidência adiada: o smoke advisory é transiente por contrato (`usagePolicy` same-request-only/promotable false/gateClosureAllowed false; `retentionPolicy` transient-request, disposeOn `request-closed`). A superfície durável e reproduzível é: suíte rastreada (importa os scripts diretamente — pins de comportamento), fixture versionada com sha256 pinado no contrato, cenário versionado, runbook e validator re-executável. Descarte dos diretórios `-001` e `-002` após esta verificação é CORRETO pela política de retenção (runbook "Cleanup do advisory": verificação de containment via realpath, `git check-ignore -q`, `gio trash`).
- observações não bloqueantes: (i) espelho `.claude/skills/olympus-product-ux/scripts/` está defasado (2026-08-06, sem `set-file-label`) — drift pré-existente a esta task, fora dos alvos; sincronização do espelho deve entrar em task de manutenção; (ii) o alvo explícito 3 citava `.agents/.../visual-harness.test.mjs`, caminho que nunca existiu — a suíte rastreada `tests/product-ux/visual-harness.test.mjs` é a superfície correta (padrão TASK-AT-444); imprecisão do task package, não desvio de execução; (iii) o validator de pacote pipeline (`validateEvidencePack`) com cenário `set-file-label` end-to-end será exercitado na primeira aquisição pipeline pós-commit (re-aquisição de TASK-AT-459) — risco baixo, pois o validator advisory é estritamente mais rígido e já validou o step integralmente.
- limites desta verificação: PNGs do smoke não abertos (advisory por design; transiente); nenhuma captura nova executada (todos os gates passaram de primeira); determinismo do step provado por contrato de bytes pinados + suíte, não por estatística de repetição.

## Sugestão de commit semântico
- `feat(operations): adiciona file step contratual ao harness product ux`
