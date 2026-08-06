# TASK-AT-440 - Fronteiras canonicas do especialista Product UX

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-440-product-ux-specialist-canonical-boundaries.md

## Modo
- mode: documental
- generation-mode: canonical-specialist-breakdown

## Capability
Product UX / Governance

## Origem documental
- `docs/tasks/PRODUCT-UX-SPECIALIST-BACKLOG-2026-08-05.md`
- Decisao humana de criar a versao completa local no padrao Olympus.
- `.codex/agents/`, `.agents/skills/` e `.antigravity/` como malha vigente.

## Objetivo unico
Fixar em ADR e spec a missao, as fronteiras, os modos e os criterios de extracao futura do especialista Product UX antes de qualquer scaffold ou runtime.

## Contexto minimo
O repositorio possui recorrencia de problemas de jornada, densidade, estados, responsividade e acessibilidade, mas nenhum especialista UX formal. Criar apenas um prompt potente deixaria ownership ambiguo e duplicaria kits existentes.

## Inputs
- Inventario dos agentes, skills, manifests e roteamento Olympus atuais.
- Tasks visuais e de acessibilidade `TASK-AT-066`, `TASK-AT-312`, `TASK-AT-314`, `TASK-AT-351`, `TASK-AT-404`, `TASK-AT-421` e `TASK-AT-434`.
- Decisoes assumidas no backlog de origem.

## Dependencias
- satisfeitas: autorizacao humana e evidencia de padrao UX recorrente no produto.
- em aberto: nenhuma para formalizacao documental.

## Alvos explicitos
1. ADR futuro `ADR-007-product-ux-specialist-local-first.md` no diretório `docs/adr/`.
2. Spec futura `SPEC-AT-005-product-ux-specialist.md` no diretório `docs/specs/`.
3. Matriz de ownership e handoff entre Product UX e os kits Olympus existentes.

## Fora de escopo
- Criar arquivos em `.codex`, `.agents` ou `.antigravity`.
- Definir identidade visual nova ou design system.
- Implementar harness, skill, agente, testes ou routing.

## Checklist de execucao
1. Registrar problema, decisao local-first, alternativas e trade-offs.
2. Definir modos `audit`, `interaction-spec` e `advisory-review`.
3. Delimitar ownership contra Critic, Taskyfier, Docs, Contracts, Runtime, Quality e Verifier.
4. Definir quando evidencia visual e obrigatoria e quando referencia humana bloqueia.
5. Fixar criterios objetivos de futura extracao para plugin/repositorio externo.
6. Declarar nao objetivos, politica de privacidade e classificacao de evidencia.

## Acceptance Criteria
1. Nenhuma responsabilidade do especialista depende de interpretacao implicita.
2. Cada output possui consumidor Olympus e nao substitui aceite, implementacao ou decisao arquitetural.
3. A estrategia local-first e os criterios de extracao futura ficam documentados.
4. Falha de aquisicao visual e referencia humana ausente possuem comportamento fail-closed.

## Definition of Done
1. ADR e spec aceitas, ligadas entre si e ao backlog.
2. Matriz de fronteiras cobre todos os kits atuais sem ownership concorrente.
3. Nenhum artefato runtime foi criado antecipadamente.

## Validacao
- comandos/checks: `npm run check:docs` e `git diff --check`.
- revisao manual: cruzar ADR/spec com TOMLs, SKILLs, manifests e protocolo Antigravity atuais.

## Evidencia esperada
- ADR e spec versionadas com alternativas, fronteiras, modos e nao objetivos.
- Registro das decisoes ainda humanas e dos triggers de extracao.

## Riscos
- Transformar o especialista em critico generico ou aprovador paralelo.
- Formalizar preferencia estetica como regra universal do produto.

## Blockers possiveis
- Divergencia humana sobre ownership ou autonomia do especialista.
- Decisao de produto que altere o papel dos kits Olympus existentes.

## Proximo passo provavel
`TASK-AT-441`

## Feedback obrigatorio de retorno
- resumo dos limites fechados
- ADR/spec materializadas
- decisoes ainda abertas
- recomendacao de continuidade

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: rotear em modo documental e encerrar com ADR/spec materiais, sem scaffold.
- constraints: sem agente, skill, harness, teste, routing ou alteracao de produto.
