# TASK-AT-177 - SmartScript: export Espanso

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-07-06
- source-of-truth: docs/tasks/TASK-AT-177-smartscript-espanso-export-runtime.md

## Modo
- mode: implementation

## Objetivo unico
Exportar manualmente snippets SmartScript `Em uso` para Espanso, mantendo o AlwaysTrack como fonte da verdade.

## Contexto minimo
Espanso deve funcionar como runtime/exportador. Somente snippets `Em uso` podem ser exportados, e triggers pessoais devem usar `:`.

## Inputs
- `TASK-AT-170`
- `TASK-AT-172`
- `TASK-AT-176`
- formato YAML do Espanso

## Dependencias
- satisfeitas: `TASK-AT-170`, `TASK-AT-172`, `TASK-AT-176`.
- em aberto: caminho local de destino Espanso por ambiente.

## Alvos explicitos
1. endpoint de export SmartScript
2. workspace do companion
3. UI `Exportar agora`
4. testes de geracao YAML

## Fora de escopo
- Sincronizacao automatica em background.
- Espanso como banco principal.
- Export de candidatos pendentes.

## Checklist
1. Endpoint retorna somente snippets `Em uso`.
2. Companion implementa `smartscript export-espanso`.
3. UI oferece `Exportar agora` quando houver itens `Em uso`.
4. YAML gerado respeita triggers `:`.
5. Triggers `/` seguem impossiveis de exportar.
6. DecisionLog registra export.
7. Falhas de escrita local sao reportadas com proximo passo claro.

## Acceptance Criteria
1. Candidato em `Gerados hoje` ou `Em revisão` nao exporta.
2. Snippet `Em uso` exporta para YAML Espanso valido.
3. Export pode ser refeito sem duplicar entradas indevidamente.
4. AlwaysTrack continua sendo origem do arquivo exportado.
5. Export fica auditavel.

## Definition of Done
1. Export backend/companion/UI implementado.
2. Testes de YAML e filtro por estado.
3. Instrucoes basicas de Espanso no runbook futuro.

## Validacao
- comandos/checks: teste de export, smoke `smartscript export-espanso`.
- revisao manual: carregar arquivo no Espanso e acionar trigger.

## Evidencia esperada
- YAML gerado de exemplo sem dados reais.
- DecisionLog de export.

## Riscos
- Drift entre arquivo Espanso e AlwaysTrack.
- Sobrescrever arquivo Espanso manual do usuario.

## Blockers possiveis
- Caminho/configuracao Espanso variar por sistema operacional.

## Retorno esperado
- resumo do export
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Resultado
- Entregue export Espanso por API, UI e companion.
- Export filtra apenas snippets `Em uso`, valida triggers `:` e gera YAML.
- `SmartScriptExport` e DecisionLog registram o export mantendo AlwaysTrack como fonte da verdade.
