# TASK-AT-171 - SmartScript: DecisionLog e eventos auditaveis

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-07-06
- source-of-truth: docs/tasks/TASK-AT-171-smartscript-decisionlog-and-audit-events.md

## Modo
- mode: implementation

## Objetivo unico
Registrar decisoes internas do SmartScript de forma auditavel sem adicionar estados visuais extras ao produto.

## Contexto minimo
O intake aceita DecisionLog como mecanismo interno e rejeita estados visuais `Manual` ou `Protegido`. A operacao precisa rastrear aprovacoes, rejeicoes, edicoes, revisoes, exports e sugestoes canonicas.

## Inputs
- `TASK-AT-168`
- `TASK-AT-170`
- servico de auditoria existente

## Dependencias
- satisfeitas: `TASK-AT-168`, `TASK-AT-170`.
- em aberto: n/a.

## Alvos explicitos
1. `services/api/src/core/script-library/`
2. `services/api/src/core/audit/`
3. testes API

## Fora de escopo
- Timeline visual rica.
- Novo painel de auditoria.
- Expor raw logs.

## Checklist
1. Registrar aprovar, rejeitar, editar, enviar para revisao, exportar e sugerir canonizacao.
2. Incluir origem da decisao: botao, revisao numerada, companion ou sistema.
3. Guardar metadados necessarios sem texto bruto sensivel.
4. Integrar com audit log operacional quando o evento for relevante para gestores.
5. Garantir que DecisionLog nao crie novo estado visual.

## Acceptance Criteria
1. Decisao por botao e por comando numerado gera DecisionLog equivalente.
2. Logs permitem reconstruir o historico de um snippet.
3. Dados sensiveis nao aparecem em metadata.
4. Auditoria segue escopo de organizacao/usuario.

## Definition of Done
1. Eventos padronizados.
2. Testes de registro e escopo.
3. Documentacao curta no EXEC.

## Validacao
- comandos/checks: testes API de DecisionLog, `npm run typecheck --workspace @alwaystrack/api`.
- revisao manual: aprovar/rejeitar um candidato e conferir logs.

## Evidencia esperada
- Eventos esperados em fixture/teste.
- Nota de privacidade dos metadados.

## Riscos
- Logar texto demais.
- Criar painel antes de haver necessidade.

## Blockers possiveis
- Definicao final de nomes de evento.

## Retorno esperado
- resumo dos eventos
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Resultado
- Entregue `SmartScriptDecisionLog` para import, approve, reject, edit, review e export.
- Eventos relevantes tambem registram audit log operacional.
- Metadata evita persistir raw text/raw log.
