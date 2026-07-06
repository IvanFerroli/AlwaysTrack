# TASK-AT-180 - SmartScript: regressao de seguranca e privacidade

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-07-06
- source-of-truth: docs/tasks/TASK-AT-180-smartscript-security-privacy-regression-suite.md

## Modo
- mode: verification

## Objetivo unico
Criar uma suite de regressao que proteja as restricoes criticas do SmartScript antes de uso real.

## Contexto minimo
SmartScript toca captura local, dados de atendimento e snippets pessoais. A regressao precisa garantir ausencia de raw logs no banco, sanitizacao, tenancy, limite de 10 candidatos, triggers `:` e bloqueio de `/`.

## Inputs
- `TASK-AT-168` a `TASK-AT-179`
- strategy de testes existente
- fixtures anonimas

## Dependencias
- satisfeitas: `TASK-AT-168` a `TASK-AT-179`.
- em aberto: n/a.

## Alvos explicitos
1. testes unitarios do companion
2. testes API da Scriptoteca
3. testes Playwright/API de fluxo SmartScript
4. `docs/testing/strategy.md` se necessario

## Fora de escopo
- Benchmark de carga grande.
- Auditoria legal completa.
- Testar provedores externos de IA.

## Checklist
1. Testar sanitizacao e bloqueios de dados sensiveis.
2. Testar limite de 10 candidatos.
3. Testar trigger `:` aceito e `/` rejeitado.
4. Testar que raw log nao aparece em payload/API/banco.
5. Testar escopo por usuario/organizacao.
6. Testar transicoes de estado.
7. Testar DecisionLog.
8. Testar export somente de `Em uso`.
9. Testar canonizacao pelo fluxo existente.

## Acceptance Criteria
1. Suite falha se raw log for persistido.
2. Suite falha se `/` for aceito como trigger pessoal.
3. Suite falha se usuario acessar snippet de outro owner.
4. Suite cobre ciclo principal sem depender de provider externo.

## Definition of Done
1. Scripts de teste integrados ao repo.
2. Fixtures anonimas versionadas.
3. Comandos documentados.

## Validacao
- comandos/checks: `npm run test --workspace @alwaystrack/api -- script-library`, testes do companion, Playwright/API SmartScript.
- revisao manual: conferir fixtures para ausencia de dados reais.

## Evidencia esperada
- Saida dos testes.
- Lista de invariantes cobertos.

## Riscos
- E2E ficar fragil por depender de Espanso instalado.
- Fixtures simularem pouco o atendimento real.

## Blockers possiveis
- Necessidade de mock estavel para clipboard/janela ativa.

## Retorno esperado
- resumo da suite
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Resultado
- Suite de regressao cobre sanitizacao, bloqueio de `/`, import sem raw logs, export apenas de `Em uso`, metricas, uso e canonizacao.
- Companion cobre allowlist, limite de 10 candidatos e sanitizacao local.
- Migration gate valida schema sem persistencia de raw logs.
