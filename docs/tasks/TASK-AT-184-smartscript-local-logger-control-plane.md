# TASK-AT-184 - SmartScript: control plane do logger local

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-07
- source-of-truth: docs/tasks/TASK-AT-184-smartscript-local-logger-control-plane.md

## Modo
- mode: implementation

## Objetivo unico
Transformar `start`, `stop`, `status`, `pause` e `resume` em controles reais do logger local, com pid/lock confiavel e status sem conteudo sensivel.

## Contexto minimo
Hoje `start` marca o companion como iniciado, mas nao governa um loop real de captura. Antes dos adapters, o nucleo precisa garantir que nada captura quando parado ou pausado.

## Inputs
- `TASK-AT-183`
- `apps/smartscript-companion/src/cli.ts`
- `apps/smartscript-companion/src/storage.ts`

## Dependencias
- satisfeitas: `TASK-AT-183`.
- em aberto: n/a.

## Alvos explicitos
1. `apps/smartscript-companion/src/cli.ts`
2. `apps/smartscript-companion/src/storage.ts`
3. scripts npm SmartScript

## Fora de escopo
- Adapter clipboard real.
- UI web.
- Instalador de servico Windows.

## Checklist
1. Implementar estado local `running`, `paused`, `stopped` e `degraded`.
2. Criar pid/lock ou mecanismo equivalente para evitar multiplos loggers conflitantes.
3. Garantir que logger parado/pausado nao aceita captura.
4. Expor `pause` e `resume`.
5. Status mostrar modo, pid, uptime, storage, rawLogsRemote e ultimo evento sem texto bruto.
6. Encerramento limpar estado sem apagar raw logs ainda uteis.

## Acceptance Criteria
1. `start/stop/pause/resume/status` refletem comportamento real.
2. Rodar `start` duas vezes nao cria captura duplicada.
3. Companion parado nao grava eventos.
4. Status nao vaza texto bruto.

## Definition of Done
1. Control plane implementado.
2. Testes cobrem transicoes.
3. Runbook documenta controles.

## Validacao
- comandos/checks: testes do companion, smoke `start/status/pause/resume/stop`.
- revisao manual: iniciar duas vezes e confirmar ausencia de loop duplicado.

## Evidencia esperada
- Saida de status em cada estado.
- Testes de transicao.

## Riscos
- Processos orfaos.
- Usuario achar que capturou quando logger estava pausado/degradado.

## Blockers possiveis
- Lock cross-platform precisar ajuste especifico de SO.

## Retorno esperado
- resumo do control plane
- evidencias de validacao
- riscos residuais
- proximo passo recomendado
