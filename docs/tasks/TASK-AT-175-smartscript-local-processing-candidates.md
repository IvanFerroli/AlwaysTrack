# TASK-AT-175 - SmartScript: processamento local e geracao de candidatos

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-07-06
- source-of-truth: docs/tasks/TASK-AT-175-smartscript-local-processing-candidates.md

## Modo
- mode: implementation

## Objetivo unico
Processar raw logs locais em candidatos sanitizados de snippets pessoais, com limite de ate 10 itens por processamento.

## Contexto minimo
O SmartScript precisa transformar mensagens repetidas ou semanticamente proximas em candidatos uteis, sem depender de provider externo de IA para funcionar localmente.

## Inputs
- `TASK-AT-169`
- `TASK-AT-174`
- fixtures anonimas de atendimento SAC

## Dependencias
- satisfeitas: `TASK-AT-169`, `TASK-AT-174`.
- em aberto: formato final do pacote local de candidatos.

## Alvos explicitos
1. workspace do companion
2. sanitizador local ou compartilhado
3. fixtures de processamento

## Fora de escopo
- Import para AlwaysTrack.
- UI web.
- Ranking perfeito por embeddings externos.

## Checklist
1. Implementar `smartscript process --today`.
2. Normalizar ruído de captura.
3. Agrupar textos repetidos ou proximos por heuristica local.
4. Sanitizar antes de gerar candidato.
5. Sugerir trigger `:` inicial.
6. Retornar no maximo 10 candidatos por processamento.
7. Apagar ou marcar raw log processado conforme regra de retencao.

## Acceptance Criteria
1. Processamento gera candidatos sem dados sensiveis conhecidos.
2. Mais de 10 padroes resultam em ate 10 candidatos priorizados.
3. Provider externo de IA nao e obrigatorio.
4. Triggers sugeridos usam `:`.
5. Raw log permanece local.

## Definition of Done
1. Processador local implementado.
2. Fixtures cobrem repeticao, ruido e dados sensiveis.
3. Saida local pronta para import.

## Validacao
- comandos/checks: testes do companion, smoke `smartscript process --today`.
- revisao manual: comparar raw log fixture com candidatos gerados.

## Evidencia esperada
- Fixture anonima.
- Saida de ate 10 candidatos.
- Nota de sanitizacao aplicada.

## Riscos
- Gerar candidatos ruins por heuristica simples.
- Sanitizar demais e destruir utilidade do texto.

## Blockers possiveis
- Necessidade de biblioteca local para similaridade textual.

## Retorno esperado
- resumo do processamento
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Resultado
- Entregue `smartscript process --today` com heuristica local de agrupamento, sanitizacao e geracao de triggers `:`.
- Processamento limita a saida a 10 candidatos.
- Teste do companion cobre sanitizacao, limite e allowlist.
