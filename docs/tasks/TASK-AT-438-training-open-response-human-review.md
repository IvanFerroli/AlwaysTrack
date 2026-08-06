# TASK-AT-438 - Revisão humana de respostas abertas

## Metadata
- status: proposed-phase-2
- owner: olympus_taskyfier
- last-updated: 2026-08-05
- source-of-truth: docs/tasks/TASK-AT-438-training-open-response-human-review.md

## Modo
- mode: implementation
- priority: P2
- generation-mode: initiative-breakdown

## Capability
Training / Human Review

## Origem documental
- Evolução da `TASK-AT-432` após o gate `TASK-AT-437`.

## Problema
Resposta aberta pode avaliar raciocínio, mas não possui score determinístico. Atribuir nota automática ou expor texto a qualquer gestor criaria risco pedagógico, de privacidade e auditoria.

## Objetivo único
Criar fluxo governado de rubrica, revisão humana, feedback, contestação e resultado final para respostas abertas.

## Contexto mínimo
IA pode ser estudada em task futura, mas não participa da decisão nem do score desta entrega.

## Inputs
- Open text persistido pela `TASK-AT-432`.
- Matriz `reviewOpenAnswer` da `TASK-AT-429`.
- Reporting da `TASK-AT-435`.

## Escopo
1. Rubrica versionada com critérios/pesos e exemplos sanitizados.
2. Fila de review por responsável autorizado e prazo.
3. Score/feedback manual com maker-checker configurável.
4. Reabertura/contestação e revisão preservando decisões anteriores.
5. Estado `PENDING_REVIEW` até decisão final e recalculo auditável do resultado.

## Fora de escopo
- Auto-grade ou sugestão por IA.
- Plágio/proctoring e moderação de conteúdo automática.
- Expor respostas abertas em export padrão.

## Arquivos ou domínios candidatos
- `services/api/src/core/` — módulo futuro de revisão humana.
- `apps/web/src/views/` — view futura de revisão.
- `services/api/prisma/schema.prisma` e migration aditiva.
- `docs/security/` — política futura de resposta aberta.

## Requisitos funcionais
1. Reviewer usa a rubrica da versão da tentativa.
2. Resultado fica pendente até critérios obrigatórios completos.
3. Nova revisão não apaga score/feedback/ator anterior.
4. Aluno vê feedback somente após publicação da revisão.
5. Contestação possui estado, motivo e SLA explícitos.

## Requisitos de permissão, tenant e auditoria
1. Reviewer precisa de permission e team/org scope aplicável.
2. Texto da resposta é entregue apenas na rota/tela restrita.
3. AuditLog guarda estado/score/IDs/motivo redigido, não a resposta integral.
4. Maker-checker impede autoaprovação quando policy exigir.

## Checklist de execução
1. Definir rubrica/lifecycle e migration mínima.
2. Implementar fila/detail/review/reopen/contest.
3. Integrar recalculo de resultado e notificações.
4. Aplicar redaction e acesso restrito.
5. Cobrir concorrência e decisões conflitantes.

## Critérios de aceite
1. Resposta aberta recebe revisão reproduzível pela rubrica pinada.
2. Histórico de decisões não é sobrescrito.
3. Usuário/reviewer fora do escopo não acessa texto nem existência útil.
4. Nenhuma IA participa do score.

## Testes esperados
- Rubrica/versioning, maker-checker, concorrência e reabertura.
- Cross-team/cross-tenant, reviewer sem permission e redaction.
- Recalculo de score/result e notificação final idempotente.
- Web review accessibility e `git diff --check`.

## Riscos
- Review manual virar gargalo operacional.
- Resposta livre conter dado pessoal/sensível.

## Dependências
- satisfeitas: `OPEN_TEXT` e reporting planejados.
- em aberto: `TASK-AT-437` com GO; responsável/SLA/rubrica/contestação aprovados.

## Blockers possíveis
- Nenhum owner/SLA humano para a fila.
- Política de privacidade/retenção da resposta não aprovada.

## Definição de pronto
1. Rubrica, fila, review, contestação e resultado auditável entregues.
2. Privacy/access tests verdes e conteúdo fora dos logs.
3. Runbook de SLA/recovery aprovado.

## Evidência esperada
- Matriz de estados e exemplo sanitizado de rubrica/revisão.
- Testes de acesso e histórico concorrente.

## Próximo passo provável
Avaliar IA apenas em ADR/task específica posterior.

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: implementar revisão humana antes de qualquer estudo de IA.
- constraints: sem auto-grade e sem resposta em export/log genérico.
