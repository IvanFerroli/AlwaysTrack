# TASK-AT-168 - SmartScript: modelo de dados e permissoes

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-07-06
- source-of-truth: docs/tasks/TASK-AT-168-smartscript-data-model-and-permissions.md

## Modo
- mode: implementation

## Objetivo unico
Criar o contrato persistido do SmartScript dentro da Scriptoteca, mantendo AlwaysTrack como fonte da verdade e sem persistir raw logs.

## Contexto minimo
`SPEC-AT-004` define SmartScript como evolucao da Scriptoteca. A base atual ja possui `PersonalScript`, sugestoes canonicas e metricas, mas ainda nao possui estado SmartScript, trigger exportavel, lote/processamento, metadados de export ou DecisionLog.

## Inputs
- `docs/specs/SPEC-AT-004-smartscript.md`
- `docs/project/intake-smartscript.md`
- `services/api/prisma/schema.prisma`
- `docs/security/commercial-permission-matrix.md`

## Dependencias
- satisfeitas: `TASK-AT-137`, `TASK-AT-141`, `TASK-AT-154`.
- em aberto: n/a.

## Alvos explicitos
1. `services/api/prisma/schema.prisma`
2. `packages/shared/src/`
3. `services/api/src/core/script-library/`
4. `docs/security/commercial-permission-matrix.md`

## Fora de escopo
- Captura local.
- UI da aba SmartScript.
- Export Espanso.
- Criar tabela de raw logs.

## Checklist
1. Modelar candidatos/snippets SmartScript reaproveitando `PersonalScript` quando defensavel.
2. Definir estados internos que renderizam apenas `Em uso`, `Gerados hoje` e `Em revisão`.
3. Adicionar trigger pessoal, origem, batch/processamento, export metadata e marcadores de sanitizacao.
4. Criar `SmartScriptDecisionLog` ou equivalente interno auditavel.
5. Garantir indices por organizacao, owner, trigger e estado.
6. Atualizar matriz/permissoes para SAC, Supervisor, Gestor e Admin.

## Acceptance Criteria
1. Banco representa candidatos, snippets aprovados, decisoes, exports e metricas necessarias.
2. Nenhuma tabela ou coluna armazena raw log bruto.
3. Trigger e unico no escopo correto de usuario/organizacao.
4. Permissoes impedem acesso a snippets pessoais de outro atendente.
5. Estados visuais continuam limitados aos tres aceitos.

## Definition of Done
1. Migration Prisma criada.
2. Tipos compartilhados atualizados.
3. Testes de permissao/modelo adicionados.
4. Roadmap atualizado se houver ajuste de escopo.

## Validacao
- comandos/checks: `npm run prisma:generate`, `npm run typecheck --workspaces --if-present`, testes API focados em Scriptoteca.
- revisao manual: conferir schema para ausencia de raw logs.

## Evidencia esperada
- Diff da migration.
- Testes de acesso por owner/organizacao.
- Nota explicita de que raw logs ficam fora do banco.

## Riscos
- Duplicar `PersonalScript` sem necessidade.
- Criar estados internos que vazem como complexidade visual.

## Blockers possiveis
- Decisao tecnica sobre estender `PersonalScript` versus novo modelo dedicado.

## Retorno esperado
- resumo do modelo criado
- evidencias de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Resultado
- Entregue modelo persistido SmartScript integrado a `PersonalScript`, com `SmartScriptBatch`, `SmartScriptDecisionLog` e `SmartScriptExport`.
- Adicionados estados internos mapeados para `Em uso`, `Gerados hoje` e `Em revisão`, trigger pessoal, origem, metadados de sanitizacao/export e indices.
- Raw logs seguem fora do schema do AlwaysTrack.
