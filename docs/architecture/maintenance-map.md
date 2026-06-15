# AlwaysTrack Maintenance Map

## Quando mexer em notas/DANFE
1. Comece por `sales-documents.service.ts`.
2. Proteja regras em `sales-documents.service.test.ts`.
3. Se tocar UI, valide `NotesView` e rode typecheck web.
4. Se tocar dedupe/reprocessamento, adicione regressao.
5. Se tocar ranking/extratos, valide que apenas `APPROVED` entra.
6. Se tocar upload, confira tamanho, MIME, storage e auditoria.
7. Se tocar IA, preserve fallback deterministico e erro observavel.

## Quando mexer em Wiki/FAQ
1. Leia `wiki.service.ts` e `faq.service.ts`.
2. Confira slug, tenant e permissao.
3. Teste revisao/aprovacao/rejeicao/comentario.
4. Se gerar notificacao, cubra destinatario e dedupe.
5. Se promover FAQ para Wiki, mantenha o vinculo nos dois lados.
6. Se mexer em tags/busca, teste filtros combinados.

## Quando mexer em Avisos/Scriptoteca
1. Leia `announcements.service.ts` e `script-library.service.ts`.
2. Confirme se a acao e de leitura, contribuicao ou governanca.
3. Preserve validade, revisao, eventos e notificacoes.
4. Se o conteudo puder virar conhecimento permanente, pense no vinculo com Wiki/FAQ.
5. Se mexer em copia de script, nao registre texto sensivel desnecessario.

## Quando mexer em usuarios/roles
1. Use contratos de `packages/shared`.
2. Preserve historico comercial: remover role nao deve apagar vendedor/notas sem decisao explicita.
3. Nunca retorne `passwordHash`.
4. Revalide `requireRole` nas rotas afetadas.
5. Se tocar senha/sessao, releia as tasks de seguranca `AT-104` e `AT-105`.

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

## Quando mexer em deploy/seguranca
1. Confira `scripts/check-env.js`, `deploy/*` e `docs/tasks/TASK-AT-102` a `TASK-AT-116`.
2. Em producao, nao aceite `localhost`, segredo fraco ou HTTP publico.
3. Se expuser upload, combine rate limit, validacao de arquivo e headers.
4. Se expuser para internet, rode o gate `TASK-AT-116`.
