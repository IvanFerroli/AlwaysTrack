# EXEC-TMP-008 - Execution Report

## Metadata
- task-id: ROADMAP item 6 (validar em clone limpo) + hardening deploy
- execution-id: EXEC-TMP-008
- mode: quality + deploy + security hygiene
- execution-mode: execution artifact mode
- orchestrator: olympus_orchestrator
- specialist: quality-gate
- status: executado
- date: 2026-05-29

## Sequencia operacional aplicada
1. Ajustado contrato de deploy web: `Dockerfile.web` recebe `VITE_APP_NAME` como build arg.
2. Ajustado Compose de producao para repassar `VITE_APP_NAME` e exigir `VITE_API_BASE_URL` explicito, sem fallback localhost.
3. Atualizado runbook de producao para usar `docker compose --env-file .env.production`, garantindo interpolacao de build args.
4. Executado clone limpo real em `/tmp/alwaystrack-clean-w1n8Xm`.
5. No clone limpo, executados `npm install`, `npm run setup` e `npm run check`.
6. Executado `npm audit fix --package-lock-only` sem `--force`, atualizando apenas transitivos seguros no lockfile.
7. Endurecido `env:check --production` para exigir `VITE_API_BASE_URL`.

## Artefatos materiais
1. `Dockerfile.web` - build arg `VITE_APP_NAME`.
2. `deploy/docker-compose.example.yml` - `VITE_APP_NAME` repassado e `VITE_API_BASE_URL` obrigatorio.
3. `scripts/check-env.js` - `VITE_API_BASE_URL` obrigatorio em modo producao.
4. `package-lock.json` - `qs` atualizado para `6.15.2` e `tmp` para `0.2.7`.
5. `docs/runbooks/RUNBOOK-002-deploy-producao-jobs.md` - comandos Compose com `--env-file`.

## Evidencias observaveis
- Clone limpo: `git clone file:///home/ivan/AlwaysTrack /tmp/alwaystrack-clean-w1n8Xm`.
- No clone limpo, `npm install` passou.
- No clone limpo, `npm run setup` passou e aplicou seed demo.
- No clone limpo, `npm run check` passou: 23 arquivos, 116 testes.
- Localmente, `npm run check` passou: 23 arquivos, 116 testes.
- Localmente, `VITE_APP_NAME=OpsCore npm run build --workspace @alwaystrack/web` passou.
- Localmente, `npm run env:check -- --production` passou com envs falsas seguras.
- `npm audit --omit=dev` ficou com residual conhecido: 2 moderadas em `uuid` via `exceljs`.

## Validacao nao executada
`docker compose config` e `docker build -f Dockerfile.web ...` nao foram executados porque Docker nao esta instalado neste ambiente (`docker: command not found`).

## Residual consciente
O fix restante sugerido por `npm audit` exige `npm audit fix --force` e downgrading major de `exceljs` para `3.4.0`. Isso foi evitado neste ciclo por risco funcional no importador/exportador XLSX.

## Estado final da trilha
ROADMAP item 6 deixou de ser pendente de clone real: o clone limpo completo passou no ambiente local.
