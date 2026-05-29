# SPEC-AT-002 - First Operator Flow

## Metadata
- status: accepted
- owner: runtime-builder
- last-updated: 2026-05-29
- source-of-truth: docs/specs/SPEC-AT-002-first-operator-flow.md

## Objetivo
Fixar o primeiro fluxo operacional do AlwaysTrack como contrato de produto e qualidade.

## Fluxo canonico
1. Admin cadastra ou usa profissional existente.
2. Admin cria uma licenca para o profissional.
3. Sistema calcula status operacional da licenca.
4. Sistema gera job de notificacao conforme regra ativa.
5. Provider configurado processa o job e grava log de envio.
6. Profissional envia documento por token publico.
7. RT ou Admin valida o documento.
8. Sistema recalcula a licenca e grava auditoria do caminho.

## Evidencias obrigatorias
- Link de upload gerado fica disponivel para copia enquanto o operador continua na tela de licencas.
- Auditoria de criacao de licenca.
- Log de notificacao enviada ou falha controlada.
- Auditoria de uso de token publico.
- Auditoria de upload publico de documento.
- Auditoria de aprovacao ou recusa de documento.
- Recalculo de status da licenca depois da validacao.
- Auditoria do recalculo de status da licenca.

## Fora de escopo
- Integracao real obrigatoria com WhatsApp.
- UI nova para todos os passos.
- Refatoracao ampla de services existentes.
- Editor/wiki colaborativa.

## Validacao
- `services/api/src/core/quality/main-flow.e2e.test.ts`
- handoff visual do link de upload em `apps/web/src/main.tsx`
- `npm run check`
