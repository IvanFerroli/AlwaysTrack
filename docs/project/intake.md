# Project Intake - Sistema Modular de Controle de Licencas

## Metadata
- status: accepted
- owner: pipeline
- last-updated: 2026-04-29
- source-of-truth: docs/project/intake.md

## Fonte canonica
- documento central: `doc/Projeto-—-Sistema-Modular-de-Controle-de-Licenças-COREN-com-Notificações-WhatsAp.txt`
- referencias auxiliares: n/a

## Objetivo em uma frase
Construir uma plataforma web modular para controlar profissionais, licencas/documentos, vencimentos, upload, validacao, auditoria, dashboard, relatorios e notificacoes oficiais via WhatsApp.

## Restricoes explicitas
- V1 operacional apresentavel, nao prototipo descartavel.
- Monolito modular; sem microservicos na V1.
- WhatsApp oficial via Meta Cloud API direta; sem Twilio/Zenvia e sem WhatsApp Web.
- Profissional nao tem login completo na V1; usa link seguro/token.
- `User` e `Professional` sao entidades separadas.
- Status de licenca e status de documento nao podem ser misturados.
- Relatorios e auditoria entram desde a V1.

## Decisoes ja tomadas
- Frontend: React, TypeScript, Tailwind CSS, Vite.
- Backend: Node.js, Express, TypeScript, Prisma.
- Banco: PostgreSQL.
- Storage externo privado para arquivos.
- Jobs simples com cron, `NotificationJob` e worker leve.
- Estrutura com `Organization`, `Unit` e `Sector` desde o inicio.

## Incertezas
- Provider final de hosting, banco e storage.
- Dados obrigatorios reais de CPF/documentos por cliente.
- Volume mensal esperado de notificacoes WhatsApp.
- Politica comercial exata para repasse de custo Meta.

## Primeira fatia recomendada
Executar `TASK-DOC-001` e depois `TASK-SCF-001`, mantendo o modelo final em mente antes de qualquer CRUD simplificado.
