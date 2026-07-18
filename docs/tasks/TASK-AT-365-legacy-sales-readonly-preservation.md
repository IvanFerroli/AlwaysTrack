# TASK-AT-365 - Preservacao read-only do legado de Vendas

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-365-legacy-sales-readonly-preservation.md

## Modo
- mode: migration

## Objetivo unico
Preservar registros, relacionamentos e exportacao do legado comercial com acesso administrativo read-only, sem mante-lo como superficie operacional.

## Contexto minimo
`SalesDocument`, extracoes, itens, perfis, grupos, campanhas e snapshots possuem valor historico e de auditoria. A retirada de Vendas nao autoriza exclusao nem reinterpretacao.

## Dependencias
- satisfeitas: TASK-AT-362 e TASK-AT-364.
- em aberto: politica formal de retencao continua sendo governada pelas tasks LGPD existentes.

## Alvos explicitos
1. Marcacao aditiva de dominio/estado legado onde necessaria.
2. Consultas e exportacao administrativa read-only escopadas por tenant.
3. Manifesto de contagem, checksums e reconciliacao antes/depois.

## Fora de escopo
- Corrigir notas, recalcular ranking ou editar campanhas comerciais.
- Excluir arquivos ou payloads historicos.

## Checklist
1. Gerar baseline por tabela, tenant, status e periodo.
2. Criar migracao/backfill idempotente e reversivel por forward fix.
3. Preservar chaves, timestamps, autores e payloads de snapshot.
4. Restringir arquivo legado a ADMIN e exportacao auditada.
5. Redigir dados conforme politicas existentes sem quebrar referencial historico.

## Acceptance Criteria
1. Contagens e relacionamentos permanecem reconciliados apos migracao.
2. Nenhuma API read-only aceita mutacao por metodo alternativo.
3. A exportacao identifica claramente `SALES_LEGACY` e nao usa labels SAC.
4. Acesso cross-tenant e roles sem permissao retornam resposta segura.

## Validacao
- comandos/checks: migration test SQLite/Postgres production-like, testes anti-IDOR, `npm run repo:hygiene` e `git diff --check`.
- revisao manual: comparar manifesto antes/depois e restaurar backup isolado.

## Riscos
- Backfill parcial deixar campanhas ou snapshots sem proveniencia.

## Proximo passo provavel
TASK-AT-366

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: migracao somente aditiva, com dry-run e reconciliacao.
