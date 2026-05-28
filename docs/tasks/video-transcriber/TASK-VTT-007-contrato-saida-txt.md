# TASK-VTT-007 - Contrato de saida TXT

## Metadata
- status: proposed
- owner: python-builder
- last-updated: 2026-05-28
- source-of-truth: docs/tasks/video-transcriber/TASK-VTT-007-contrato-saida-txt.md

## Modo
- mode: implementation

## Agentes sugeridos
- `olympus_python_builder`
- `olympus_task_verifier`

## Objetivo unico
Salvar a transcricao como `.txt` simples ao lado do arquivo de entrada.

## Contexto minimo
A saida preferida da V1 e `entrada.with_suffix(".txt")`, com texto corrido, sem timestamps, sem indices e sem blocos de legenda.

## Inputs
- `transcrever.py`
- secao 8 do documento central

## Dependencias
- satisfeitas: `TASK-VTT-006`
- em aberto: n/a

## Alvos explicitos
1. `transcrever.py`
2. arquivo `.txt` gerado ao lado da entrada em teste manual

## Fora de escopo
- pasta obrigatoria `outputs/`
- `.srt`
- `.vtt`
- timestamps
- JSON
- historico de arquivos

## Checklist
1. Implementar `salvar_txt(entrada: Path, texto: str) -> Path`.
2. Usar `entrada.with_suffix(".txt")`.
3. Escrever com `encoding="utf-8"`.
4. Encerrar arquivo com quebra de linha final.
5. Exibir `TXT gerado: <saida>` no terminal.

## Acceptance Criteria
1. O `.txt` e criado no mesmo diretorio da entrada.
2. O conteudo e texto corrido.
3. O conteudo nao possui timestamps.
4. O conteudo nao possui blocos SRT/VTT.
5. O terminal informa o caminho gerado.

## Definition of Done
1. O contrato de saida esta implementado e testado com arquivo real.
2. O arquivo gerado pode ser usado em fluxos posteriores de IA como texto bruto.

## Validacao
- comandos/checks: `. .venv/bin/activate && python transcrever.py "/mnt/c/Users/ACER/Videos/teste.mp4"`
- revisao manual: abrir o `.txt` e verificar formato

## Evidencia esperada
- caminho do `.txt` gerado
- amostra curta do formato, sem expor conteudo privado sensivel

## Riscos
- sobrescrever `.txt` existente com mesmo basename
- erro de permissao no diretorio da entrada

## Blockers possiveis
- entrada em diretorio somente leitura

## Retorno esperado
- caminho do arquivo gerado
- confirmacao do formato
