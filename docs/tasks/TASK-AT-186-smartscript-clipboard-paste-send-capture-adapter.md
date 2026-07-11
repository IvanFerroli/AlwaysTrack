# TASK-AT-186 - SmartScript: adapter de clipboard, paste e envio

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-07
- source-of-truth: docs/tasks/TASK-AT-186-smartscript-clipboard-paste-send-capture-adapter.md

## Modo
- mode: implementation

## Objetivo unico
Capturar eventos reais de clipboard/paste/envio apenas quando o contexto ativo estiver permitido, gerando eventos locais padronizados para o SmartScript.

## Contexto minimo
O usuario deixou o SmartScript ligado esperando capturas reais. Esta task entrega o primeiro adapter que transforma atividade operacional em raw log local, sem capturar teclado generico.

## Inputs
- `TASK-AT-185`
- `TASK-AT-184`
- `apps/smartscript-companion/src/`

## Dependencias
- satisfeitas: `TASK-AT-184`, `TASK-AT-185`.
- em aberto: dependencia nativa minima para clipboard/host.

## Alvos explicitos
1. `apps/smartscript-companion/src/`
2. `package.json`
3. docs/runbook SmartScript

## Fora de escopo
- Keylogger.
- Captura fora da allowlist.
- Captura perfeita de todos os apps.
- Envio remoto de raw logs.

## Checklist
1. Escolher abordagem minima para observar clipboard/paste no ambiente alvo.
2. Gerar eventos `clipboard`, `paste` ou `sent` conforme sinal disponivel.
3. Aplicar resolver de contexto antes de persistir texto.
4. Deduplicar clipboard repetido em janela curta.
5. Degradar claramente se dependencia do SO nao existir.
6. Garantir que `/` nao vira trigger sugerido.

## Acceptance Criteria
1. Copiar/colar em contexto permitido gera evento local.
2. Copiar/colar em contexto bloqueado nao salva texto.
3. Companion pausado/parado nao captura.
4. Status indica adapter ativo ou degradado.
5. Testes unitarios nao dependem de clipboard real.

## Definition of Done
1. Adapter inicial implementado.
2. Testes cobrem normalizacao/dedupe/descartes.
3. Smoke manual documentado.

## Validacao
- comandos/checks: testes do companion.
- revisao manual: capturar em app permitido e bloqueado.

## Evidencia esperada
- Contagens antes/depois da captura.
- Nota das dependencias nativas.
- Confirmacao de rawLogsRemote false.

## Riscos
- WSL limitar acesso ao clipboard/janela.
- Adapter gerar ruido demais.

## Blockers possiveis
- Necessidade de permissao/admin para ferramenta nativa.

## Retorno esperado
- resumo do adapter
- evidencias de captura
- limitacoes por ambiente
- proximo passo recomendado
