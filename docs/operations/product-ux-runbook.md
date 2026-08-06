# Product UX Operations Runbook

## Metadata

- status: active-procedure
- capability-status: consultar `docs/operations/product-ux-state.md`
- owner: olympus_product_ux
- harness-owner: olympus_runtime_builder
- last-updated: 2026-08-05
- source-of-truth: docs/operations/product-ux-runbook.md
- related-task: TASK-AT-448

## Finalidade

Operar aquisição e consumo de evidência Product UX de forma local, determinística, sanitizada e fail-closed. Este runbook ensina preflight, captura, validação, inspeção do PNG, handoff, troubleshooting e descarte; ele não ativa o especialista, não promove seu estado e não substitui `TASK-AT-449` ou o gate final de `TASK-AT-450`.

Fontes em ordem de precedência:

1. Task Package e handoff da execução;
2. `docs/adr/ADR-007-product-ux-specialist-local-first.md`;
3. `docs/specs/SPEC-AT-005-product-ux-specialist.md`;
4. `docs/pipeline/product-ux-protocol.md`;
5. contratos `olympus-product-ux/review@1.0.0` e `olympus-product-ux/visual-evidence@1.0.0`;
6. skill package e scripts vigentes;
7. este runbook;
8. `docs/operations/product-ux-state.md`.

O status `active-procedure` significa apenas que este é o procedimento operacional vigente. A capacidade permanece no estado declarado em `product-ux-state.md`.

## Boundaries invariáveis

- Product UX audita, especifica, adquire evidência e produz review consultivo.
- Runtime Builder implementa UI e mantém o harness.
- Quality Builder cria e executa gates independentes.
- Task Verifier emite aceite final.
- Product UX não edita UI, código, CSS, markup, tokens, assets ou baselines.
- Captura fake/local não prova production-like ou live.
- `CAPTURED`, manifesto `passed` ou validator `valid` provam aquisição íntegra; não provam que a UX passou.
- Código, JSX, CSS, DOM, build ou screenshot não inspecionado não fecham afirmação visual.
- Não existe sucesso visual degradado. Falha de browser, estado, privacidade, integridade ou inspeção mantém o gate visual aberto.

## Condição terminal da execução

Uma execução Product UX só termina quando todos os itens aplicáveis estiverem registrados:

1. modo, artefato primário, `request_id` e matriz de alvo foram confirmados; task, Execution ID e Evidence ID são obrigatórios somente no pipeline;
2. o resultado público foi determinado e traduzido sem perder causa ou limitações;
3. todo pacote `CAPTURED` ou record `ADVISORY_CAPTURED` foi validado pelo CLI do lane vigente;
4. cada PNG usado em afirmação visual foi realmente aberto por uma ferramenta de imagem e recebeu registro de inspeção fora do record/manifesto imutável;
5. claims visuais, estruturais e `manual-needed` ficaram separados;
6. o próximo owner recebeu handoff suficiente;
7. processos e workspace E2E pertencentes à execução foram encerrados;
8. retenção, descarte ou expiração dos artefatos foi executada ou atribuída a owner e data explícitos.

Em bloqueio, a condição terminal é um envelope fail-closed com `failed_gate`, fatos seguros, menor input necessário, claims inseguros, `resume_from` e próximo owner. Não é necessário “forçar” captura para encerrar corretamente.

## 1. Confirmar roteamento e estado

Antes de iniciar:

1. leia `docs/operations/product-ux-state.md`;
2. confirme exatamente um modo de capacidade: `audit`, `interaction-spec` ou `advisory-review`;
3. confirme exatamente um artefato primário;
4. escolha exatamente um lane de aquisição:
   - advisory audit: `UxReviewRequest.request_id`, `ux-audit` primário e evidência apenas de apoio;
   - pipeline: para aquisição dedicada, `capability_mode: audit`, `operation: evidence-acquisition`, `primary_artifact: visual-evidence-package` e `VisualEvidenceRequest 1.0` task-backed;
5. quando houver task, confirme que ela não agrega especificação, implementação e aceite;
6. confirme `allowed_environment`, origem dos dados, retenção e destino independente de validação.

No lane advisory, não invente task, Execution ID ou Evidence ID. O lane gera apenas um record operacional transitório, sem manifesto canônico. No lane de pipeline, os três identificadores são obrigatórios e reais; um record advisory nunca os substitui.

