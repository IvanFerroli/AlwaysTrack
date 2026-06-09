# TASK-AT-049 - Playwright E2E regression suite

## Metadata
- status: completed-partial
- owner: olympus_taskyfier
- last-updated: 2026-06-09
- source-of-truth: docs/tasks/TASK-AT-049-playwright-e2e-regression-suite.md

## Modo
- mode: e2e-quality

## Objetivo unico
Adicionar Playwright para cobrir fluxos reais do navegador e impedir regressao em operacoes criticas do AlwaysTrack.

## Contexto minimo
O app e uma SPA Vite/React com API Express. O backend tem boa cobertura service-level, mas faltam testes navegando pela UI real: login, notas, ranking, Wiki, FAQ, notificacoes e usuarios.

## Alvos explicitos
1. Instalar/configurar Playwright.
2. Criar ambiente e2e isolado com banco temporario e seed deterministico.
3. Criar helpers de login por role: ADMIN, VENDEDOR, SUPERVISOR, SAC/FINANCEIRO.
4. Cobrir smoke principal:
   - Login Google mockado ou fallback email/senha.
   - Upload DANFE fixture como vendedor/admin.
   - Aprovar/rejeitar nota.
   - Ver ranking/extrato.
   - Criar Wiki, sugerir edicao, aprovar/rejeitar com comentario.
   - Criar FAQ, comentar, reagir, promover para Wiki.
   - Receber e marcar notificacao.
   - Criar usuario/role comercial.
5. Adicionar screenshots/videos apenas em falha.
6. Rodar em desktop e mobile viewport basico.

## Fora de escopo
- Testar provider real Google/OpenAI.
- Teste visual pixel-perfect extenso.
- Cobrir todos os filtros combinatorios.

## Acceptance Criteria
1. `npm run test:e2e` sobe ambiente, roda Playwright e limpa estado.
2. Fluxos criticos passam localmente e em CI.
3. Falha gera artefato util: screenshot, trace ou video.
4. Teste e2e nao depende de dados manuais do dev.

## Validacao
- `npm run test:e2e`
- `npm run check`

## Execucao 2026-06-09
- Playwright instalado e configurado em `playwright.config.ts`.
- `npm run test:e2e` agora roda Playwright real, nao alias de integration.
- Ambiente e2e isolado criado em `scripts/start-e2e.js`, com SQLite temporario em `.tmp/e2e`, API `3334` e web `5174`.
- Smoke desktop/mobile criado para login admin e navegacao das areas comerciais principais.
- CI instala Chromium com deps e roda smoke desktop.
- Pendente: ampliar para upload/review DANFE, Wiki review, FAQ thread/promocao, notificacoes e criacao de usuario.
- Validacao local do navegador ficou bloqueada por dependencia de SO ausente (`libnspr4.so`) e falta de sudo para `playwright install-deps`; CI cobre instalacao com `--with-deps`.

## Riscos
- E2E flaky se servidor/banco nao forem isolados.
- Login Google real deve ser mockado ou evitado no CI.
