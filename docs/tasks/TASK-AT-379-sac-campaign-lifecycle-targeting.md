# TASK-AT-379 - Ciclo de vida e segmentacao de Campanhas SAC

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-379-sac-campaign-lifecycle-targeting.md

## Modo
- mode: implementation

## Objetivo unico
Permitir criar, revisar, publicar, pausar e encerrar campanhas SAC com audiencia, periodo, metrica e meta governados.

## Contexto minimo
Campanha SAC deve orientar uma iniciativa operacional sem recriar ranking. Audiencia e regra precisam ficar congeladas por versao para explicar resultados.

## Dependencias
- satisfeitas: TASK-AT-378 e TASK-AT-364.
- em aberto: n/a.

## Alvos explicitos
1. APIs CRUD/lifecycle de Campanhas SAC.
2. Workspace de lista, formulario, preview de audiencia e historico.
3. Auditoria e notificacoes de mudanca de estado.

## Fora de escopo
- Disparo externo automatizado.
- Premio, comissao ou gamificacao.

## Checklist
1. Definir nome, objetivo, metrica, meta, periodo, time/audiencia e owner.
2. Validar periodo contra definicao versionada da metrica.
3. Congelar snapshot de audiencia ao publicar, com regra de novos membros explicita.
4. Bloquear edicao destrutiva de campanha ativa/encerrada.
5. Registrar transicoes e notificar audiencia de forma deduplicada.

## Acceptance Criteria
1. Rascunho nao aparece para audiencia operacional.
2. Publicacao mostra exatamente quem/qual time e quais dados alimentarao o resultado.
3. Pausa/encerramento preservam historico e nao alteram Performance aprovada.
4. Nenhuma configuracao aceita `ranking` ou dados `SALES_LEGACY` como fonte.

## Validacao
- comandos/checks: testes service/HTTP/RBAC/notificacao/Web e typecheck.
- revisao manual: criar, publicar, pausar e encerrar por duas equipes.

## Riscos
- Mudanca de membership durante campanha produzir audiencia ambigua.

## Proximo passo provavel
TASK-AT-380

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: lifecycle versionado e sem delete.
