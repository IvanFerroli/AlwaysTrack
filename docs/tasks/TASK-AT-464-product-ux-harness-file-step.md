# TASK-AT-464 - File step contratual no harness Product UX

## Metadata
- status: ready-to-execute
- pipeline: READY_TO_EXECUTE
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

## Sugestão de commit semântico
- `feat(operations): adiciona file step contratual ao harness product ux`
