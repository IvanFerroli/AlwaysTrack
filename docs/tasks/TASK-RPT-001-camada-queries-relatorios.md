# TASK-RPT-001 - Camada de queries de relatorios

## Metadata
- status: completed
- owner: contracts-builder
- last-updated: 2026-04-30
- source-of-truth: docs/tasks/TASK-RPT-001-camada-queries-relatorios.md

## Modo
- mode: implementation

## Agentes sugeridos
- `olympus_contracts_builder`
- runtime builder
- quality builder
- `olympus_task_verifier`

## Objetivo unico
Criar base de filtros, paginacao e DTOs para relatorios operacionais.

## Inputs
- documento central, secao 8

## Dependencias
- satisfeitas: `TASK-LIC-002`, `TASK-FIL-004`, `TASK-NOT-005`
- em aberto: n/a

## Alvos explicitos
1. `modules/reports`
2. filtros comuns por periodo, unidade, setor, RT e tipo
3. testes de queries

## Fora de escopo
- exportacao

## Acceptance Criteria
1. Queries usam historico real, nao calculo improvisado em tela.
2. Filtros comuns sao reutilizaveis.
3. Resultados respeitam escopo de acesso.

## Validacao
- testes de filtros e permissoes

## Riscos
- relatorios nascerem acoplados ao layout

## Evidencias de conclusao
- Criado modulo `services/api/src/core/reports` com service, handlers, filtros comuns e paginacao.
- Filtros reutilizaveis: periodo, unidade, setor, RT, tipo de licenca, status, canal, janela e paginacao.
- Queries respeitam escopo por ADMIN, RT responsavel e SUPERVISOR por unidade/setor.
- Testes cobrem parsing de filtros, escopo e agregacao.

## Validacao executada
- `npm run check` - 87 testes passaram.
- `npm run build --workspace @sylembra/web` - build passou.
- `npm run setup` - migrations/seed alinhados.
