# EXEC-AT-151 - Anexos operacionais genericos

## Metadata
- status: completed-mvp-slice
- owner: olympus-orchestrator
- completed-at: 2026-06-19
- related-task: docs/tasks/TASK-AT-151-generic-operational-attachments.md

## Escopo entregue
- Model `OperationalAttachment` e migration SQLite.
- Service/handlers de upload, download e arquivamento auditavel.
- Upload validado por magic bytes para `png`, `jpeg` e `webp`.
- Escopo por organizacao e teste anti-IDOR no download.
- Separacao frontend: Wiki permanece em `uploadWikiImage`; demais editores ricos usam `uploadOperationalImage`.

## Superficies iniciais
- Avisos: `announcement`
- FAQ: `faq`
- Fluxos: `service-flow`
- Scriptoteca: `script-library`
- Reservas futuras: `profile`, `settings`

## Validacao
```bash
npm run prisma:generate
npm run typecheck --workspace @alwaystrack/api
npm run typecheck --workspace @alwaystrack/web
npm run test --workspace @alwaystrack/api -- operational-attachments.service.test.ts storage.test.ts env.test.ts
```

## Compatibilidade
- Nenhum markdown antigo da Wiki foi migrado ou quebrado.
- O endpoint antigo `/v1/wiki/attachments` segue existindo para paginas e revisoes da Wiki.
