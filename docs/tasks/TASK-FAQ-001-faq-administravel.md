# TASK-FAQ-001 - FAQ administravel

## Metadata
- status: completed
- owner: runtime-builder
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-FAQ-001-faq-administravel.md

## Modo
- mode: implementation

## Agentes sugeridos
- runtime builder
- frontend implementer
- `olympus_task_verifier`

## Objetivo unico
Implementar FAQ com categorias, busca simples e itens ativos por organizacao.

## Inputs
- documento central, secao 10

## Dependencias
- satisfeitas: `TASK-DAT-001`, `TASK-AUT-002`, `TASK-UX-002`
- em aberto: conteudo final das perguntas

## Alvos explicitos
1. modulo `modules/faq`
2. CRUD admin de FaqItem
3. pagina publica de FAQ

## Fora de escopo
- chatbot
- inbox

## Acceptance Criteria
1. Admin gerencia perguntas por categoria.
2. Profissional acessa FAQ pelo fluxo publico.
3. Busca simples filtra pergunta/resposta.

## Validacao
- testes de service
- smoke manual

## Riscos
- FAQ virar suporte complexo demais

## Evidencias de entrega
- Criado modulo `services/api/src/core/faq`.
- CRUD admin entregue em `GET/POST/PATCH /v1/faq`.
- Endpoint publico `GET /v1/public-faq` com busca simples por pergunta/resposta e filtro de categoria.
- FAQ publica lista apenas itens ativos por organizacao ativa.
- Tela admin em `Configuracoes` permite criar e ativar/desativar perguntas.
- Pagina publica `/faq` exibe busca, categorias e respostas.
- Alteracoes geram auditoria `faq.*`.

## Validacao realizada
- `npm run check` passou com 81 testes.
- `npm run setup` passou.
- `npm run build --workspace @sylembra/web` passou.
- Smoke local: criar FAQ, buscar FAQ publica e consultar auditoria `faq.create`.
