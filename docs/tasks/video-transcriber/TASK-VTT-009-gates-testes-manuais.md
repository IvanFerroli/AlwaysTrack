# TASK-VTT-009 - Gates locais e testes manuais

## Metadata
- status: proposed
- owner: qa-verifier
- last-updated: 2026-05-28
- source-of-truth: docs/tasks/video-transcriber/TASK-VTT-009-gates-testes-manuais.md

## Modo
- mode: verification

## Agentes sugeridos
- `olympus_task_verifier`
- `olympus_qa_runner`

## Objetivo unico
Validar que a V1 funciona localmente e respeita o contrato do documento central.

## Contexto minimo
A V1 nao precisa de suite complexa. Precisa de verificacoes simples, reproduziveis e de um teste manual com audio/video curto real.

## Inputs
- `transcrever.py`
- `requirements.txt`
- `README.md`
- arquivo pequeno de audio/video local para teste

## Dependencias
- satisfeitas: `TASK-VTT-008`
- em aberto: disponibilidade de arquivo real de teste

## Alvos explicitos
1. terminal local
2. arquivo `.txt` gerado
3. checklist de beta

## Fora de escopo
- CI completo
- testes E2E web
- testes de carga
- benchmark GPU

## Checklist
1. Rodar `python -m py_compile transcrever.py`.
2. Testar sem argumento.
3. Testar caminho inexistente.
4. Testar caminho de diretorio.
5. Testar arquivo audio/video curto valido.
6. Conferir que o `.txt` foi criado ao lado da entrada.
7. Conferir que o `.txt` nao contem timestamps, SRT ou VTT.
8. Conferir que nenhum arquivo extra desnecessario foi criado.

## Acceptance Criteria
1. Todos os cenarios de erro retornam mensagem clara.
2. O fluxo feliz gera `.txt`.
3. O `.txt` contem somente texto corrido.
4. Nenhum item fora de escopo foi detectado.

## Definition of Done
1. Checklist manual concluido.
2. Evidencias registradas sem expor conteudo privado do video.
3. Riscos restantes documentados.

## Validacao
- comandos/checks: `. .venv/bin/activate && python -m py_compile transcrever.py`, `. .venv/bin/activate && python transcrever.py`, `. .venv/bin/activate && python transcrever.py /nao/existe.mp4`, `. .venv/bin/activate && python transcrever.py .`, `. .venv/bin/activate && python transcrever.py "<arquivo-real>"`
- revisao manual: abrir o `.txt` gerado

## Evidencia esperada
- saidas de terminal
- caminho do `.txt`
- confirmacao manual do formato

## Riscos
- teste com video privado nao deve vazar conteudo
- performance em videos longos ainda desconhecida

## Blockers possiveis
- ausencia de arquivo real de teste
- falta de rede na primeira execucao para baixar modelo

## Retorno esperado
- checklist de validacao preenchido
- bugs encontrados ou aceite para beta