Nos estados `draft`, `evaluation-ready` ou `pilot-ready`, só execute o recorte autorizado pela task correspondente. `degraded` nunca permite fail-open. `disabled` proíbe aquisição e parecer de pipeline. Uso regular exige `active`, promovido somente pelo gate competente.

## 2. Preparar a matriz de alvo

Para cada cenário, registre antes do browser:

| Campo | Regra operacional |
| --- | --- |
| `surface` | nome funcional percebido pelo usuário; URL sozinha não identifica a tela |
| `role` | `ADMIN`, `GESTOR`, `SAC`, `FINANCEIRO`, `VENDEDOR`, `SUPERVISOR` ou `ANONYMOUS` sem login |
| `state` | estado funcional reproduzido; não confundir `forbidden` com ação `disabled` |
| `setup_steps` | preparação determinística com seed sintético e sem credenciais no cenário |
| `navigation_steps` | sequência semântica e reproduzível até o alvo |
| `viewport` | largura, altura, orientação e escala; adapter atual usa device scale factor 1 |
| terminal condition | condição observável que distingue o alvo de login, erro ou estado intermediário |

O documento de cenário usa `schemaVersion: 1.0.0`, fica dentro do repositório e contém de 1 a 30 cenários. O adapter atual aceita:

- presets `login-desktop`, `login-mobile`, `admin-caseflow-connectors` e `sac-service-flows-mobile`;
- steps `goto`, `login-role`, `open-navigation`, `click-role`, `wait-role`, `press-role`, `fill-label`, `select-label` e `check-label`;
- viewports entre 320 e 1920 px de largura e 568 e 1200 px de altura;
- `fixedTime` ISO-8601 terminado em `Z`;
- seletores de overflow e pares de regiões críticas dentro da allowlist.

O primeiro step deve ser `goto` ou `login-role`; o último deve ser `wait-role`. `expectedTerminalCondition` deve descrever esse estado final. O harness não aceita `evaluate`, script arbitrário, query/fragment em navegação, URL externa, credential-bearing input ou role fora da allowlist.

O runtime de captura cria SQLite temporário, aplica o schema, executa seed sintético e sobe API/Web somente em loopback nas portas 3334/5174. A role `GESTOR` é criada de forma controlada no runtime isolado. Nunca copie e-mail ou senha de seed para cenário, evidência ou runbook.

## 3. Verificar revisão e worktree

Execute da raiz do repositório:

```bash
product_ux_expected_commit="$(git rev-parse HEAD)"
git status --short
```

Política padrão:

- worktree limpa: não use `--allow-dirty-worktree`; o pipeline registra `fresh` e o advisory continua `same-request-only`;
- worktree dirty: só continue com autorização explícita no handoff e use `--allow-dirty-worktree`;
- no pipeline, evidência dirty gerada pelo adapter atual é `same-execution-only`; o SHA do commit não reproduz seu conteúdo e ela não pode ser reutilizada por outra execução;
- no advisory, toda captura é `same-request-only`, mesmo com worktree limpa; clean/dirty continua registrado para honestidade de reprodução, mas nunca concede reuse ou promoção;
- `--reuse` não transforma evidência dirty em fresh e não é autorização de promoção;
- mudança de revisão, fixture, estado, referência, checksum ou política de idade exige nova aquisição: novo Evidence ID no pipeline ou novo output ancorado ao request advisory aplicável.

Para um gate que exija reprodução entre execuções, capture de worktree limpa. Não use pacote dirty para readiness, baseline, cross-execution review ou fechamento de ambiente superior.

## 4. Rodar preflight

Defina o cenário e escolha um único anchor sem informação pessoal.

### Advisory taskless

```bash
product_ux_scenario="tests/product-ux/fixtures/login-scenario.json"
product_ux_request_id="UXREQ-LOGIN-AUDIT-001"
```

Execute:

```bash
node .agents/skills/olympus-product-ux/scripts/preflight.mjs \
  --scenario "$product_ux_scenario" \
  --request-id "$product_ux_request_id" \
  --classification fake
```

### Pipeline task-backed

```bash
product_ux_scenario="tests/product-ux/fixtures/login-scenario.json"
product_ux_task_id="TASK-AT-448"
product_ux_execution_id="EXEC-AT-448-001"
product_ux_evidence_id="PRODUCT-UX-AT448-001"
```

Execute:

```bash
node .agents/skills/olympus-product-ux/scripts/preflight.mjs \
  --scenario "$product_ux_scenario" \
  --evidence-id "$product_ux_evidence_id" \
  --classification fake
```

O preflight deve retornar `status: ready` e registrar:

