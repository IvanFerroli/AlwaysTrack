# TASK-AT-080 - Notificacoes mais uteis

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-12
- source-of-truth: docs/tasks/TASK-AT-080-useful-notifications-v2.md

## Fase
- fase: C - Produto interno definitivo
- prioridade: 12
- dependencias: centro de notificacoes in-app existente.

## Objetivo unico
Melhorar notificacoes com link profundo, agrupamento simples por tipo, leitura eficiente e resumo operacional sem complexidade excessiva.

## Contexto
Notificacao boa reduz esquecimento; notificacao ruim vira ruido. O foco e acao e contexto.

## Escopo funcional
1. Link profundo confiavel para nota, Wiki, FAQ, campanha ou auditoria.
2. Agrupamento simples por tipo/status no painel.
3. Marcar individual e "marcar todas como lidas".
4. Filtro de nao lidas.
5. Opcional: resumo diario in-app simples, sem email inicialmente.

## Arquivos candidatos
- `apps/web/src/components/notification-center.tsx`
- `apps/api/src/**/notifications*`
- `apps/api/src/**/audit*`
- `prisma/schema.prisma` se faltar metadado

## Plano de execucao
1. Auditar tipos atuais e links.
2. Normalizar payload de link profundo.
3. Implementar agrupamento/filtros no painel.
4. Adicionar acao de marcar todas como lidas.
5. Testar links principais e permissao.

## Acceptance Criteria
1. Notificacoes principais abrem destino correto.
2. Usuario consegue filtrar nao lidas e marcar todas como lidas.
3. Agrupamento nao esconde notificacao critica.
4. Permissoes continuam respeitadas no destino.
5. Typecheck/build e testes relevantes passam.

## Impacto na apresentacao
Mostra que o produto empurra o usuario para decisao, nao so armazena dados.

## Riscos
- Agrupamento excessivo esconder contexto.
- Link profundo quebrar quando entidade foi arquivada/removida.

