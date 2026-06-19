# TASK-AT-159 - Busca global escopada por permissao beta

## Metadata
- status: completed-mvp
- owner: olympus_orchestrator
- last-updated: 2026-06-19
- source-of-truth: docs/tasks/TASK-AT-159-beta-global-search-permission-scope.md

## Modo
- mode: implementation

## Objetivo unico
Garantir que a busca global retorne apenas resultados permitidos pela role e escopo do usuario.

## Contexto minimo
Busca global e ponto classico de vazamento. Para o Beta SAC, a busca nao pode retornar nada comercial. Para VENDEDOR, pode retornar conhecimento e apenas dados comerciais proprios/agregados permitidos.

## Inputs
- `TASK-AT-154`
- `TASK-AT-156`

## Dependencias
- satisfeitas: matriz e backend hardening.
- em aberto: n/a.

## Alvos explicitos
1. `services/api/src/core/search`
2. `apps/web/src` componente de busca global
3. testes de busca

## Fora de escopo
- Reescrever motor de busca.
- Adicionar busca full-text sofisticada.

## Checklist
1. Mapear dominios retornados atualmente.
2. Filtrar dominios por role antes de retornar.
3. SAC: Wiki, FAQ, Avisos, Scriptoteca, Fluxos.
4. VENDEDOR: conhecimento + proprios dados comerciais permitidos.
5. Garantir que resultados comerciais nao vazem metadados identificaveis de terceiros.
6. Adicionar testes negativos.

## Acceptance Criteria
1. Busca SAC nao retorna notas, ranking, extratos, campanhas, usuarios, auditoria ou config.
2. Busca VENDEDOR nao retorna dados de outros vendedores.
3. Admin/Gestor preservam busca ampla conforme matriz.

## Definition of Done
1. Busca alinhada a matriz.
2. Testes negativos cobrindo SAC e VENDEDOR.
3. UI nao mostra categorias vazias indevidas.

## Validacao
- comandos/checks: testes API de busca, typecheck API/Web.
- revisao manual: buscar termos comerciais como SAC.

## Evidencia esperada
- Casos de busca por role.
- Print/checklist de SAC sem conteudo comercial.

## Riscos
- Consulta interna buscar tudo e filtrar tarde demais com metadados sensiveis.
- Categoria vazia revelar existencia de dominio bloqueado.

## Blockers possiveis
- Falta de fixtures com dados comerciais de terceiros.

## Retorno esperado
- resumo curto do escopo de busca
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
