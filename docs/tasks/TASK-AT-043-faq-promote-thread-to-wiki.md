# TASK-AT-043 - FAQ promote thread to wiki

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-06-09
- source-of-truth: docs/tasks/TASK-AT-043-faq-promote-thread-to-wiki.md

## Modo
- mode: implementation

## Objetivo unico
Permitir que usuario superior/admin transforme uma pergunta/thread da FAQ em pagina ou secao da Wiki, preservando na FAQ um link para a pagina criada.

## Contexto minimo
O pedido define que a FAQ continua existindo depois da promocao, mas passa a apontar para a secao/pagina da Wiki criada. A Wiki ja possui publicacao Markdown, slug e revisoes; a FAQ thread MVP deve existir antes para fornecer a pergunta, respostas e estado a serem promovidos.

## Inputs
- Pedido do usuario em 2026-06-08.
- `TASK-AT-040-wiki-published-slug-access.md`
- `TASK-AT-042-faq-threads-mvp.md`
- `docs/specs/SPEC-AT-003-wiki-collaborative-review.md`
- `services/api/src/core/wiki/*`
- Futuro `services/api/src/core/faq/*`

## Dependencias
- satisfeitas: Wiki publica paginas diretamente por admin, slug unico por organizacao, Markdown seguro.
- em aberto: `TASK-AT-042` deve definir modelos de thread e permissao de estado; `TASK-AT-040` deve tornar o link por slug confiavel para o usuario.

## Alvos explicitos
1. `services/api/src/core/faq/*`: acao de promocao de thread para Wiki.
2. `services/api/src/core/wiki/wiki.service.ts`: reusar criacao de pagina ou helper interno sem duplicar regras de slug/versionamento.
3. `services/api/prisma/schema.prisma`: campos de backlink na thread, por exemplo `wikiPageId` e `promotedAt`/`promotedById`, se nao existirem.
4. `apps/web/src/main.tsx`: botao exclusivo para admin/superior e link da thread para a Wiki.
5. Testes de service cobrindo permissao, tenant, duplicidade e backlink.

## Fora de escopo
- Sincronizacao bidirecional entre Wiki e FAQ depois da promocao.
- Apagar ou ocultar automaticamente a thread original.
- Promover comentarios individuais como revisoes separadas.
- Promover para Wiki publica sem login.
- Notificacoes da promocao; isso pertence a `TASK-AT-044`.

## Checklist
1. Definir quais roles contam como "superior/admin" no AlwaysTrack, preferindo `ADMIN` e `SUPERVISOR` se o contrato comercial permitir.
2. Criar acao transacional que le a thread da mesma organizacao, monta conteudo Markdown e cria pagina Wiki.
3. Gerar titulo/slug inicial a partir da pergunta, respeitando normalizacao e colisao por organizacao.
4. Incluir no conteudo da Wiki um resumo operacional da pergunta e respostas escolhidas, sem expor metadados sensiveis desnecessarios.
5. Marcar a thread com `wikiPageId`, data e usuario da promocao.
6. Exibir na FAQ o link para `/wiki/<slug>` quando houver pagina criada.
7. Impedir promocao duplicada sem decisao explicita; se ja houver `wikiPageId`, retornar link existente.
8. Registrar auditoria `faq.thread.promote_to_wiki` e `wiki.page.create` ou equivalente.

## Acceptance Criteria
1. Admin/superior ve acao exclusiva para promover thread da FAQ para Wiki.
2. Usuario sem permissao nao ve a acao e nao consegue executar via API.
3. Ao promover, uma nova pagina Wiki e criada na mesma organizacao.
4. A pagina Wiki tem titulo, slug e conteudo Markdown derivados da pergunta/thread.
5. A thread da FAQ continua existindo e passa a exibir link para a Wiki criada.
6. Promocao repetida nao cria paginas duplicadas sem confirmacao/regra explicita.
7. Link da FAQ abre a pagina por slug, dependendo de `TASK-AT-040`.
8. Isolamento por organizacao e auditoria sao preservados.

## Definition of Done
1. Promocao FAQ -> Wiki implementada como fluxo transacional e tenant-safe.
2. Backlink da FAQ para Wiki fica persistido e visivel.
3. Permissao de admin/superior coberta por teste.
4. Validacao manual mostra thread, promocao e abertura da pagina Wiki.

## Validacao
- comandos/checks: `npm run test --workspace @alwaystrack/api -- faq.service.test.ts wiki.service.test.ts`, `npm run typecheck --workspace @alwaystrack/api`, `npm run typecheck --workspace @alwaystrack/web`, `npm run build --workspace @alwaystrack/web`
- revisao manual: criar thread FAQ; promover como admin/superior; abrir link na FAQ; confirmar pagina Wiki por slug; tentar promover como usuario sem permissao.

## Evidencia esperada
- Teste de promocao com backlink e bloqueio de permissao.
- Print ou relato da thread FAQ com link para Wiki.
- Print ou relato da pagina Wiki criada a partir da thread.

## Riscos
- Conteudo automatico da Wiki pode ficar ruidoso se copiar todos os comentarios sem curadoria.
- Slug duplicado precisa de regra previsivel para evitar falhas operacionais.
- Role "superior" pode estar ambigua; documentar a decisao usada.

## Blockers possiveis
- `TASK-AT-042` nao definir modelo de thread ou estado suficiente.
- `TASK-AT-040` nao estar concluida, deixando o backlink por slug fraco.

## Retorno esperado
- resumo curto da promocao entregue
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
