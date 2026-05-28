# TASK-VTT-003 - Scaffold Python minimalista

## Metadata
- status: proposed
- owner: python-builder
- last-updated: 2026-05-28
- source-of-truth: docs/tasks/video-transcriber/TASK-VTT-003-scaffold-python-minimalista.md

## Modo
- mode: implementation

## Agentes sugeridos
- `olympus_python_builder`
- `olympus_task_verifier`

## Objetivo unico
Criar a estrutura minima do projeto Python local descrito no documento central.

## Contexto minimo
A estrutura alvo da V1 e pequena: `transcrever.py`, `requirements.txt`, `README.md` e opcionalmente `.gitignore`. Qualquer monolito, API, app web ou banco fica fora de escopo.

## Inputs
- `TASK-VTT-001`
- `TASK-VTT-002`
- secoes 6, 7 e 10 do documento central

## Dependencias
- satisfeitas: remoto/branch alinhados, escopo congelado
- em aberto: confirmacao para remover ou arquivar arquivos antigos caso o repo atual seja convertido

## Alvos explicitos
1. `transcrever.py`
2. `requirements.txt`
3. `README.md`
4. `.gitignore`

## Fora de escopo
- `apps/`
- `services/`
- `packages/`
- Docker
- frontend
- API
- banco

## Checklist
1. Criar arquivos minimos na raiz do projeto alvo.
2. Adicionar `.gitignore` para `.venv/`, caches Python e saidas temporarias.
3. Remover ou arquivar artefatos antigos somente apos decisao explicita.
4. Confirmar que a arvore final nao induz a execucao de stack Node/React/Express.

## Acceptance Criteria
1. A raiz do projeto contem os arquivos minimos da V1.
2. Nao ha framework desnecessario novo.
3. O projeto e reconhecivel como CLI Python local.

## Definition of Done
1. Estrutura base pronta para implementacao.
2. `git status --short` mostra apenas mudancas esperadas do scaffold/cleanup.
3. O proximo passo e configurar dependencias Python.

## Validacao
- comandos/checks: `find . -maxdepth 2 -type f | sort`, `git status --short`
- revisao manual: confirmar ausencia de novas camadas web/API

## Evidencia esperada
- listagem dos arquivos criados
- resumo dos arquivos removidos/arquivados, se houver

## Riscos
- apagar material do projeto antigo sem rollback
- deixar restos de monorepo confundindo instalacao

## Blockers possiveis
- falta de autorizacao para cleanup destrutivo

## Retorno esperado
- estrutura criada
- ressalvas sobre arquivos legados
- proximo passo recomendado
