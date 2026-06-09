# TASK-AT-049 - Playwright E2E regression suite

## Metadata
- status: proposed
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

## Riscos
- E2E flaky se servidor/banco nao forem isolados.
- Login Google real deve ser mockado ou evitado no CI.

