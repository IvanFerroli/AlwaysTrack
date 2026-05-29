# TASK-AT-009 - Regularization workflow

## Metadata
- status: proposed
- owner: product-builder
- last-updated: 2026-05-29
- source-of-truth: docs/tasks/TASK-AT-009-regularization-workflow.md

## Modo
- mode: planning

## Objetivo unico
Criar acompanhamento explicito de pendencias/casos de regularizacao por licenca ou documento.

## Contexto minimo
O dashboard ja aponta vencimentos, documentos pendentes e falhas. O proximo salto de produto e transformar essas filas em casos com responsavel, prazo, status, nota e auditoria.

## Inputs
- `docs/specs/`
- `services/api/prisma/schema.prisma`
- `services/api/src/core/licenses/*`
- `services/api/src/core/documents/*`
- `apps/web/src/main.tsx`

## Dependencias
- satisfeitas: fluxo operacional principal, auditoria, dashboard action center
- em aberto: desenho de dominio do caso de regularizacao

## Alvos explicitos
1. Modelo de caso de regularizacao.
2. API para criar, atualizar e listar casos.
3. UI para acompanhar status, responsavel, prazo e notas.
4. Auditoria para mudancas de status.

## Fora de escopo
- Automacao externa de protocolo.
- SLA multi-etapa complexo.
- Notificacao em tempo real.

## Checklist
1. Especificar entidade e estados.
2. Definir migration e service.
3. Implementar API/UI/testes.

## Acceptance Criteria
1. Admin consegue abrir caso a partir de licenca/documento.
2. Caso tem responsavel, prazo, status e historico.
3. Dashboard consegue contar casos abertos.

## Validacao
- comandos/checks: `npx prisma validate`, `npm run check`, `npm run build --workspace @alwaystrack/web`
- revisao manual: criar e fechar um caso local

## Riscos
- Schema novo exige cuidado com migracao e escopo por organizacao.
