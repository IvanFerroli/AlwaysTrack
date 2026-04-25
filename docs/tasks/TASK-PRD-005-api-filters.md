# TASK-PRD-005 - API: Sistema de Busca, Filtros e Mutação de Vagas

## Metadata
- status: completed-with-remarks
- owner: olympus-taskyfier
- last-updated: 2026-04-25

## Modo
- mode: planning

## Objetivo unico
Criar endpoints e lógica de backend para filtrar o ranking de vagas e permitir a edição de tags/status de uma vaga específica.

## Contexto minimo
O Dashboard precisará consumir a lista de vagas filtrada por afinidade mínima, texto, tags ou status. Além disso, precisamos de uma rota para que o usuário possa marcar uma vaga como "discarded", "applied", ou adicionar tags customizadas.

## Alvos explicitos
1. Modificar `MatchService.listRanked` para aceitar um objeto de filtros `JobFilterOptions` (search text, minScore, status, tags).
2. Atualizar o handler `GET /v1/jobs/ranked` para extrair query params (ex: `?q=react&minScore=50&status=new`) e passá-los para o `listRanked`.
3. Criar rota de atualizacao no `match.handlers.ts` ou `ingestion.handlers.ts` para atualizar `tags` e `userStatus` de uma vaga no `store`.
   - Implementado como `POST /v1/jobs/update` no runtime atual.

## Definition of Done
- Endpoint `/v1/jobs/ranked` suportando filtros opcionais.
- Endpoint de atualizacao `POST /v1/jobs/update` operacional e alterando o estado em memoria.
- Typecheck passando.
