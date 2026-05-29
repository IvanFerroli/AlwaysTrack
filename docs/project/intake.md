# Project Intake - AlwaysTrack

## Metadata
- status: accepted
- owner: product-builder
- last-updated: 2026-05-29
- source-of-truth: docs/project/intake.md

## Fonte canonica
- baseline de produto: `docs/specs/SPEC-AT-001-product-baseline.md`
- auditoria de transicao: `docs/operations/auditoria-estado-atual-template-2026-05-27.md`
- origem historica arquivada: `docs/archive/sylembra/`

## Objetivo em uma frase
Evoluir o AlwaysTrack como starter vertical de licencas/compliance, com operacao local segura, dados seedados anonimos e caminho incremental para beta controlado.

## Restricoes explicitas
- Manter commits pequenos, auditaveis e sempre subidos para `origin/main`.
- Remover secrets, identificadores reais, logs sensiveis e artefatos locais antes de qualquer beta.
- Preservar o dominio funcional de licencas/compliance ate existir decisao explicita de genericidade.
- Integracoes externas devem continuar opcionais por env, com provider fake/local como padrao seguro.
- Nao reabrir tasks SyLembra arquivadas como backlog ativo.

## Realidade atual do runtime
- Frontend: React 19, TypeScript, Vite e CSS proprio em `apps/web`.
- Backend: Node.js, Express 5, TypeScript, Prisma.
- Banco local: SQLite via `DATABASE_URL=file:./dev.db`.
- Storage atual: local privado em `services/api/.storage/`.
- Jobs: worker de notificacoes executado por npm/cron/Compose.
- Modulos implementados: auth, organizacoes, usuarios, licencas, documentos, importacao CSV/XLSX/Google Sheets, notificacoes WhatsApp, relatorios, auditoria, FAQ e dashboard.

## Incertezas
- Escopo beta: quais integracoes reais ficam habilitadas e quais permanecem fake/local.
- Nivel de polimento necessario no fluxo operacional principal antes de beta externo.
- Se e quando extrair uma base SaaS generica a partir deste starter vertical.

## Proxima fatia recomendada
Executar a trilha `TASK-AT-*`: baseline de produto, limpeza de copy/seed, contrato explicito de seed local, fluxo operacional principal e gate de beta.
