# TASK-FAQ-001 - FAQ administravel

## Metadata
- status: proposed
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
