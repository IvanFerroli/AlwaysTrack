# Revisao LGPD e seguranca - 2026-04-30

## Escopo
Auditoria operacional da V1 conforme secao 19.2 do documento central: dados pessoais, documentos, tokens, storage, logs, roles e exports.

## Checklist
- Controle de acesso por role: verificado nas rotas protegidas por `requireAuth`/`requireRole` e nos filtros de dominio por organizacao, RT e escopo de supervisor.
- Storage privado: documentos sao acessados por `getDocumentDownload` apenas apos decisao de escopo; upload publico nao retorna `fileKey`.
- Links temporarios: tokens de upload possuem expiracao, uso unico e invalidacao.
- Token com hash: token bruto e retornado uma unica vez; persistencia usa SHA-256 via `hashUploadToken`.
- Auditoria: criacao/uso/inativacao de tokens, upload, aprovacao/recusa e recalculo de status registram eventos em `auditLog`.
- Historico critico: registros sao desativados/invalidados quando aplicavel, preservando trilha historica.
- Exposicao por role: listagens e relatorios aplicam filtros por organizacao, RT ou unidade/setor.
- Logs/secrets: provider Meta normaliza falhas sem logar token de autorizacao; handler global registra erros inesperados, sem payloads de documentos.
- Exports: CSV reutiliza `runReport`, mantendo a mesma autorizacao e escopo das consultas JSON.

## Ajuste aplicado
- `recalculateLicenses` passou a permitir recálculo de uma licença específica para usuarios nao-admin dentro do proprio escopo. Isso corrige o fluxo em que RT aprova documento, mas a atualizacao de status quebrava por exigir ADMIN apos a autorizacao de validacao ja ter sido aceita.
- Recálculo em massa continua restrito a ADMIN.

## Evidencias automatizadas
- `services/api/src/core/quality/main-flow.e2e.test.ts` cobre status de licenca, criacao/processamento de job fake, upload publico, validacao por RT e recálculo escopado.
- `services/api/src/core/notifications/notifications.service.test.ts` cobre retry/falha de provider sem exposicao de secret.
- Testes existentes cobrem hash/expiracao/uso unico de token, storage/download com escopo, permissoes por role e CSV com escopo de relatorio.

## Riscos residuais
- E2E atual e em nivel de dominio/API com mocks de Prisma/provider; nao ha Playwright/browser configurado neste repo.
- Handler global ainda usa `console.error(error)` para erros inesperados; aceitavel para V1, mas producao deve usar logger estruturado com redacao de payloads.
- Revisao LGPD nao substitui parecer juridico formal.
