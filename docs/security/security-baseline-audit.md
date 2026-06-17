# AlwaysTrack - Security Baseline Audit

## Metadata
- status: active
- owner: security-maintainers
- last-updated: 2026-06-17
- related-task: TASK-AT-102
- source-of-truth: docs/security/security-baseline-audit.md

## Resumo executivo
O AlwaysTrack ja tem bons controles de base para um produto interno: autenticacao centralizada, roles compartilhadas, escopo comercial por organizacao/vendedor/grupo em services criticos, auditoria operacional e limites de upload. O risco principal antes de exposicao externa nao e falta de "login"; e o conjunto de perimetro web incompleto para API com cookie: CSRF/origin, expiracao/atributos de sessao, rate limit e validacao real de arquivos.

Maior risco tecnico imediato: qualquer mutacao autenticada depende de cookie e nao foi observado middleware transversal de CSRF/origem em `services/api/src/app.ts`.

## Metodo
- Leitura de rotas em `services/api/src/app.ts`.
- Leitura de auth/session em `services/api/src/core/auth/*`.
- Amostragem profunda dos dominios: `sales-documents`, `wiki`, `faq`, `announcements`, `script-library`.
- Leitura do schema Prisma e deploy de referencia.
- Cruzamento com arquitetura e matriz de permissoes comercial.
- Sem pentest, sem execucao de exploit e sem mudanca funcional.

## Status por area
| Area | Baseline atual | Gap principal | Prioridade |
| --- | --- | --- | --- |
| Perimetro HTTP | CORS manual opcional; health/webhooks publicos | Falta helmet/CSP/HSTS, politica CORS por ambiente, proxy seguro | P0 |
| Autenticacao | Cookie assinado HMAC; Google login por dominio | TTL/rotacao/atributos de cookie precisam hardening e teste | P0 |
| CSRF/origem | Nao observado controle transversal | Mutacoes com cookie vulneraveis a cross-site request | P0 |
| Rate limit | Nao observado middleware | Login, upload, webhooks, busca e export podem sofrer abuso | P0 |
| Autorizacao/tenancy | Sales bem escopado; roles no app.ts | Precisa suite anti-IDOR por dominio e novas rotas | P1 |
| Uploads | MIME allowlist e limite de tamanho | Falta sniffing/magic bytes, extensao segura, serving com headers | P1 |
| Input validation | Parsers manuais por service | Falta schema runtime uniforme para contratos publicos | P1 |
| XSS/conteudo | Markdown/texto persistido em varios dominios | Sanitizacao/render policy precisa ser explicitada e testada | P1 |
| Logs/auditoria | AuditLog para acoes relevantes | Falta taxonomia de eventos de seguranca e redacao de dados | P2 |
| Segredos/deploy | Env centralizado; compose exemplo | Defaults dev e ausencia de guard de producao | P1 |
| Dependencias | Workspaces npm existentes | Falta SCA/gate de CI documentado | P2 |
| Backup/dados | Volumes Docker no exemplo | Falta runbook de backup/restore e retencao | P2 |
| Integracoes externas | Google/Meta/IA configuraveis por env | Falta checklist de assinatura, scopes, dados enviados e fallback | P2 |

## Evidencias de controles existentes
| Controle | Evidencia | Comentario |
| --- | --- | --- |
| Autenticacao por usuario ativo | `requireAuth` busca `user` no banco, rejeita inativo e role desconhecida | Bom para revogacao por desativacao |
| Role por rota | `requireRole(...)` em rotas comerciais/admin/legado | Simples e visivel no `app.ts` |
| Dominio Google permitido | `loginUserByVerifiedGoogleEmail` exige `emailVerified` e dominio em env | Controle importante para produto interno |
| Escopo comercial | `sellerScopeWhere`, `salesDocumentWhere`, `getScopedSalesDocument` | VENDEDOR e SUPERVISOR ficam reduzidos por usuario/grupo |
| Limite de upload | `express.raw({ limit: "11mb" })` e `DOCUMENT_MAX_BYTES` | Bom limite inicial, falta validar conteudo real |
| Nome/chave de arquivo | `safeFileName`, `randomUUID`, `organizationId` no `fileKey` | Reduz path traversal e colisao |
| Auditoria | `recordAuditLog` em login, upload, review, exports, conteudo | Base util para investigacao |
| Paginacao | `pageSize` limitado a 100 em services criticos | Reduz DoS acidental em listagens |
| Legado default-off | `ENABLE_LEGACY_SYLEMBRA === "true"` | Bom isolamento operacional, precisa guard em producao |

