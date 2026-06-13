# TASK-AT-076 - Paginacao server-side em telas criticas

## Metadata
- status: completed-critical-screens
- owner: olympus_taskyfier
- last-updated: 2026-06-13
- source-of-truth: docs/tasks/TASK-AT-076-server-side-pagination-critical-screens.md

## Fase
- fase: B - Confiabilidade operacional
- prioridade: 8
- dependencias: contratos atuais de Notas, Auditoria, Extratos, Wiki e FAQ.

## Objetivo unico
Padronizar paginacao, filtros e ordenacao no backend para telas criticas que hoje podem depender de paginacao client-side.

## Contexto
Para volume real e 1000 usuarios simultaneos, tabelas/listas nao devem carregar conjuntos grandes no cliente.

## Escopo tecnico
1. Contrato padrao: `page`, `pageSize`, `total`, `items`, filtros e ordenacao.
2. Notas/DANFEs.
3. Auditoria.
4. Extratos.
5. Wiki.
6. FAQ.

## Arquivos candidatos
- `apps/api/src/**`
- `apps/web/src/views/notes.tsx`
- `apps/web/src/views/audit.tsx`
- `apps/web/src/views/statements.tsx`
- `apps/web/src/views/wiki.tsx`
- `apps/web/src/views/faq.tsx`
- `apps/web/src/components/operational.tsx`
- `packages/shared/src/**`

## Plano de execucao
1. Inventariar endpoints com paginacao client-side.
2. Definir helper/contrato compartilhado para paginacao.
3. Migrar uma tela por vez, com compatibilidade onde possivel.
4. Adicionar indices se queries filtradas precisarem.
5. Atualizar UI para pagina remota e reset de filtros.
6. Cobrir endpoints com testes de total/filtro/ordenacao.

## Acceptance Criteria
1. Telas criticas nao dependem de carregar tudo para paginar.
2. Filtros e ordenacao funcionam junto com paginacao.
3. API retorna total correto.
4. UI preserva estado e nao duplica resultados ao trocar pagina.
5. Testes cobrem pelo menos Notas, Auditoria e Wiki/FAQ.

## Impacto na apresentacao
Pouco visivel, mas sustenta a promessa de ferramenta pronta para escala.

## Riscos
- Quebrar filtros existentes por divergencia de parametros.
- Queries sem indices ficarem lentas apos server-side.