- harness, Node, Playwright e Chromium;
- classificação `fake` ou `local`;
- Git SHA e flag dirty;
- isolamento loopback + SQLite temporário + seed sintético;
- cenário, superfície, estado, role, viewport, fixed time e terminal condition.

O preflight também exige Node 22+, arquivos runtime, output ignorado pelo Git, browser inicializável e portas 3334/5174 livres. `--request-id` e `--evidence-id` são anchors mutuamente exclusivos; misturá-los retorna `AMBIGUOUS_PREFLIGHT_ANCHOR`. `--output-dir` é opcional, exige um anchor e deve permanecer sob o root desse lane. `production-like`, `live`, base URL externa ou output fora do root correspondente falham fechados.

## 5. Resolver dependências do browser

Se o preflight retornar `BROWSER_UNAVAILABLE`, preserve apenas a mensagem sanitizada. `libnspr4.so` ausente é blocker ambiental, não regressão do produto.

Primeiro verifique o cache user-space oficial:

```bash
node .agents/skills/olympus-product-ux/scripts/bootstrap-browser-runtime.mjs \
  --verify-only
```

Se ele ainda não existir, inicialize-o:

```bash
node .agents/skills/olympus-product-ux/scripts/bootstrap-browser-runtime.mjs
```

O bootstrap vigente:

- suporta somente Linux x64/amd64 Debian-compatible;
- usa `apt-get download` para `libnspr4` e `libnss3` sem `sudo` e sem instalar pacote no host;
- cria temporário com `mkdtemp` dentro do root ignorado e sob ownership do script, sem path `/tmp` hardcoded;
- valida arquitetura, metadata, `libnspr4.so`, `libnss3.so` e abertura real do Chromium;
- publica o cache atomicamente em `test-results/product-ux/.browser-runtime/debian-amd64`;
- faz cleanup apenas do temporário que criou quando falha.

Depois, rode novamente `--verify-only` e o preflight. O harness descobre o cache automaticamente; não é necessário definir `LD_LIBRARY_PATH` manualmente.

Para diagnóstico do host, sem mutação:

```bash
npx playwright install-deps chromium --dry-run
```

Em host autorizado a instalar pacotes do sistema, a alternativa administrada é:

```bash
npx playwright install --with-deps chromium
```

Em plataforma não suportada pelo bootstrap, use CI/container ou instalação administrada. Se um runtime customizado já autorizado for necessário, `PRODUCT_UX_BROWSER_LIB_PATH` deve apontar para diretório absoluto, existente e não-symlink; não copie path temporário de outro host e não aumente `LD_LIBRARY_PATH` por tentativa.

O cache é dependência local ignorada, não evidência de produto. Quando Runtime Builder determinar que ele está inválido/obsoleto, descarte somente o root exato após verificar path e ignore rule, depois execute bootstrap novamente:

```bash
product_ux_browser_cache="test-results/product-ux/.browser-runtime/debian-amd64"
product_ux_cache_root="$(realpath test-results/product-ux/.browser-runtime)"
test "$(realpath "$product_ux_browser_cache")" = "$product_ux_cache_root/debian-amd64"
git check-ignore -q "$product_ux_browser_cache"
gio trash "$product_ux_browser_cache"
```

Se `gio` não existir, não improvise remoção recursiva ampla: registre o path exato e use o mecanismo recuperável do host.

## 6. Capturar no lane correto

### Advisory taskless

#### Worktree limpa

```bash
test -z "$(git status --porcelain)"
node .agents/skills/olympus-product-ux/scripts/capture.mjs \
  --scenario "$product_ux_scenario" \
  --request-id "$product_ux_request_id" \
  --expected-commit "$product_ux_expected_commit" \
  --classification fake
```

#### Worktree dirty explicitamente autorizada

```bash
node .agents/skills/olympus-product-ux/scripts/capture.mjs \
  --scenario "$product_ux_scenario" \
  --request-id "$product_ux_request_id" \
  --expected-commit "$product_ux_expected_commit" \
  --classification fake \
  --allow-dirty-worktree
```

O output advisory é exatamente `test-results/product-ux/advisory/<request-id>/`, com `advisory-capture-record.json` e `screenshots/`. Não contém `manifest.json`, taskId, executionId ou evidenceId. O resultado `ADVISORY_CAPTURED` indica aquisição válida somente para o request ativo; não é status público Product UX, pacote promovível, reuse ou aceite.

### Pipeline task-backed

#### Worktree limpa

