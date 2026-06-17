# Security Events Taxonomy

## Metadata
- status: active
- owner: ops/security
- last-updated: 2026-06-17
- source-of-truth: docs/security/security-events-taxonomy.md

## Objetivo
Padronizar nomes e campos minimos para eventos de seguranca no AlwaysTrack.

## Eventos
- `security.auth.login_failed`
- `security.auth.forbidden`
- `security.auth.unauthorized`
- `security.auth.session_rotated`
- `security.tenancy.cross_org_blocked`
- `security.upload.rejected`
- `security.ai.reprocess_spike`
- `security.user.role_changed`
- `security.user.password_changed`
- `security.config.changed`
- `security.export.admin_csv`

## Campos minimos
- `event`
- `occurredAt`
- `actorId` quando houver usuario autenticado
- `organizationId` quando conhecida
- `targetType` e `targetId` quando houver recurso alvo
- `requestId` quando disponivel
- `statusCode` para bloqueios HTTP
- `reason` redigido e sem segredo

## Campos proibidos
- senha, hash, token, cookie ou API key;
- `DATABASE_URL` e `REDIS_URL` completos;
- chave privada Google;
- arquivo bruto, XML bruto ou PDF bruto;
- payload completo de provedor externo.

## Severidade sugerida
- `critical`: cross-org confirmado com dado retornado, segredo vazado, role admin indevida.
- `high`: pico de 403/401, upload malicioso repetido, token suspeito.
- `medium`: falha de login repetida, reprocessamento IA anormal, export admin fora de rotina.
- `low`: evento unico sem repeticao e sem dado exposto.
