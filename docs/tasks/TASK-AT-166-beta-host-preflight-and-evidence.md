# TASK-AT-166 - Preflight final do beta na maquina host

## Metadata
- status: ready-external-host
- owner: olympus_orchestrator
- last-updated: 2026-06-21
- source-of-truth: docs/tasks/TASK-AT-166-beta-host-preflight-and-evidence.md

## Modo
- mode: verification

## Objetivo unico
Executar o gate final do Beta Fechado na maquina que hospedara o AlwaysTrack e registrar evidencias antes de liberar acesso Tailscale.

## Contexto minimo
Unitarios, typechecks, descoberta Playwright e scripts do preflight foram validados. Esta sessao nao conseguiu concluir subprocessos locais do Playwright/smoke por bloqueio `spawnSync npx EPERM` do sandbox e falta de retorno do executor externo.

## Dependencias
- satisfeitas: `TASK-AT-154` a `TASK-AT-165`.
- em aberto: `.env` beta real, credenciais Google e maquina host acessivel.

## Checklist
1. Preencher `APP_MODE=beta-local`, `VITE_APP_MODE=beta-local` e `BETA_ALLOWED_EMAILS` real.
2. Rodar `npm run beta:preflight` na maquina host.
3. Confirmar os quatro testes E2E por role.
4. Confirmar smoke beta com banco temporario.
5. Validar login tradicional permitido e negado.
6. Validar Google Login permitido e negado com redirect Tailscale configurado.
7. Conferir banner beta e menus de SAC/Vendedor.
8. Guardar saida do comando e prints no registro de homologacao.

## Acceptance Criteria
1. `npm run beta:preflight` termina com exit code zero.
2. Nenhum teste acessa banco de trabalho durante o gate.
3. SAC nao ve dados comerciais e vendedor nao ve terceiros.
4. Google Login respeita dominio e allowlist nominal.
5. Evidencias ficam anexadas ao registro da primeira sessao.

## Riscos
- Redirect Google diferente do cadastrado no Google Cloud.
- Email do participante ausente da allowlist.
- Porta/hostname Tailscale diferente do documentado.

## Retorno esperado
- saida do preflight
- prints por role
- decisao GO/NO-GO
- incidentes encontrados