```bash
test -z "$(git status --porcelain)"
node .agents/skills/olympus-product-ux/scripts/capture.mjs \
  --scenario "$product_ux_scenario" \
  --task-id "$product_ux_task_id" \
  --execution-id "$product_ux_execution_id" \
  --evidence-id "$product_ux_evidence_id" \
  --expected-commit "$product_ux_expected_commit" \
  --classification fake
```

#### Worktree dirty explicitamente autorizada

```bash
node .agents/skills/olympus-product-ux/scripts/capture.mjs \
  --scenario "$product_ux_scenario" \
  --task-id "$product_ux_task_id" \
  --execution-id "$product_ux_execution_id" \
  --evidence-id "$product_ux_evidence_id" \
  --expected-commit "$product_ux_expected_commit" \
  --classification fake \
  --allow-dirty-worktree
```

O output de pipeline é `test-results/product-ux/<evidence-id>/`. O destino deve estar ignorado, ser descendente desse root e estar vazio/ausente; o harness nunca sobrescreve pacote existente. Um Evidence ID novo representa uma nova aquisição. É proibido copiar ou adaptar um diretório advisory para esse destino.

`capture.mjs` aceita exatamente um anchor: `--request-id` advisory ou o trio completo `--task-id`, `--execution-id` e `--evidence-id` de pipeline. Mistura retorna `AMBIGUOUS_CAPTURE_ANCHOR`; trio incompleto retorna `INCOMPLETE_PIPELINE_ANCHOR`. `--output-dir`, quando usado, deve ser descendente ignorado do root do lane selecionado.

O harness:

1. repete o preflight;
2. inicia runtime E2E isolado;
3. executa steps semânticos e terminal condition;
4. estabiliza animação, caret, fonte, tema e reduced motion;
5. mascara valores sensíveis detectáveis antes da screenshot;
6. coleta geometria, digest ARIA e sinais runtime sem persistir texto bruto;
7. grava PNG e o record/report aplicável, com mode `0600` para JSON; somente o lane de pipeline grava manifesto;
8. valida o output pelo contrato do lane;
9. encerra apenas o processo que iniciou e remove `.tmp/e2e` no `finally`.

Rede externa é bloqueada. Baselines não são criados, atualizados ou autoaceitos.

## 7. Validar integridade, anchor e freshness

### Advisory taskless

```bash
product_ux_advisory_record="test-results/product-ux/advisory/$product_ux_request_id/advisory-capture-record.json"
node .agents/skills/olympus-product-ux/scripts/validate-advisory-capture.mjs \
  --record "$product_ux_advisory_record" \
  --request-id "$product_ux_request_id"
```

Resultado consumível somente pelo request atual:

- validator `status: valid-advisory-record`;
- `resultCode: ADVISORY_CAPTURED`;
- `requestId` igual ao `UxReviewRequest.request_id` ativo;
- `reusable: false` e `promotable: false`;
- `usagePolicy.scope: same-request-only`, sem manifesto/gate closure;
- screenshots e cenários íntegros, sanitizados e ancorados ao alvo;
- `freshness.status: same-request-only`, mesmo em worktree limpa.

Não existe reuse advisory. Passar `--reuse` ao validator retorna `ADVISORY_REUSE_FORBIDDEN`. Encerrar ou trocar o request invalida o consumo; uma task posterior readquire pelo lane de pipeline.

### Pipeline task-backed

Após captura:

```bash
product_ux_manifest="test-results/product-ux/$product_ux_evidence_id/manifest.json"
node .agents/skills/olympus-product-ux/scripts/validate-evidence.mjs \
  --manifest "$product_ux_manifest"
```

Para consumir um pacote previamente aceito, declare o contexto de reuse:

```bash
node .agents/skills/olympus-product-ux/scripts/validate-evidence.mjs \
  --manifest "$product_ux_manifest" \
  --reuse
```

`--reuse` apenas permite que incompatibilidades detectadas de checksum/revisão/fixture/referência sejam classificadas como `STALE_EVIDENCE`. Antes dele, o consumidor ainda deve rejeitar pacote `dirty: true`/`same-execution-only` vindo de outra execução e conferir que revisão, fixture, target state, referência e idade continuam sendo as pedidas.

Resultado consumível da aquisição atual:

- validator `status: valid`;
- `resultCode: CAPTURED`;
- manifest/report IDs e hashes coerentes;
- todo cenário requerido com `acquisitionStatus: captured`;
- `redaction.status: applied`;
- nenhum `gateClosure` fake/local;
- `commit.dirty` compatível com a política da execução;
- report `freshness.status` igual a `fresh` ou `same-execution-only` conforme o caso.

