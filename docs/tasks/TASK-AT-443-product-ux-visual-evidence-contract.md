# TASK-AT-443 - Contrato de evidencia visual Product UX

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-443-product-ux-visual-evidence-contract.md

## Modo
- mode: contracts
- generation-mode: canonical-specialist-breakdown

## Capability
Product UX / Visual Evidence Contract

## Origem documental
- `docs/tasks/PRODUCT-UX-SPECIALIST-BACKLOG-2026-08-05.md`
- ADR/spec de `TASK-AT-440`.
- Contrato publico de `TASK-AT-442`.
- Baselines `TASK-AT-312`, `TASK-AT-313`, `TASK-AT-314` e `TASK-AT-333`.

## Objetivo unico
Definir o contrato reproduzivel, sanitizado e fail-closed de aquisicao e classificacao de evidencia visual consumida pelo especialista UX.

## Contexto minimo
O agente pode capturar o app autonomamente, mas somente se rota, role, estado, viewport, commit e ambiente forem conhecidos. Screenshot sem proveniencia ou code review sem imagem nao sustentam parecer visual.

## Inputs
- Rota ou jornada, role, viewport e estado esperado.
- Seed/fixture, commit e classificacao do ambiente.
- Politica de artefatos sensiveis e retencao.
- Referencia humana quando houver target estetico externo.

## Dependencias
- satisfeitas: convencoes de evidencia e regressao visual existentes.
- em aberto: `TASK-AT-440` a `TASK-AT-442`.

## Alvos explicitos
1. `.agents/skills/olympus-product-ux/contracts/visual-evidence-contract.md`.
2. Manifesto de captura com rota, role, viewport, estado, commit, browser, data UTC e classificacao.
3. Codigos de resultado, incluindo `CAPTURED`, `REFERENCE_REQUIRED`, `VISUAL_ACQUISITION_BLOCKED`, `SENSITIVE_ARTIFACT_REJECTED` e `STALE_EVIDENCE` ou equivalentes.

## Fora de escopo
- Implementar Playwright ou instalar dependencias nativas.
- Capturar producao, sistema externo ou dado pessoal real.
- Definir tolerancia de pixel ou autoaceite de baseline.

## Checklist de execucao
1. Definir inputs obrigatorios para captura autonoma.
2. Classificar evidencia como fake, local, production-like, live ou human-reference.
3. Definir sanitizacao e artefatos proibidos: cookie, token, PII, HTML e storage de sessao.
4. Definir freshness, checksum e vinculo a commit/fixture.
5. Separar captura do estado observado e referencia do estado desejado.
6. Definir comportamento para browser, login, seed, rota ou referencia indisponiveis.
7. Impedir que build, DOM ou leitura de codigo sejam rotulados como validacao visual.

## Acceptance Criteria
1. Toda imagem aceita possui proveniencia suficiente para reproducao.
2. Ausencia de browser ou referencia obrigatoria produz blocker explicito, nao parecer visual degradado.
3. Evidencia sensivel ou stale e rejeitada deterministicamente.
4. O contrato distingue screenshot observado de Figma/print usado como target.

## Definition of Done
1. Contrato e manifesto de captura materializados no skill package.
2. Codigos de sucesso, bloqueio e rejeicao possuem semantica e fallback.
3. Privacidade e retencao estao claras antes do harness.

## Validacao
- comandos/checks: `npm run check:docs` e `git diff --check`.
- revisao manual: percorrer captura local valida, browser ausente, screenshot stale, target ausente e artefato sensivel.

## Evidencia esperada
- Contrato material e exemplos sanitizados de manifests aceito/rejeitado.
- Matriz condicao -> resultado -> proximo responsavel.

## Riscos
- Aceitar screenshot bonito sem provar role, estado ou commit.
- Guardar informacao sensivel no proprio pacote de evidencia UX.

## Blockers possiveis
- Politica de retencao de screenshot ainda nao aceita.
- Divergencia entre evidence manifest e baselines visuais existentes.

## Proximo passo provavel
`TASK-AT-444`

## Feedback obrigatorio de retorno
- contrato e manifest materializados
- codigos fail-closed
- politica de sanitizacao
- blockers preservados para o harness

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: rotear ao Contracts Builder e fechar a fronteira de evidencia antes de qualquer browser automation.
- constraints: sem captura, instalacao, harness, agente ou alteracao de baseline.
