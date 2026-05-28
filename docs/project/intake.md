# Project Intake - Base SyLembra para template AlwaysTrack

## Metadata
- status: accepted
- owner: pipeline
- last-updated: 2026-05-28
- source-of-truth: docs/project/intake.md

## Fonte canonica
- auditoria de transicao: `docs/operations/auditoria-estado-atual-template-2026-05-27.md`
- documento original SyLembra: `doc/Projeto-—-Sistema-Modular-de-Controle-de-Licenças-COREN-com-Notificações-WhatsAp.txt`

## Objetivo em uma frase
Usar o MVP SyLembra como base limpa para um starter vertical de controle operacional, preparando o repositorio AlwaysTrack para evoluir sem secrets, dados pessoais ou artefatos locais da instancia original.

## Restricoes explicitas
- Nao fazer rebrand amplo enquanto a fronteira do template nao estiver definida.
- Manter commits pequenos, auditaveis e sempre subidos para `origin/main`.
- Remover secrets, identificadores reais, logs sensiveis e artefatos locais antes de qualquer beta.
- Preservar o dominio SyLembra funcional ate existir decisao explicita de genericidade ou produto final.
- Integracoes externas devem continuar opcionais por env, com provider fake/local como padrao seguro.

## Realidade atual do runtime
- Frontend: React 19, TypeScript, Vite e CSS proprio em `apps/web`.
- Backend: Node.js, Express 5, TypeScript, Prisma.
- Banco local: SQLite via `DATABASE_URL=file:./dev.db`.
- Storage atual: local privado em `services/api/.storage/`.
- Jobs: worker de notificacoes executado por npm/cron/Compose.
- Modulos implementados: auth, organizacoes, usuarios, licencas, documentos, importacao CSV/XLSX/Google Sheets, notificacoes WhatsApp, relatorios, auditoria, FAQ e dashboard.

## Incertezas
- Categoria final do template: starter de licencas/compliance, base operacional generica ou AlwaysTrack ja rebrandado.
- Banco e storage de producao: assumir SQLite/local com volumes ou migrar contrato para Postgres/storage externo.
- Nivel de parametrizacao de marca, seed, tenant publico e templates.
- Escopo beta: quais integracoes reais ficam habilitadas e quais permanecem fake/local.

## Proxima fatia recomendada
Fechar a limpeza de template em ordem: manter P0 da auditoria resolvidos, sincronizar runbooks/roadmap com o runtime real, decidir fronteira do template e so entao iniciar rebrand ou extracao estrutural.
