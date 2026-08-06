# TASK-AT-435 - Resultados e acompanhamento por responsáveis

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-435-training-manager-results-compliance.md

## Modo
- mode: implementation
- priority: P1
- generation-mode: initiative-breakdown

## Capability
Training / Management Reporting

## Origem documental
- `TASK-AT-429`, `TASK-AT-433` e `TASK-AT-434`.

## Problema
Responsáveis precisam acompanhar obrigatoriedade, atraso, aprovação e tentativas, mas uma visão nominal ampla ou baseada no time atual pode vazar dados e distorcer histórico.

## Objetivo único
Entregar visão gerencial tenant/team-scoped de progresso e resultados, com export mínimo e sem ranking punitivo.

## Contexto mínimo
O objetivo é gestão de capacitação e compliance de conclusão, não competição individual nem inferência de performance operacional.

## Inputs
- Matriz de acesso da `TASK-AT-429`.
- Assignments/enrollments da `TASK-AT-433`.
- Attempts/resultados da `TASK-AT-434`.

## Escopo
1. Totais por programa/versão/status/equipe/período.
2. Lista nominal autorizada de pendentes, atrasados, aprovados, reprovados e review pendente.
3. Detalhe de tentativas/score/versão no escopo permitido.
4. Export CSV mínimo com filtros e redaction.
5. Reset/override somente com permission, motivo e histórico preservado.

## Fora de escopo
- Ranking, comparação pública ou correlação automática com KPI/SLA.
- Ler resposta aberta sem permissão de review.
- BI externo ou relatório agendado.

## Arquivos ou domínios candidatos
- `services/api/src/core/` — reporting futuro de Treinamento.
- `apps/web/src/views/` — view gerencial futura de Treinamento.
- `docs/api/openapi.v1.yaml`.
- `services/api/src/core/reports/` somente para export comum.

## Requisitos funcionais
1. Agregados distinguem versão e estado do enrollment/attempt.
2. Resultado histórico usa team scope temporal definido pela policy.
3. Reset cria nova tentativa/estado e não sobrescreve resultado anterior.
4. Export reflete filtros e timezone declarados.
5. Nenhuma métrica de treino entra em dashboard operacional de Fluxos/SAC.

## Requisitos de permissão, tenant e auditoria
1. `readTeam`/`readOrg` e `override` são independentes.
2. Supervisor não vê outro time/período nem resposta aberta por default.
3. Export, reset e override são auditados com filtros/motivo redigidos.
4. Cross-tenant/sem escopo não expõe contagem que permita inferência.

## Checklist de execução
1. Definir queries/agregações e dicionário de métricas.
2. Implementar API e filtros tenant/team scoped.
3. Implementar painel e detalhe autorizado.
4. Implementar export/reset/override governados.
5. Cobrir privacidade, timezone e histórico.

## Critérios de aceite
1. Responsável autorizado identifica pendências e resultados do seu escopo.
2. Mudança de equipe não reatribui silenciosamente histórico.
3. Reset/override preserva antes/depois e motivo.
4. Não existe ranking nem escrita/leitura em métricas operacionais.

## Testes esperados
- Agregação por versão/status/equipe/período e timezone.
- Supervisor cross-team, Gestor/Admin e cross-tenant.
- Export filtrado/redigido, reset/override e auditoria.
- Web filters/detail/accessibility e `git diff --check`.

## Riscos
- Relatório nominal virar ferramenta de vigilância.
- Team scope temporal calculado pela data errada.

## Dependências
- satisfeitas: `SupportTeamMembership` histórico e export patterns.
- em aberto: `TASK-AT-429`, `TASK-AT-433` e `TASK-AT-434`; decisão de visibilidade nominal.

## Blockers possíveis
- Política de responsável/time histórico não aprovada.
- Requisito de correlação com performance abrir escopo novo.

## Definição de pronto
1. Painel/API/export respeitam self/team/org.
2. Dicionário de métricas e testes de privacidade estão publicados.
3. Reset/override são reversíveis no histórico e auditados.

## Evidência esperada
- Matriz de filtros/resultados por role.
- Testes comparando time vigente e histórico.

## Próximo passo provável
`TASK-AT-436`

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: entregar acompanhamento sem ranking ou correlação operacional.
- constraints: menor privilégio e histórico preservado.