`assessmentFindings > 0` não invalida a aquisição: pode ser exatamente a evidência do defeito. Também não aprova o produto.

## 8. Inspecionar o PNG obrigatoriamente

Validação de hash e assinatura PNG não significa inspeção visual. Antes de afirmar aparência, reflow, overflow, colisão, foco visível, target size ou regressão:

1. valide o record/pacote pelo CLI do lane;
2. resolva o caminho a partir do record ou manifesto/report, nunca de input não validado;
3. confirme que o arquivo fica dentro do pacote e não atravessa symlink;
4. abra cada PNG relevante com a ferramenta de imagem da engine;
5. no Codex, use `view_image` com caminho absoluto e detalhe `high` ou `original`;
6. confirme superfície, estado terminal, viewport, máscara/redaction e escopo visual realmente observado;
7. registre um `InspectionRecord` no artefato consumidor, sem alterar record advisory, manifesto ou capture report imutáveis; no advisory, o consumidor é o `ux-audit` do mesmo `request_id`.

Registro mínimo:

```text
inspection_id: <id>
capture_id: <scenario id>
artifact_path: <relative path>
artifact_sha256: <hash registrado no record/manifesto>
inspected_at: <UTC timestamp>
inspector: olympus_product_ux
method: actual-png-visual-inspection
scope: <itens efetivamente observados>
finding_refs: <ids ou []>
limitations: <DOM/ARIA/keyboard/manual-needed não provados pela imagem>
```

Abrir arquivo pelo shell, verificar dimensão ou confiar na miniatura não substitui a inspeção. Se a engine não tiver ferramenta de imagem ou o PNG não abrir de forma inteligível, retorne top-level `BLOCKED` com `code: UX_EVIDENCE_REQUIRED` e `cause.status: VISUAL_ACQUISITION_BLOCKED`; não emita parecer visual.

Se a imagem revelar PII, credencial ou conteúdo proibido apesar das máscaras, interrompa o consumo, não copie o artefato e retorne top-level `BLOCKED` com `code: UX_EVIDENCE_REQUIRED`, `failed_gate: privacy` e `cause.status: SENSITIVE_ARTIFACT_REJECTED`.

## 9. Entender códigos low-level e públicos

| Camada | Valor | Significado operacional |
| --- | --- | --- |
| preflight | `ready` | dependências, portas, browser e cenário estão prontos; ainda não há captura |
| cenário | `acquisitionStatus: captured` | terminal condition e screenshot foram adquiridos |
| cenário | `acquisitionStatus: failed` | setup, navegação, rede ou screenshot não completaram |
| assessment | `clear` / `findings` | sinais observados; não alteram a completude da aquisição |
| manifesto | `passed` / `failed` | execução de aquisição, nunca aceite da task |
| validator | `valid` | integridade e contrato interno do pacote passaram |
| contrato público | `CAPTURED` | pacote pronto para inspeção/consumo, não produto aprovado |
| advisory record | `ADVISORY_CAPTURED` | captura válida apenas para o request ativo; não é `VisualEvidenceResult`, pacote ou aceite |
| advisory validator | `valid-advisory-record` | record íntegro, `reusable: false`, `promotable: false`; ainda exige inspeção do PNG |

Mapeamento de erro:

