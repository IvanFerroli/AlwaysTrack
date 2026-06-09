# TASK-AT-040 - Wiki published slug access

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-06-08
- source-of-truth: docs/tasks/TASK-AT-040-wiki-published-slug-access.md

## Modo
- mode: implementation

## Objetivo unico
Permitir que uma pagina publicada da Wiki seja acessada por slug autenticado, por exemplo `/wiki/primeira-wiki`, mantendo isolamento por organizacao e regras de pagina ativa/arquivada.

## Contexto minimo
Na tela `/wiki`, uma pagina publicada aparece na lista com slug `/primeira-wiki` e conteudo renderizado, mas o usuario tentou acessar via slug e nao conseguiu. O backend atual busca pagina por `pageId` em `/v1/wiki/pages/:pageId`; a UI inicia em `/wiki`, mas nao resolve `window.location.pathname` para um slug de pagina publicada.

## Inputs
- Pedido do usuario em 2026-06-08.
- Print observado: Wiki em `localhost:5173/wiki`, pagina publicada com slug `/primeira-wiki`.
- `docs/specs/SPEC-AT-003-wiki-collaborative-review.md`
- `docs/tasks/TASK-AT-034-wiki-content-admin.md`
- `services/api/src/core/wiki/*`
- `apps/web/src/main.tsx`

## Dependencias
- satisfeitas: Wiki autenticada, `WikiPage.slug`, unicidade por organizacao, listagem de paginas ativas e renderer Markdown.
- em aberto: definir se o contrato publico interno sera `GET /v1/wiki/pages/by-slug/:slug` ou reaproveitamento seguro da listagem com filtro exato.

## Alvos explicitos
1. `services/api/src/core/wiki/wiki.service.ts`: resolver pagina ativa por slug dentro da organizacao do ator.
2. `services/api/src/core/wiki/wiki.handlers.ts` e registro de rotas de wiki: endpoint autenticado por slug, se necessario.
3. `services/api/src/core/wiki/wiki.service.test.ts`: cobertura de slug, org e pagina arquivada.
4. `apps/web/src/main.tsx`: abrir `/wiki/:slug`, selecionar a pagina correta e manter navegacao por slug.
5. `apps/web/src/styles.css`: apenas se houver ajuste visual minimo de link/estado ativo.

## Fora de escopo
- Wiki publica sem login.
- Redirects historicos para slugs antigos.
- Permissoes granulares por pagina.
- Refatorar toda a Wiki para roteador dedicado.
- Alterar o formato Markdown ou fluxo de revisao.

## Checklist
1. Confirmar como as rotas `/wiki` sao interceptadas no bootstrap do app e como rotas desconhecidas se comportam no Vite/local.
2. Implementar busca por slug exato, normalizado e escopado por `organizationId`.
3. Garantir que nao-admin nao acesse pagina arquivada via slug.
4. Garantir que admin consiga abrir pagina arquivada por slug apenas se essa for uma decisao explicita; caso contrario, manter o mesmo comportamento da lista ativa.
5. Ao selecionar uma pagina na UI, atualizar a URL para `/wiki/<slug>` sem recarregar a SPA.
6. Ao entrar diretamente em `/wiki/<slug>`, carregar a lista e selecionar a pagina correspondente ou mostrar 404 operacional claro.
7. Preservar leitura, presenca e rascunho local vinculados ao `pageId`.
8. Cobrir slug inexistente, slug de outra organizacao e slug de pagina arquivada.

## Acceptance Criteria
1. Usuario autenticado acessa `/wiki/primeira-wiki` e ve a pagina publicada correta.
2. Usuario autenticado de outra organizacao nao acessa a pagina por slug.
3. Slug inexistente mostra estado de nao encontrado sem quebrar o restante da Wiki.
4. Pagina arquivada nao fica acessivel por slug para usuario nao-admin.
5. Clicar em uma pagina da lista atualiza a URL para o slug correspondente.
6. Atualizar/recarregar o navegador em `/wiki/<slug>` preserva a pagina selecionada.
7. Leitura e presenca continuam registradas por `pageId`.
8. Testes de service cobrem o acesso por slug e o isolamento por organizacao.

## Definition of Done
1. Contrato de acesso por slug implementado e documentado no EXEC correspondente.
2. UI resolve entrada direta por slug e navegacao interna por slug.
3. Acesso continua autenticado e tenant-safe.
4. Validacoes automatizadas relevantes passam ou a impossibilidade fica documentada.

## Validacao
- comandos/checks: `npm run test --workspace @alwaystrack/api -- wiki.service.test.ts`, `npm run typecheck --workspace @alwaystrack/api`, `npm run typecheck --workspace @alwaystrack/web`, `npm run build --workspace @alwaystrack/web`
- revisao manual: login; abrir `/wiki`; clicar em uma pagina; copiar/recarregar `/wiki/<slug>`; testar slug inexistente; testar pagina arquivada conforme role.

## Evidencia esperada
- Print ou relato de `/wiki/primeira-wiki` carregando a pagina publicada.
- Teste mostrando slug escopado por organizacao.
- Registro de que leitura/presenca ainda usa `pageId`.

## Riscos
- Conflito entre rota SPA `/wiki/:slug` e outras rotas futuras.
- Busca por slug parcial pode abrir pagina errada; usar slug exato.
- Admin alterar slug pode quebrar links existentes, residual ja identificado em `TASK-AT-034`.

## Blockers possiveis
- Configuracao do servidor local/producao nao encaminhar `/wiki/:slug` para a SPA.
- Falta de registro claro das rotas de wiki no backend se o endpoint por slug precisar ser adicionado.

## Retorno esperado
- resumo curto do acesso por slug entregue
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Execucao
- `EXEC-AT-029-wiki-published-slug-access.md`
