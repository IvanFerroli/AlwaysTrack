# TASK-AT-374 - Lancamento manual e importacao de Performance SAC

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-374-sac-performance-manual-entry-import.md

## Modo
- mode: implementation

## Objetivo unico
Criar entrada manual e importacao em lote como rascunho validado, com fonte, competencia e preview de erros.

## Contexto minimo
O dado nasce manual, portanto digitacao, duplicidade e planilhas precisam falhar de modo explicavel antes de publicar performance.

## Dependencias
- satisfeitas: TASK-AT-373.
- em aberto: formato inicial de arquivo deve seguir ferramentas ja presentes no repositorio.

## Alvos explicitos
1. APIs de criar draft, adicionar linhas, validar e importar.
2. Formulario e preview tabular de erros.
3. Template versionado de importacao e idempotency key de origem.

## Fora de escopo
- Aprovar ou publicar registros.
- Buscar dados automaticamente em terceiros.

## Checklist
1. Exigir metrica, componentes, atendente, periodo, fonte e referencia externa opcional.
2. Validar lote inteiro e apontar linha/campo sem persistencia parcial invisivel.
3. Deduplicar por tenant, fonte e chave externa/competencia.
4. Limitar tamanho, tipos e conteudo livre; nao armazenar planilha bruta sem necessidade.
5. Permitir salvar rascunho e retomar sem expor outro time.

## Acceptance Criteria
1. Registro invalido nunca entra como aprovado.
2. Preview mostra aceitos, rejeitados e duplicados antes do commit.
3. Retry do mesmo lote nao duplica dados.
4. SAC sem permissao e usuario cross-tenant nao lancam para terceiros.

## Validacao
- comandos/checks: testes parser/service/HTTP/Web, fuzz de arquivo e typecheck.
- revisao manual: lote misto com linhas validas, invalidas e repetidas.

## Riscos
- Formula ou macro em arquivo exportado/importado gerar CSV injection.

## Proximo passo provavel
TASK-AT-375

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: entrada manual termina em draft, nunca em publicacao implicita.
