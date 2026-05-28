# TASK-VTT-004 - Ambiente Python e dependencias

## Metadata
- status: proposed
- owner: python-builder
- last-updated: 2026-05-28
- source-of-truth: docs/tasks/video-transcriber/TASK-VTT-004-ambiente-python-dependencias.md

## Modo
- mode: implementation

## Agentes sugeridos
- `olympus_python_builder`
- `olympus_task_verifier`

## Objetivo unico
Configurar dependencias para rodar `faster-whisper` localmente em CPU.

## Contexto minimo
A V1 deve priorizar CPU para reduzir atrito com CUDA/cuDNN. GPU pode ser documentada como melhoria futura, mas nao deve bloquear o beta.

## Inputs
- `requirements.txt`
- secao 7 do documento central
- ambiente WSL2 Ubuntu com Python 3

## Dependencias
- satisfeitas: `TASK-VTT-003`
- em aberto: acesso de rede para baixar pacotes/modelo na primeira execucao

## Alvos explicitos
1. `.venv/` local nao versionado
2. `requirements.txt`

## Fora de escopo
- CUDA obrigatorio
- Docker
- Poetry/uv/pipenv se nao houver decisao explicita
- empacotamento `.exe`

## Checklist
1. Criar ambiente virtual com `python3 -m venv .venv`.
2. Instalar `faster-whisper`.
3. Congelar dependencias em `requirements.txt`.
4. Validar instalacao com import simples de `faster_whisper`.
5. Confirmar que `.venv/` nao sera commitado.

## Acceptance Criteria
1. `pip install -r requirements.txt` funciona em ambiente limpo.
2. `python -c "from faster_whisper import WhisperModel"` executa sem erro.
3. `requirements.txt` contem `faster-whisper` e dependencias necessarias.
4. Nenhuma dependencia de servico pago foi adicionada.

## Definition of Done
1. Ambiente local consegue importar a biblioteca principal.
2. O projeto esta pronto para implementar o script.

## Validacao
- comandos/checks: `python3 -m venv .venv`, `. .venv/bin/activate && pip install -r requirements.txt`, `. .venv/bin/activate && python -c "from faster_whisper import WhisperModel"`
- revisao manual: conferir `requirements.txt`

## Evidencia esperada
- comando de import bem-sucedido
- diff do `requirements.txt`

## Riscos
- pacotes pesados aumentarem tempo de setup
- incompatibilidade local de Python
- download inicial do modelo ser confundido com chamada de API paga

## Blockers possiveis
- Python 3 ausente
- rede indisponivel para instalacao/download inicial

## Retorno esperado
- versao do Python
- dependencias instaladas
- proximo passo recomendado
