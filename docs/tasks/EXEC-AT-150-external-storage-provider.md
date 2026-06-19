# EXEC-AT-150 - Provider S3-compatible para storage privado

## Metadata
- status: completed-mvp
- owner: olympus-orchestrator
- completed-at: 2026-06-19
- related-task: docs/tasks/TASK-AT-150-external-storage-provider.md

## Escopo entregue
- Adapter `S3CompatibleStorageProvider` para `StorageProvider`.
- Configuracao por env com `STORAGE_PROVIDER=s3`, mantendo `local` como default.
- Guard de inicializacao para impedir provider externo parcialmente configurado.
- Testes unitarios do adapter e do parse de ambiente.
- Documentacao operacional atualizada com variaveis e smoke pendente.

## Variaveis
- `STORAGE_PROVIDER=s3`
- `STORAGE_S3_ENDPOINT`
- `STORAGE_S3_BUCKET`
- `STORAGE_S3_REGION`
- `STORAGE_S3_ACCESS_KEY_ID`
- `STORAGE_S3_SECRET_ACCESS_KEY`
- `STORAGE_S3_FORCE_PATH_STYLE`

## Validacao
```bash
npm run typecheck --workspace @alwaystrack/api
npm run test --workspace @alwaystrack/api -- storage.test.ts env.test.ts documents.service.test.ts wiki.service.test.ts
git diff --check
```

## Risco residual
- O smoke com bucket real ainda depende de infraestrutura e credenciais fora do repositorio.
- Migracao de arquivos ja gravados em `.storage/private/` deve ser feita em task/roteiro proprio antes de producao multi-instancia.
