## Resumo
- Task/manifests:
- Escopo alterado:

## Validacao
- Commit validado:
- UTC:
- Ambiente (`fake`, `local`, `production-like`, `live`):
- Operador:
- Comandos, resultados e exit codes:
- [ ] `npm run check`
- [ ] `npm run docs:api` quando contratos/docs mudaram
- [ ] `npm run test:e2e` quando UI/navegacao mudou
- [ ] `npm run db:test:migrations` quando schema/seed mudou
- [ ] `npm run perf:smoke` quando performance/endpoint quente mudou

## Gates
- Fronteira afetada: demo / rollout interno / exposicao externa / nenhuma
- Decisao antes/depois: sem mudanca / `go` / `go-with-risk` / `no-go`
- [ ] Evidencia fake/local nao foi usada para promover gate production-like/live.
- [ ] Screenshot/relato possui contexto e prova tecnica corroborante quando fecha gate.

## Risco e rollback
- Risco:
- Owner e prazo do risco residual:
- Rollback:

## Evidencia
- Manifesto conforme `docs/operations/evidence-manifest.schema.json`:
- Screenshots/logs/relatorios e checksums SHA-256:
- Sensibilidade: public / internal / confidential / restricted
- Redaction aplicada:
- Aprovador/decisao, quando exigido:
