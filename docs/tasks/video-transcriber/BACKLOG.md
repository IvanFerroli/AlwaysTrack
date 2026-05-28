# Video Transcriber Backlog Operacional

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-05-28
- source-of-truth: docs/tasks/video-transcriber/BACKLOG.md

## Diagnostico
No inicio do planejamento, o repositorio ainda era o SyLembra: monorepo React/Express/Prisma, com `origin` apontando para `git@github.com:IvanFerroli/SyLembra.git`. O alvo descrito em `doc/documento-central-local-video-to-txt-transcriber.md` e um produto diferente e muito menor: Python local, CLI, `faster-whisper`, CPU primeiro, um arquivo por vez e saida `.txt` simples.

Este backlog trata a mudanca como pivot/overhaul controlado. A preservacao do estado atual e o alinhamento remoto vem antes de qualquer remocao.

## Execucao inicial
- 2026-05-28: baseline SyLembra preservado em branch local `preserve/sylembra-baseline-before-vtt-2026-05-28`.
- 2026-05-28: tag local `sylembra-baseline-before-vtt-2026-05-28` criada no commit `ba94a39`.
- 2026-05-28: remoto antigo renomeado para `sylembra-origin`.
- 2026-05-28: novo `origin` configurado como `git@github.com:IvanFerroli/AlwaysTrack.git`.

## Fase 0 - Git, preservacao e origem remota

### TASK-VTT-GIT-001 - Auditar estado Git e preservar baseline SyLembra
- status: completed
- depende de: n/a
- aceite: `git status`, `git remote -v` e `git log -1` registrados; branch/tag de backup definida antes de qualquer remocao; untracked atuais classificados
- riscos: perder historico util do SyLembra; misturar produto antigo com o novo transcriber

### TASK-VTT-GIT-002 - Alinhar origem remota ao novo projeto
- status: completed
- depende de: `TASK-VTT-GIT-001`
- aceite: decisao explicita entre novo repo remoto ou troca do `origin`; branch principal pushavel; remoto nao aponta mais ambiguamente para SyLembra se o repo virar transcriber
- riscos: sobrescrever/contaminar o remoto SyLembra; CI antigo rodar contra projeto novo

## Fase 1 - Reenquadramento do projeto

### TASK-VTT-DOC-001 - Atualizar intake/roadmap para Local Video to TXT Transcriber
- depende de: remoto/baseline definidos
- aceite: docs do projeto apontam para o documento central novo; restricoes negativas registradas: sem frontend, API, banco, Docker, batch, timestamps, SRT, login e cloud
- riscos: agentes futuros reintroduzirem arquitetura antiga

### TASK-VTT-ADR-001 - Registrar decisao arquitetural da V1
- depende de: `TASK-VTT-DOC-001`
- aceite: ADR curta confirma Python CLI, `faster-whisper`, CPU, modelo `small`, `int8`, idioma `pt`, saida `.txt` ao lado do arquivo
- riscos: otimizacao prematura para GPU ou configuracao complexa

### TASK-VTT-CLN-001 - Planejar remocao controlada do monorepo antigo
- depende de: backup Git
- aceite: lista objetiva de artefatos a remover ou arquivar: `apps/`, `services/`, `packages/`, `deploy/`, Dockerfiles, Prisma, scripts npm, docs SyLembra, tasks antigas
- riscos: apagar pipeline util junto com produto antigo; deixar residuos que violem o escopo V1

## Fase 2 - Overhaul estrutural

### TASK-VTT-CLN-002 - Remover superficies fora de escopo da V1
- depende de: `TASK-VTT-CLN-001`
- aceite: repo nao contem frontend ativo, backend/API, banco, Docker/deploy, jobs, auth, storage, integracoes Meta/Google/OpenAI
- riscos/regressoes: mudanca destrutiva grande; precisa ser feita em branch isolada e revisada por diff

### TASK-VTT-SCF-001 - Criar estrutura minima do projeto Python
- depende de: limpeza aprovada
- aceite: estrutura final contem `transcrever.py`, `requirements.txt`, `README.md`; opcionalmente `outputs/`, mas sem alterar comportamento de salvar ao lado do arquivo
- riscos: criar estrutura grande demais ou pacote Python desnecessario

### TASK-VTT-ENV-001 - Configurar dependencias locais
- depende de: `TASK-VTT-SCF-001`
- aceite: `requirements.txt` instala `faster-whisper`; `.venv` funciona localmente e nao e versionada; instalacao documentada
- riscos: dependencias pesadas; download inicial de modelo; possiveis problemas de codec/ambiente no WSL

## Fase 3 - Implementacao da V1

### TASK-VTT-CLI-001 - Implementar entrada via terminal e validacoes basicas
- depende de: scaffold Python
- aceite: sem argumento mostra uso; arquivo inexistente mostra erro; diretorio mostra erro; arquivo valido segue para transcricao
- riscos: caminhos Windows/WSL mal interpretados; mensagens divergirem do README

### TASK-VTT-TRN-001 - Implementar transcricao local com faster-whisper
- depende de: `TASK-VTT-CLI-001`, dependencias instalaveis
- aceite: usa `WhisperModel("small", device="cpu", compute_type="int8")`; `language="pt"`; `vad_filter=True`; nao chama API externa
- riscos: primeira execucao lenta por download; CPU pode demorar em videos longos; arquivo sem fala gera texto vazio

### TASK-VTT-OUT-001 - Gerar `.txt` corrido ao lado do arquivo original
- depende de: `TASK-VTT-TRN-001`
- aceite: usa `entrada.with_suffix(".txt")`; une segmentos em texto simples; nao gera timestamps, indices, `.srt` ou `.vtt`; imprime `TXT gerado: ...`
- riscos: sobrescrever `.txt` existente; saida vazia ainda criar arquivo, conforme desenho atual

### TASK-VTT-DOC-002 - Criar README minimo de uso
- depende de: implementacao funcional
- aceite: README cobre instalacao, uso, escopo, limitacoes e saida esperada; nao promete GPU, batch, API, frontend ou IA pos-processamento
- riscos: documentacao virar roadmap e abrir escopo

## Fase 4 - Validacao e beta

### TASK-VTT-QLT-001 - Testes manuais de erro sem modelo pesado
- depende de: CLI implementada
- aceite: validar sem argumento, arquivo inexistente e diretorio; registrar comandos e saidas
- riscos: mensagens mudarem sem documentacao acompanhar

### TASK-VTT-QLT-002 - Teste real com video/audio curto
- depende de: transcricao implementada e ambiente instalado
- aceite: rodar com arquivo pequeno; gerar `.txt`; confirmar texto corrido; confirmar ausencia de timestamps/SRT; confirmar nenhum arquivo extra inesperado
- riscos: ambiente sem codec compativel; modelo nao baixar; performance abaixo do aceitavel

### TASK-VTT-QLT-003 - Auditoria anti-escopo antes do beta
- depende de: limpeza + implementacao
- aceite: varredura confirma ausencia de frontend, backend, banco, Docker, login, API paga, batch e integracao cloud; README e codigo batem com o documento central
- riscos: residuos do SyLembra confundirem beta testers ou agentes futuros

### TASK-VTT-REL-001 - Fechamento beta e publicacao remota
- depende de: gates manuais aprovados
- aceite: branch principal limpa, commit final pushado, tag beta criada, instrucao de teste manual pronta
- riscos: publicar no remoto errado; beta depender de arquivo local nao incluido

## Ordem recomendada
1. `TASK-VTT-GIT-001`
2. `TASK-VTT-GIT-002`
3. `TASK-VTT-DOC-001`
4. `TASK-VTT-ADR-001`
5. `TASK-VTT-CLN-001`
6. `TASK-VTT-CLN-002`
7. `TASK-VTT-SCF-001`
8. `TASK-VTT-ENV-001`
9. `TASK-VTT-CLI-001`
10. `TASK-VTT-TRN-001`
11. `TASK-VTT-OUT-001`
12. `TASK-VTT-DOC-002`
13. `TASK-VTT-QLT-001`
14. `TASK-VTT-QLT-002`
15. `TASK-VTT-QLT-003`
16. `TASK-VTT-REL-001`

## Checklist de validacao final
1. Git remoto aponta para o projeto correto.
2. Repo nao contem app web, API, banco, Docker ou integracoes externas ativas.
3. `python transcrever.py caminho/do/video.mp4` gera `caminho/do/video.txt`.
4. Saida e texto corrido, sem timestamps e sem formato SRT/VTT.
5. README permite instalar e rodar localmente no WSL.
6. Teste real com video curto foi executado antes do beta.

## Sugestoes de commits semanticos
- `chore(git): preserve sylembra baseline before transcriber pivot`
- `chore: remove legacy app surfaces for local transcriber`
- `feat(cli): add local video to txt transcriber`
