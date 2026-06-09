# TASK-AT-055 - CI quality gates and developer onboarding

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-06-09
- source-of-truth: docs/tasks/TASK-AT-055-ci-quality-gates-dev-onboarding.md

## Modo
- mode: developer-experience

## Objetivo unico
Transformar manutencao do AlwaysTrack em um processo claro: setup rapido, checks confiaveis, PR template, quality gates e guia de contribuicao.

## Contexto minimo
O projeto ja tem scripts de setup/check, docs de tasks e runbooks, mas um dev novo ainda precisa descobrir muita coisa por leitura dispersa. Para escala de time, precisamos de contrato de contribuicao.

## Alvos explicitos
1. Criar `CONTRIBUTING.md`.
2. Criar guia "primeira hora no projeto".
3. Documentar comandos:
   - setup local;
   - seed/flush;
   - tests;
   - docs;
   - e2e;
   - perf smoke;
   - migrations.
4. Criar PR template com checklist:
   - testes;
   - migrations;
   - docs;
   - screenshots/evidencia;
   - risco/rollback.
5. Atualizar CI para gates por camada:
   - lint/typecheck/unit;
   - integration;
   - e2e smoke;
   - docs;
   - migrations;
   - perf smoke opcional.
6. Definir branch/release/rollback policy.

## Fora de escopo
- Implantar plataforma CI nova se GitHub Actions atual bastar.
- Exigir teste de carga completo em todo PR.

## Acceptance Criteria
1. Dev novo roda ambiente local seguindo docs sem ajuda oral.
2. PR template orienta risco e validacao.
3. CI mostra claramente qual camada falhou.
4. Docs listam quando rodar cada gate localmente.

## Validacao
- Simular clone limpo: `npm install`, `npm run setup`, `npm run check`.
- Abrir PR teste ou rodar GitHub Actions.

## Execucao 2026-06-09
- Criado `CONTRIBUTING.md` com primeira hora, comandos e politica de PR.
- Criado `.github/pull_request_template.md`.
- CI separado em gate de qualidade e smoke Playwright.
- CI agora roda `check`, `check:docs`, `db:test:migrations`, `repo:hygiene` e Playwright desktop.
- Pendente: avaliar custo do Playwright em todo push e mover para PR/nightly se pesar.

## Riscos
- Gates demais podem atrasar entrega; separar rapido/completo.
- Docs precisam ser mantidas junto com mudanças de runtime.
