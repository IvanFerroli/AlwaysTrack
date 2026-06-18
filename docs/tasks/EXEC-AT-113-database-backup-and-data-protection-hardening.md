# EXEC-AT-113 - Seguranca: banco, backup e protecao de dados

## Resultado
- status: completed
- date: 2026-06-17
- task: docs/tasks/TASK-AT-113-database-backup-and-data-protection-hardening.md

## Entrega
Criado runbook operacional de backup/restore para banco e storage privado, com criterios de uso de SQLite versus Postgres por ambiente e politica inicial de RPO/RTO/retencao.

## Escopo coberto
1. Classificacao de dados sensiveis de usuarios, comercial, DANFE, conhecimento, auditoria e segredos.
2. RPO/RTO para desenvolvimento, demo, piloto interno e producao externa.
3. Comandos manuais para backup e restore dry-run de SQLite/local storage sem imprimir dados.
4. Receita futura para Postgres, incluindo `pg_dump`, `pg_restore` e validacao sem expor payload.
5. Protecao de volumes Docker `api-data` e `api-storage`.
6. ADR-003 e ADR-004 atualizadas com apontamento operacional ao runbook.

## Validacao
- Revisao documental contra `schema.prisma`, `docker-compose.example.yml`, `storage.ts`, ADR-003 e ADR-004.
- `npm run db:test:migrations` passou.
- `git diff --check` passou.
- `npm run repo:hygiene` passou apos trocar exemplo de env em `EXEC-AT-110` por descricao sem padrao de segredo.

## Risco residual
- Restore real com dados de staging/producao depende de infraestrutura final e nao foi executado neste slice.
- Producao externa ainda deve abrir task propria para migrar para Postgres e provider externo de storage antes de promessa multiusuario ampla.
- Os comandos Docker usam nomes de volume exemplares; o operador deve confirmar o prefixo real com `docker volume ls`.
