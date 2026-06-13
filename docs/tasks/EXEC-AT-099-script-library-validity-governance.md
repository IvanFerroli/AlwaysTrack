# EXEC-AT-099 - Scriptoteca: validade e recertificacao de scripts

## Resultado
- status: completed-mvp
- date: 2026-06-13
- task: docs/tasks/TASK-AT-099-script-library-validity-governance.md

## Entrega
Criada governanca simples de validade dos scripts para impedir que textos antigos continuem parecendo confiaveis sem revisao.

## Escopo coberto
1. Campo `reviewDueAt` em scripts.
2. Campos `recertifiedById` e `recertifiedAt`.
3. Estado calculado `reviewState`: `VALIDATED`, `REVIEW_DUE`, `DRAFT` ou `OBSOLETE`.
4. Filtro gerencial de `Revisao pendente`.
5. Acao `Recertificar` com comentario auditavel.
6. Evento `recertify` e audit log `script.recertify`.
7. Seed demo com scripts futuros e um script vencido para demonstracao.

## Validacao
- `npm run test --workspace @alwaystrack/api -- script-library.service.test.ts`
- `npm run db:test:migrations`
- `npm run build --workspace @alwaystrack/web`

## Risco residual
- Ainda nao ha notificacao automatica por vencimento; o MVP entrega alerta visual/filtro operacional. Se a rotina pedir, isso pode virar job diario depois.
