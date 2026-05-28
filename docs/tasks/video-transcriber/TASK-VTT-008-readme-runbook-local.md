# TASK-VTT-008 - README e runbook local

## Metadata
- status: proposed
- owner: docs-writer
- last-updated: 2026-05-28
- source-of-truth: docs/tasks/video-transcriber/TASK-VTT-008-readme-runbook-local.md

## Modo
- mode: implementation

## Agentes sugeridos
- `olympus_docs_writer`
- `olympus_task_verifier`

## Objetivo unico
Documentar instalacao, uso, saida e limitacoes da V1 para execucao local.

## Contexto minimo
O README deve permitir que o usuario rode o projeto no WSL/Ubuntu sem perguntar nada e sem prometer recursos fora de escopo.

## Inputs
- `README.md`
- secoes 9, 10, 13, 14, 16 e 17 do documento central

## Dependencias
- satisfeitas: `TASK-VTT-007`
- em aberto: n/a

## Alvos explicitos
1. `README.md`

## Fora de escopo
- documentar deploy
- documentar SaaS
- documentar frontend/API
- documentar GPU como requisito

## Checklist
1. Explicar objetivo do projeto.
2. Declarar escopo e nao escopo.
3. Listar requisitos locais.
4. Instruir criacao/ativacao de `.venv`.
5. Instruir `pip install -r requirements.txt`.
6. Mostrar comando de uso com caminho WSL.
7. Explicar onde o `.txt` sera salvo.
8. Incluir troubleshooting minimo para primeira execucao/model download.

## Acceptance Criteria
1. O README permite instalar e rodar o script.
2. O README nao promete batch, frontend, API, timestamps, SRT ou GPU.
3. O README deixa claro que o `.txt` sai ao lado do arquivo original.

## Definition of Done
1. Documentacao esta alinhada com o comportamento implementado.
2. Um beta tester consegue executar o fluxo feliz lendo apenas o README.

## Validacao
- comandos/checks: seguir o README em ambiente limpo
- revisao manual: comparar promessas do README contra o escopo fechado

## Evidencia esperada
- trecho de comando de instalacao
- trecho de comando de uso

## Riscos
- README documentar melhorias futuras como V1
- faltar aviso sobre primeira execucao baixar modelo

## Blockers possiveis
- comportamento final do script ainda instavel

## Retorno esperado
- resumo das secoes do README
- diferencas conhecidas entre documento central e implementacao
