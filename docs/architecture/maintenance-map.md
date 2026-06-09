# AlwaysTrack Maintenance Map

## Quando mexer em notas/DANFE
1. Comece por `sales-documents.service.ts`.
2. Proteja regras em `sales-documents.service.test.ts`.
3. Se tocar UI, valide `NotesView` e rode typecheck web.
4. Se tocar dedupe/reprocessamento, adicione regressao.
5. Se tocar ranking/extratos, valide que apenas `APPROVED` entra.

## Quando mexer em Wiki/FAQ
1. Leia `wiki.service.ts` e `faq.service.ts`.
2. Confira slug, tenant e permissao.
3. Teste revisao/aprovacao/rejeicao/comentario.
4. Se gerar notificacao, cubra destinatario e dedupe.

## Quando mexer em usuarios/roles
1. Use contratos de `packages/shared`.
2. Preserve historico comercial: remover role nao deve apagar vendedor/notas sem decisao explicita.
3. Nunca retorne `passwordHash`.
4. Revalide `requireRole` nas rotas afetadas.

## Quando mexer em banco/migration
1. Criar migration versionada.
2. Testar em banco limpo.
3. Testar com seed comercial.
4. Documentar rollback ou backup/restore.
5. Nunca commitar `dev.db` ou backups locais.

## Quando mexer em performance
1. Medir antes.
2. Corrigir por endpoint/fluxo.
3. Evitar cache sem tenant key.
4. Registrar antes/depois.
5. Rodar carga com Artillery quando a task `AT-051` estiver implementada.

