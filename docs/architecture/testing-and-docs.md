# Testing and Docs Maintenance

## Comandos principais
- `npm run up`: bancada local completa; instala, prepara banco/seed/docs, sobe API/Web/Studio e abre app/docs/reports no navegador.
- `npm run up -- --skip-install --no-open --no-perf-smoke`: variante rapida para subir sem abas e sem carga local.
- `npm run setup`: prepara ambiente e banco sem subir servicos.
- `npm run check`: gate rapido atual.
- `npm run test:unit`: unit/service tests sem quality e2e.
- `npm run test:integration`: fluxo principal service-level.
- `npm run test:regression`: notas, Wiki, FAQ e notificacoes.
- `npm run docs:api`: TypeDoc.
- `npm run test:all`: check + TypeDoc.
- `npm run repo:hygiene`: higiene de repo e segredos obvios.
- `npm run security:deps`: auditoria de dependencias de producao alta/critica.
- `npm run perf:smoke:report -- --target=http://localhost:3333`: smoke Artillery com JSON/HTML/diagnostico.

## Artefatos abertos pelo `npm run up`
- App: `http://localhost:5173`
- API health: `http://localhost:3333/health`
- Prisma Studio: `http://localhost:5555`
- TypeDoc: `docs/generated/typedoc/index.html`
- Testes: `docs/testing/strategy.md` e `docs/testing/playwright-ci.md`
- Performance: `docs/performance/README.md`, `docs/performance/report-template.md` e ultimo HTML/MD em `docs/performance/reports/`
- Seguranca/operacao: gate de exposicao, backup/restore e incidente
- Reports existentes: Playwright e coverage quando ja estiverem no disco

## Auditoria recente
O mapa atual de cobertura e lacunas recentes fica em `docs/architecture/recent-test-doc-coverage-audit.md`.

Use esse documento quando precisar entender rapidamente:
- quais frentes recentes ja tem testes/docs suficientes;
- quais riscos dependem de deploy/infra real;
- quais follow-ups foram conscientemente deixados fora do backlog ativo.

## Onde documentar
- Arquitetura transversal: `docs/architecture`.
- Estrategia de testes: `docs/testing`.
- Task planejada: `docs/tasks/TASK-AT-*.md`.
- Execucao concluida: `docs/tasks/EXEC-AT-*.md`.
- Runbook operacional: `docs/runbooks`.

## Padrao de comentario no codigo
Use doc comments em exports quando houver:
- regra de negocio nao obvia;
- contrato de tenant/role;
- idempotencia/dedupe;
- efeitos colaterais como auditoria/notificacao;
- dependencia externa ou fallback.

Evite comentario que apenas repete o nome da funcao.
