# TASK-AT-412 - Carga, coverage, contratos e gates

## Metadata
- status: implemented-partial-load-evidence-pending
- owner: olympus_taskyfier
- last-updated: 2026-07-18
- source-of-truth: docs/tasks/TASK-AT-412-scheduling-load-coverage-contract-gates.md

## Modo
- mode: verification

## Objetivo unico
Estender TASK-AT-386 com thresholds, contratos e carga para materializacao, cobertura em tempo real, trocas, deep links e recorrencia.

## Contexto minimo
Testes focados nao provam que novos modulos entram no gate raiz ou suportam virada de turno, burst de aprovacoes e fan-out recorrente.

## Dependencias
- satisfeitas: TASK-AT-386, TASK-AT-409, TASK-AT-410 e TASK-AT-411.
- em aberto: carga real, stress/spike/soak, burst de trocas/remarcacoes, contratos versionados completos e ambiente production-like.

## Estado reconciliado em 2026-07-18
- API passou 892 testes e coverage de 80,72% linhas, 66,99% branches e 81,20% funcoes; Web passou 115 testes e coverage de 56,53% linhas, 75,38% branches e 54,84% funcoes. Cinco planos Artillery locais cobrem leitura, invariantes de cobertura, materializacao idempotente, burst de 12 candidaturas e quatro materializadores de recorrencia. O gate estatico 8/8 integra `check:source`; nenhuma carga real foi executada e swaps, fan-out sustentado e recovery production-like continuam pendentes.

## Alvos explicitos
1. Coverage por branch de risco em API/Shared/Web.
2. OpenAPI/contract tests e schemas de evento/stream.
3. Carga, stress, spike e soak da nova frente.

## Fora de escopo
- Reduzir threshold existente para obter verde.
- Chamar smoke local de capacidade de producao.

## Checklist
1. Cobrir precedencia, lock, fallback e branches de dia inexistente/stale.
2. Versionar endpoints, erros, cursor, target e event payloads.
3. Carregar materializacao em lote, virada de turno e timeline multi-time.
4. Aplicar burst de ofertas/trocas/remarcacoes e jobs 14/29.
5. Medir p95/p99, pool, lag, conflito esperado, duplicidade e recovery.
6. Integrar `check`, docs, hygiene e builds afetados.

## Acceptance Criteria
1. Branches criticos atingem threshold definido sem excluir arquivos novos.
2. Drift API/Web/evento falha no CI.
3. Carga nao cria escala/ocorrencia/notificacao duplicada nem breach silencioso.
4. Relatorio informa commit, massa, ambiente e limites.

## Validacao
- comandos/checks: `npm run check`, `npm run coverage:check`, `npm run check:docs`, carga production-like e `git diff --check`.
- revisao manual: coverage de branches criticos e relatorio de carga.

## Riscos
- Scheduler de teste usar calendario real e tornar carga irreproduzivel.

## Proximo passo provavel
TASK-AT-413

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: relogio/massa controlados e evidencia classificada.
