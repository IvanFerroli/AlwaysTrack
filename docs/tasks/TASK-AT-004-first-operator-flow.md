# TASK-AT-004 - First operator flow

## Metadata
- status: completed
- owner: runtime-builder
- last-updated: 2026-05-29
- source-of-truth: docs/tasks/TASK-AT-004-first-operator-flow.md

## Modo
- mode: implementation

## Objetivo unico
Fortalecer o fluxo operacional principal do AlwaysTrack de ponta a ponta.

## Contexto minimo
O runtime ja possui organizacoes, profissionais, licencas, documentos, notificacoes, relatorios e auditoria. A proxima parede de produto e garantir que esse caminho esteja claro, testado e ergonomico.

## Inputs
- `apps/web/src/main.tsx`
- `services/api/src/core/quality/main-flow.e2e.test.ts`
- `services/api/src/core/*`

## Dependencias
- satisfeitas: `TASK-AT-001`
- em aberto: escopo exato do beta externo

## Alvos explicitos
1. Dashboard e navegacao do fluxo principal.
2. Criacao/edicao de profissional e licenca.
3. Upload/validacao de documento.
4. Geracao de notificacao e evidencia de auditoria.

## Fora de escopo
- Rebrand de dominio tecnico.
- Integracao real obrigatoria com Meta, Google ou IA.
- Refatoracao ampla da SPA monolitica.

## Checklist
1. Mapear fluxo atual. Status: completed.
2. Corrigir friccoes de menor risco. Status: completed sem mudanca de UX/runtime.
3. Ampliar teste e2e de qualidade se houver lacuna. Status: completed.
4. Validar `npm run check`. Status: completed.
