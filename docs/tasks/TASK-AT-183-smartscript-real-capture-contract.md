# TASK-AT-183 - SmartScript: contrato da captura real

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-07
- source-of-truth: docs/tasks/TASK-AT-183-smartscript-real-capture-contract.md

## Modo
- mode: implementation

## Objetivo unico
Definir o contrato de eventos reais do SmartScript, separando captura local bruta, descarte por politica, pacote processavel e candidato importavel.

## Contexto minimo
O SmartScript MVP atual processa fixtures/eventos locais, mas ainda nao possui listener real. Esta task abre a Fase H garantindo que captura real nao vire keylogger generico e que raw logs continuem somente locais.

## Inputs
- `docs/specs/SPEC-AT-004-smartscript.md`
- `docs/runbooks/RUNBOOK-004-smartscript-local-companion.md`
- `apps/smartscript-companion/src/storage.ts`
- `apps/smartscript-companion/src/allowlist.ts`

## Dependencias
- satisfeitas: `TASK-AT-168` a `TASK-AT-182`.
- em aberto: n/a.

## Alvos explicitos
1. `apps/smartscript-companion/src/`
2. `docs/runbooks/RUNBOOK-004-smartscript-local-companion.md`
3. `docs/operations/smartscript-usage-report.md`

## Fora de escopo
- Captura real de clipboard/janela.
- Bridge AlwaysChat.
- Persistir raw logs no AlwaysTrack.

## Checklist
1. Definir schema local de evento real com tipo, fonte, destino, timestamp, texto bruto local e metadados redigiveis.
2. Definir eventos descartados sem salvar texto bloqueado.
3. Mapear fontes permitidas e bloqueadas.
4. Documentar limites de SO/WSL/Windows.
5. Reafirmar que AlwaysTrack recebe apenas candidatos/processados/decisoes.
6. Reafirmar triggers pessoais com `:` e `/` reservado.

## Acceptance Criteria
1. Existe contrato claro para adapters reais gerarem eventos.
2. O contrato nao exige raw log remoto.
3. Eventos fora da allowlist podem ser contados sem salvar conteudo.
4. O processador atual consegue continuar consumindo eventos locais.
5. O proximo task consegue implementar control plane sem rediscutir produto.

## Definition of Done
1. Tipos/helpers locais ajustados ou documentados.
2. Runbook atualizado com contrato e fronteiras.
3. Testes basicos cobrem evento aceito e descartado.

## Validacao
- comandos/checks: `npm run typecheck --workspace @alwaystrack/smartscript-companion`, `npm run test --workspace @alwaystrack/smartscript-companion`.
- revisao manual: conferir que nenhum novo contrato aponta raw log para API/DB.

## Evidencia esperada
- Exemplo de evento local sem dados reais.
- Nota de privacidade no runbook.
- Saida dos testes.

## Riscos
- Scope virar keylogger generico.
- Contrato depender demais de API fragil do Windows/WSL.

## Blockers possiveis
- Falta de decisao sobre quais apps entram na allowlist real.

## Retorno esperado
- resumo do contrato
- evidencias de validacao
- riscos residuais
- proximo passo recomendado
