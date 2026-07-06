# TASK-AT-174 - SmartScript: captura local por allowlist

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-07-06
- source-of-truth: docs/tasks/TASK-AT-174-smartscript-local-capture-allowlist.md

## Modo
- mode: implementation

## Objetivo unico
Implementar captura local permitida por allowlist, registrando raw logs temporarios sem transformar o companion em keylogger generico.

## Contexto minimo
O MVP captura clipboard, janela ativa, texto enviado no AlwaysChat, texto copiado do ChatGPT, texto colado no AlwaysChat, timestamps e origem/destino quando identificavel.

## Inputs
- `TASK-AT-173`
- allowlist definida no intake
- restricoes de privacidade da `SPEC-AT-004`

## Dependencias
- satisfeitas: `TASK-AT-173`.
- em aberto: nomes/identificadores locais de janelas/sistemas permitidos.

## Alvos explicitos
1. workspace do companion
2. configuracao local de allowlist
3. storage local temporario

## Fora de escopo
- Processamento semantico.
- Import para AlwaysTrack.
- Captura fora da allowlist.

## Checklist
1. Configurar allowlist inicial: AlwaysChat, ChatGPT e sistemas definidos pelo usuario.
2. Registrar eventos permitidos com timestamp, origem/destino e tipo.
3. Ignorar eventos fora da allowlist.
4. Aplicar retencao de 1 dia ou purge pos-processamento.
5. Criar comando/status que mostre captura ativa sem expor conteudo sensivel.

## Acceptance Criteria
1. Companion parado nao captura nada.
2. Companion captura somente quando iniciado pelo usuario.
3. Evento fora da allowlist e descartado.
4. Raw log fica apenas local.
5. Retencao/purge e testavel.

## Definition of Done
1. Captura allowlist implementada.
2. Testes ou smoke local cobrindo permitido/bloqueado.
3. Documentacao curta de configuracao.

## Validacao
- comandos/checks: testes do companion, smoke local com fixture de eventos.
- revisao manual: simular evento permitido e evento bloqueado.

## Evidencia esperada
- Amostra redigida de evento permitido.
- Prova de descarte fora da allowlist.

## Riscos
- Capturar demais por identificador de janela amplo.
- Log local crescer sem purge.

## Blockers possiveis
- Limitacoes do sistema operacional para identificar janela ativa.

## Retorno esperado
- resumo da captura
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Resultado
- Entregue allowlist inicial para AlwaysChat, ChatGPT e dominios relacionados.
- Companion aceita fixture local allowlisted e descarta eventos fora da allowlist.
- Raw logs ficam apenas no storage local temporario, com purge de arquivos antigos.
