# EXEC-AT-029 - Wiki published slug access

## Metadata
- task-id: AT-040
- execution-id: EXEC-AT-029
- mode: runtime
- execution-mode: orchestrator
- specialist: codex
- status: completed
- date: 2026-06-08

## Sequencia operacional aplicada
1. Revisado o fluxo atual da Wiki, que carregava detalhe apenas por `pageId`.
2. Criado contrato autenticado `GET /v1/wiki/pages/by-slug/:slug`.
3. Resolver por slug normalizado e escopado por `organizationId`, preservando regra de pagina ativa para nao-admin.
4. Atualizada a SPA para iniciar em Wiki quando a URL for `/wiki` ou `/wiki/<slug>`.
5. Entrada direta por slug passa a selecionar a pagina correta; slug inexistente mostra erro operacional em vez de abrir a primeira pagina.
6. Clicar em pagina da lista atualiza a URL para `/wiki/<slug>` sem recarregar a SPA.

## Artefatos materiais
1. `services/api/src/core/wiki/wiki.service.ts`
2. `services/api/src/core/wiki/wiki.handlers.ts`
3. `services/api/src/app.ts`
4. `services/api/src/core/wiki/wiki.service.test.ts`
5. `apps/web/src/main.tsx`
6. `docs/tasks/EXEC-AT-029-wiki-published-slug-access.md`

## Evidencias observaveis
1. `/wiki/primeira-wiki` entra na view Wiki e tenta abrir exatamente a pagina `primeira-wiki`.
2. Endpoint por slug usa `organizationId` do ator.
3. Nao-admin recebe apenas paginas ativas por slug.
4. Leitura e presenca continuam usando `pageId` depois da resolucao do slug.

## Validacao
1. `npm run test --workspace @alwaystrack/api -- wiki.service.test.ts` - passou, 17 testes.
2. `npm run typecheck --workspace @alwaystrack/api` - passou.
3. `npm run typecheck --workspace @alwaystrack/web` - passou.
4. `npm run build --workspace @alwaystrack/web` - passou.

## Riscos e ressalvas
1. O servidor de producao ainda precisa encaminhar rotas SPA como `/wiki/<slug>` para `index.html`; o Vite local ja faz isso.
2. Mudanca futura de slug continua quebrando links antigos; redirects historicos seguem fora de escopo.

## Nota para proximo ciclo
Validar manualmente no navegador copiando/recarregando `/wiki/<slug>` de uma pagina publicada.
