# Backup Restore Runbook

## Metadata
- status: active
- owner: ops/platform
- last-updated: 2026-06-17
- source-of-truth: docs/operations/backup-restore-runbook.md
- related-task: docs/tasks/TASK-AT-113-database-backup-and-data-protection-hardening.md
- related-adrs: docs/adr/ADR-003-contrato-banco-producao.md, docs/adr/ADR-004-contrato-storage-producao.md

## Objetivo
Proteger banco, storage privado e evidencias operacionais do AlwaysTrack contra perda de volume, corrupcao, erro humano e rollback de deploy, sem copiar dados sensiveis para docs, logs ou tickets.

## Classificacao de dados
| Classe | Onde fica | Sensibilidade | Regra de backup |
| --- | --- | --- | --- |
| Usuarios, roles e sessoes | SQLite/Postgres via Prisma | pessoal e acesso | backup criptografado e acesso restrito |
| Vendedores, grupos, metas e campanhas | banco | comercial | backup diario no minimo |
| DANFEs, itens, totais e extracoes | banco + storage local | fiscal/comercial sensivel | backup coordenado DB + storage |
| Wiki, FAQ, Avisos e Scriptoteca | banco + anexos no storage | conhecimento interno | backup diario no minimo |
| Auditoria e diagnosticos | banco/logs | evidencia operacional | preservar conforme retencao |
| Segredos e envs | fora do Git/provider de secrets | segredo operacional | nao entram em backup de aplicacao salvo cofre proprio |

## Metas RPO/RTO
| Ambiente | Banco recomendado | Storage recomendado | RPO | RTO | Observacao |
| --- | --- | --- | --- | --- | --- |
| Desenvolvimento local | SQLite `file:./dev.db` | `.storage/private` local | best effort | best effort | pode recriar com seed; dados locais nao sao fonte oficial |
| Demo controlada | SQLite em volume persistente | volume persistente | 24h | 4h | aceitavel se dados forem demo ou amostra autorizada |
| Piloto interno mono-host | SQLite com WAL/backups ou Postgres gerenciado | volume persistente com snapshot ou bucket privado | 4h | 4h | SQLite so se houver baixa concorrencia e janela de manutencao clara |
| Producao externa/multiusuario | Postgres gerenciado | S3/GCS/S3-compatible privado | 1h | 2h | migracao deve ser task propria antes de promessa comercial ampla |

## Decisao SQLite vs Postgres
- SQLite continua adequado para desenvolvimento, demo local e piloto pequeno mono-host com baixo volume de escrita.
- SQLite em producao exige volume persistente, backup testado, um unico writer efetivo e plano de manutencao para corrupcao/lock.
- Postgres e a recomendacao para producao real com multiplos usuarios, maior concorrencia, backup gerenciado, replica/PITR e operacao sem parar a API para copia segura.
- Migrar para Postgres nao esta neste runbook; abrir task propria para trocar `provider`, revisar migrations e criar baseline.

## Retencao minima
| Artefato | Retencao inicial | Local | Observacao |
| --- | --- | --- | --- |
| Backup diario DB | 14 dias | storage criptografado fora do host da API | manter pelo menos 2 restauracoes recentes testaveis |
| Backup semanal DB | 8 semanas | storage criptografado fora do host da API | usar para erro descoberto tarde |
| Snapshot storage diario | 14 dias | fora do volume ativo | coordenar com backup DB |
| Snapshot storage semanal | 8 semanas | fora do volume ativo | preservar estrutura de caminhos |
| Logs operacionais sem segredo | 30 dias ou politica interna menor | log provider | nao anexar payload bruto |
| Dumps manuais de incidente | menor prazo possivel | cofre restrito | apagar apos restauracao/auditoria |

Se houver requisito fiscal/juridico especifico para DANFE, ele deve substituir esta retencao minima e ser registrado fora deste runbook tecnico.

## Regras de protecao
- Nunca commitar `dev.db`, dumps, `.env*`, `.storage/`, arquivos de DANFE ou backups.
- Nunca colar `DATABASE_URL`, `REDIS_URL`, cookies, tokens, senhas, chaves Google ou payload bruto de nota em docs/logs.
- Backups precisam ficar fora do host primario ou em snapshot gerenciado pelo provider.
- Arquivos de backup devem ser criptografados pelo provider/volume; quando exportados manualmente, usar storage criptografado e ACL minima.
- Permissao recomendada: diretorios `0700`, arquivos `0600`, dono igual ao usuario do processo/ops.
- Backup de banco e storage deve ter o mesmo carimbo de tempo para facilitar restore consistente.

## Backup SQLite local ou demo
Use apenas com a API parada ou em janela sem escrita. Para copia online de SQLite em producao, preferir `sqlite3 ".backup"` ou snapshot do volume; `cp` direto so e aceitavel com writes parados.

```bash
export BACKUP_ID="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p .backups/"$BACKUP_ID"

# Pare API/workers antes deste ponto em demo/piloto SQLite.
cp services/api/prisma/dev.db ".backups/$BACKUP_ID/dev.db"
tar -C services/api -czf ".backups/$BACKUP_ID/storage-private.tgz" .storage/private

chmod 700 .backups ".backups/$BACKUP_ID"
chmod 600 ".backups/$BACKUP_ID/dev.db" ".backups/$BACKUP_ID/storage-private.tgz"
```

Validacao sem expor dados:

