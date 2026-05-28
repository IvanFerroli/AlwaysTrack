# TASK-VTT-010 - Beta handoff e release

## Metadata
- status: proposed
- owner: release-operator
- last-updated: 2026-05-28
- source-of-truth: docs/tasks/video-transcriber/TASK-VTT-010-beta-handoff-release.md

## Modo
- mode: verification

## Agentes sugeridos
- `olympus_orchestrator`
- `olympus_git_sentinel`
- `olympus_task_verifier`

## Objetivo unico
Fechar o overhaul como beta testavel, com Git limpo, evidencias de validacao e instrucoes de handoff.

## Contexto minimo
Depois da implementacao e dos testes manuais, o projeto deve estar pronto para um usuario beta rodar localmente no WSL/Ubuntu.

## Inputs
- resultados de `TASK-VTT-009`
- estado Git final
- README final

## Dependencias
- satisfeitas: `TASK-VTT-009`
- em aberto: remoto Git correto configurado

## Alvos explicitos
1. commit semantico do overhaul
2. tag ou marco beta
3. checklist final de handoff

## Fora de escopo
- deploy
- Docker
- publicacao em package registry
- instalador Windows
- suporte oficial a GPU

## Checklist
1. Rodar `git status --short`.
2. Revisar diff final.
3. Confirmar que remoto Git correto esta configurado.
4. Criar commit semantico.
5. Opcionalmente criar tag `v0.1.0-beta.1`.
6. Enviar branch/tag para o remoto correto.
7. Registrar comandos de instalacao e teste no handoff.

## Acceptance Criteria
1. Working tree esta limpo apos commit.
2. Commit descreve o overhaul do transcriber.
3. Remoto usado nao e o repo SyLembra por acidente.
4. Beta tester recebe README e checklist de validacao.

## Definition of Done
1. Projeto esta versionado no destino correto.
2. Handoff informa como instalar, rodar e validar.
3. Riscos conhecidos estao documentados.

## Validacao
- comandos/checks: `git status --short`, `git diff --stat HEAD~1..HEAD`, `git remote -v`
- revisao manual: confirmar tag/branch/remoto

## Evidencia esperada
- hash do commit
- nome da branch
- remoto de push
- tag beta, se criada

## Riscos
- publicar no remoto errado
- beta tester tentar rodar sem ativar `.venv`
- videos longos gerarem expectativa de performance nao validada

## Blockers possiveis
- remoto ausente ou permissao SSH falhando
- falhas abertas na validacao manual

## Retorno esperado
- resumo do release beta
- checklist de validacao
- riscos e proximos passos
