# TASK-AT-329 Local Recovery Evidence

## Metadata
- status: active
- owner: ops/platform
- last-updated: 2026-07-15
- source-of-truth: docs/operations/recovery-drills/TASK-AT-329-local-evidence.md
- related-task: docs/tasks/TASK-AT-329-recovery-restore-rollback-drill.md

## Classificacao
- environment: isolated local temporary directory
- evidence: local/fake
- operator: automated local harness
- external systems: none
- credentials or user data: none

## Resultado de referencia
Em 2026-07-15, o ensaio focado concluiu o caminho GO com RPO observado de 300.000 ms e RTO de 3.853 ms. A suite focada final executou 9 testes com sucesso. Estes tempos sao evidencia local/fake e nao constituem promessa de ambiente produtivo.

| Check | Resultado esperado |
| --- | --- |
| Snapshot e candidato restaurado | inventario, tamanho e SHA-256 reconciliados |
| SQLite | `integrity_check=ok`, zero violacao FK |
| CaseFlow | um caso, uma fonte, um run terminal, uma evidencia, zero duplicacao |
| Storage e configuracao | fixture fake e firewall `SUBMIT` reconciliados |
| Companion | Host/Extension no protocolo `1`, artefato conhecido como bom |
| RPO/RTO | valores observados no JSON, ambos dentro dos limites locais |
| Falha fechada | checksum, protocolo, banco ou objetivo invalido impedem promocao |

## Evidencia reproduzivel

```bash
node scripts/recovery/restore-drill.mjs
node --test tests/recovery/restore-drill.test.mjs
npm run typecheck --workspaces --if-present
npm run repo:hygiene
git diff --check
```

O JSON da CLI contem timestamps UTC, RPO/RTO em milissegundos, targets, checks e classificacao. Nao persistir o SQLite, o snapshot ou o diretorio temporario em Git, ticket ou storage compartilhado.

## Riscos residuais
Continuam pendentes Postgres/PITR, storage externo, volumes reais, pacotes assinados, Windows/WSL/Chromium, pairing, firewall do host, carga operacional e execucao com operador em ambiente production-like. Portanto, `LOCAL_ONLY` nunca pode ser promovido a evidencia live.
