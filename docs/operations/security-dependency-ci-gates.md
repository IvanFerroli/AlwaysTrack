# Security Dependency And CI Gates

## Metadata
- status: active
- owner: ops/security
- last-updated: 2026-07-15
- source-of-truth: docs/operations/security-dependency-ci-gates.md

## Objetivo
Definir os gates bloqueantes de dependencia, SAST, segredo, licenca e higiene de repositorio sem depender de credenciais externas.

## Gates locais
```bash
npm run security:deps
npm run security:licenses
npm run repo:hygiene
npm run env:check -- --production
```

- `security:deps:prod` executa `npm audit --audit-level=high --omit=dev` na arvore de producao.
- `security:deps:all` executa o mesmo limiar na arvore completa, incluindo ferramentas de desenvolvimento e build.
- `repo:hygiene` bloqueia arquivos locais, scripts de workspace ausentes, segredos obvios no snapshot e em todo o historico Git, licencas proibidas e excecoes incompletas ou expiradas. Valores de segredo nunca sao impressos.
- `security:licenses` usa o mesmo verificador para produzir o inventario e aplicar a politica de licencas.
- `env:check -- --production` continua sendo um preflight de deploy e deve falhar em uma maquina sem configuracao de producao.

## Gates de CI
O workflow `check.yml` aplica:

1. lint, typecheck e testes de todos os workspaces, sem `--if-present`;
2. build de todos os workspaces, incluindo validacao do manifest MV3 e dos bundles Web/API;
3. SCA de producao e da arvore completa no limiar alto;
4. scanner local de segredos no snapshot e no historico completo (`fetch-depth: 0`), inventario de licencas e politica do repositorio;
5. CodeQL para SAST de JavaScript/TypeScript, seguido de enforcement local do SARIF em `security-severity >= 7.0` ou nivel `error`, com apenas `contents: read` e `security-events: write` no job que publica o resultado.

Os jobs possuem timeout e nao recebem tokens, chaves ou ambientes de terceiros. O token efemero do proprio GitHub e usado apenas pelo CodeQL para publicar SARIF. Dependabot verifica semanalmente npm e GitHub Actions.

## Politica de bloqueio
- Vulnerabilidade alta ou critica em dependencia de producao, desenvolvimento ou build bloqueia o CI.
- Licencas AGPL, SSPL ou GPL sem alternativa permissiva bloqueiam o CI.
- Licenca sem metadado bloqueia, salvo excecao versionada e vigente.
- Segredo potencial no snapshot ou historico bloqueia; o log informa somente regra, arquivo/linha atual ou commit historico.
- Achado SAST com `security-severity >= 7.0` ou nivel SARIF `error` bloqueia o proprio job; regras de protecao podem aplicar limites adicionais.

## Excecoes
Toda excecao deve ser versionada junto ao gate e conter:

- pacote, versao, advisory ou gate afetado;
- motivo e mitigacao aplicada;
- owner e data de expiracao;
- issue/task de acompanhamento quando aplicavel;
- comando que reproduz o alerta.

Excecoes expiradas falham em `repo:hygiene`. As excecoes atuais de licenca cobrem somente metadados SPDX ausentes em `buffers@0.1.1` e `xmlhttprequest-ssl@2.1.2`, ambos com evidencia de concessao MIT no pacote publicado e revisao ate 2026-10-15.
As duas excecoes de segredo historico se limitam a entradas sinteticas do teste de sanitizacao em `test-harness.test.ts`, identificadas por commit e arquivo, com owner `security` e expiracao em 2026-10-15.

## Risco residual atual
Em 2026-07-15, `npm audit --audit-level=high` passa e ainda reporta 19 itens baixos/moderados. A maior parte vem de telemetria transitiva do Artillery; `uuid` vem de ExcelJS. Nao foi usado `npm audit fix --force`, pois as correcoes propostas fariam downgrade ou mudanca de major. Dependabot e a revisao semanal mantem esses itens visiveis.
