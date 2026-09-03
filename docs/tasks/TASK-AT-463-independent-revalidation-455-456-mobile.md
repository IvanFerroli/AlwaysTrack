# TASK-AT-463 - Revalidação task-backed independente dos fixes mobile 455/456

## Metadata
- status: ready-to-execute
- pipeline: READY_TO_EXECUTE
- classified-by: olympus-taskyfier run #2 (2026-09-03) — reconciliação do audit repo-wide `docs/testing/product-ux-repo-wide-audit-2026-09-03.md`, findings `ATUX-002` e `ATUX-003` (Grupo C, revalidações pós-fix). Representação escolhida: UMA task mínima cobrindo as duas revalidações (menor representação honesta; não reabre 455/456 e não cria um doc por finding)
- owner: olympus_product_ux (aquisição pipeline task-backed) + revisor independente de PNG
- verifier: Task Verifier fresh (sem auto-aprovação de quem capturou)
- last-updated: 2026-09-03
- source-of-truth: docs/tasks/TASK-AT-463-independent-revalidation-455-456-mobile.md
- mode: evidence-acquisition
- priority: P2
- severity: medium
- confidence: high (fixes verificados em código; revalidação advisory positiva, não independente)
- estimated-effort: 2-4h
- execution-order: 5 — executar com worktree limpa em commit contendo os dois fixes (política do runbook para gate); aguardar o lane de implementação em voo (TASK-AT-459) drenar, ou usar checkout limpo

## Objetivo único
Produzir revalidação task-backed e independente (aquisição nova + inspeção de PNG por revisor que não capturou) dos fixes já implementados em `TASK-AT-455` (commit `77804d76`) e `TASK-AT-456` (commit `b1265dfc`), fechando o residual `FIXED_ADVISORY_REVALIDATED` dos findings `ATUX-002`/`ATUX-003` do audit.

## Contexto e evidência referenciada
O audit repo-wide confirmou ambos os fixes em código e registrou revalidação advisory positiva de 2026-09-03 (geometry passed; inspeções `COORD-INSP-001..006`), mas o fechamento de 455 foi builder-inspected e 456 teve apenas snapshots do builder. O registry exige "revalidação task-backed independente" e a regra de evidência (seção O.3) proíbe fechar gate com o PNG advisory da tarefa de audit (same-request-only, fake).

## Definição operacional de "revalidação task-backed independente"
1. **Aquisição nova, pipeline lane, task-backed**: preflight + capture + validate com task/execution/evidence IDs reais desta task (cenários versionados em `tests/product-ux/fixtures/`); nunca reutilizar PNGs advisory do audit nem da onda 1.
2. **Inspeção independente**: cada PNG usado em afirmação visual é aberto por revisor que não participou da captura (method `actual-png-visual-inspection`), com registro de inspeção fora do record/manifesto imutável, conforme runbook.
3. **Viewports-alvo**: 390x844 e 320x700 (os dois viewports dos findings; smoke desktop opcional de comparação).
4. **Geometria**: helpers existentes (`expectNoUnexpectedOverflow`, `expectControlsInsideViewport`, `expectRegionsNotOverlapping`) passam sem tolerância.
5. **Aceite**: Task Verifier fresh, com limitações `manual-needed` registradas honestamente (teclado completo, zoom 200%, landscape e tecnologia assistiva permanecem fora — risco residual já aceito em 455/456, não reaberto aqui).

## Escopo
1. Criar cenários determinísticos na fixture do lane cobrindo:
   - ATUX-002: pós-seleção de um filho SAC e de um filho Administração em 390x844 (grupo/item ativos identificáveis, primeiro bloco útil visível, árvore compacta) e smoke 320x700 (árvore compacta, sem overflow do escopo 455);
   - ATUX-003: Configurações em 390x844 e 320x700 (documento sem overflow, controles dentro do viewport, matriz contida em `.table-scroll`).
2. Adquirir, validar e inspecionar conforme a definição operacional acima.
3. Registrar resultado com proveniência (Evidence ID, SHAs, registros de inspeção) para atualização do registry do audit pelo Orchestrator.

## Fora de escopo
- Qualquer mudança de código de produto, CSS ou testes unitários; correções novas (residuais novos viram findings, não patch aqui).
- Reabrir `TASK-AT-455/456` ou reavaliar seus critérios originais.
- Taskificar o topbar 320x700/`ATUX-009` (decisão própria, seção K.3) nem avaliar chips (`ATUX-019`).
- Teclado completo, zoom 200%, landscape, tecnologia assistiva real.

## Dependências
- satisfeitas: fixes `77804d76` e `b1265dfc` publicados em `origin/main`; lane de aquisição existe (runbook + harness + bootstrap de browser); seed sintético e roles allowlistadas disponíveis.
- em aberto (não bloqueia a existência da task, condiciona a execução): worktree limpa em commit contendo ambos os fixes. O lane em voo `TASK-AT-459` altera `markdown-editor.tsx` — sem interseção de arquivo com esta task, mas evidência de gate em árvore suja é `same-execution-only` e não fecha revalidação; aguardar drenar o lane ou usar checkout limpo.

## Critérios de aceite
1. Pacote `CAPTURED` validado pelo CLI do lane pipeline, com IDs reais desta task e Git SHA registrado.
2. Todos os PNGs-alvo (mínimo: 2 filhos SAC/Administração a 390x844 + smoke 320x700 + Configurações a 390 e 320) inspecionados por revisor independente com registros de inspeção.
3. 390x844: primeiro bloco útil visível sem a árvore expandida; grupo/filho ativos identificáveis (reabertura com `aria-current` verificável por teste browser existente, quando aplicável).
4. 320x700: sem overflow no escopo da navegação; Configurações contida nos dois viewports.
5. Helpers geométricos passam sem tolerância e sem `overflow-x:hidden` mascarando conteúdo.
6. Limitações `manual-needed` registradas; nenhuma afirmação visual além do inspecionado.

## Validação
- `preflight.mjs` → `capture.mjs` → validação do lane vigente, com worktree limpa.
- Reexecutar os helpers geométricos dos cenários; `git diff --check` (docs/fixture apenas).

## Riscos
- Captura em árvore suja invalidaria o propósito da revalidação (same-execution-only).
- Comportamento `matchMedia` de 455 pode divergir em resize durante a captura; usar cenários com viewport fixo por execução.
- Revisor independente indisponível no mesmo momento: a task NÃO fecha sem a inspeção; nunca substituir por auto-inspeção do capturador.

## Limitações
- Evidência fake/loopback; não prova produção nem tecnologia assistiva.
- PNG não prova teclado, foco, scroll por teclado ou leitor de tela.

## Definição de pronto
- Registry do audit pode transitar `ATUX-002`/`ATUX-003` de `FIXED_ADVISORY_REVALIDATED` para revalidado task-backed independente, com evidência indexada e inspecionada.

## Sugestão de commit semântico
- `docs(ux): revalida fixes mobile 455/456 com evidencia task-backed`
