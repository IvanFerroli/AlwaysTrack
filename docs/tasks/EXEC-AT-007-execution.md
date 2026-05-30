# EXEC-AT-007 - DANFE extraction, review, ranking and statements

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-05-30
- source-of-truth: docs/tasks/EXEC-AT-007-execution.md

## Escopo
Executar novo lote da trilha comercial priorizando upload de notas com extracao por IA e os primeiros fluxos que dependem dela.

## Entregue
1. `AT-017`: extracao estruturada de DANFE com provider OpenAI/Gemini/fake.
2. `AT-018`: revisao MVP de notas por perfis superiores.
3. `AT-019`: ranking e campanhas read-only com calculo em tempo real.
4. `AT-021`: extratos JSON e CSV simples.
5. UI comercial atualizada para extrair, aprovar/reprovar, ver ranking, campanhas e extratos.

## Validacao
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run test --workspace @alwaystrack/api -- sales-documents.service.test.ts`
- `npm run check`
- `npm run build --workspace @alwaystrack/web`
- `npm run smoke:beta-local`

## Residual
- Rodar gate completo antes de release externa.
- Adicionar editor visual de campos/itens da nota.
- Adicionar CRUD e snapshots de campanhas.
- Implementar filtros visuais de ranking/extratos.