| Condição low-level | Resultado visual especializado | Boundary pública Product UX | Próxima ação |
| --- | --- | --- | --- |
| `BROWSER_UNAVAILABLE`, `BROWSER_RUNTIME_CACHE_*`, `BROWSER_RUNTIME_BOOTSTRAP_FAILED`, `UNSUPPORTED_BROWSER_RUNTIME_PLATFORM`, `PORT_IN_USE`, `E2E_START_FAILED`, `E2E_START_TIMEOUT` | `VISUAL_ACQUISITION_BLOCKED` | `BLOCKED` / `UX_REPRODUCTION_BLOCKED` | Runtime Builder via Orchestrator; corrigir ambiente e repetir bootstrap/preflight |
| `GESTOR_SETUP_FAILED`, `ROLE_UNAVAILABLE`, terminal state/fixture ausente | `VISUAL_ACQUISITION_BLOCKED` | `BLOCKED` / `UX_REPRODUCTION_BLOCKED` | owner do setup/role via Orchestrator; criar estado sintético determinístico |
| `INVALID_*`, `UNSAFE_BASE_URL`, `UNSAFE_CLASSIFICATION`, `UNSAFE_PATH`, `UNSAFE_STEP`, path/symlink, output existente, worktree dirty não autorizada, artifact ausente ou checksum inicial inválido | `VISUAL_ACQUISITION_BLOCKED` | `BLOCKED` / `UX_EVIDENCE_REQUIRED` | corrigir request/scenario/pacote; não abrir artefato inseguro |
| `SENSITIVE_INPUT`, `SENSITIVE_EVIDENCE`, `UNSAFE_ARTIFACT`, `UNSAFE_REDACTION` | `SENSITIVE_ARTIFACT_REJECTED` | `BLOCKED` / `UX_EVIDENCE_REQUIRED` | privacy/evidence owner; descartar com segurança e readquirir |
| checksum/revisão/fixture/referência divergente durante reuse | `STALE_EVIDENCE` | `BLOCKED` / `UX_EVIDENCE_REQUIRED` | Product UX; rejeitar claim atual e readquirir com novo Evidence ID |
| target visual/brand authority ausente | `REFERENCE_REQUIRED` | `HUMAN_INPUT_REQUIRED` / `UX_INTENT_REQUIRED` | pedir uma decisão/referência mínima |
| advisory `ADVISORY_ACQUISITION_BLOCKED` | `VISUAL_ACQUISITION_BLOCKED` | `BLOCKED` / `UX_REPRODUCTION_BLOCKED` ou `UX_EVIDENCE_REQUIRED` conforme o gate | corrigir o blocker no mesmo request; não converter em parecer por código |

### Tradução obrigatória da referência humana

`REFERENCE_REQUIRED` é status especializado de `VisualEvidenceResult`; não pode escapar como status top-level do Product UX. Tradução exata:

```text
VisualEvidenceResult.status: REFERENCE_REQUIRED
  -> UxContractError.status: HUMAN_INPUT_REQUIRED
  -> UxContractError.code: UX_INTENT_REQUIRED
  -> failed_gate: intent
  -> cause.contract: olympus-product-ux/visual-evidence@1.0.0
  -> cause.status: REFERENCE_REQUIRED
```

Preserve `known_facts`, `missing_input`, `unsafe_claims`, `resume_from` e `next_owner`. Captura do estado atual pode continuar apenas como evidência `observed-current` separada; nunca vira autoridade do target por conveniência.

## 10. Matriz de ação, owner e retry

| Boundary pública e cause visual | Owner imediato | Pode continuar | Critério de retry/fechamento |
| --- | --- | --- | --- |
| `CAPTURED`, não inspecionado | Product UX | somente análise não visual | todos os PNGs relevantes abertos e InspectionRecord registrado |
| `CAPTURED`, inspecionado | consumidor do artefato UX | findings/spec/review dentro do escopo | handoff material, limitações e manual-needed registrados |
| `ADVISORY_CAPTURED`, não inspecionado | Product UX no request ativo | somente análise não visual | PNGs relevantes abertos e InspectionRecord registrado no ux-audit |
| advisory fechado ou request divergente | owner do request | nenhum claim visual novo | descartar o diretório; readquirir sob novo request ou pipeline real |
| `HUMAN_INPUT_REQUIRED` | autoridade humana/produto | fatos objetivos em escopo separado | referência/decisão mínima recebida e classificada como target |
| `BLOCKED/UX_REPRODUCTION_BLOCKED`, cause `VISUAL_ACQUISITION_BLOCKED` runtime/browser | Runtime Builder via Orchestrator | análise estrutural rotulada | preflight `ready` e alvo terminal reproduzível |
| `BLOCKED/UX_REPRODUCTION_BLOCKED`, cause `VISUAL_ACQUISITION_BLOCKED` role/state | owner da fixture/superfície via Orchestrator | análise documental rotulada | seed/role/state sintético reproduzível sem segredo |
| `BLOCKED/UX_EVIDENCE_REQUIRED`, cause `SENSITIVE_ARTIFACT_REJECTED` | evidence/privacy owner via Orchestrator | apenas digest sanitizado | descarte confirmado e nova aquisição segura |
| `BLOCKED/UX_EVIDENCE_REQUIRED`, cause `STALE_EVIDENCE` | Product UX | nenhum claim de estado atual | nova aquisição na revisão/fixture/referência pedida |
| review consultivo | Quality Builder/Task Verifier | status `aligned`, `deviation`, `regression`, `not-reproduced`, `manual-needed` | Task Verifier decide aceite de forma independente |

## 11. Troubleshooting

