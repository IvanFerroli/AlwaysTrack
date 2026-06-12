# TASK-AT-071 - Timeline visual da nota

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-12
- source-of-truth: docs/tasks/TASK-AT-071-sales-document-visual-timeline.md

## Fase
- fase: A - Impacto para apresentacao
- prioridade: 3
- dependencias: auditoria, notas, revisao e notificacoes existentes.

## Objetivo unico
Criar uma timeline visual por DANFE/nota com eventos de upload, extracao, duplicidade, revisao, comentario, aprovacao/rejeicao e impacto comercial.

## Contexto
A nota e o objeto central do fluxo comercial. A timeline torna rastreabilidade visivel para gestor, suporte e apresentacao.

## Escopo funcional
1. Timeline no detalhe da nota/DANFE.
2. Eventos: envio, extracao, metodo usado, erro, duplicidade, reprocessamento, revisao, comentario, aprovacao/rejeicao.
3. Eventos de impacto: entrou no ranking, campanha, extrato e auditoria relacionada quando disponivel.
4. Links para auditoria e diagnostico de DANFE.

## Arquivos candidatos
- `apps/web/src/views/notes.tsx`
- `apps/api/src/**/sales*`
- `apps/api/src/**/audit*`
- `apps/api/src/**/notifications*`
- `prisma/schema.prisma` se eventos nao forem recuperaveis hoje

## Plano de execucao
1. Mapear quais eventos ja existem em auditoria/notificacao/documento.
2. Criar endpoint de timeline por documento agregando eventos existentes.
3. Adicionar painel/drawer de timeline na tela de Notas.
4. Garantir ordenacao temporal e labels compreensiveis.
5. Cobrir endpoint com teste de eventos principais.

## Acceptance Criteria
1. Uma nota pendente, aprovada e rejeitada exibem timelines coerentes.
2. Comentarios de revisao aparecem com autor/data.
3. Metodo de extracao/reprocessamento e duplicidade aparecem quando registrados.
4. Timeline nao quebra se algum evento antigo nao tiver dado completo.
5. Typecheck/build e teste de API passam.

## Impacto na apresentacao
Mostra rastreabilidade ponta a ponta: o sistema nao so calcula, ele explica o processo.

## Riscos
- Eventos historicos incompletos podem exigir fallbacks visuais.
- Misturar auditoria tecnica crua com linguagem de negocio.

