# TASK-AT-368 - Administracao e publicacao de slots de pausa

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-368-sac-pause-slot-administration.md

## Modo
- mode: implementation

## Objetivo unico
Permitir que a governanca configure, valide e publique agendas de slots SAC por time e periodo.

## Contexto minimo
Slots precisam nascer de politica versionada, escala e capacidade, com rascunho antes de ficarem elegiveis para escolha.

## Dependencias
- satisfeitas: TASK-AT-367.
- em aberto: n/a.

## Alvos explicitos
1. APIs de draft, preview, publish e archive de agenda.
2. Tela administrativa de calendario/lista de slots.
3. Auditoria de publicacao e mudanca de politica.

## Fora de escopo
- Reserva pelo atendente.
- Geracao automatica sem confirmacao administrativa.

## Checklist
1. Gerar preview com capacidade resultante por intervalo.
2. Bloquear slots duplicados, fora da escala ou abaixo do piso.
3. Publicar uma versao imutavel e permitir nova versao para ajustes.
4. Impedir edicao silenciosa de slot ja reservado.
5. Exibir conflitos e impacto antes da confirmacao.

## Acceptance Criteria
1. Somente agenda publicada aparece para escolha.
2. Repetir publish com a mesma chave nao duplica slots.
3. Alteracao posterior cria revisao e preserva reservas/historico.
4. Preview e resultado persistido usam a mesma regra de capacidade.

## Validacao
- comandos/checks: testes service/HTTP/Web, typecheck API/Web e `git diff --check`.
- revisao manual: criar rascunho, revisar conflito, publicar e versionar.

## Riscos
- Preview divergir da validacao no commit da agenda.

## Proximo passo provavel
TASK-AT-369

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: publicar slots somente apos validacao backend.
