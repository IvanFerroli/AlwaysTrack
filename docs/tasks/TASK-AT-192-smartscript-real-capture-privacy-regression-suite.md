# TASK-AT-192 - SmartScript: regressao de privacidade da captura real

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-07
- source-of-truth: docs/tasks/TASK-AT-192-smartscript-real-capture-privacy-regression-suite.md

## Modo
- mode: verification

## Objetivo unico
Criar a suite minima de regressao para garantir que captura real respeita pausa/parada, allowlist, raw local, sanitizacao e triggers `:`.

## Contexto minimo
As regressões anteriores cobrem import/process/UI. Esta suite protege o novo caminho de captura real antes do release gate.

## Inputs
- `TASK-AT-185` a `TASK-AT-191`
- `docs/testing/strategy.md`
- mocks de adapter local

## Dependencias
- satisfeitas: `TASK-AT-185` a `TASK-AT-191`.
- em aberto: mock estavel para contexto ativo/clipboard.

## Alvos explicitos
1. testes do companion
2. testes API SmartScript se import for tocado
3. docs/testing se houver novo comando

## Fora de escopo
- Teste CI dependente de clipboard real.
- Benchmark grande.
- Auditoria legal externa.

## Checklist
1. Testar logger parado.
2. Testar pause/resume.
3. Testar fora da allowlist.
4. Testar raw nao remoto.
5. Testar purge/TTL.
6. Testar `/` bloqueado e `:` exigido.
7. Testar import sanitizado.
8. Testar status sem conteudo bruto.
9. Documentar smoke manual real fora do CI.

## Acceptance Criteria
1. Suite falha se raw log for enviado ao AlwaysTrack.
2. Suite falha se fonte bloqueada gerar candidato.
3. Suite falha se status expuser texto.
4. Suite roda sem clipboard real no CI.

## Definition of Done
1. Testes automatizados integrados.
2. Smoke manual documentado.
3. Checklist de privacidade atualizado.

## Validacao
- comandos/checks: `npm run test --workspace @alwaystrack/smartscript-companion`, testes API SmartScript relevantes, `npm run typecheck --workspaces --if-present`.
- revisao manual: smoke de fonte permitida e bloqueada no host.

## Evidencia esperada
- Saida dos testes.
- Checklist manual com ambiente/data.
- Confirmacao de raw local.

## Riscos
- Mock passar e ambiente real falhar.
- CI nao proteger dependencias nativas.

## Blockers possiveis
- Adapters nao terem interface injetavel.

## Retorno esperado
- resumo da regressao
- evidencias automatizadas/manuais
- riscos residuais
- proximo passo recomendado
