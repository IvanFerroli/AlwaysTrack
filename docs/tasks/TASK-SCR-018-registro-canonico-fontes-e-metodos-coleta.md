# TASK-SCR-018 - Registro canonico de fontes e metodos de coleta

## Metadata
- status: completed-with-remarks
- owner: olympus-taskyfier
- last-updated: 2026-04-26
- source-of-truth: docs/tasks/TASK-SCR-018-registro-canonico-fontes-e-metodos-coleta.md

## Modo
- mode: runtime

## Objetivo unico
Centralizar configuracao de fontes e metodos de coleta (`api-json`, `rss`, `sitemap`, `ats`, `html-jsonld`) para permitir expansao de cobertura sem hardcode disperso.

## Contexto minimo
A base atual cresceu por incrementos validos, mas ainda concentra regras de metodo em pontos diferentes do scraper. Isso aumenta custo de manutencao ao adicionar novas fontes.

## Inputs
- `services/api/src/features/scraper/scraper.types.ts`
- `services/api/src/features/scraper/scraper.runner.ts`
- `services/api/src/features/scraper/scraper.fetcher.ts`
- `services/api/src/features/scraper/scraper.parser.ts`
- `services/api/src/features/scraper/scraper.runner.test.ts`
- `docs/specs/SPEC-003-job-scraping.md`

## Dependencias
- satisfeitas: TASK-SCR-010, TASK-SCR-011
- em aberto: nomenclatura final dos metodos para observabilidade

## Alvos explicitos
1. Definir registro unico de fonte+metodo com campos obrigatorios por fonte.
2. Fazer runner usar esse registro como verdade unica de execucao.
3. Expor `method` efetivo no `sourceReports` para diagnostico.
4. Atualizar spec/runbook para refletir o novo contrato.

## Fora de escopo
- adicionar dezenas de novas fontes neste mesmo ciclo;
- redesign completo do scraper;
- bypass de protecoes anti-bot.

## Checklist
1. Criar tipo canonico de metodo de coleta.
2. Migrar definicoes de fonte para registro unico.
3. Ajustar report para incluir metodo efetivo.
4. Cobrir regressao para `source=all` sem quebra.

## Acceptance Criteria
1. `source=all` segue funcional apos refactor de registro.
2. Cada fonte ativa reporta `method` de forma consistente.
3. Testes do runner cobrem registro canonico sem flakiness.

## Definition of Done
1. Registro central de fontes/metodos ativo no runtime.
2. Inclusao de novas fontes fica mais previsivel e rastreavel.

## Validacao
- comandos/checks:
  - `npm run test --workspace @olympus/api -- src/features/scraper/scraper.runner.test.ts`
  - `npm run check`
- revisao manual:
  - executar `POST /v1/scraper/run?source=all` e validar `sourceReports[].method`.

## Evidencia esperada
- tabela/registro de fontes e metodos versionada;
- report com `method` por fonte;
- spec atualizada com contrato novo.

## Riscos
- regressao silenciosa por migracao incompleta de fonte antiga;
- divergencia entre metodo configurado e realmente executado.

## Blockers possiveis
- acoplamentos antigos nao mapeados durante migracao;
- testes atuais insuficientes para garantir cobertura de todos os metodos.

## Feedback obrigatorio de retorno
- quais metodos ficaram oficialmente suportados no baseline?
- houve alguma fonte existente que precisou mudar de metodo para manter estabilidade?
