# TASK-AT-181 - SmartScript: runbook operacional e readiness

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-07-06
- source-of-truth: docs/tasks/TASK-AT-181-smartscript-runbook-and-operations-readiness.md

## Modo
- mode: documentation

## Objetivo unico
Documentar como instalar, operar, diagnosticar e homologar o SmartScript localmente antes de liberar uso real.

## Contexto minimo
O MVP depende de companion local, AlwaysTrack e Espanso. Operadores precisam de um caminho claro para capturar, processar, importar, revisar, exportar e usar snippets.

## Inputs
- `TASK-AT-173` a `TASK-AT-180`
- `docs/runbooks/_template.md`
- evidencias das tasks anteriores

## Dependencias
- satisfeitas: `TASK-AT-173` a `TASK-AT-180`.
- em aberto: caminhos finais de instalacao do companion/Espanso.

## Alvos explicitos
1. `docs/runbooks/RUNBOOK-004-smartscript-local-companion.md`
2. `docs/operations/` se houver checklist operacional
3. `README.md` se precisar link curto

## Fora de escopo
- Manual extenso para usuario final nao tecnico.
- Guia de provider externo de IA.
- Automacao de instalacao enterprise.

## Checklist
1. Documentar pre-requisitos.
2. Documentar comandos do companion.
3. Documentar configuracao de allowlist.
4. Documentar retencao/purge de raw logs.
5. Documentar import no AlwaysTrack.
6. Documentar revisao na aba SmartScript.
7. Documentar export Espanso e validacao de trigger.
8. Documentar troubleshooting comum.
9. Criar checklist GO/NO-GO.

## Acceptance Criteria
1. Um mantenedor consegue executar o ciclo completo seguindo o runbook.
2. Runbook deixa claro que raw logs ficam locais.
3. Runbook deixa claro que Espanso nao e fonte da verdade.
4. Checklist inclui privacidade, permissao, export e canonizacao.

## Definition of Done
1. Runbook criado.
2. Links em README/docs relevantes.
3. Checklist operacional validado manualmente.

## Validacao
- comandos/checks: revisao manual seguindo o runbook.
- revisao manual: executar pelo menos um ciclo com fixture anonima.

## Evidencia esperada
- Runbook versionado.
- Checklist GO/NO-GO preenchivel.

## Riscos
- Documentacao ficar atras da implementacao.
- Omitir passo de limpeza de raw logs.

## Blockers possiveis
- Falta de caminho Espanso estavel no ambiente alvo.

## Retorno esperado
- resumo do runbook
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Resultado
- Criado `docs/runbooks/RUNBOOK-004-smartscript-local-companion.md`.
- Runbook cobre comandos, allowlist, raw logs locais, import, revisao, export Espanso, registro de uso, canonizacao e checklist GO/NO-GO.
