# Testing and Docs Maintenance

## Comandos principais
- `npm run up`: bancada local completa; verifica dependencias e frescor dos artefatos, prepara SQLite/seed, reutiliza servicos saudaveis, sobe o que estiver ausente e abre todas as superficies disponiveis no navegador.
- `npm run up -- --hub-only`: prepara tudo, mas abre somente o Presentation Hub.
- `npm run up -- --skip-install --no-open --no-perf-smoke`: variante sem instalacao, abas ou carga local.
- `npm run up -- --refresh-artifacts`: forca regeneracao de TypeDoc, coverage, Playwright e carga.
- `--no-coverage`, `--no-e2e`, `--no-docs`, `--no-studio` e `--no-smartscript` permitem reduzir superficies conscientemente.
- `npm run setup`: prepara ambiente e banco sem subir servicos.
- `npm run check`: gate rapido atual.
- `npm run test:unit`: unit/service tests sem quality e2e.
- `npm run test:integration`: fluxo principal service-level.
- `npm run test:regression`: notas, Wiki, FAQ e notificacoes.
- `npm run coverage:check` ou `npm run coverage:html`: thresholds e coverage HTML dos seis workspaces; politica em `docs/testing/coverage-policy.md`.
- `npm run docs:api`: TypeDoc.
- `npm run check:docs`: valida a integridade da documentacao ativa, preserva os invariantes de rollout e gera TypeDoc.
- `npm run test:all`: check + integridade documental + TypeDoc.
- `npm run repo:hygiene`: higiene de repo e segredos obvios.
- `npm run security:deps`: auditoria de dependencias de producao alta/critica.
- `npm run perf:smoke:report -- --target=http://localhost:3333`: smoke Artillery com JSON/HTML/diagnostico.
- `npm run test:startup`: freshness, seguranca e catalogo navegavel do startup local.

## Artefatos abertos pelo `npm run up`
- App: `http://localhost:5173`
- API health: `http://localhost:3333/health`
- Prisma Studio: `http://localhost:5555`
- Presentation Hub: `http://localhost:4173`
- Snapshot da bancada: `docs/generated/local-workbench/index.html`
- TypeDoc: `http://localhost:4173/files/docs/generated/typedoc/index.html`
- Testes: `docs/testing/strategy.md` e `docs/testing/playwright-ci.md`
- Performance: `docs/performance/README.md`, `docs/performance/report-template.md` e ultimo HTML/MD em `docs/performance/reports/`
- Seguranca/operacao: gate de exposicao, backup/restore e incidente
- Reports existentes: Playwright, coverage dos seis workspaces e performance servidos por HTTP quando estiverem no disco

O modo padrao abre hub, app, health live/ready, Studio, TypeDoc, seis coverages, Playwright, ultimo Artillery e documentos essenciais. Use `--hub-only` quando a apresentacao pedir uma unica aba. `--no-open` e um opt-out total e tambem impede o Artillery de abrir janela propria.

O servidor de artefatos escuta apenas em `127.0.0.1` e usa allowlist. Ele nao serve `.env`, banco, storage ou caminhos arbitrarios do checkout. Uma `DATABASE_URL` nao baseada em `file:` tambem e recusada pelo startup, salvo opt-in operacional explicito por `--allow-remote-database`.

## Coverage
`npm run coverage:html` roda as suites Vitest dos seis workspaces com `@vitest/coverage-v8`, imprime os resumos no terminal e gera um `coverage/index.html` por workspace.

Use coverage como mapa de risco, nao como numero absoluto cego:
- arquivos de parser/service recentes devem ter cobertura direta quando forem mudados;
- arquivos legados default-off podem aparecer com cobertura baixa sem bloquear apresentacao;
- bugs corrigidos devem ganhar regressao focada antes de aumentar porcentagem global.

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

## Contrato executavel da documentacao
`scripts/check-doc-integrity.js` valida todos os arquivos Markdown ativos em `docs/`. O gate cobre links e anchors internos, paths de repositorio em code spans, referencias `TASK-AT-NNN`, comandos `npm run` no pacote raiz ou no workspace indicado e os quatro campos de metadata dos artefatos canonicos ADR, SPEC, TASK e RUNBOOK.

O escopo exclui explicitamente `docs/archive/` (historico congelado), `docs/generated/` (saida do TypeDoc e da bancada local) e `docs/performance/reports/` (evidencia gerada imutavel). Excecoes de metadata preexistentes ficam em allowlist no checker com `owner` e justificativa; novas excecoes nao devem ser adicionadas sem responsavel e divida rastreavel.

## Padrao de comentario no codigo
Use doc comments em exports quando houver:
- regra de negocio nao obvia;
- contrato de tenant/role;
- idempotencia/dedupe;
- efeitos colaterais como auditoria/notificacao;
- dependencia externa ou fallback.

Evite comentario que apenas repete o nome da funcao.
