# ADR-003 - Contrato de banco de dados para producao

## Metadata
- status: accepted
- owner: olympus_orchestrator
- last-updated: 2026-06-17
- source-of-truth: docs/adr/ADR-003-contrato-banco-producao.md

## Contexto
O runtime atual usa SQLite via `provider = "sqlite"` no schema Prisma e `DATABASE_URL=file:./dev.db`.
A documentacao inicial (docs/project/intake.md versao original) mencionava PostgreSQL como alvo, mas o codigo nunca foi baseado nele.
A auditoria em `docs/operations/auditoria-estado-atual-template-2026-05-27.md` (secao 6 e 11.2) aponta que esta diferenca e um risco de template.
O ROADMAP item 4 exige que essa decisao seja tomada antes de prometer beta externo.

## Decisao
O starter AlwaysTrack adota **SQLite como contrato local-first** para desenvolvimento, demo e ambientes sem requisito de concorrencia ou alta disponibilidade.

Para producao real com multiplos usuarios simultaneos, o contrato correto e **PostgreSQL**. A migracao de SQLite para PostgreSQL e tecnicamente viavel via Prisma (troca de provider e ajuste de tipos de migration), mas exige uma task propria com:
- ajuste do `provider` no schema;
- revisao de tipos especificos de SQLite (sem enum nativo, sem JSON nativo em versoes antigas);
- nova migration de baseline;
- escolha de servico/host Postgres;
- revisao do Compose de producao.

## Alternativas consideradas
1. Manter SQLite e nao documentar Postgres: rejeitado porque omite risco operacional real de concorrencia e backup.
2. Migrar imediatamente para Postgres: rejeitado porque exige refatoracao antes de qualquer beta claro e sem ganho imediato para demo local.
3. Assumir SQLite em producao com WAL e backups periódicos: valido para instancias pequenas, mas nao deve ser a promessa default do starter.

## Consequencias
- positivas: starter continua funcionando localmente sem dependencia externa; onboarding e rapido.
- negativas: producao com multiplos usuarios exige migracao antes de beta serio.
- trade-offs: complexidade zero agora, migracao controlada quando houver volume real.
- operacionais: enquanto SQLite for usado fora de dev, o ambiente precisa seguir `docs/operations/backup-restore-runbook.md` com volume persistente, backup testado, RPO/RTO aceito e restore dry-run periodico.

## Impacto em artefatos
- specs relacionadas: n/a
- tasks relacionadas: docs/tasks/ROADMAP.md item 4
- runbooks relacionados: docs/runbooks/RUNBOOK-001-ambiente-local.md, docs/runbooks/RUNBOOK-002-deploy-producao-jobs.md, docs/operations/backup-restore-runbook.md

## Validacao e evidencia esperada
- validacao: `npx prisma validate --schema services/api/prisma/schema.prisma` passa com provider sqlite.
- evidencia: este ADR registrado, ROADMAP item 4 fechado; politica de backup/restore registrada em `docs/operations/backup-restore-runbook.md`.

## Fora de escopo
Esta ADR nao executa a migracao para Postgres. A migracao deve ser feita em task propria quando houver decisao de beta com multiplos usuarios simultaneos.
