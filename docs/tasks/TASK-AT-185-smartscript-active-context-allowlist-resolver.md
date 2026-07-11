# TASK-AT-185 - SmartScript: resolver de contexto ativo e allowlist

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-07
- source-of-truth: docs/tasks/TASK-AT-185-smartscript-active-context-allowlist-resolver.md

## Modo
- mode: implementation

## Objetivo unico
Resolver app, janela, dominio ou processo ativo para decidir se uma captura local pode ser aceita pela allowlist do SmartScript.

## Contexto minimo
Captura real so e segura se o contexto ativo for confiavel. O companion deve descartar fontes bloqueadas sem salvar o texto bruto capturado.

## Inputs
- `TASK-AT-184`
- `apps/smartscript-companion/src/allowlist.ts`
- ambiente Windows/WSL do operador

## Dependencias
- satisfeitas: `TASK-AT-184`.
- em aberto: capacidade tecnica de identificar contexto ativo no host.

## Alvos explicitos
1. `apps/smartscript-companion/src/allowlist.ts`
2. `apps/smartscript-companion/src/`
3. docs/runbook SmartScript

## Fora de escopo
- Capturar texto.
- Persistir raw logs.
- Administracao central de allowlist no backend.

## Checklist
1. Definir fontes default permitidas com escopo restrito.
2. Permitir allowlist local configuravel por env/arquivo.
3. Resolver app/janela/processo/dominio quando disponivel.
4. Registrar descarte por motivo sem texto bruto.
5. Tratar contexto desconhecido como bloqueado ou degradado seguro.
6. Documentar limitacoes por SO.

## Acceptance Criteria
1. Contexto permitido libera evento para o adapter.
2. Contexto bloqueado descarta sem salvar texto.
3. Matching amplo demais e evitado por testes.
4. Status mostra allowlist e descartes sem conteudo.

## Definition of Done
1. Resolver implementado.
2. Testes cobrem permitido, bloqueado e desconhecido.
3. Docs atualizadas.

## Validacao
- comandos/checks: testes do companion.
- revisao manual: simular contextos de AlwaysChat/ChatGPT e app bloqueado.

## Evidencia esperada
- Saida de status com contagem de descartes.
- Testes de allowlist.

## Riscos
- Nomes de janela inconsistentes.
- Matching permissivo capturar app pessoal.

## Blockers possiveis
- APIs do host nao exporem janela ativa para WSL.

## Retorno esperado
- resumo do resolver
- evidencias de validacao
- limitacoes por SO
- proximo passo recomendado