### Portas 3334 ou 5174 ocupadas

O harness recusa reutilizar ou matar processo existente. Inspecione sem mutação:

```bash
ss -ltnp '( sport = :3334 or sport = :5174 )'
```

Se não houver prova de ownership pela execução atual, não encerre o processo. Altere o contexto operacional ou peça ao owner. Se a execução atual iniciou o processo, feche-a pelo próprio controle do harness e repita o preflight.

### Runtime não sobe ou expira

- confirme Node 22+;
- confirme `scripts/start-e2e.js`, Prisma, seed e workspaces disponíveis;
- não persista stdout/stderr bruto: o harness guarda somente digest e contagem sanitizados;
- encaminhe `E2E_START_FAILED`/`E2E_START_TIMEOUT`, diagnostic digest e passo de retomada ao Runtime Builder.

### Role, navegação ou terminal condition falham

- confira role allowlisted e seed sintético;
- confira ordem dos steps e o último `wait-role`;
- confira nome acessível e `exact` do controle terminal;
- não substitua espera semântica por timeout, seletor arbitrário ou `evaluate`;
- se o estado não puder ser montado com o adapter atual, bloqueie e peça fixture/step contratual ao owner correto.

### Output já existe

O harness não sobrescreve evidência. Se a execução/request anterior ainda está aberto, mantenha o output. Se fechou, aplique a política de retenção. No pipeline use Evidence ID novo; no advisory use o anchor do request ativo e nunca reutilize o record anterior.

### Record/pacote inválido, PNG incorreto ou checksum divergente

- na montagem inicial: top-level `BLOCKED/UX_EVIDENCE_REQUIRED`, cause `VISUAL_ACQUISITION_BLOCKED`;
- no reuse de pacote previamente válido: top-level `BLOCKED/UX_EVIDENCE_REQUIRED`, cause `STALE_EVIDENCE` quando o validator detectar incompatibilidade de freshness/integridade;
- nunca edite hash, report ou manifesto para “consertar” pacote;
- nunca edite o record advisory para adicionar inspeção ou “consertar” aquisição;
- reacquisição cria novo Evidence ID no pipeline ou novo output no request advisory aplicável.

### Assessment encontra defeito

`geometry/accessibility/runtime: failed` com `acquisitionStatus: captured` pode ser evidência válida do problema. Product UX inspeciona, separa severidade de confiança e produz finding; não muda o resultado de aquisição nem aprova a task.

## 12. Privacidade e retenção

Nunca persistir:

- cookie, senha, sessão, token, API key ou header de autorização;
- storage state ou perfil de browser;
- e-mail, telefone, documento, cliente/pedido ou outro PII real;
- HTML, payload de rede, console ou snapshot ARIA/DOM brutos;
- screenshot live/production-like sem autorização, redaction e retenção prévias.

O adapter atual aceita apenas `fake` e `local`, bloqueia rede externa, mascara valores sensíveis detectáveis, persiste apenas digests/contagens e exige `redaction: applied`. A inspeção humana/visual continua necessária porque detecção automática não prova ausência de todo dado sensível.

Retenção padrão:

| Tipo | Política |
| --- | --- |
| fake/local pipeline transitório | owner = Execution ID; descartar no fechamento/aborto |
| dirty de pipeline | same-execution-only; descartar ao fechar; nunca reutilizar |
| advisory fake/local | owner = request_id; sempre same-request-only; descartar em request-closed; nunca reutilizar/promover |
| baseline/referência versionada | somente task explícita e review independente; Product UX não altera |
| production-like/live | bloqueado até owner, finalidade, expiração exata, redaction e evidência de descarte |
| user-provided target | referência/link por padrão; copiar somente com autorização e sensitivity review |

### Cleanup do advisory

Depois de fechar o request e somente quando a retenção mandar descartar:

```bash
product_ux_advisory_output="test-results/product-ux/advisory/$product_ux_request_id"
product_ux_advisory_root="$(realpath test-results/product-ux/advisory)"
test "$(realpath "$product_ux_advisory_output")" = "$product_ux_advisory_root/$product_ux_request_id"
git check-ignore -q "$product_ux_advisory_output"
gio trash "$product_ux_advisory_output"
```

### Cleanup do pacote de pipeline

Depois de fechar handoff e somente quando a retenção mandar descartar:

```bash
product_ux_output="test-results/product-ux/$product_ux_evidence_id"
product_ux_output_root="$(realpath test-results/product-ux)"
test "$(realpath "$product_ux_output")" = "$product_ux_output_root/$product_ux_evidence_id"
git check-ignore -q "$product_ux_output"
gio trash "$product_ux_output"
```

