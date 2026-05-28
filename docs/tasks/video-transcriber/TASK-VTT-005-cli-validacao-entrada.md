# TASK-VTT-005 - CLI e validacao de entrada

## Metadata
- status: proposed
- owner: python-builder
- last-updated: 2026-05-28
- source-of-truth: docs/tasks/video-transcriber/TASK-VTT-005-cli-validacao-entrada.md

## Modo
- mode: implementation

## Agentes sugeridos
- `olympus_python_builder`
- `olympus_task_verifier`

## Objetivo unico
Implementar a entrada por terminal e validacoes basicas de caminho local.

## Contexto minimo
A V1 deve aceitar exatamente um caminho local via terminal e falhar com mensagens simples quando o argumento estiver ausente, inexistente ou apontar para diretorio.

## Inputs
- `transcrever.py`
- secao 8 do documento central

## Dependencias
- satisfeitas: `TASK-VTT-004`
- em aberto: n/a

## Alvos explicitos
1. `transcrever.py`

## Fora de escopo
- interface grafica
- upload
- API HTTP
- processamento em lote
- parser complexo de flags

## Checklist
1. Implementar `validar_entrada(argv: list[str]) -> Path`.
2. Exibir uso quando nenhum caminho for informado.
3. Rejeitar arquivo inexistente.
4. Rejeitar caminho que nao seja arquivo.
5. Retornar `Path` expandido com `expanduser()`.

## Acceptance Criteria
1. `python transcrever.py` mostra `Uso: python transcrever.py caminho/do/video.mp4`.
2. Caminho inexistente mostra `Arquivo nao encontrado`.
3. Diretorio mostra `O caminho informado nao e um arquivo`.
4. Arquivo valido avanca para a etapa de transcricao.

## Definition of Done
1. Validacoes basicas funcionam sem carregar o modelo quando a entrada e invalida.
2. Mensagens sao claras para uso local.

## Validacao
- comandos/checks: `. .venv/bin/activate && python transcrever.py`, `. .venv/bin/activate && python transcrever.py /caminho/inexistente`, `. .venv/bin/activate && python transcrever.py .`
- revisao manual: conferir fluxo de saida no terminal

## Evidencia esperada
- saida dos tres cenarios de erro

## Riscos
- carregar modelo antes de validar entrada
- aceitar diretorio por engano

## Blockers possiveis
- `transcrever.py` ainda nao criado

## Retorno esperado
- resumo das validacoes implementadas
- comandos executados
