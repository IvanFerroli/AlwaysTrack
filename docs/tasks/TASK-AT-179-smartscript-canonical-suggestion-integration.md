# TASK-AT-179 - SmartScript: sugestao para Scriptoteca canonica

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-07-06
- source-of-truth: docs/tasks/TASK-AT-179-smartscript-canonical-suggestion-integration.md

## Modo
- mode: implementation

## Objetivo unico
Permitir que snippets SmartScript `Em uso` sejam enviados ao fluxo existente de sugestao canonica da Scriptoteca.

## Contexto minimo
O intake define que snippets aprovados podem seguir para canonizacao, mas Admin/Gestor deve revisar; publicacao canonica automatica esta fora de escopo.

## Inputs
- `TASK-AT-170`
- `TASK-AT-172`
- `services/api/src/core/script-library/script-library.service.ts`
- `TASK-AT-128`

## Dependencias
- satisfeitas: `TASK-AT-170`, `TASK-AT-172`, `TASK-AT-178`.
- em aberto: n/a.

## Alvos explicitos
1. fluxo `suggestPersonalScriptAsCanonical`
2. fila `OperationalScriptSuggestion`
3. UI SmartScript
4. notificacoes existentes quando aplicavel

## Fora de escopo
- Aprovar automaticamente como `OperationalScript`.
- Criar segunda fila de canonizacao.
- Permitir sugestao de candidato nao aprovado.

## Checklist
1. Botao para sugerir snippet `Em uso` como canonico.
2. Reaproveitar fila existente de sugestoes da Scriptoteca.
3. Linkar snippet pessoal SmartScript a sugestao gerada.
4. Registrar DecisionLog e audit log.
5. Notificar Admin/Gestor conforme padrao atual.
6. Mostrar retorno ao autor quando a sugestao for decidida.

## Acceptance Criteria
1. Apenas snippet `Em uso` pode ser sugerido para canon.
2. Admin/Gestor revisa no fluxo atual.
3. Aprovado vira `OperationalScript`.
4. Rejeitado/mesclado mantem rastro.
5. Snippet pessoal continua existindo mesmo apos sugestao.

## Definition of Done
1. Integracao com fluxo existente entregue.
2. Testes de permissao e decisao.
3. UI indica status da sugestao.

## Validacao
- comandos/checks: testes API de sugestao, Playwright/API smoke quando disponivel.
- revisao manual: sugerir snippet e decidir como gestor.

## Evidencia esperada
- Sugestao criada com origem SmartScript.
- Retorno de decisao ao autor.

## Riscos
- Duplicar fluxo da Scriptoteca.
- Canonizar texto ainda pessoal demais.

## Blockers possiveis
- Ajuste de campos para registrar origem SmartScript.

## Retorno esperado
- resumo da integracao
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Resultado
- Entregue endpoint e acao de UI para sugerir snippet SmartScript `Em uso` ao fluxo canonico.
- Integracao reaproveita `OperationalScriptSuggestion` e a fila existente da Scriptoteca.
- DecisionLog registra `SUGGEST_CANONICAL`.