Isso move o pacote exato para a lixeira. Se `gio` não existir, registre cleanup pendente e use o mecanismo recuperável do host; não use glob, diretório raiz, variável vazia ou remoção recursiva ampla.

O harness remove `.tmp/e2e` e encerra o processo que iniciou. Em crash abrupto, confirme que 3334/5174 estão livres antes de qualquer cleanup. Não apague `.tmp/e2e` enquanto houver runtime ativo.

## 13. Dry-run transitório observado

`PRODUCT-UX-PILOT-ROOT-LOGIN-001` é evidência real de exercício local, não de readiness:

| Campo | Valor observado |
| --- | --- |
| task | `TASK-AT-449` |
| revisão | `8d9992f7ce36ea55da761d2308be9e1e1ababb7e` |
| worktree | dirty |
| ambiente | fake, loopback, SQLite temporário, seed sintético |
| browser | Chromium 149.0.7827.55 via Playwright 1.61.0 |
| alvo | Login Web, `ANONYMOUS`, estado default, 1024x768 |
| terminal condition | heading `Entrar` visível |
| aquisição histórica | cenário `captured`, assessment `clear`, manifesto `passed` |
| screenshot | 1024x768, dois elementos mascarados, hash registrado |

O PNG real foi aberto com ferramenta de imagem. A inspeção confirmou somente que a captura era legível, correspondia à superfície de login, mostrava a ação `Entrar com senha` e preservava máscaras nos campos. Ela não provou teclado, leitor de tela, zoom, produção, target estético nem aceite.

Limitações obrigatórias deste exemplo:

1. `dirty: true` restringe uso à execução que o produziu;
2. o pacote foi gerado antes da forma corrente do report e não contém `executionId`/freshness/retention exigidos pelo validator atual;
3. a revalidação corrente retorna o resultado visual especializado `VISUAL_ACQUISITION_BLOCKED` com `reasonCode: INVALID_REPORT`, que na boundary pública seria `BLOCKED/UX_EVIDENCE_REQUIRED`;
4. portanto ele não pode ser reutilizado, promovido a piloto aprovado ou usado para mudar o estado do especialista;
5. nova evidência deve usar a CLI atual, novo Evidence ID e, para uso entre execuções, worktree limpa.

O exemplo permanece transitório e sob a retenção do owner original. Não o copie para docs, baseline ou artefato versionado.

## 14. Handoff e fechamento

### Para Runtime Builder

Enviar reason code, gate, scenario/step, ambiente, versões, digest sanitizado e comando exato de retomada. Não enviar segredo ou log bruto.

### Para autoridade humana

Enviar somente a menor referência/decisão, alternativas legítimas e impacto. Traduzir `REFERENCE_REQUIRED` para `HUMAN_INPUT_REQUIRED`.

### Para Quality Builder

Enviar acceptance hooks, matriz reproduzida, pacote validado, InspectionRecords, assessment signals e itens `manual-needed`. Product UX não cria nem aprova o gate.

### Para Task Verifier

Enviar task/execution IDs, artefato UX, evidências/classes, limitações, status consultivo por critério e `self_review`. Nunca emitir `approved`, `approved-with-notes`, `rejected` ou decisão final equivalente.

### Para fechamento advisory

Entregar o `ux-audit` no próprio request, com record validado, InspectionRecords, findings e limitações. Não enviar o record como pacote canônico ao Task Verifier. Se o diagnóstico demandar trabalho, encaminhar os findings ao Taskyfier/Orchestrator; qualquer task criada readquire evidência no lane de pipeline.

### Checklist de encerramento

- [ ] Um resultado público e seu owner foram registrados.
- [ ] Todo claim visual tem PNG inspecionado ou está bloqueado.
- [ ] Evidência dirty/stale não foi reutilizada.
- [ ] Advisory permaneceu no mesmo request, sem task/execution/evidence IDs, manifesto, reuse, promoção ou gate closure.
- [ ] Nenhum segredo, PII, raw HTML/payload/ARIA ou baseline indevido foi persistido.
- [ ] Handoff preserva fatos, limitações, claims inseguros e `resume_from`.
- [ ] Runtime owned foi encerrado e portas verificadas quando necessário.
- [ ] Retenção foi cumprida ou atribuída com prazo.
- [ ] Nenhuma promoção de lifecycle foi inferida de `CAPTURED`, `valid` ou deste runbook.
