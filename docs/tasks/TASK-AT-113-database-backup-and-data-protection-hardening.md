# TASK-AT-113 - Seguranca: banco, backup e protecao de dados

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-06-17
- source-of-truth: docs/tasks/TASK-AT-113-database-backup-and-data-protection-hardening.md
- execution: docs/tasks/EXEC-AT-113-database-backup-and-data-protection-hardening.md

## Modo
- mode: audit

## Objetivo unico
Definir como proteger dados do banco, backups e arquivos armazenados antes de producao real.

## Contexto minimo
O schema Prisma usa SQLite no momento. Isso e excelente para desenvolvimento e demo local, mas producao com multiplos usuarios e dados sensiveis pode exigir decisoes:
- backup automatico;
- criptografia em repouso pelo provedor/volume;
- permissao de arquivo;
- retencao;
- restauracao testada;
- migracao futura para Postgres se necessario.

## Inputs
- `services/api/prisma/schema.prisma`
- `deploy/docker-compose.example.yml`
- `services/api/src/core/documents/storage.ts`
- `docs/adr/ADR-003-contrato-banco-producao.md`
- `docs/adr/ADR-004-contrato-storage-producao.md`

## Dependencias
- satisfeitas: ADRs de contrato de banco/storage existem.
- em aberto: decisao de hospedagem e volume.

## Alvos explicitos
1. Politica de backup.
2. Politica de restauracao.
3. Politica de retencao de dados.
4. Revisao de SQLite versus Postgres para producao.
5. Protecao do storage de arquivos.

## Explicacao simples
Seguranca tambem e disponibilidade e recuperacao. Se der problema no servidor, ransomware, erro humano ou arquivo corrompido, precisa existir backup que realmente restaura.

## Fora de escopo
- Migrar imediatamente para Postgres.
- Implementar criptografia customizada de todos os campos.
- LGPD juridica completa.

## Checklist
1. Classificar dados: pessoais, comerciais, notas, conhecimento, logs.
2. Definir RPO/RTO simples:
   - quanto dado pode perder;
   - em quanto tempo precisa voltar.
3. Definir estrategia para backup do DB e storage.
4. Testar restauracao em ambiente local.
5. Documentar permissao de volume e acesso administrativo.
6. Avaliar se SQLite atende 1000 usuarios simultaneos e producao externa.
7. Se Postgres for recomendado, criar task separada de migracao.

## Acceptance Criteria
1. Existe runbook de backup e restore.
2. Existe criterio documentado para continuar com SQLite ou migrar.
3. Storage de arquivos entra no plano de backup.
4. Restauracao foi testada pelo menos uma vez em local/demo.
5. Dados sensiveis nao sao copiados para docs/logs.

## Definition of Done
1. `docs/operations/backup-restore-runbook.md` criado.
2. Decisao registrada em ADR ou update dos ADRs existentes.
3. Task futura aberta se precisar migrar DB.

## Validacao
- comandos/checks: script manual de backup/restore documentado.
- revisao manual: executar restauracao em ambiente local com dados demo.

## Evidencia esperada
- Checklist de restore concluido.
- Tempo aproximado de backup/restore.

## Evidencia de execucao
- Runbook criado: `docs/operations/backup-restore-runbook.md`.
- ADR-003 e ADR-004 atualizadas com referencia operacional ao runbook.
- Restore local seguro validado via `npm run db:test:migrations`, que cria SQLite temporario, aplica schema/seed demo, copia backup e confirma restore path sem dados reais.
- Checklist documental concluido em `docs/tasks/EXEC-AT-113-database-backup-and-data-protection-hardening.md`.

## Follow-up recomendado
- Abrir task propria para migracao PostgreSQL antes de producao externa/multiusuario.
- Abrir task propria para provider externo de storage antes de deploy multi-instancia ou sem filesystem persistente.

## Riscos
- Backup sem teste da falsa sensacao de seguranca.
- SQLite em volume compartilhado pode virar gargalo em producao.

## Blockers possiveis
- Falta de infraestrutura final.

## Retorno esperado
- Recomendacao clara para demo, piloto interno e producao.
- Proximas tasks se houver migracao de banco/storage.
