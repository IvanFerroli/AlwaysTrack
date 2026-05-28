# TASK-VTT-006 - Transcricao local com faster-whisper

## Metadata
- status: proposed
- owner: python-builder
- last-updated: 2026-05-28
- source-of-truth: docs/tasks/video-transcriber/TASK-VTT-006-transcricao-local-faster-whisper.md

## Modo
- mode: implementation

## Agentes sugeridos
- `olympus_python_builder`
- `olympus_task_verifier`

## Objetivo unico
Implementar a transcricao local usando `WhisperModel` em CPU.

## Contexto minimo
A configuracao esperada da V1 e `MODEL_SIZE = "small"`, `DEVICE = "cpu"`, `COMPUTE_TYPE = "int8"` e `LANGUAGE = "pt"`.

## Inputs
- `transcrever.py`
- `requirements.txt`
- secoes 3, 4, 5 e 8 do documento central

## Dependencias
- satisfeitas: `TASK-VTT-005`
- em aberto: download inicial do modelo local

## Alvos explicitos
1. `transcrever.py`

## Fora de escopo
- GPU obrigatoria
- OpenAI API
- traducao
- resumo
- correcao com IA
- diarizacao/separacao por locutor

## Checklist
1. Declarar constantes `MODEL_SIZE`, `DEVICE`, `COMPUTE_TYPE` e `LANGUAGE`.
2. Instanciar `WhisperModel` com CPU/int8.
3. Chamar `model.transcribe(str(entrada), language=LANGUAGE, vad_filter=True)`.
4. Iterar segmentos e coletar apenas `segment.text.strip()`.
5. Unir segmentos com espaco simples.
6. Avisar quando nenhuma fala for transcrita.

## Acceptance Criteria
1. O modelo carrega localmente.
2. Um arquivo de audio/video valido gera texto em memoria.
3. Nao ha chamada para API externa paga.
4. O codigo permite trocar o modelo depois de forma simples.

## Definition of Done
1. `transcrever_arquivo(entrada: Path) -> str` esta implementada.
2. O fluxo principal chama a transcricao somente apos validar entrada.
3. O texto retornado e corrido e sem timestamps.

## Validacao
- comandos/checks: `. .venv/bin/activate && python -m py_compile transcrever.py`
- revisao manual: rodar com audio/video curto real

## Evidencia esperada
- log de execucao mostrando `Iniciando transcricao...`
- confirmacao de que o modelo usado foi CPU/int8

## Riscos
- primeira execucao demorar por download do modelo
- arquivo sem fala gerar txt vazio
- CPU ser mais lenta que o desejado em videos longos

## Blockers possiveis
- dependencia nao instalada
- modelo nao baixado por falta de rede na primeira execucao

## Retorno esperado
- resumo da implementacao
- tempo aproximado do teste manual
- ressalvas de performance