```bash
DATABASE_URL="file:$(pwd)/.backups/$BACKUP_ID/dev.db" \
  npx prisma db execute --schema services/api/prisma/schema.prisma --stdin <<'SQL'
SELECT 1;
SQL

tar -tzf ".backups/$BACKUP_ID/storage-private.tgz" >/dev/null
```

## Restore dry-run SQLite local
Nao restaure por cima do banco ativo para teste. Use diretorio temporario e rode apenas consultas tecnicas.

```bash
export BACKUP_ID="YYYYMMDDTHHMMSSZ"
export RESTORE_TMP="$(mktemp -d)"

cp ".backups/$BACKUP_ID/dev.db" "$RESTORE_TMP/dev.db"
mkdir -p "$RESTORE_TMP/storage"
tar -C "$RESTORE_TMP/storage" -xzf ".backups/$BACKUP_ID/storage-private.tgz"

DATABASE_URL="file:$RESTORE_TMP/dev.db" \
  npx prisma db execute --schema services/api/prisma/schema.prisma --stdin <<'SQL'
SELECT 1;
SQL

find "$RESTORE_TMP/storage" -type f | wc -l
rm -rf "$RESTORE_TMP"
```

Nao registre a lista de arquivos se ela contiver nomes de clientes, chaves de acesso ou outros dados sensiveis; use apenas contagem.

## Backup Postgres recomendado
Use quando a migracao para Postgres existir. Nao informe senha na linha de comando; use secret manager, `.pgpass` restrito ou variavel injetada pelo provider.

```bash
export BACKUP_ID="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p ".backups/$BACKUP_ID"

pg_dump \
  --format=custom \
  --no-owner \
  --no-acl \
  --file=".backups/$BACKUP_ID/alwaystrack.pgcustom" \
  "$DATABASE_URL"

tar -C services/api -czf ".backups/$BACKUP_ID/storage-private.tgz" .storage/private
chmod 600 ".backups/$BACKUP_ID/alwaystrack.pgcustom" ".backups/$BACKUP_ID/storage-private.tgz"
```

Validacao sem dados:

```bash
pg_restore --list ".backups/$BACKUP_ID/alwaystrack.pgcustom" >/dev/null
tar -tzf ".backups/$BACKUP_ID/storage-private.tgz" >/dev/null
```

## Restore dry-run Postgres
Use banco temporario sem usuarios reais conectados.

```bash
createdb alwaystrack_restore_check
pg_restore \
  --dbname="postgresql://localhost/alwaystrack_restore_check" \
  --clean \
  --if-exists \
  ".backups/$BACKUP_ID/alwaystrack.pgcustom"

psql "postgresql://localhost/alwaystrack_restore_check" -c "SELECT 1;"
dropdb alwaystrack_restore_check
```

## Backup de volumes Docker
O Compose de referencia usa `api-data` para Prisma/SQLite e `api-storage` para `.storage`. Em mono-host, faca snapshot ou tar dos volumes com API/workers parados.

```bash
export BACKUP_ID="$(date -u +%Y%m%dT%H%M%SZ)"
mkdir -p ".backups/$BACKUP_ID"

docker compose --env-file .env.production -f deploy/docker-compose.example.yml stop api notification-job ranking-snapshot-worker

docker run --rm \
  -v alwaystrack_api-data:/volume:ro \
  -v "$(pwd)/.backups/$BACKUP_ID:/backup" \
  alpine tar -C /volume -czf /backup/api-data.tgz .

docker run --rm \
  -v alwaystrack_api-storage:/volume:ro \
  -v "$(pwd)/.backups/$BACKUP_ID:/backup" \
  alpine tar -C /volume -czf /backup/api-storage.tgz .

docker compose --env-file .env.production -f deploy/docker-compose.example.yml start api notification-job ranking-snapshot-worker
```

Confirme o nome real dos volumes com `docker volume ls`; o prefixo pode mudar conforme o nome do projeto Compose.

## Procedimento de restauracao real
1. Declare incidente e congele writes: parar API, workers, jobs e crons.
2. Identifique backup candidato por data, ambiente e hash/checksum.
3. Restaure primeiro em ambiente temporario e rode `SELECT 1`, healthcheck e login admin de teste.
4. Restaure banco e storage como par consistente do mesmo `BACKUP_ID`.
5. Suba API/workers.
6. Rode `curl https://<api-host>/health`, login administrativo e uma leitura de tela critica.
7. Registre no canal privado: janela, responsavel, backup usado, tempo de restore e risco residual. Nao anexar dump nem payload.

## Checklist periodico
- Diario: backup DB e storage criado fora do host primario.
- Semanal: restore dry-run em ambiente temporario.
- Antes de migration/deploy com schema: backup verificavel e `docs/operations/migration-rollback-runbook.md`.
- Antes de beta externo: decidir Postgres/storage externo ou aceitar formalmente mono-host com RPO/RTO deste runbook.
- Mensal: revisar retencao e apagar backups expirados.

## Evidencia segura
Pode registrar:
- comando executado;
- status passou/falhou;
- duracao aproximada;
- tamanho total aproximado do artefato;
- contagem de arquivos restaurados;
- hash/checksum do arquivo de backup.

Nao registrar:
- conteudo de tabelas;
- nomes de clientes/compradores;
- chaves de acesso de DANFE;
- caminhos completos com identificadores sensiveis;
- URLs completas com credenciais.

