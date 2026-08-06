# TASK-AT-445 - Skill package completo Product UX

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-445-product-ux-skill-package.md

## Modo
- mode: documental
- generation-mode: canonical-specialist-breakdown

## Capability
Product UX / Skill Package

## Origem documental
- `docs/tasks/PRODUCT-UX-SPECIALIST-BACKLOG-2026-08-05.md`
- ADR/spec e scaffold de `TASK-AT-440`/`441`.
- Contratos de `TASK-AT-442`/`443`.
- Interface do harness de `TASK-AT-444`.

## Objetivo unico
Completar o skill package Product UX com instrucoes, manifest, rubricas e templates fiéis aos contratos e ao modelo operacional Olympus.

## Contexto minimo
O skill precisa ser potente pela disciplina dos seus inputs, modos, evidencias e limites, nao por assumir responsabilidades de todos os outros agentes. Um prompt monolitico sem rubricas nem templates seria dificil de avaliar e manter.

## Inputs
- Fronteiras, modos e nao objetivos aceitos.
- Contratos de review e evidencia visual.
- Interface e codigos do harness.
- Padrao integral dos skill packages Olympus atuais.

## Dependencias
- satisfeitas: padrao de SKILL/manifest/rubric/template ja utilizado no repositorio.
- em aberto: `TASK-AT-440` a `TASK-AT-444`.

## Alvos explicitos
1. `.agents/skills/olympus-product-ux/SKILL.md`.
2. `.agents/skills/olympus-product-ux/manifests/kit-manifest.md`.
3. Rubricas de evidencia UX e readiness de interaction spec.
4. Templates de UX audit, interaction spec e advisory review.
5. Referencias aos contratos e ao harness, sem duplicar seu conteudo.

## Fora de escopo
- Criar TOML do agente ou bundle Antigravity.
- Alterar Orchestrator ou registry.
- Implementar produto, harness, teste ou design system.
- Incluir conhecimento de outro repositorio sem fonte.

## Checklist de execucao
1. Definir ativacao, fontes prioritarias e processo obrigatorio por modo.
2. Exigir aquisicao visual para afirmacoes visuais e explicitar blockers humanos.
3. Separar observacao, impacto, recomendacao, decisao aberta e confianca.
4. Incluir checklist de jornada, estados, responsive, teclado, foco, semantica, copy e privacidade.
5. Declarar ownership proibido contra os demais kits.
6. Criar rubricas pontuaveis e templates pequenos, completos e consumiveis.
7. Documentar fallback sem opiniao estetica inventada.

## Acceptance Criteria
1. Cada modo possui trigger, input, processo, output, fallback e consumidor claros.
2. Findings visuais exigem evidencia aceita por `TASK-AT-443`.
3. O skill nao cria task, codigo, teste, ADR/spec canonica nem classificacao final de aceite.
4. Rubricas detectam falta de evidencia, preferencia subjetiva e invasao de ownership.
5. Templates geram pacotes uteis ao Taskyfier, Runtime e Quality.

## Definition of Done
1. Skill package completo e autossuficiente materializado no scaffold.
2. Todos os links internos resolvem e nao ha conteudo duplicado desnecessario.
3. Check documental e higiene aprovados.

## Validacao
- comandos/checks: `npm run check:docs`, `npm run repo:hygiene` e `git diff --check`.
- revisao manual: executar dry-run documental dos tres modos com input valido, ambiguo e bloqueado.

## Evidencia esperada
- SKILL, manifest, rubricas e templates materiais.
- Matriz requisito contratual -> secao/artefato do package.

## Riscos
- Skill se tornar checklist generico de UX sem contexto de jornada.
- Copiar responsabilidades do Critic, Docs, Runtime, Quality ou Verifier.

## Blockers possiveis
- Contrato ou harness ainda instavel.
- Divergencia entre os modos e a forma como o Orchestrator roteia especialistas.

## Proximo passo provavel
`TASK-AT-446`

## Feedback obrigatorio de retorno
- artefatos materializados
- modos cobertos
- dry-runs executados
- riscos ou limites preservados

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: rotear em modo documental e completar apenas o skill package aderente aos contratos.
- constraints: sem TOML, bundle, registry, produto, teste automatizado ou decisao arquitetural nova.
