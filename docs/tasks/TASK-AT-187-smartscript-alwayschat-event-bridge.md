# TASK-AT-187 - SmartScript: bridge local de eventos AlwaysChat

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-07
- source-of-truth: docs/tasks/TASK-AT-187-smartscript-alwayschat-event-bridge.md

## Modo
- mode: implementation

## Objetivo unico
Permitir que o AlwaysChat ou superficie equivalente envie eventos locais ao companion quando a captura SmartScript estiver ativa.

## Contexto minimo
Clipboard e janela ativa podem ser frageis. Quando a propria superficie de atendimento emite eventos, o SmartScript ganha captura mais confiavel sem depender de ler tudo do sistema.

## Inputs
- `TASK-AT-184`
- `TASK-AT-185`
- codigo da superficie AlwaysChat quando existir no repo
- companion local

## Dependencias
- satisfeitas: `TASK-AT-184`, `TASK-AT-185`.
- em aberto: local exato do AlwaysChat/event source.

## Alvos explicitos
1. companion local
2. superficie AlwaysChat/event source
3. docs/runbook SmartScript

## Fora de escopo
- Salvar raw log no banco do AlwaysTrack.
- Quebrar atendimento se companion estiver offline.
- CORS/local endpoint exposto sem protecao.

## Checklist
1. Definir canal local seguro para eventos do app ao companion.
2. Enviar eventos apenas quando captura estiver ativa.
3. Falha do companion nao quebra atendimento.
4. Aplicar allowlist e contrato local.
5. Registrar metadados sem texto em status.
6. Documentar como desligar a bridge.

## Acceptance Criteria
1. Evento de atendimento permitido chega ao companion.
2. Companion offline nao interrompe a UI de atendimento.
3. Raw text nao passa pelo banco do AlwaysTrack.
4. Eventos gerados pela bridge entram no mesmo processamento local.

## Definition of Done
1. Bridge implementada ou, se AlwaysChat nao existir ainda, contrato local pronto e bloqueio documentado.
2. Testes/mocks cobrem sucesso e falha do companion.
3. Runbook atualizado.

## Validacao
- comandos/checks: testes do companion e da superficie tocada.
- revisao manual: emitir evento e confirmar contagem local.

## Evidencia esperada
- Evento local contado no status.
- Falha simulada do companion sem quebrar fluxo.

## Riscos
- Acoplamento indevido UI-companion.
- Endpoint local mal protegido.

## Blockers possiveis
- AlwaysChat nao estar implementado no repo ainda.

## Retorno esperado
- resumo da bridge
- evidencias de validacao
- blockers se houver
- proximo passo recomendado
