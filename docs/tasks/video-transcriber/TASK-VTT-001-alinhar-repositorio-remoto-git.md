# TASK-VTT-001 - Alinhar repositorio remoto Git

## Metadata
- status: completed
- owner: repo-operator
- last-updated: 2026-05-28
- source-of-truth: docs/tasks/video-transcriber/TASK-VTT-001-alinhar-repositorio-remoto-git.md

## Modo
- mode: planning

## Agentes sugeridos
- `olympus_orchestrator`
- `olympus_git_sentinel`
- `olympus_task_verifier`

## Objetivo unico
Garantir que o overhaul do video transcriber tenha branch/remoto Git correto antes de qualquer mudanca estrutural.

## Contexto minimo
No inicio da task, o `origin` apontava para `git@github.com:IvanFerroli/SyLembra.git`, enquanto o documento central descreve outro projeto. Esta task existe para evitar push acidental ou destruicao de historico do projeto anterior.

## Inputs
- `doc/documento-central-local-video-to-txt-transcriber.md`
- saida de `git status --short --branch`
- saida de `git remote -v`

## Dependencias
- satisfeitas: documento central existe localmente
- em aberto: n/a

## Alvos explicitos
1. configuracao Git local
2. branch de trabalho do overhaul
3. remoto Git correto para o transcriber

## Fora de escopo
- apagar arquivos do projeto atual
- implementar Python
- fazer push antes de confirmar destino remoto

## Checklist
1. Registrar estado atual de `git status --short --branch`.
2. Registrar estado atual de `git remote -v`.
3. Confirmar se o destino deve ser um repo novo, recomendado, ou conversao do repo atual.
4. Criar branch de trabalho, por exemplo `overhaul/video-transcriber-v1`.
5. Se for repo novo, trocar/adicionar remoto do transcriber e preservar referencia ao remoto antigo como `sylembra-origin`.
6. Validar que `origin` nao aponta mais para o repo errado antes de qualquer push de overhaul.

## Acceptance Criteria
1. Existe uma decisao explicita sobre o remoto alvo.
2. Existe uma branch de trabalho nomeada para o overhaul.
3. O remoto do transcriber esta configurado ou a ausencia dele esta documentada como blocker.
4. Nenhum push foi feito para `IvanFerroli/SyLembra.git` por engano.

## Definition of Done
1. O operador consegue explicar qual remoto recebera o trabalho.
2. `git remote -v` nao deixa ambiguidade sobre o destino do transcriber.
3. O proximo agente pode executar cleanup/scaffold sem risco de publicar no repo errado.

## Validacao
- comandos/checks: `git status --short --branch`, `git remote -v`, `git branch --show-current`
- revisao manual: confirmar nome do repositorio remoto alvo

## Evidencia esperada
- print ou log dos comandos Git
- anotacao da decisao de remoto

## Execucao
1. Estado inicial registrado: `origin` apontava para `git@github.com:IvanFerroli/SyLembra.git`.
2. Baseline preservado em branch local `preserve/sylembra-baseline-before-vtt-2026-05-28`.
3. Tag local `sylembra-baseline-before-vtt-2026-05-28` criada no commit `ba94a39`.
4. Remoto antigo `git@github.com:IvanFerroli/SyLembra.git` preservado como `sylembra-origin`.
5. Novo `origin` configurado como `git@github.com:IvanFerroli/AlwaysTrack.git`.

## Riscos
- sobrescrever historico de SyLembra
- confundir branch local com destino remoto

## Blockers possiveis
- repo remoto do transcriber ainda nao existe
- permissao SSH/GitHub ausente

## Retorno esperado
- resumo do remoto escolhido
- branch ativa
- proximo passo recomendado

## Retorno
- remoto escolhido: `git@github.com:IvanFerroli/AlwaysTrack.git`
- branch ativa: `main`
- proximo passo: congelar escopo e commitar o pacote de planejamento inicial
