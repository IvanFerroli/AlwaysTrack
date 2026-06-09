# EXEC-AT-021 - SyLembra seed/demo gate

## Metadata
- task-id: AT-027B
- execution-id: EXEC-AT-021
- mode: runtime
- execution-mode: batch-worker
- orchestrator: olympus_orchestrator
- specialist: worker
- status: completed
- date: 2026-06-04

## Sequência operacional aplicada
1. Revisado o residual de `TASK-AT-027` e a fase recomendada `AT-027B`.
2. Mantido o setup comercial como padrao e colocado fixtures SyLembra atras de `ENABLE_LEGACY_SYLEMBRA=true`.
3. Ajustado o flush local para recriar somente organizacao/admin por padrao.
4. Atualizado runbook e task manifest com o novo contrato default/opt-in.
5. Executadas validacoes de API, setup e smoke comercial.

## Artefatos materiais
1. `services/api/prisma/seed.ts`
2. `scripts/flush-local-demo.js`
3. `docs/runbooks/RUNBOOK-001-ambiente-local.md`
4. `docs/tasks/TASK-AT-027-decommission-sylembra-legacy.md`
5. `docs/tasks/EXEC-AT-021-sylembra-seed-demo-gate.md`

## Evidências observáveis
1. `npm run typecheck --workspace @alwaystrack/api` - passou.
2. `npm run setup` - passou.
3. `npm run smoke:beta-local` - passou.
4. Contrato resultante: RT, unidade/setor, profissionais, licencas, documentos, upload token e notificacoes antigas ficam default-off; `ENABLE_LEGACY_SYLEMBRA=true` preserva o seed legado opt-in.

## Blockers
Nenhum.

## Nota para próximo ciclo
`npm run setup` e idempotente: bancos locais que ja tinham linhas SyLembra antigas podem continuar com esses dados ate um reset/flush local. Rotas, services, `job:notifications`, alias `db:flush:demo` e fallback `FLUSH_DEMO_*` seguem preservados por compatibilidade.
