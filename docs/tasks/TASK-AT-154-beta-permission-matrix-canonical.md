# TASK-AT-154 - Matriz canonica de permissoes do Beta Fechado

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-06-19
- source-of-truth: docs/tasks/TASK-AT-154-beta-permission-matrix-canonical.md

## Modo
- mode: planning

## Objetivo unico
Definir a matriz canonica de permissoes da Fase Beta Fechado por role, modulo, acao e escopo de dados.

## Contexto minimo
O beta sera local, fechado e controlado. O produto permanece unico e todos os modulos continuam ativos, mas cada role deve enxergar e acessar apenas o que sua permissao permitir. A API continua sendo fonte da verdade.

## Inputs
- Decisoes congeladas da Fase Beta Fechado por Permissoes.
- Matriz comercial existente em `docs/security/commercial-permission-matrix.md`.
- Roles atuais em `packages/shared`.

## Dependencias
- satisfeitas: decisoes de produto congeladas para SAC, VENDEDOR, FINANCEIRO, SUPERVISOR, GESTOR e ADMIN.
- em aberto: n/a.

## Alvos explicitos
1. `docs/security/commercial-permission-matrix.md`
2. `docs/architecture/domains.md`
3. `packages/shared/src/index.ts`
4. `docs/tasks/ROADMAP.md`

## Fora de escopo
- Implementar bloqueios de API.
- Alterar UI.
- Criar seeds.

## Checklist
1. Mapear roles e modulos: Comercial, Conhecimento, Atendimento, Admin, Auditoria e Integracoes.
2. Definir acoes por role: ver, criar, comentar, sugerir, revisar, aprovar, governar, exportar.
3. Definir escopos por role: proprio vendedor, grupo supervisionado, agregados, global.
4. Registrar explicitamente negacoes importantes do beta.
5. Indicar quais permissoes ja existem e quais precisam de hardening.

## Acceptance Criteria
1. SAC fica documentado sem acesso a notas, ranking, extratos, campanhas, usuarios, configuracoes, auditoria, integracoes e dados comerciais sensiveis.
2. VENDEDOR fica documentado com acesso a conhecimento e apenas aos proprios dados comerciais.
3. SUPERVISOR fica documentado como acompanhamento, sem revisao de notas no beta.
4. FINANCEIRO fica documentado sem governanca de campanhas.
5. ADMIN fica documentado com acesso total.

## Definition of Done
1. Matriz final revisavel em docs.
2. Ponto unico de referencia para as tasks seguintes.
3. Riscos de divergencia entre frontend/backend apontados.

## Validacao
- comandos/checks: n/a.
- revisao manual: comparar matriz com as decisoes congeladas.

## Evidencia esperada
- Tabela final por role/modulo/acao/escopo.
- Lista de negacoes criticas do beta.

## Riscos
- Matriz ambigua gerar implementacao divergente.
- Roles antigas ou legado SyLembra vazarem no raciocinio do beta.

## Blockers possiveis
- n/a.

## Retorno esperado
- resumo curto da matriz criada
- decisoes incorporadas
- riscos ou ressalvas
- proximo passo recomendado
