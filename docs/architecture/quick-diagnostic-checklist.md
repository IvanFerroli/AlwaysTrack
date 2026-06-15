# AlwaysTrack - Checklist rapido de diagnostico

## Para se orientar em 10 minutos
1. Abra `docs/architecture/onboarding-typedoc.md`.
2. Abra `docs/architecture/flow-deep-dive.md`.
3. Abra `docs/tasks/ROADMAP.md`.
4. Rode `npm run up` para abrir Web, API health, Prisma Studio, TypeDoc e docs.
5. Confirme que a tela inicial carrega e que o usuario demo entra.

## Se nota/DANFE quebrou
1. Veja a tela Notas e o status da nota.
2. Abra Prisma Studio em `SalesDocument`, `SalesDocumentExtraction` e `SalesItem`.
3. Confira `accessKey`, `status`, `sellerProfileId`, `fileKey` e `mimeType`.
4. Leia logs de `sales_document.upload`, `sales_document.extract` e `sales_document.review`.
5. Teste novamente com XML conhecido antes de culpar IA.
6. Se for duplicidade estranha, compare `organizationId + accessKey`.

## Se ranking/extrato quebrou
1. Confirme que existem notas `APPROVED`.
2. Confirme periodo/filtro/campanha.
3. Confira se vendedor tem `SellerProfile` ativo.
4. Compare dashboard, ranking e extrato usando o mesmo range.
5. Se snapshot nao atualizou, veja `ranking-snapshot.jobs`.

## Se Wiki/FAQ/Avisos/Scriptoteca quebraram
1. Confirme role do usuario.
2. Confira `organizationId`.
3. Veja status: ativo, arquivado, pendente, validado, obsoleto.
4. Teste busca sem tags primeiro; depois combine tags/filtros.
5. Se houve promocao FAQ -> Wiki, confira backlink nos dois lados.
6. Se notificacao nao apareceu, veja dedupe e destinatario.

## Se login/permissao quebrou
1. Confira `SESSION_SECRET`, cookie e `CORS_ORIGIN`.
2. Confira se usuario esta `active`.
3. Confira role em `packages/shared/src/index.ts`.
4. Confira `requireRole` da rota em `services/api/src/app.ts`.
5. Para Google, confira dominio permitido e callback.

## Se deploy/seguranca virar prioridade
1. Comece por `TASK-AT-102`.
2. Depois faça `AT-103`, `AT-104`, `AT-105` e `AT-106`.
3. Nao exponha publicamente sem passar pelo `TASK-AT-116`.
4. Se envolver NFs reais, revise backup, logs, upload e IA externa.

## Comandos curtos
- `npm run up`
- `npm run docs:api`
- `npm run check`
- `npm run test:regression`
- `npm run test:e2e:api`
- `npm run env:check -- --production`

## Regra de decisao
Se uma falha afeta dado comercial, NF, usuario, permissao ou ranking, trate como fluxo critico: reproduza, registre evidencia, crie task pequena e teste antes de mexer em varias camadas.
