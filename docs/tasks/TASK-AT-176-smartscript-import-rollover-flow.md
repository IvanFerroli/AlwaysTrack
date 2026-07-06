# TASK-AT-176 - SmartScript: importacao e rollover de Gerados hoje

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-07-06
- source-of-truth: docs/tasks/TASK-AT-176-smartscript-import-rollover-flow.md

## Modo
- mode: implementation

## Objetivo unico
Conectar o companion ao AlwaysTrack para importar candidatos processados e aplicar a regra de rollover de `Gerados hoje` para `Em revisão`.

## Contexto minimo
`Gerados hoje` representa a sessao/processamento mais recente. Ao importar uma nova sessao, pendentes do ciclo anterior devem migrar para `Em revisão`.

## Inputs
- `TASK-AT-170`
- `TASK-AT-175`
- autenticacao local usada pelo AlwaysTrack

## Dependencias
- satisfeitas: `TASK-AT-170`, `TASK-AT-175`.
- em aberto: forma segura de token/config local para o companion.

## Alvos explicitos
1. workspace do companion
2. endpoints SmartScript da API
3. testes de rollover

## Fora de escopo
- Export Espanso.
- UI de revisao.
- Captura adicional.

## Checklist
1. Implementar `smartscript import --today`.
2. Enviar apenas candidatos processados/sanitizados.
3. Bloquear envio de raw logs.
4. Aplicar rollover de pendentes anteriores para `Em revisão`.
5. Registrar batch/processamento e DecisionLog/import event.
6. Tratar falhas de rede sem perder pacote local.

## Acceptance Criteria
1. Import cria candidatos em `Gerados hoje`.
2. Segundo import migra pendentes anteriores para `Em revisão`.
3. Raw log nunca aparece no payload.
4. Falha de import deixa pacote reexecutavel.
5. API respeita owner/organizacao.

## Definition of Done
1. Companion importa candidatos.
2. Testes API/companion cobrem rollover.
3. Erros comuns documentados.

## Validacao
- comandos/checks: testes API de import, smoke `smartscript import --today` com fixture.
- revisao manual: importar dois lotes e conferir estados.

## Evidencia esperada
- Payload exemplo sem raw log.
- Logs de dois imports com rollover.

## Riscos
- Duplicar candidatos em retries.
- Perder candidato local apos falha parcial.

## Blockers possiveis
- Autenticacao local do companion precisar decisao de UX.

## Retorno esperado
- resumo do fluxo de import
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Resultado
- Entregue `smartscript import --today` enviando apenas pacote processado/sanitizado ao AlwaysTrack.
- API aplica rollover de `Gerados hoje` para `Em revisão` antes de importar novo batch.
- Payload de import nao inclui raw logs.
