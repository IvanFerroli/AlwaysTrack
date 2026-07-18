# TASK-AT-390 - Gate final da transformacao operacional SAC

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-390-sac-transformation-final-readiness-gate.md

## Modo
- mode: verification

## Objetivo unico
Emitir decisao reproduzivel de prontidao para demo, rollout interno e exposicao externa da nova operacao SAC.

## Contexto minimo
Implementacao local, seed e screenshots nao bastam para afirmar prontidao. A decisao deve reconciliar requisitos, dados, seguranca, operacao e evidencias por ambiente.

## Dependencias
- satisfeitas: n/a.
- em aberto: TASK-AT-362 a TASK-AT-389, cada uma com evidencia aplicavel.

## Alvos explicitos
1. Matriz requisito -> task -> teste -> evidencia -> owner.
2. Auditoria de ausencia operacional de Vendas e integridade legada.
3. Decisoes separadas GO, GO-WITH-RISK ou NO-GO.

## Fora de escopo
- Corrigir silenciosamente gaps durante o gate.
- Promover evidencia fake/local para live.

## Checklist
1. Reconciliar todas as acceptance criteria e blockers.
2. Verificar zero escrita comercial, ponte read-only e contagens legadas.
3. Verificar capacidade, concorrencia, swaps, overrides e overlap.
4. Verificar formulas, maker-checker, campanhas e dashboard admin.
5. Verificar RBAC, auditoria, observabilidade, coverage, docs, seed e rollback.
6. Registrar riscos aceitos, validade da evidencia e owners de follow-up.

## Acceptance Criteria
1. Nenhuma linha critica da matriz fica sem evidencia ou waiver com prazo/owner.
2. Demo, rollout interno e exposicao externa recebem decisoes independentes.
3. NO-GO em concorrencia, tenancy, integridade de dados ou rollback nao pode ser compensado por aceite visual.
4. O gate prova preservacao do legado e ausencia de nomenclatura/superficie operacional de Vendas.

## Validacao
- comandos/checks: `npm run test:all`, `npm run coverage:check`, `npm run repo:hygiene`, rehearsal aplicavel e `git diff --check`.
- revisao manual: sign-off de produto, engenharia, seguranca e operacao.

## Evidencia esperada
- Commit, ambiente, data UTC, comandos/exit codes, manifests, checksums e decisoes assinadas.
- Classificacao fake, local, production-like ou live para cada evidencia.

## Riscos
- Pressao de data transformar pendencia live em aceite por narrativa.

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: concluir somente com ledger integral e blockers objetivos encerrados ou aceitos formalmente.
