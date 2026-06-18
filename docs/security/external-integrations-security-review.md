# AlwaysTrack - External Integrations Security Review

## Metadata
- status: active
- owner: security-maintainers
- last-updated: 2026-06-17
- related-task: TASK-AT-114
- source-of-truth: docs/security/external-integrations-security-review.md

## Resumo executivo
As fronteiras externas revisadas estao em bom estado para uso controlado: Google login e Google OAuth usam state e PKCE, o webhook Meta valida assinatura HMAC quando `META_APP_SECRET` existe, tokens Google legados sao criptografados em repouso e BullMQ so liga quando explicitamente configurado.

O principal criterio operacional e manter integracoes reais desligadas por padrao. Para producao, habilitar apenas Google login com dominio permitido. Google Sheets legado, Meta WhatsApp, provedores reais de IA e BullMQ devem ficar off ate existir uma decisao explicita de produto/operacao, segredos fortes e smoke externo controlado.

## Escopo e evidencias
| Integracao | Evidencia revisada | Resultado |
| --- | --- | --- |
| Google login | `services/api/src/core/auth/google-login.service.ts`, `google-login.service.test.ts` | Aprovavel para producao com allowlist de dominio e redirect fixo |
| Google OAuth/Sheets legado | `services/api/src/core/integrations/google/*`, `google-oauth.service.test.ts`, `imports/google-sheets-template.service.ts` | Deve ficar off salvo necessidade operacional |
| Meta WhatsApp/webhook | `services/api/src/core/notifications/*`, `notifications.service.test.ts`, `provider.test.ts` | Deve ficar off ate app secret, verify token e templates estarem validados |
| AI providers | `services/api/src/core/document-ai/*`, `provider.test.ts` | Deve ficar fake/off salvo aprovacao de dados fiscais/comerciais em provedor externo |
| BullMQ/Redis | `services/api/src/core/jobs/*`, `queue.redis.test.ts` | Pode ficar off/inline; BullMQ apenas com Redis privado/TLS e worker controlado |
| Envs/toggles | `services/api/src/config/env.ts` | Defaults favorecem fake/inline, mas producao depende de TASK-AT-110 |

## Decisao de toggles
| Toggle/env | Default observado | Producao recomendada | Condicao para ligar |
| --- | --- | --- | --- |
| `GOOGLE_LOGIN_CLIENT_ID`, `GOOGLE_LOGIN_CLIENT_SECRET`, `GOOGLE_LOGIN_REDIRECT_URI` | Off se ausente | On | Redirect fixo HTTPS, `GOOGLE_LOGIN_ALLOWED_DOMAINS` preenchido e client separado do OAuth legado |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` | Off se ausente | Off por padrao | Somente admin, necessidade real de Google Sheets, redirect fixo e token encryption key forte |
| `GOOGLE_SERVICE_ACCOUNT_*` / `GOOGLE_APPLICATION_CREDENTIALS` | Off se ausente | Off por padrao | Preferir pasta restrita e conta dedicada se Sheets for indispensavel |
| `NOTIFICATION_PROVIDER=meta` | `fake` | Off/fake | Ligar so com `META_WHATSAPP_TOKEN`, `META_WHATSAPP_PHONE_NUMBER_ID`, `META_WEBHOOK_VERIFY_TOKEN` e `META_APP_SECRET` |
| `DOCUMENT_AI_PROVIDER=openai|gemini` | `fake` | Off/fake | Ligar so apos aprovacao de envio de DANFE/documentos e retencao do provedor |
| `JOB_QUEUE_DRIVER=bullmq` | `inline` | Inline ou BullMQ controlado | Redis privado, senha/TLS quando externo, workers monitorados e sem exposicao publica |
| `REDIS_URL` | Ausente | Ausente se inline | Nunca usar Redis sem autenticacao em rede compartilhada |

## Google login
Controles observados:
- Escopos minimos: `openid email profile`.
- PKCE S256 com `code_verifier` guardado em cookie assinado.
- `state` assinado e correlacionado por nonce com cookie de estado.
- Janela maxima de estado de 10 minutos.
- Callback usa `googleLoginRedirectUri` configurado no servidor; nao aceita redirect/origin arbitrario do request.
- Profile so e aceito com email retornado pelo endpoint userinfo; dominio permitido e aplicado no fluxo de login de usuario.

Riscos e expectativas:
- `GOOGLE_LOGIN_ALLOWED_DOMAINS` deve ser obrigatorio em producao para evitar qualquer dominio Google valido.
- Segredo de sessao fraco invalida a assinatura do state cookie; depende de `TASK-AT-110`.
- Erros de callback nao devem registrar `code`, `state` ou access token.

Status: aprovado para producao controlada.

## Google OAuth e Sheets legado
Controles observados:
- Start de OAuth exige `ADMIN`.
- Usa state aleatorio persistido como SHA-256, PKCE S256 e expiracao de 10 minutos.
- Callback rejeita state ausente, expirado, usado ou desconhecido antes de chamar token endpoint.
- Refresh token e criptografado com AES-256-GCM usando `GOOGLE_TOKEN_ENCRYPTION_KEY` ou fallback `SESSION_SECRET`.
- Scopes atuais: `spreadsheets` e `drive.file`.
- Revogacao remota nao bloqueia desconexao local e loga apenas status/mensagem curta.

Riscos:
- Scope `spreadsheets` e amplo. Para criacao/export de templates, avaliar reduzir quando o fluxo permitir.
- Fallback de criptografia para `SESSION_SECRET` e aceitavel em dev, mas producao deve definir `GOOGLE_TOKEN_ENCRYPTION_KEY`.
- Token refresh e chamadas Sheets/Drive ainda nao possuem timeout transversal revisado neste slice.

Status: deve ficar off por padrao em producao; ligar apenas por decisao operacional.

## Meta WhatsApp e webhook
Controles observados:
- Provider fake e default.
- Provider Meta so liga com `NOTIFICATION_PROVIDER=meta`, token e phone number id.
- Telefone do destinatario e normalizado e rejeitado se invalido antes da chamada externa.
- Webhook challenge exige `hub.verify_token` igual ao env.
- Eventos de webhook validam `x-hub-signature-256` por HMAC SHA-256 quando `META_APP_SECRET` existe.
- Validacao usa raw body quando fornecido pelo handler, preservando a assinatura real.

Riscos:
- Se `META_APP_SECRET` nao existir, eventos POST sao aceitos sem assinatura. Em producao, o secret deve ser obrigatorio para ligar Meta.
- Provider Meta ainda nao possui timeout de fetch neste slice.
- Logs de provider devem continuar sem token; raw response pode conter mensagem de erro do fornecedor e deve ser tratado como dado operacional sensivel.

Status: deve ficar off/fake ate credenciais, segredo de app, templates e smoke externo serem validados.

## IA e dados enviados a provedores
Dados enviados hoje:
- Documento profissional: bytes completos do arquivo (`pdf` ou imagem), MIME type e filename; prompt pede nome, CPF, tipo/numero de licenca, emissor, UF e datas.
- DANFE/nota fiscal: bytes completos do arquivo, MIME type e filename; prompt pede chave de acesso, numero, serie, emissao, emissor, comprador, total e itens.
- Nao sao enviados dados extras de banco alem do proprio arquivo e filename.

Controles observados:
- Provider fake e default.
- OpenAI e Gemini so ligam com provider e chave configurados.
- Schema de resposta estruturado reduz texto livre.
- Resultado e normalizado antes de aplicar no dominio.
- Auditoria de analise registra provider/model/status/extractionId, sem bytes do documento.
- Chamadas reais OpenAI/Gemini agora carregam timeout de 30 segundos via `AbortSignal.timeout`.

Politica esperada:
- Considerar DANFE, CPF, comprador, emissor, itens e valores como dados comerciais/sensiveis.
- Nao logar arquivo base64, raw prompt, chave de API, access key completa de DANFE ou resposta bruta de erro contendo payload.
- Persistir resultado estruturado apenas dentro do tenant e auditar aplicacao separadamente.
- Antes de ligar OpenAI/Gemini em producao, registrar aprovacao do fornecedor, retencao/treinamento de dados e base legal/contratual.

Status: manter `DOCUMENT_AI_PROVIDER=fake` ate aprovacao de dados externos.

## BullMQ e Redis
Controles observados:
- Driver default e `inline`.
- BullMQ exige `JOB_QUEUE_DRIVER=bullmq` e `REDIS_URL`.
- Redis `rediss://` habilita TLS.
- Jobs usam `jobId` deterministico como dedupe key, tentativas 3, backoff exponencial e limites de retencao.
- Worker so inicia se driver e Redis estiverem configurados.