## Gaps detalhados
| ID | Gap | Impacto | Prob. | Evidencia no codigo | Recomendacao | Task |
| --- | --- | --- | --- | --- | --- | --- |
| G1 | Sem headers de seguranca/CSP/HSTS no app/proxy | XSS, clickjacking, mixed content, sniffing | Alta se web publico | `deploy/nginx.conf` so serve SPA; `app.ts` nao usa headers dedicados | Definir headers API/web, CSP compativel com Vite build e uploads | TASK-AT-103 |
| G2 | CORS manual aceita credenciais quando `CORS_ORIGIN` existe | Config errada pode abrir API cookie-based | Media | `access-control-allow-origin` vem de env, sem allowlist por array | Validar origem exata por ambiente e negar wildcard com credentials | TASK-AT-103 |
| G3 | Sessao assinada sem expiracao validada | Cookie antigo segue valido ate segredo trocar | Media | `SessionPayload.issuedAt`; `parseSessionToken` nao checa idade | TTL, max-age, secure, httpOnly, sameSite, logout claro | TASK-AT-104 |
| G4 | Falta rate limit em login/upload/webhook/busca/export | Brute force, custo de IA/storage, DoS leve | Alta | Nenhum middleware de limite em `app.ts` | Limites por IP+usuario+rota; resposta auditavel | TASK-AT-106 |
| G5 | Falta CSRF/origin check para mutacoes | Ataque cross-site com cookie valido | Alta | Rotas `POST/PATCH/DELETE` usam cookie; nenhum guard transversal observado | Validar `Origin`/`Referer` e/ou token CSRF para mutacoes | TASK-AT-105 |
| G6 | Upload confia em `content-type` | Arquivo disfarcado pode ser armazenado/servido | Media | Allowlist usa MIME vindo do header; Wiki serve `inline` | Magic bytes, extensao final segura, `X-Content-Type-Options`, antivirus opcional | TASK-AT-108 |
| G7 | Conteudo Markdown rico sem politica de sanitizacao no baseline | XSS persistente em Wiki/FAQ/Avisos/Scriptoteca | Media | Campos `content`, `body`, `answer` persistidos e renderizados no web | Esquema de sanitizacao/render seguro e testes com payloads | TASK-AT-107 |
| G8 | Validacao manual divergente por service | Campos inesperados podem escapar ou ficar ambiguos | Media | Parsers locais `parse*Input` sem schema central | Zod/Valibot ou contratos equivalentes nos boundaries | TASK-AT-107 |
| G9 | Anti-IDOR nao esta automatizado transversalmente | Regressao em nova rota pode vazar dados | Media | Sales esta escopado; outros dominios usam padroes variados | Testes por role para ids de outra org/vendedor/grupo | TASK-AT-109 |
| G10 | Defaults dev podem entrar em producao | Sessao forjavel ou storage/banco errado | Media | `SESSION_SECRET ?? "dev-only-session-secret"`; `DATABASE_URL ?? file:./dev.db` | Env guard por `NODE_ENV=production` | TASK-AT-110 |
| G11 | Webhook/callbacks precisam revisao de assinatura/state | Payload falso ou OAuth confusion | Media | Rotas publicas Meta e Google em `app.ts` | Assinatura Meta obrigatoria, state one-time, redirect allowlist | TASK-AT-114 |
| G12 | Logs de erro podem conter payload sensivel | Dados fiscais/tokens em console/diagnostico | Media | Error handler faz `console.error(error)`; logs de dominio incluem metadata | Redacao padrao e eventos de seguranca separados | TASK-AT-111 |
| G13 | Backup/restore nao definido | Perda de banco/storage/auditoria | Media | Compose usa volumes `api-data`, `api-storage`, sem rotina | Runbook de backup, restore testado e retencao | TASK-AT-113 |
| G14 | Sem gate SCA/dependencias documentado | Vulnerabilidade entra no CI | Media | Roadmap tem task futura, sem baseline ativo | `npm audit`/SCA, lockfile policy e excecoes documentadas | TASK-AT-112 |
| G15 | Incidente sem runbook | Tempo de resposta alto em vazamento/conta tomada | Media | Nao ha runbook security dedicado | Checklist de revogacao, logs, comunicacao e rollback | TASK-AT-115 |

