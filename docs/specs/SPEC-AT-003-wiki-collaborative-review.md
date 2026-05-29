# SPEC-AT-003 - Collaborative Wiki Review

## Metadata
- status: accepted
- owner: product-builder
- last-updated: 2026-05-29
- source-of-truth: docs/specs/SPEC-AT-003-wiki-collaborative-review.md

## Objetivo
Definir o MVP da wiki interna do AlwaysTrack em `/wiki`.

## Vocabulario
- Pagina: conteudo publicado e visivel para usuarios autenticados da organizacao.
- Revisao: snapshot de uma versao publicada.
- Requisicao: proposta de alteracao feita por usuario nao-admin.
- Leitura: registro de ultimo acesso de usuario em uma pagina.
- Presenca: heartbeat HTTP recente indicando quem esta lendo ou editando.

## Regras
1. Usuarios autenticados veem apenas paginas da propria organizacao.
2. Admin cria e publica paginas diretamente.
3. Admin edita e publica novas versoes diretamente.
4. RT e Supervisor nao alteram a versao publicada; eles criam requisicoes pendentes.
5. Admin aprova ou reprova requisicoes pendentes.
6. Aprovacao publica nova versao apenas se a versao base da requisicao ainda for atual.
7. Leitura e presenca sao escopadas por organizacao e pagina.

## MVP implementado
- Schema: `WikiPage`, `WikiRevision`, `WikiEditRequest`, `WikiReadReceipt`, `WikiPresence`.
- API autenticada em `/v1/wiki/*`.
- UI autenticada em `/wiki`.
- Editor simples com textarea.
- Fila de moderacao para Admin.
- Leitores recentes e presenca por polling HTTP.

## Fora de escopo
- Editor rich text.
- Comentarios inline.
- WebSocket ou colaboracao simultanea em tempo real.
- Permissoes granulares por pagina.
- Wiki publica sem login.

## Validacao
- `services/api/src/core/wiki/wiki.service.test.ts`
- `npm run setup`
- `npm run check`
- `npm run build --workspace @alwaystrack/web`
