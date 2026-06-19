# Production Postgres and Storage Readiness

## Metadata
- status: active
- owner: ops/platform
- last-updated: 2026-06-19
- source-of-truth: docs/operations/production-postgres-storage-readiness.md
- related-task: docs/tasks/TASK-AT-147-prod-postgres-storage-readiness.md
- related-adrs: docs/adr/ADR-003-contrato-banco-producao.md, docs/adr/ADR-004-contrato-storage-producao.md

## Objetivo
Definir o caminho seguro para sair do contrato local-first atual, SQLite + storage privado local, e operar o AlwaysTrack em producao com banco gerenciado e storage externo sem quebrar o ambiente local de estudo.

## Estado atual
- Banco local: Prisma com `provider = "sqlite"` e `DATABASE_URL=file:./dev.db`.
- Storage local: `LocalStorageProvider` grava em `.storage/private/`.
- Documentos sensiveis: DANFEs, anexos ricos, avatars e artefatos operacionais dependem de banco + storage como par consistente.
- Decisao arquitetural: SQLite/storage local continuam corretos para dev, demo local e piloto mono-host pequeno. Producao real pede Postgres e storage externo.

## Nao fazer
- Nao trocar o `provider` do Prisma direto em uma task visual.
- Nao apontar producao para container/volume efemero sem backup e restore testado.
- Nao copiar `dev.db`, DANFEs ou `.storage/private/` para ticket, chat, docs ou Git.
- Nao misturar dados reais e seed/demo sem identificacao clara.

## Variaveis obrigatorias por ambiente
| Variavel | Local | Staging/producao | Observacao |
| --- | --- | --- | --- |
| `DATABASE_URL` | `file:./dev.db` | Postgres gerenciado | Usar secret manager; nunca commitar |
| `SESSION_SECRET` | valor local forte | valor unico por ambiente | Rotacao invalida sessoes |
| `GOOGLE_LOGIN_ALLOWED_DOMAINS` | dominio de teste | dominio corporativo | Evita login fora da empresa |
| `CORS_ORIGINS` | localhost | URL publica exata | Sem wildcard em producao |
| `STORAGE_PROVIDER` | `local` | `s3`/`gcs`/provider escolhido | Provider externo ainda requer task de implementacao |
| `STORAGE_LOCAL_DIR` | `.storage/private` | volume persistente se mono-host | Nao usar como fonte de verdade multi-instancia |
| `OPENAI_API_KEY` | opcional | secret manager | Necessario para IA real |
| `META_WHATSAPP_*` | opcional | secret manager | Usar apenas se notificacoes externas forem ativadas |
| `REDIS_URL` | opcional/local | Redis gerenciado | Necessario para filas BullMQ fora do processo unico |

## Caminho recomendado para Postgres
1. Criar banco descartavel de staging com backup/PITR habilitado.
2. Criar task propria para provider Postgres:
   - revisar `services/api/prisma/schema.prisma`;
   - trocar datasource para Postgres em branch isolada;
   - gerar baseline de migrations compativel;
   - validar tipos SQLite-specific e campos JSON serializados como texto.
3. Rodar `npx prisma validate --schema services/api/prisma/schema.prisma`.
4. Rodar `npx prisma migrate deploy --schema services/api/prisma/schema.prisma` no banco descartavel.
5. Rodar seed/demo controlado somente se o ambiente for de demonstracao.
6. Executar smoke:
   - login;
   - upload de DANFE;
   - revisao/aprovacao/rejeicao;
   - ranking explicavel;
   - upload/download de anexo de Wiki;
   - auditoria.
7. Executar restore dry-run antes de liberar usuario real.

## Caminho recomendado para storage externo
1. Escolher provider: S3-compatible, GCS ou equivalente corporativo.
2. Implementar adapter que respeite `StorageProvider.put` e `StorageProvider.get`.
3. Definir se download continua proxiado pela API ou usa URL assinada curta.
4. Garantir criptografia em repouso, bucket privado, ACL minima e logs de acesso.
5. Testar par banco + storage com mesmo carimbo de backup.
6. Validar que arquivar anexo remove acesso operacional, mas preserva evidencia no storage e na auditoria.

## Gate antes de exposicao externa
Rodar e registrar evidencia segura:

```bash
npm run prisma:generate
npm run typecheck --workspace @alwaystrack/api
npm run typecheck --workspace @alwaystrack/web
npm run test --workspace @alwaystrack/api
npm run test:e2e:api
npm run security:deps
npm run perf:smoke:report -- --target=http://localhost:4000
```

Se Playwright/Chromium falhar por dependencia do SO, registrar a causa no CI ou instalar a dependencia no runner. Nao tratar falha ambiental como aprovacao funcional.

## Rollback
- App-only: reverter deploy mantendo banco intacto.
- Schema ruim: congelar writes, restaurar backup verificado e subir hotfix compativel.
- Storage ruim: voltar API para provider anterior e restaurar snapshot do mesmo `BACKUP_ID` do banco.
- Integracao externa ruim: desligar provider via env/feature flag e manter operacao manual.

## Criterios de pronto
- Plano de Postgres validado em staging descartavel.
- Plano de storage externo validado com upload/download real.
- Backup e restore dry-run executados sem expor dados.
- `security:deps` sem high/critical em dependencias de producao.
- Smoke de fluxo comercial e conhecimento operacional aprovado.
- Runbook de incidente e responsaveis definidos.
