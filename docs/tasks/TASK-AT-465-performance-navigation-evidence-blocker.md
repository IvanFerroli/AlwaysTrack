# TASK-AT-465 - Diagnóstico do blocker de aquisição da superfície Performance

## Metadata
- status: ready-to-execute
- pipeline: READY_TO_EXECUTE
- classified-by: olympus-taskyfier run #2 (2026-09-03) — reconciliação do audit repo-wide `docs/testing/product-ux-repo-wide-audit-2026-09-03.md`, finding `ATUX-017` (ATUX-R2/HIST-005; Grupo D, investigação de evidência; seção O.4: "handoff para Runtime Builder, não task de produto"). Doc novo mínimo justificado: nenhum doc existente cobria o item (verificado em `docs/tasks/` e `tests/product-ux/fixtures/` — nenhum cenário de Performance)
- owner: Runtime Builder (harness)
- verifier: Task Verifier fresh
- last-updated: 2026-09-03
- source-of-truth: docs/tasks/TASK-AT-465-performance-navigation-evidence-blocker.md
- mode: evidence-infrastructure / investigation
- priority: P2
- severity: medium
- confidence: medium
- estimated-effort: 2-4h
- execution-order: 7 — investigação; pode anteceder 463 se a aquisição de Performance for priorizada

## Objetivo único
Diagnosticar e corrigir no local correto a causa do blocker recorrente de aquisição da superfície Performance (GESTOR/ADMIN desktop) — login OK, falha no passo de navegação/terminal condition — para tornar a captura task-backed dessa superfície reproduzível.

## Contexto e evidência referenciada
Três audits consecutivos registraram `setup-incomplete`/falha para Performance desktop. O diagnóstico novo do audit (seção L/ATUX-017): o PNG `COORD-INSP-012` (advisory, `21477834…`) mostra o Dashboard GESTOR 1440 renderizado — login e setup OK; a falha está no `open-navigation`/terminal condition, não na sessão. Contraprova de viabilidade: `COORD-INSP-011` capturou Performance SAC mobile com sucesso (`sac-performance-mobile`), provando que a superfície é capturável em ao menos um recorte. `tests/product-ux/fixtures/pilot-scenarios.json` não contém cenário de Performance; os cenários do audit eram advisory temporários (registro `-001`; o diretório `-002` é órfão, descarte pendente de decisão do owner — fora do escopo desta task).

## Escopo
1. Reproduzir com cenário determinístico task-backed (login GESTOR + `open-navigation` Performance + `wait-role` de terminal condition) a partir de fixture versionada.
2. Isolar a causa: cenário (nome de grupo/item incorreto, terminal condition mal formulada, timeout curto) versus harness (matcher/condição do `open-navigation`, race de render).
3. Aplicar a correção mínima no local identificado (fixture e/ou harness); se o harness for tocado, cobrir em `visual-harness.test.mjs`.
4. Provar a correção capturando Performance GESTOR desktop com pacote task-backed válido (e smoke ADMIN desktop).
5. Se a causa raiz for um defeito real de produto (navegação quebrada na superfície), NÃO corrigir produto aqui: registrar finding novo com evidência e devolver para reconciliação do Taskyfier/Orchestrator.

## Fora de escopo
- Qualquer patch de código de produto.
- Alterar roles allowlistadas, portas, política de dirty worktree ou retenção.
- Consumir/promover PNGs advisory (`-002` órfão incluído).
- Avaliar conteúdo/UX da tela Performance (aquisição apenas).

## Dependências
- satisfeitas: harness ativo; Performance comprovadamente capturável em mobile (COORD-INSP-011 como pista, não como evidência); roles GESTOR/ADMIN criadas de forma controlada no runtime isolado.
- em aberto: nenhuma para a investigação. Executar em worktree limpa (ou registrar `--allow-dirty-worktree` conforme política) — evidência de gate em árvore suja é `same-execution-only`.

## Critérios de aceite
1. Causa raiz documentada (cenário vs harness vs produto) com evidência reproduzível.
2. Correção mínima aplicada no local identificado; nenhum afrouxamento de allowlist/validação do harness.
3. Cenário determinístico de Performance GESTOR desktop captura com terminal condition observável ("heading Desempenho visível" ou equivalente estrito), smoke ADMIN.
4. Pacote task-backed validado pelo CLI do lane; registros honestos de limitações.
5. Se produto: finding registrado e handoff formal — tarefa encerrada como investigação, sem fix de produto.

## Validação
- preflight/capture/validação do lane com os cenários novos; `visual-harness.test.mjs` se harness tocado; `git diff --check`.

## Riscos
- "Consertar" o cenário mascarando um defeito real de produto — mitigado pelo diagnóstico explícito antes da correção e pela regra do item 5 do escopo.
- Intermitência (animações/matchMedia) pode simular correção; repetir a captura para confirmar reprodutibilidade.

## Limitações
- Não prova conteúdo visual completo da superfície (zoom, teclado, TA não cobertos); aquisição fake/loopback.
- Confiança média: nenhuma run fresh do audit neste ciclo; o diagnóstico parte de PNG advisory da onda 1.

## Definição de pronto
- Aquisição da superfície Performance desktop reproduzível por terceiros; registry do audit pode transitar `ATUX-017` de `BLOCKED (evidence acquisition)` para resolvido/desbloqueado.

## Sugestão de commit semântico
- `fix(operations): estabiliza aquisicao de evidencia da superficie performance`
