# EXEC-AT-013 - Wiki content admin MVP

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-03
- source-of-truth: docs/tasks/EXEC-AT-013-wiki-content-admin-api.md

## Objetivo
Entregar uma fatia complementar de Wiki focada em administracao de conteudo, sem alterar o parser/editor principal.

## Escopo executado
- `AT-034`: MVP de administracao de paginas da Wiki.
- Administradores podem arquivar, desarquivar e restaurar revisoes por API.
- Listagem de paginas agora suporta visao admin de ativas, arquivadas ou todas.
- Atualizacao direta de pagina aceita slug normalizado e bloqueia duplicidade por organizacao.
- UI da Wiki ganhou filtro admin por status, badge de pagina arquivada, botoes de arquivar/desarquivar e restauracao de revisao.
- UI admin permite editar slug junto da publicacao de nova versao.
- Auditoria registra archive, unarchive e restore.

## Validacao
- `npm run test --workspace @alwaystrack/api -- wiki.service.test.ts` passou, 13 testes.
- `npm run typecheck --workspace @alwaystrack/api` passou.
- `npm run check` passou, 140 testes.
- `npm run build --workspace @alwaystrack/web` passou.

## Residual
- Paginacao completa de historico.
- Tela de descoberta com filtros/taxonomia (`AT-035`).
- Upload de imagens/anexos (`AT-032`).
