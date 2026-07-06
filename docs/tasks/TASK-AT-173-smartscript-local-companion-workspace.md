# TASK-AT-173 - SmartScript: workspace do companion local

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-07-06
- source-of-truth: docs/tasks/TASK-AT-173-smartscript-local-companion-workspace.md

## Modo
- mode: implementation

## Objetivo unico
Criar o esqueleto do SmartScript Local Companion com CLI local e armazenamento temporario separado do banco do AlwaysTrack.

## Contexto minimo
O SmartScript precisa de um processo local iniciado pelo usuario. Esse companion e responsavel por capturar, processar e importar candidatos, mas raw logs devem permanecer locais.

## Inputs
- `docs/specs/SPEC-AT-004-smartscript.md`
- estrutura de workspaces do monorepo
- scripts npm existentes

## Dependencias
- satisfeitas: `TASK-AT-168`.
- em aberto: decisao de workspace final, sugerido `apps/smartscript-companion/`.

## Alvos explicitos
1. `apps/smartscript-companion/` ou workspace equivalente
2. `package.json`
3. docs/runbooks futuro do SmartScript

## Fora de escopo
- Captura real de clipboard/janelas.
- Processamento de candidatos.
- Export Espanso.

## Checklist
1. Criar workspace do companion.
2. Implementar CLI `smartscript start`, `stop`, `status`, `process --today`, `import --today`, `export-espanso` como comandos stub seguros.
3. Definir diretorio local de dados temporarios.
4. Garantir que comandos nao enviam raw logs ao AlwaysTrack.
5. Adicionar smoke local minimo do CLI.

## Acceptance Criteria
1. CLI responde aos comandos conceituais sem executar captura real ainda.
2. Diretorio local temporario e documentado.
3. Nenhum comando cria tabela, upload ou persistencia remota de raw logs.
4. Workspace entra em typecheck/test conforme padrao do repo.

## Definition of Done
1. Workspace criado.
2. Smoke do CLI documentado.
3. Proxima task de captura desbloqueada.

## Validacao
- comandos/checks: script de teste/smoke do companion, `npm run typecheck --workspaces --if-present`.
- revisao manual: rodar `smartscript status`.

## Evidencia esperada
- Saida do CLI.
- Localizacao do storage temporario.

## Riscos
- Acoplar companion ao backend cedo demais.
- Criar comportamento de captura antes de allowlist.

## Blockers possiveis
- Stack do companion exigir dependencia nativa nao suportada.

## Retorno esperado
- resumo do workspace
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Resultado
- Criado workspace `@alwaystrack/smartscript-companion` em `apps/smartscript-companion`.
- CLI responde a `start`, `stop`, `status`, `process --today`, `import --today` e `export-espanso`.
- Storage local fica em `~/.alwaystrack/smartscript` por padrao e status redige conteudo sensivel.
