# Pipeline Audit - 2026-04-29

## Metadata
- status: accepted
- owner: codex
- last-updated: 2026-04-29
- source-of-truth: docs/operations/pipeline-audit-2026-04-29.md

## Objetivo
Auditar o core herdado e iniciar a conversao para um pipeline de desenvolvimento reutilizavel, leve e LLM-engine agnostic.

## Achados
- O fluxo herdado de handoff, evidencia e verificacao era aproveitavel.
- A documentacao ativa estava acoplada a um projeto anterior, com rotas, capabilities, tasks e estados especificos.
- O repositorio precisava separar tres coisas: core do pipeline, instancia do projeto e documento central de entrada.
- O historico herdado era grande o bastante para prejudicar token usage se continuasse no contexto padrao.

## Decisao aplicada
- Criar `docs/pipeline/` como core reutilizavel.
- Criar `docs/project/` como superficie generica de instancia.
- Reescrever `docs/README.md` como indice agnostico.
- Remover specs, tasks, runbooks e states herdados do contexto ativo.

## Riscos
- Pode haver referencia antiga em git history, mas ela nao entra mais na leitura padrao.
- A primeira rodada de cada projeto ainda precisa identificar explicitamente o documento central correto em `doc/`.
- Se o documento central for ambiguo, o pipeline deve registrar incertezas em intake antes de criar specs.

## Recomendacao
Proximo ciclo: criar `docs/project/intake.md` a partir do documento central do projeto atual, sem promover decisao de dominio ou stack que nao esteja sustentada pela fonte.