Riscos:
- Redis sem TLS/senha em rede compartilhada permite leitura/escrita de payload de job.
- Payloads carregam `CurrentUser` e ids de campanha; nao devem incluir tokens externos.
- Logs de worker registram erro; manter redacao de erros em produtores de payload.

Status: inline e aceitavel; BullMQ pode ser habilitado com Redis privado, credenciais fortes e monitoramento.

## Testes adicionados
- `google-oauth.service.test.ts`: callback com state desconhecido rejeita antes do token exchange.
- `notifications.service.test.ts`: webhook Meta com assinatura invalida rejeita antes de consultar jobs/logs.
- `document-ai/provider.test.ts`: OpenAI e Gemini enviam requests com timeout signal.

## Gaps residuais e retorno ao Taskyfier
| ID | Gap | Severidade | Retorno sugerido |
| --- | --- | --- | --- |
| AT-114-G1 | Meta POST depende de `META_APP_SECRET`; sem secret o webhook aceita evento unsigned | Alta se Meta ligado | Producao deve bloquear `NOTIFICATION_PROVIDER=meta` sem app secret |
| AT-114-G2 | Google Sheets/Drive e Meta provider ainda nao tem timeout padronizado | Media | Criar task pequena para timeout/redacao em fetches externos nao-IA |
| AT-114-G3 | Scope Google `spreadsheets` e amplo para uso legado | Media | Reavaliar escopo quando o fluxo Sheets for mantido ou removido |
| AT-114-G4 | Smoke externo nao executado por falta de credenciais reais | Baixa neste audit | Validar em ambiente staging antes de ligar toggles reais |
| AT-114-G5 | Gemini usa API key em query string do endpoint | Media | Evitar logar URL completa; avaliar SDK/header se disponivel |

## Checklist de validacao
- Google login/OAuth: state, PKCE, redirect fixo e dominio documentados.
- Google Sheets: scopes e armazenamento de refresh token documentados.
- Meta webhook: challenge, HMAC e comportamento sem app secret documentados.
- AI: dados enviados, timeout, redacao e politica de fornecedor documentados.
- BullMQ/Redis: driver, Redis e riscos de payload documentados.
- Toggles prod/off explicitados.
