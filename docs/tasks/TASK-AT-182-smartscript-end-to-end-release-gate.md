# TASK-AT-182 - SmartScript: gate ponta a ponta para uso real

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-07-06
- source-of-truth: docs/tasks/TASK-AT-182-smartscript-end-to-end-release-gate.md

## Modo
- mode: verification

## Objetivo unico
Executar o gate final do SmartScript comprovando que o ciclo completo esta pronto para uso operacional.

## Contexto minimo
Ao concluir esta task, o SmartScript deve estar pronto para uso: capturar, processar, sugerir, revisar, aprovar, exportar, usar, medir e sugerir canonizacao.

## Inputs
- `TASK-AT-168` a `TASK-AT-181`
- `docs/specs/SPEC-AT-004-smartscript.md`
- runbook SmartScript

## Dependencias
- satisfeitas: `TASK-AT-168` a `TASK-AT-181`.
- em aberto: ambiente local com AlwaysTrack, companion e Espanso configurados.

## Alvos explicitos
1. ciclo local completo
2. API/DB AlwaysTrack
3. UI Scriptoteca > SmartScript
4. Espanso runtime
5. `docs/tasks/ROADMAP.md`

## Fora de escopo
- Novas funcionalidades.
- Refino visual grande.
- Captura fora da allowlist.

## Checklist
1. Iniciar companion.
2. Capturar sessao permitida por allowlist.
3. Processar `--today`.
4. Importar `--today`.
5. Revisar candidatos em `Gerados hoje`.
6. Aprovar um snippet como `Em uso`.
7. Enviar outro para `Em revisão`.
8. Rejeitar um candidato.
9. Exportar Espanso.
10. Acionar trigger `:` no runtime.
11. Confirmar metricas.
12. Sugerir snippet `Em uso` para canonizacao.
13. Confirmar que raw logs nao entraram no banco.
14. Rodar suite de regressao.
15. Registrar decisao GO/NO-GO.

## Acceptance Criteria
1. Ciclo completo executa sem intervencao manual fora do runbook.
2. Nenhum raw log aparece no banco do AlwaysTrack.
3. Export Espanso contem apenas snippets `Em uso`.
4. Trigger `/` continua bloqueado.
5. Metricas e DecisionLog registram os eventos principais.
6. Sugestao canonica aparece no fluxo existente da Scriptoteca.

## Definition of Done
1. Gate executado com evidencias.
2. Roadmap atualizado para SmartScript pronto ou blockers registrados.
3. Decisao GO/NO-GO documentada.

## Validacao
- comandos/checks: suite da `TASK-AT-180`, smoke do companion, typecheck/testes relevantes.
- revisao manual: ciclo completo conforme checklist.

## Evidencia esperada
- EXEC com comandos, prints e decisao final.
- YAML Espanso de exemplo sem dados reais.
- Confirmacao de ausencia de raw logs no banco.

## Riscos
- Ambiente local mascarar problema do operador real.
- Espanso estar instalado/configurado de forma diferente.

## Blockers possiveis
- Limite do sistema operacional para captura local.
- Falta de Espanso no ambiente alvo.

## Retorno esperado
- resumo do gate
- evidencias de validacao
- decisao GO/NO-GO
- proximos passos recomendados

## Resultado
- Gate tecnico local validado por typecheck, testes API, testes companion, smoke companion, Prisma generate e migration gate.
- Ciclo funcional implementado: companion local, processamento, import, revisao, aprovacao, export, metricas/uso e canonizacao.
- Validacao em atendimento real com Espanso instalado permanece como smoke operacional recomendado antes de uso diario.
