# TASK-AT-010 - Compliance dossier export

## Metadata
- status: cancelled
- owner: product-builder
- last-updated: 2026-05-29
- source-of-truth: docs/tasks/TASK-AT-010-compliance-dossier-export.md

## Modo
- mode: planning

## Objetivo unico
Cancelada: pertencia ao recorte antigo de licencas/compliance.

## Contexto minimo
O produto foi pivotado para operacao comercial de suplementos. O equivalente futuro e extrato comercial por vendedor/grupo/campanha, nao dossie de compliance.

## Inputs
- `services/api/src/core/reports/*`
- `services/api/src/core/professionals/*`
- `services/api/src/core/documents/*`
- `services/api/src/core/audit/*`
- `apps/web/src/main.tsx`

## Dependencias
- satisfeitas: relatórios CSV, auditoria, documentos e licencas
- em aberto: escolher formato inicial entre JSON, CSV ou HTML imprimivel

## Alvos explicitos
1. Endpoint de dossie por profissional/licenca.
2. Conteudo com dados cadastrais, licencas, documentos, notificacoes e auditoria relacionada.
3. UI ou acao de exportacao no modulo de relatorios.
4. Testes de montagem do dossie.

## Fora de escopo
- Assinatura digital.
- PDF diagramado.
- Upload automatico para terceiros.

## Checklist
1. Definir formato inicial.
2. Implementar service/handler.
3. Adicionar acao na UI.
4. Validar conteudo do export.

## Acceptance Criteria
1. Admin consegue gerar dossie por profissional/licenca no ambiente local.
2. Dossie inclui evidencias principais de documentos, notificacoes e auditoria.
3. Export nao vaza dados de outra organizacao.

## Validacao
- comandos/checks: `npm run check`, `npm run build --workspace @alwaystrack/web`
- revisao manual: gerar dossie no seed local

## Riscos
- Escopo do dossie pode crescer; iniciar com formato simples e auditavel.
