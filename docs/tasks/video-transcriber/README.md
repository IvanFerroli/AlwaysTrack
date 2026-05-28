# Video Transcriber Tasks

## Objetivo
Registrar o plano de overhaul para transformar o escopo descrito em `doc/documento-central-local-video-to-txt-transcriber.md` em um projeto Python local, minimalista e pronto para beta.

## Fonte de verdade
- Documento central: `doc/documento-central-local-video-to-txt-transcriber.md`
- Backlog taskyfier: `docs/tasks/video-transcriber/BACKLOG.md`
- Roadmap operacional: `docs/tasks/video-transcriber/ROADMAP.md`
- Matriz de overhaul: `docs/tasks/video-transcriber/OVERHAUL-FILE-MATRIX.md`

## Convencao
- Track: `VTT`
- Formato: `TASK-VTT-###-<slug>.md`
- Escopo V1: CLI local, um arquivo por vez, `faster-whisper`, saida `.txt` simples.

## Guardrails
- Nao adicionar frontend.
- Nao adicionar API HTTP.
- Nao adicionar banco de dados.
- Nao adicionar Docker.
- Nao adicionar batch.
- Nao adicionar SRT, VTT ou timestamps.
- Nao adicionar API paga.
- Nao exigir GPU na V1.
