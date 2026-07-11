# TASK-AT-191 - SmartScript: observabilidade local e evidencia redigida

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-07
- source-of-truth: docs/tasks/TASK-AT-191-smartscript-local-observability-and-redacted-evidence.md

## Modo
- mode: implementation

## Objetivo unico
Expor observabilidade segura do logger real: ativo/parado, eventos aceitos/descartados, ultima captura, allowlist aplicada e storage, sem conteudo bruto.

## Contexto minimo
Sem observabilidade, o usuario nao sabe se capturou algo. Com observabilidade demais, vazamos texto. Esta task cria a fronteira segura para operar e diagnosticar.

## Inputs
- `TASK-AT-188`
- `TASK-AT-190`
- `docs/operations/smartscript-usage-report.md`

## Dependencias
- satisfeitas: `TASK-AT-188`, `TASK-AT-190`.
- em aberto: decisao se algum status aparece tambem na UI web.

## Alvos explicitos
1. `apps/smartscript-companion/src/cli.ts`
2. `docs/runbooks/RUNBOOK-004-smartscript-local-companion.md`
3. `docs/operations/smartscript-usage-report.md`
4. `apps/web/src/views/script-library.tsx` se houver status web

## Fora de escopo
- Mostrar raw logs.
- Dashboard remoto de capturas.
- Admin corporativo de politicas.

## Checklist
1. Status mostrar eventos aceitos/descartados por fonte/tipo.
2. Mostrar ultima captura redigida.
3. Mostrar estado do adapter e allowlist.
4. Mostrar storage/TTL sem texto.
5. Diferenciar demo de captura real.
6. Documentar como coletar evidencia segura.

## Acceptance Criteria
1. Operador sabe se capturou algo sem abrir raw logs.
2. Nenhum texto bruto aparece em status/UI/docs.
3. Evidencia redigida basta para debug basico.
4. Estados de produto seguem limitados a `Em uso`, `Gerados hoje`, `Em revisão`.

## Definition of Done
1. Status seguro implementado.
2. Docs de observacao atualizadas.
3. Validacao manual com captura real/degradada.

## Validacao
- comandos/checks: typecheck companion/web se tocado.
- revisao manual: comparar status com arquivos locais sem expor conteudo.

## Evidencia esperada
- Saida de `smartscript:status`.
- Nota de evidencia redigida.
- Confirmacao de ausencia de raw text.

## Riscos
- Observabilidade vazar texto.
- Diagnostico insuficiente para ambiente real.

## Blockers possiveis
- Browser nao acessar companion local com seguranca.

## Retorno esperado
- resumo da observabilidade
- evidencias de validacao
- riscos residuais
- proximo passo recomendado
