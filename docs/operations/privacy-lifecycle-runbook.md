# Privacy Lifecycle Runbook

## Metadata
- status: active-local-validation
- owner: privacy + api-operations
- last-updated: 2026-07-15
- source-of-truth: docs/operations/privacy-lifecycle-runbook.md
- related-task: docs/tasks/TASK-AT-328-privacy-retention-lifecycle-enforcement.md

## Objetivo
Executar retencao e exclusao CaseFlow de forma tenant-scoped, redigida, idempotente e recuperavel. Este runbook nao autoriza dados reais nem substitui aprovacao do controlador/juridico.

## Inventario executavel
| Politica | Persistencia real | Controle |
| --- | --- | --- |
| Conversa minima, 30 dias por default | `EvidenceFact` com `key` iniciando em `conversation.` | substitui `valueJson` e `normalizedValueJson` por marcador irreversivel, preservando referencias estruturais |
| Diagnosticos, 7 dias por default | `ConnectorRun.diagnosticsJson` e `ConnectorHealthEvent.diagnosticsJson` | define o campo como `null` depois do cutoff |
| Cache, 15 minutos por default | nenhum modelo/tabela de cache de conteudo CaseFlow; apenas headers HTTP e infraestrutura Redis de fila foram encontrados | sem alvo de purge; nao criar tabela por inferencia |

Todos os filtros incluem `organizationId`. Registros no cutoff ou mais novos ficam fora. Valores ja anonimizados e diagnosticos `null` nao voltam a ser afetados, tornando retries idempotentes quanto aos dados.

## Dry-run obrigatorio
O entrypoint usa dry-run por default e exige um tenant explicito:

```bash
cd services/api
PRIVACY_ORGANIZATION_ID='<tenant-id>' \
  npx tsx src/jobs/privacy-lifecycle.ts
```

O resultado permitido contem somente modo, cutoff, contagens e metadados do job. Nao registrar IDs de caso, texto de conversa, diagnosticos ou erros brutos. Para agendamento, configure o scheduler da plataforma uma vez por dia, em UTC, com uma invocacao separada por tenant; nunca use enumeracao global dentro do job.

## Aprovacao de execute
Execute somente depois de:

1. dry-run revisado pelo owner de privacy;
2. backup verificavel conforme `docs/operations/backup-restore-runbook.md`;
3. janela e tenant confirmados por operacoes;
4. aprovacao juridica/controlador quando o ambiente contiver dados reais.

O modo destrutivo e fail-closed e exige confirmacao vinculada ao tenant:

```bash
cd services/api
PRIVACY_ORGANIZATION_ID='<tenant-id>' \
PRIVACY_LIFECYCLE_MODE='execute' \
PRIVACY_EXECUTION_CONFIRMATION='<tenant-id>:PURGE_EXPIRED_DIAGNOSTICS' \
  npx tsx src/jobs/privacy-lifecycle.ts
```

Este comando e apenas procedimento documentado. Nao foi executado na TASK-AT-328.

## Exclusao por direito do titular
`deleteServiceCaseData` nao esta exposto por rota publica. O chamador interno deve fornecer um `CurrentUser` autenticado com role `ADMIN`. Para `dryRun: false`, tambem deve fornecer `requestId` e um `approvedById` de outro administrador ativo no mesmo tenant. A autorizacao e validada antes de consultar o caso.

O caso e todas as dependencias reais (`EvidenceConflict`, `EvidenceFact`, `ConnectorRun` e `ServiceCaseSource`) sao removidos em uma unica transacao. Caso inexistente, caso de outro tenant e retry depois da exclusao retornam o mesmo estado `not_found`. IDs do alvo e da solicitacao aparecem na auditoria apenas como SHA-256.

## Auditoria e reconciliacao
- `privacy.lifecycle.started` e persistido antes de qualquer mutacao.
- Cada alvo gera `target_completed` ou `target_failed`; falhas usam apenas `PURGE_TARGET_FAILED`.
- A execucao termina em `privacy.lifecycle.completed` ou `privacy.lifecycle.failed`.
- Exclusoes registram `started`, `completed`, `failed` ou `denied`, sem motivo bruto, texto ou ID em claro.
- A chave de dedupe usa job, tenant, dia UTC e modo. Reuse os mesmos dados no retry.

Se um alvo falhar, os demais podem concluir. O job retorna falha para retry, e filtros idempotentes fazem o retry atingir somente dados ainda elegiveis. Um evento `started` sem terminal indica interrupcao ou indisponibilidade de auditoria posterior e deve ser reconciliado antes de nova janela.

## Falha e rollback
1. Nao altere tenant, cutoff ou modo durante o retry.
2. Consulte auditoria por `PrivacyLifecycle` e o hash da chave de dedupe; nao consulte payloads pessoais.
3. Se a auditoria inicial falhar, nenhuma mutacao e iniciada.
4. Se a exclusao de caso falhar, a transacao deve reverter integralmente; preserve o evento redigido `DELETE_FAILED`.
5. Retencao executada e irreversivel no banco ativo. Restauracao exige processo de incidente e backup, nunca update manual de payload.

## Validacao segura
```bash
npm run test --workspace @alwaystrack/api -- --run \
  src/core/case-flow/audit.test.ts \
  src/core/jobs/privacy-lifecycle.jobs.test.ts
npm run typecheck --workspace @alwaystrack/api
git diff --check
```

Use apenas fixtures/mocks locais. Nao aponte `DATABASE_URL` ou `REDIS_URL` para ambiente real durante esta validacao.
