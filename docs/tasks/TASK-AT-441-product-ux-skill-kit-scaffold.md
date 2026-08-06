# TASK-AT-441 - Scaffold do skill package Product UX

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-441-product-ux-skill-kit-scaffold.md

## Modo
- mode: scaffolding
- generation-mode: canonical-specialist-breakdown

## Capability
Product UX / Skill Scaffolding

## Origem documental
- `docs/tasks/PRODUCT-UX-SPECIALIST-BACKLOG-2026-08-05.md`
- ADR e spec produzidas por `TASK-AT-440`.
- Padrao estrutural dos skill packages em `.agents/skills/olympus-*`.

## Objetivo unico
Criar a estrutura minima e previsivel do skill package Product UX para receber contratos, rubricas e templates sem embutir comportamento antes da formalizacao.

## Contexto minimo
Contratos e templates precisam de destino estavel. Criar o TOML do agente ou um SKILL completo antes do scaffold e das boundaries levaria o Runtime Builder a inventar estrutura e comportamento ao mesmo tempo.

## Inputs
- ADR/spec aceitas em `TASK-AT-440`.
- Estrutura dos kits Contracts, Docs, Quality e Taskyfier.
- Convencoes de kebab-case, manifests, rubrics e templates do repositorio.

## Dependencias
- satisfeitas: padrao estrutural Olympus existente.
- em aberto: `TASK-AT-440`.

## Alvos explicitos
1. `.agents/skills/olympus-product-ux/`.
2. Subpastas `contracts/`, `manifests/`, `rubrics/` e `templates/`.
3. Arquivos-base minimos, sem regras comportamentais nao contratadas.

## Fora de escopo
- Criar `.codex/agents/olympus_product_ux.toml`.
- Implementar harness ou comandos de browser.
- Escrever o conteudo final do SKILL, contratos, rubricas ou templates.

## Checklist de execucao
1. Confirmar nomenclatura final contra ADR/spec.
2. Criar somente pastas e arquivos-base necessarios para as tasks seguintes.
3. Evitar exports, handlers ou dependencias ficticias.
4. Documentar ownership de cada subpasta.
5. Garantir que o scaffold nao altera registry ou routing.

## Acceptance Criteria
1. Cada arquivo-base possui consumidor e proxima task identificados.
2. Nenhuma regra UX ou de runtime e inventada no scaffold.
3. O layout segue a convencao dos kits Olympus e suporta contratos separados de review e evidencia visual.
4. O scaffold e pequeno, revisavel e nao interfere nos kits existentes.

## Definition of Done
1. Estrutura material criada nos alvos explicitos.
2. Nenhum arquivo fora da estrutura prevista foi alterado.
3. Integridade e higiene do repositorio permanecem verdes.

## Validacao
- comandos/checks: `npm run check:docs`, `npm run repo:hygiene` e `git diff --check`.
- revisao manual: comparar a arvore criada com pelo menos dois kits Olympus existentes.

## Evidencia esperada
- Arvore de arquivos criada.
- Mapa arquivo -> responsabilidade -> task consumidora.

## Riscos
- Criar boilerplate ornamental ou estrutura para capacidades futuras nao decididas.
- Embutir comportamento em placeholders e reduzir a utilidade dos contratos seguintes.

## Blockers possiveis
- `TASK-AT-440` nao aceita ou naming ainda instavel.
- Convencao estrutural dos kits mudar antes da execucao.

## Proximo passo provavel
`TASK-AT-442`

## Feedback obrigatorio de retorno
- arvore materializada
- arquivos propositalmente vazios ou minimos
- validacoes executadas
- riscos residuais

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: rotear ao Scaffolding Builder e criar somente a base estrutural aprovada.
- constraints: sem comportamento final, TOML, routing, harness ou feature de produto.
