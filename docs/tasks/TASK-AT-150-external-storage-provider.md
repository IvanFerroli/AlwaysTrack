# TASK-AT-150 - Provider externo de storage privado

## Metadata
- status: completed-mvp
- owner: olympus-orchestrator
- last-updated: 2026-06-19
- source-of-truth: docs/tasks/TASK-AT-150-external-storage-provider.md

## Modo
- mode: implementation

## Objetivo unico
Adicionar um adapter externo para `StorageProvider`, como S3/GCS/S3-compatible, mantendo storage local para desenvolvimento.

## Contexto minimo
Arquivos sensiveis hoje ficam em `.storage/private/`. Isso e aceitavel localmente, mas producao multi-instancia precisa storage externo privado.

## Inputs
- Provider escolhido.
- Bucket/container privado.
- Credenciais via secret manager.

## Dependencias
- satisfeitas: `ADR-004`, `TASK-AT-147`.
- implementado: adapter S3-compatible por env, mantendo local como default.
- em aberto: bucket real, credenciais e smoke em staging/producao.

## Alvos explicitos
1. `services/api/src/core/documents/storage.ts`
2. `services/api/src/core/documents/storage.provider.ts`
3. `docs/operations/production-postgres-storage-readiness.md`
4. `.env.example`

## Fora de escopo
- Migrar arquivos reais antigos sem plano separado.
- Expor arquivos publicamente.
- Validar bucket real sem credenciais/infrastrutura disponivel.

## Resultado entregue
1. `StorageProvider` ganhou adapter S3-compatible com assinatura AWS Signature V4 para `PUT` e `GET`.
2. `STORAGE_PROVIDER=local` segue como comportamento padrao.
3. `STORAGE_PROVIDER=s3` exige endpoint, bucket e credenciais antes de subir o provider.
4. Variaveis suportadas:
   - `STORAGE_S3_ENDPOINT`
   - `STORAGE_S3_BUCKET`
   - `STORAGE_S3_REGION`
   - `STORAGE_S3_ACCESS_KEY_ID`
   - `STORAGE_S3_SECRET_ACCESS_KEY`
   - `STORAGE_S3_FORCE_PATH_STYLE`
5. Testes unitarios cobrem parse de env, upload assinado, download assinado/preservando mime type e rejeicao de chave insegura.

## Checklist
1. Criar adapter externo.
2. Manter `local` como default.
3. Validar upload/download de DANFE e anexos.
4. Documentar env vars.
5. Rodar smoke e backup/restore.

## Acceptance Criteria
1. `STORAGE_PROVIDER=local` continua funcionando.
2. Provider externo salva e recupera arquivo privado.
3. URLs continuam autenticadas/proxiadas ou assinadas com TTL curto.

## Definition of Done
1. Testes unitarios do adapter.
2. Smoke unitario de upload/download com `fetch` mockado.
3. Docs e rollback atualizados.
4. Smoke real com bucket privado fica como passo de deploy.

## Validacao
- comandos/checks:
  - `npm run typecheck --workspace @alwaystrack/api`
  - `npm run test --workspace @alwaystrack/api -- storage.test.ts env.test.ts documents.service.test.ts wiki.service.test.ts`
- revisao manual: baixar DANFE e anexo Wiki autenticado.

## Evidencia esperada
- Logs sem nomes de clientes ou chaves.
- Registro de provider usado e tempo de resposta.

## Riscos
- Credenciais vazarem.
- Bucket mal configurado com acesso publico.

## Blockers possiveis
- Provider nao escolhido.
- Sem permissao para criar bucket privado.

## Retorno esperado
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
