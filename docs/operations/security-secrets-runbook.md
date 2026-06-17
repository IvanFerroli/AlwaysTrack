# Security Secrets Runbook

## Metadata
- status: active
- owner: ops/security
- last-updated: 2026-06-17
- source-of-truth: docs/operations/security-secrets-runbook.md

## Objetivo
Manter producao fora de defaults locais, sem segredos versionados e com um roteiro claro para trocar credenciais quando houver suspeita de vazamento.

## Gate de ambiente
Antes de publicar ou reiniciar producao, rode:

```bash
npm run env:check -- --production
npm run repo:hygiene
```

O gate de producao exige `NODE_ENV=production`, `DATABASE_URL` nao local, `SESSION_SECRET` forte e URLs publicas HTTPS para `CORS_ORIGIN`, `VITE_API_BASE_URL` e redirects OAuth configurados.

## Variaveis obrigatorias em producao
- `NODE_ENV=production`
- `DATABASE_URL` apontando para banco persistente, nao `file:./dev.db`
- `SESSION_SECRET` com pelo menos 32 caracteres aleatorios
- `CORS_ORIGIN` com HTTPS e dominio publico
- `VITE_API_BASE_URL` com HTTPS e dominio publico

## Variaveis condicionais
- `NOTIFICATION_PROVIDER=meta`: exige `META_WHATSAPP_TOKEN`, `META_WHATSAPP_PHONE_NUMBER_ID`, `META_WEBHOOK_VERIFY_TOKEN` e `META_APP_SECRET`.
- `JOB_QUEUE_DRIVER=bullmq`: exige `REDIS_URL`.
- Google login parcial: exige `GOOGLE_LOGIN_CLIENT_ID`, `GOOGLE_LOGIN_CLIENT_SECRET`, `GOOGLE_LOGIN_REDIRECT_URI` e `GOOGLE_LOGIN_ALLOWED_DOMAINS`.
- Google OAuth/Sheets parcial: exige o conjunto completo de client id, client secret, redirect URI e chave de criptografia, ou service account completa.
- `DOCUMENT_AI_PROVIDER=openai`: exige `OPENAI_API_KEY`.
- `DOCUMENT_AI_PROVIDER=gemini`: exige `GEMINI_API_KEY`.

## Rotacao
1. Remova ou revogue o segredo suspeito no provedor original.
2. Gere um novo segredo com escopo minimo.
3. Atualize o provedor de secrets ou `.env.production` fora do Git.
4. Rode `npm run env:check -- --production`.
5. Reinicie apenas os processos que consomem o segredo.
6. Registre data, motivo, variavel afetada e responsavel no canal operacional privado.

## Notas por segredo
- `SESSION_SECRET`: trocar invalida sessoes ativas; avise admins antes.
- Google OAuth: rotacione client secret e confirme redirects HTTPS.
- Google service account: revogue a chave antiga e valide acesso minimo a pastas.
- IA: rotacione chave OpenAI/Gemini e confira limites de uso.
- Meta/WhatsApp: rotacione token, app secret e verify token; rode smoke antes de envio real.
- Banco/Redis: rotacione senha em janela curta e confirme workers depois.

## Arquivos e volumes
- `.env`, `.env.production`, dumps, bancos locais e storage privado continuam fora do Git.
- Banco SQLite local e storage local precisam de volume persistente e backup antes de beta externo.
- `.env.production.example` ainda deve ser criado fora deste slice de escrita, sem valores reais e com comentarios operacionais.

## Riscos
- Gate rigido pode bloquear demos se `--production` for usado por engano.
- Rotacao de segredo compartilhado sem reinicio coordenado pode deixar workers com credencial antiga.
