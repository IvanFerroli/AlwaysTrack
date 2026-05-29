# Beta Readiness Gate - 2026-05-29

## Metadata
- status: active
- owner: ops-builder
- last-updated: 2026-05-29
- source-of-truth: docs/operations/beta-readiness-gate-2026-05-29.md

## Decisao
AlwaysTrack pode seguir para beta externo controlado somente depois que todos os itens obrigatorios abaixo estiverem verdes no ambiente alvo.

## Obrigatorios
1. `npm run check` passa no commit publicado.
2. `npm run smoke:beta-local` passa em maquina local antes de publicar o beta.
3. `npm run env:check -- --production` passa com URLs publicas e `SESSION_SECRET` forte.
4. Banco SQLite usa volume persistente ou ha ADR nova para outro banco.
5. Storage local usa volume persistente e rotina de backup ou ha ADR nova para storage externo.
6. `.env.production` nao e versionado.
7. `NOTIFICATION_PROVIDER=fake` fica como padrao ate credenciais Meta reais serem configuradas e testadas.
8. Se `NOTIFICATION_PROVIDER=meta`, todos os secrets Meta estao no provider/host e webhook esta validado.
9. Admin real tem senha definida fora do seed temporario.
10. Wiki e dados operacionais estao isolados por organizacao.
11. Suporte/contingencia definidos: pausar job, trocar provider para fake, rollback de imagem e backup de banco/storage.

## Aceito para beta controlado
- SQLite local-first com volume e backup.
- Storage local privado com volume e backup.
- Integracoes Google, IA e Meta opcionais por env.
- Provider fake para demonstracao sem envio real.

## Nao aceito
- `localhost` ou loopback em URLs publicas.
- `SESSION_SECRET` curto, default ou compartilhado.
- Credenciais reais em arquivo versionado.
- Envio Meta real sem smoke de webhook e template.
- Conteudo wiki cross-org ou sem trilha de auditoria.

## Validacoes desta rodada
- `npm run env:check`: passou localmente.
- `npm run env:check -- --production`: passou com envs publicas sinteticas e secret forte.
- `npm run setup`: passou e aplicou schema/seed local.
- `npm run check`: passou.
- `npm run build --workspace @alwaystrack/web`: passou.
- `npm run smoke:beta-local`: passou; comando versionado em `package.json`.

## Residuos conhecidos
- `npm audit --omit=dev` ainda tinha residual moderado em `exceljs`/`uuid` em ciclos anteriores; acompanhar upgrade seguro upstream.
- Ambiente externo real ainda nao foi provisionado nesta task.