## Rotas prioritarias para testes de seguranca
1. `POST /v1/auth/login`: brute force, enum de usuario, cookie seguro.
2. `GET /v1/auth/google/start` e `/callback`: state, dominio, redirect.
3. `POST /v1/sales/documents`: upload real, vendedor escolhido, limite, custo de extracao.
4. `PATCH /v1/sales/documents/:documentId/review`: CSRF, role e IDOR.
5. `GET /v1/sales/*.csv`: escopo de vendedor/supervisor e export amplo.
6. `POST /v1/wiki/attachments` e `GET /v1/wiki/attachments/:id/file`: MIME real e headers de download/inline.
7. `POST/PATCH /v1/wiki/pages`, `/v1/faq/threads`, `/v1/announcements`, `/v1/script-library`: XSS persistente e permissao por role.
8. `GET /v1/audit-logs` e `/v1/diagnostics/*`: admin-only e redacao.
9. `POST /v1/webhooks/meta-whatsapp`: assinatura, replay e tamanho.
10. Rotas legado publicas quando `ENABLE_LEGACY_SYLEMBRA=true`: decisao explicita de nao expor no produto comercial.

## Ordem recomendada das proximas tasks
1. `TASK-AT-103`: fechar perimetro HTTP/CORS/headers antes de mexer em detalhes.
2. `TASK-AT-104`: endurecer cookie, TTL e login Google/senha.
3. `TASK-AT-105`: adicionar protecao CSRF/origin para todas as mutacoes autenticadas.
4. `TASK-AT-106`: limitar abuso em login, upload, webhooks, buscas e exports.
5. `TASK-AT-107`: padronizar validacao runtime e preparar defesa XSS.
6. `TASK-AT-108`: endurecer uploads e serving de arquivos.
7. `TASK-AT-109`: criar suite anti-IDOR por role/escopo.
8. `TASK-AT-110`: travar segredos, envs e deploy de producao.
9. `TASK-AT-111` a `TASK-AT-115`: completar operacao segura.
10. `TASK-AT-116`: gate formal antes de exposicao externa.

## Riscos residuais aceitos nesta task
- Nenhuma correcao funcional foi implementada por escopo.
- A auditoria e baseada em leitura estatica e amostragem de services; nao substitui teste dinamico.
- A politica final de hospedagem ainda esta aberta, entao algumas severidades assumem exposicao web publica.
- Conteudo frontend/renderizacao Markdown deve ser confirmado nas tasks `TASK-AT-103` e `TASK-AT-107`.

## Checklist de validacao manual
- DANFE/ranking/extratos aparecem como ativos e rotas prioritarias.
- FAQ/Wiki/Avisos/Scriptoteca aparecem como superficie de XSS/conteudo persistido.
- Publico vs autenticado esta separado no threat model.
- Cada gap tem impacto, probabilidade, evidencia e task relacionada.
- Roadmap aponta `TASK-AT-102` como porta de entrada concluida da fase de seguranca.
