# Recent Test and Documentation Coverage Audit

## Metadata
- status: current
- owner: olympus_orchestrator
- last-updated: 2026-06-18
- source-of-truth: docs/architecture/recent-test-doc-coverage-audit.md

## Objetivo
Registrar a cobertura real das mudancas recentes para facilitar manutencao, onboarding e retomada do projeto sem depender do historico do chat.

## Estado resumido
O AlwaysTrack esta em estado de MVP interno avancado com trilhas funcionais de DANFE, ranking, Wiki/FAQ, Avisos, Scriptoteca, seguranca e onboarding tecnico. As mudancas recentes estao documentadas em tasks/EXECs e os comandos principais estao concentrados em `docs/architecture/testing-and-docs.md`.

## Cobertura por frente recente

### Seguranca e exposicao externa
- Coberto: modelo de ameacas, headers/CORS, login/sessao, CSRF/origem, rate limit, upload, anti-IDOR, segredos/env, auditoria, dependencias, backup, integracoes e gate de exposicao.
- Evidencias: `TASK-AT-102` a `TASK-AT-116`, EXECs correspondentes, `docs/security/*`, `docs/operations/*`, `npm run repo:hygiene`, `npm run security:deps`.
- Lacuna consciente: validacao definitiva de deploy depende de infraestrutura real, DNS/HTTPS, storage externo, secrets manager e decisao de banco/backup fora do SQLite local.

### Validacao runtime e contratos
- Coberto: primeira fatia de helper de validacao runtime e documentacao do padrao.
- Evidencias: `TASK-AT-107`, `EXEC-AT-107`, docs de arquitetura e testes.
- Lacuna recomendada: migrar gradualmente announcements, script library, organizations, documents, notifications, imports e reports para o mesmo helper. Nao e bloqueio de demo, mas reduz risco de payload inconsistente.

### Imagens ricas em conteudo operacional
- Coberto: suporte MVP transversal para anexos/imagens em conteudos operacionais.
- Evidencias: `TASK-AT-101`, `EXEC-AT-101`, `docs/architecture/rich-content-images.md`, typecheck/build.
- Lacuna recomendada: remocao auditavel de anexos, seeds visuais e validacao manual por navegador/upload real.

### `npm run up` e onboarding local
- Coberto: instalacao, setup, seed, TypeDoc, app, Prisma Studio, artefatos de testes/docs/reports e smoke local opcional.
- Evidencias: `TASK-AT-121`, `EXEC-AT-121`, `scripts/start-all.js`, `docs/testing/strategy.md`, `docs/performance/README.md`.
- Lacuna consciente: coverage HTML e Playwright report so abrem quando ja existem. A task nao introduziu ferramenta nova de coverage para evitar escopo artificial.

### Performance e carga
- Coberto: Artillery smoke/report local, comandos de 1000 usuarios documentados e guard contra benchmark pesado em ambiente inadequado.
- Evidencias: `scripts/perf-report.js`, `docs/performance/README.md`, `docs/performance/report-template.md`, `TASK-AT-051`, `TASK-AT-055`, `TASK-AT-121`.
- Lacuna consciente: prova real de 1000 usuarios simultaneos exige ambiente stage/producao similar ao deploy final, monitoramento e massa de dados representativa.

### Testes automatizados
- Coberto: lint, typecheck, unit/integration/regression API, Playwright smoke/API, migration gate, repo hygiene e gates de seguranca.
- Evidencias: scripts em `package.json`, `docs/testing/strategy.md`, `docs/testing/playwright-ci.md`.
- Lacuna recomendada: adicionar coverage gate formal somente se o projeto decidir um alvo minimo por modulo. Hoje a prioridade e smoke confiavel e testes direcionados por risco.

## Backlog ativo apos auditoria
1. `TASK-AT-074-final-visual-polish-by-real-screenshots.md`: bloqueada por prints reais de acabamento visual.

## Follow-ups ainda nao taskificados
1. Coverage formal com HTML gerado por comando padrao.
2. Migracao completa para validacao runtime em todos os endpoints restantes.
3. Anexos com remocao auditavel e seeds visuais.
4. Preparacao de infraestrutura final de deploy.
5. Padronizacao de timeout/redaction em integracoes externas.

## Decisao
Auditoria reaberta em 18/06/2026 apos `TASK-AT-126`, `TASK-AT-140` e `TASK-AT-141`. A cobertura existente continua suficiente para DANFE, Wiki/FAQ, seguranca, docs e validacao runtime da Scriptoteca em nivel unit/service. Em 19/06/2026, `TASK-AT-142` fechou a lacuna dos pacotes/roteiros com regressao API e Artillery cobrindo Fluxos/Scriptoteca/copia. As demais lacunas seguem como follow-ups conscientes, sem task formal nova nesta rodada.
