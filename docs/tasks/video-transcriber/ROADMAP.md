# Video Transcriber Roadmap

## Metadata
- status: proposed
- owner: task-planner
- last-updated: 2026-05-28
- source-of-truth: docs/tasks/video-transcriber/ROADMAP.md

## Objetivo
Sequenciar o trabalho desde o alinhamento com uma origem remota Git ate o ponto em que o projeto Python local passou pelo overhaul completo e esta pronto para testes beta.

## Contexto
No inicio do planejamento, o repositorio estava em `main...origin/main` e o `origin` apontava para `git@github.com:IvanFerroli/SyLembra.git`. O documento central descreve outro produto: uma ferramenta Python local de transcricao de video/audio para `.txt`, sem frontend, API, banco, Docker ou SaaS.

Execucao inicial em 2026-05-28:
- baseline preservado em `preserve/sylembra-baseline-before-vtt-2026-05-28`
- tag local `sylembra-baseline-before-vtt-2026-05-28`
- remoto antigo preservado como `sylembra-origin`
- novo `origin`: `git@github.com:IvanFerroli/AlwaysTrack.git`

Antes de qualquer alteracao destrutiva, a execucao precisa decidir se o transcriber sera um repositorio novo ou se este repositorio sera deliberadamente convertido. A rota recomendada e criar/alinha-lo com um remoto proprio para evitar sobrescrever o historico do SyLembra por acidente.

## Ordem recomendada
1. `TASK-VTT-001` alinhar repositorio, branch e remoto Git.
2. `TASK-VTT-002` congelar escopo e mapear o overhaul.
3. `TASK-VTT-003` limpar/scaffoldar a base Python minimalista.
4. `TASK-VTT-004` configurar ambiente Python e dependencias.
5. `TASK-VTT-005` implementar CLI e validacao de entrada.
6. `TASK-VTT-006` implementar transcricao local com `faster-whisper`.
7. `TASK-VTT-007` implementar contrato de saida `.txt`.
8. `TASK-VTT-008` documentar instalacao, uso e limitacoes.
9. `TASK-VTT-009` executar gates locais e testes manuais.
10. `TASK-VTT-010` preparar beta, tag/release e handoff.

## Gate final beta
O beta so fica pronto quando:
1. O remoto Git correto esta configurado e protegido contra push acidental no repo SyLembra.
2. A arvore do projeto contem apenas artefatos coerentes com a V1 local.
3. `transcrever.py`, `requirements.txt` e `README.md` existem.
4. O script valida argumento ausente, arquivo inexistente e caminho de diretorio.
5. Um arquivo de audio/video real gera `.txt` ao lado da entrada.
6. O `.txt` contem texto corrido, sem timestamps e sem formato de legenda.
7. O README permite instalar e rodar no WSL/Ubuntu sem contexto externo.
8. Nenhum item fora de escopo da V1 foi introduzido.

## Riscos principais
- Fazer push do overhaul no remoto `SyLembra` por engano.
- Apagar artefatos do projeto atual sem decisao explicita.
- Criar arquitetura maior que o necessario.
- Deixar a instalacao dependente de CUDA/GPU.
- Prometer no README features futuras como se fossem parte da V1.
