# TASK-AT-150 - Provider externo de storage privado

## Metadata
- status: proposed-blocked-by-infra-decision
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
- em aberto: decisao de provider e credenciais.

## Alvos explicitos
1. `services/api/src/core/documents/storage.ts`
2. `services/api/src/core/documents/storage.provider.ts`
3. `docs/operations/production-postgres-storage-readiness.md`
4. `.env.example`

## Fora de escopo
- Migrar arquivos reais antigos sem plano separado.
- Expor arquivos publicamente.

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
2. Smoke de upload/download.
3. Docs e rollback atualizados.

## Validacao
- comandos/checks: testes unitarios, typecheck API, smoke de documentos.
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
