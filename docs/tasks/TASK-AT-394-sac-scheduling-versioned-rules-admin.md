# TASK-AT-394 - Regras versionadas e configuracao gerencial de Escalas

## Metadata
- status: implemented-partial-local-validation
- owner: olympus_taskyfier
- last-updated: 2026-07-18
- source-of-truth: docs/tasks/TASK-AT-394-sac-scheduling-versioned-rules-admin.md

## Modo
- mode: implementation

## Objetivo unico
Permitir que a gestao configure e publique regras de Escala com preview, vigencia futura e versao imutavel.

## Contexto minimo
Regras facilmente configuraveis nao podem ser JSON livre nem edicao in-place. Duracao, descanso, antecedencia, troca e aprovacao precisam de campos validados e explicacao.

## Dependencias
- satisfeitas: TASK-AT-393.
- em aberto: workflow de draft/preview/diff/archive da regra; limites e politica de aprovacao ja sao campos versionados por equipe.

## Estado reconciliado em 2026-07-18
- API e painel criam diretamente a proxima versao imutavel com vigencia futura e fecham a janela anterior em transacao. Nao foram localizados draft persistido, diff entre versoes nem comando de arquivamento da regra.

## Alvos explicitos
1. APIs draft/preview/publish/archive de regras.
2. Formulario gerencial estruturado e diff entre versoes.
3. Auditoria de publicacao, substituicao e vigencia.

## Fora de escopo
- Motor generico de regras arbitrarias.
- Aplicar regra retroativamente em dia encerrado.

## Checklist
1. Configurar timezone, semana-base, limites, descansos, antecedencia e aprovacao.
2. Validar coerencia e impacto em memberships/turnos antes de publicar.
3. Exigir `effectiveFrom` e impedir duas versoes ativas sobrepostas no mesmo escopo.
4. Congelar payload normalizado e checksum da versao publicada.
5. Exibir diff e conflitos futuros de forma acionavel.

## Acceptance Criteria
1. Gestao altera politica por controles estruturados, sem editar JSON.
2. Publicacao repetida com a mesma chave/checksum e idempotente.
3. Dia passado continua ligado a versao que o gerou.
4. Configuracao invalida nao chega ao materializador.

## Validacao
- comandos/checks: testes parser/service/HTTP/Web, property tests de limites e typecheck.
- revisao manual: criar draft, comparar, publicar hoje/futuro e arquivar.

## Riscos
- Uma regra excessivamente flexivel virar linguagem dificil de manter.

## Proximo passo provavel
TASK-AT-395

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: UI estruturada e versao publicada imutavel.
