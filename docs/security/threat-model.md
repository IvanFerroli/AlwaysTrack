# AlwaysTrack - Threat Model

## Metadata
- status: active
- owner: security-maintainers
- last-updated: 2026-06-17
- related-task: TASK-AT-102
- source-of-truth: docs/security/threat-model.md

## Objetivo
Este documento responde, em linguagem operacional, o que o AlwaysTrack precisa proteger antes de expor o produto interno fora do ambiente local.

Modelo de ameacas e o mapa de "quem pode atacar, por onde entra, o que quer atingir e qual seria o dano". Nao e uma lista de bibliotecas de seguranca: e a referencia para decidir a ordem das proximas tasks de hardening.

## Escopo analisado
- API Express em `services/api/src/app.ts`.
- Autenticacao por cookie assinado em `services/api/src/core/auth/*`.
- Fluxo comercial DANFE, ranking, campanhas, dashboard e extratos em `services/api/src/core/sales-documents/*`.
- Conhecimento operacional: Wiki, FAQ, Avisos e Scriptoteca.
- Banco Prisma SQLite em `services/api/prisma/schema.prisma`.
- Deploy de referencia em `deploy/docker-compose.example.yml` e `deploy/nginx.conf`.
- Arquitetura documentada em `docs/architecture/*`.

## Ativos sensiveis
| Ativo | Onde aparece | Por que importa | Impacto se vazar/alterar |
| --- | --- | --- | --- |
| DANFEs/notas fiscais | `SalesDocument`, storage local, extracoes | Contem chave de acesso, emissor, comprador, valores e itens | Vazamento comercial, fraude em ranking, exposicao fiscal |
| Itens e totais comerciais | `SalesItem`, ranking, dashboard, extratos CSV | Base de meta, campanhas e acompanhamento financeiro | Pagamento/comissao incorreta, decisao gerencial errada |
| Vendedores e grupos | `SellerProfile`, `SalesGroup`, usuarios vinculados | Define escopo de vendedor/supervisor | IDOR entre equipes, exposicao de performance |
| Usuarios, roles e sessoes | `User`, cookie `alwaystrack_session` | Controla entrada e privilegios | Tomada de conta, escalada para ADMIN |
| Wiki/FAQ/Avisos/Scriptoteca | `WikiPage`, `FaqThread`, `Announcement`, `OperationalScript` | Conhecimento interno, scripts de atendimento e comunicados | XSS persistente, instrucoes falsas, vazamento operacional |
| Anexos da Wiki | `WikiAttachment`, storage local | Imagens internas servidas inline | Malware por arquivo disfarcado, vazamento de imagem |
| Auditoria e diagnosticos | `AuditLog`, HTTP metrics, timelines | Evidencia de quem fez o que | Encobrimento de fraude, vazamento de metadados |
| Integracoes externas | Google OAuth/login, Google Sheets legado, Meta WhatsApp, IA OpenAI/Gemini | Carregam tokens, callbacks e dados enviados a terceiros | Roubo de token, callback indevido, envio de dados fiscais para provedor errado |
| Segredos e envs | `SESSION_SECRET`, tokens Meta/Google/IA, `DATABASE_URL`, Redis | Chaves de operacao do sistema | Assinatura de sessao falsa, acesso a API externa, perda de dados |

## Atores
| Ator | Perfil | Risco principal |
| --- | --- | --- |
| Visitante anonimo | Sem login, consegue chamar rotas publicas e webhooks expostos | Enumerar endpoints, abusar webhook/OAuth/callback, tentar upload publico legado |
| `VENDEDOR` | Envia DANFEs e acompanha seus dados | Ver dados de outro vendedor, subir arquivo malicioso, manipular nota propria |
| `SUPERVISOR` | Opera grupo comercial, campanhas e FAQ | Acessar grupo fora do escopo, manipular ranking do proprio time |
| `SAC` | Consulta e revisa notas, usa conhecimento/scriptoteca | Alterar fluxo comercial por revisao indevida, copiar dados sensiveis |
| `FINANCEIRO` | Consulta extratos/notas e revisa notas | Exportar dados amplos, aprovar/rejeitar nota incorreta |
| `GESTOR` | Visao ampla comercial e moderacao operacional | Alteracao ampla de campanha/comunicados/scripts |
| `ADMIN` | Usuarios, organizacao, Wiki publicada, auditoria, integracoes | Conta de maior impacto; qualquer tomada de conta compromete o ambiente |
| Job/worker | Ranking snapshot, notificacao, cron | Processamento em massa com envs e acesso a banco/storage |
| Provedor externo | Google, Meta, IA, navegador do usuario | Callback, webhook, token e conteudo trafegando fora do app |

Roles comerciais canonicas estao em `docs/security/commercial-permission-matrix.md`.

## Fronteiras de confianca
1. Navegador -> API: cookie de sessao, CORS com credenciais e payloads JSON/raw.
2. API -> banco Prisma/SQLite: todos os filtros de organizacao e escopo precisam estar no service, nao apenas na UI.
3. API -> storage local: arquivos DANFE e anexos Wiki saem do request e viram arquivos persistentes.
4. API -> provedores externos: Google OAuth/login, Meta WhatsApp e IA recebem callbacks/tokens/dados.
5. API -> workers/Redis: snapshots podem rodar inline ou BullMQ.
6. Web estatico -> API publica: `nginx.conf` atual so serve SPA; headers e proxy/perimetro ainda nao estao definidos ali.
7. Legado SyLembra -> produto comercial: rotas antigas ficam atras de `ENABLE_LEGACY_SYLEMBRA`, mas ainda ampliam superficie se habilitadas.

## Entradas externas e rotas publicas
Rotas sem `requireAuth`:

| Rota | Condicao | Entrada | Observacao de risco |
| --- | --- | --- | --- |
| `GET /health` | Sempre ativa | Nenhuma | Baixo risco; pode revelar disponibilidade |
| `POST /v1/auth/login` | Sempre ativa | email/senha JSON | Precisa rate limit, lockout/log de falhas e cookie endurecido |
| `GET /v1/auth/google/status` | Sempre ativa | Query indireta/env | Informa se login Google esta configurado |
| `GET /v1/auth/google/start` | Sempre ativa | Redirect OAuth | Precisa state robusto e dominio permitido |
| `GET /v1/auth/google/callback` | Sempre ativa | OAuth code/state | Callback sensivel; tomada de login se state/redirect falhar |
| `GET /v1/integrations/google/oauth/callback` | Sempre ativa no app.ts | OAuth code/state | Integra admin, mas callback esta antes de `requireAuth`; depende do state salvo |
| `GET /v1/webhooks/meta-whatsapp` | Sempre ativa | Verify token | Precisa manter token secreto |
| `POST /v1/webhooks/meta-whatsapp` | Sempre ativa | Raw JSON ate 1 MB | Precisa validar assinatura Meta com `META_APP_SECRET` |
| `GET /v1/public-upload/:token` | So se legado habilitado | Token em path | Token precisa ser imprevisivel e expirar |
| `POST /v1/public-upload/:token` | So se legado habilitado | PDF/imagem raw ate 11 MB | Upload anonimo, alto risco se legado for exposto |
| `GET /v1/public-faq` | So se legado habilitado | `organizationId`, busca, paginacao | Pode enumerar organizacoes se ids vazarem |
| `POST /v1/public-help/wa-link` | So se legado habilitado | JSON de ajuda | Pode gerar spam/link indevido |

## Rotas autenticadas por dominio
Todas abaixo passam por `requireAuth` e `requireRole(...)`, mas ainda precisam de validacao de origem/CSRF porque a sessao usa cookie.

| Dominio | Rotas principais | Roles no app.ts | Dados sensiveis |
| --- | --- | --- | --- |
| Autenticacao/perfil | `/v1/auth/logout`, `/v1/auth/me`, `/v1/profile` | usuario logado | Sessao, avatar, dados pessoais |
| Comercial | `/v1/sales/*`, `/v1/operations/today` | `commercialAllRoles`, `commercialManagerRoles`, `commercialReviewerRoles` | DANFE, ranking, extratos, campanhas |
| Wiki | `/v1/wiki/*` | todos comerciais para leitura/anexos; ADMIN publica/restaura; contribuidores criam requests | Conhecimento interno e anexos |
| FAQ | `/v1/faq/threads/*`, `/v1/faq` | todos comerciais para threads; moderadores/ADMIN para status/publicacao | Duvidas internas, comentarios e promocao para Wiki |
| Avisos | `/v1/announcements/*` | todos comerciais leem; managers criam/publicam | Comunicados internos e ciencia |
| Scriptoteca | `/v1/script-library/*` | todos comerciais usam/sugerem; managers gerem; ADMIN restaura revisao | Scripts SAC, placeholders e metricas de uso |
| Admin | `/v1/users`, `/v1/organization`, `/v1/integrations/google/*` | ADMIN | Usuarios, reset de senha, configuracao e tokens |
| Diagnosticos/auditoria | `/v1/audit-logs`, `/v1/diagnostics/*` | ADMIN | Logs, metricas e falhas recentes |
| Legado SyLembra | `/v1/documents`, `/v1/licenses`, `/v1/reports`, `/v1/notifications/*` | ADMIN/RT/SUPERVISOR quando flag ativo | Dados antigos de compliance, documentos e WhatsApp |

## Controles existentes observados
- Autenticacao centralizada por `requireAuth`, cookie assinado HMAC e usuario recarregado do banco a cada request.
- `requireRole(...)` aplicado no registro de rotas.
- Google login exige email verificado e dominio listado em `GOOGLE_LOGIN_ALLOWED_DOMAINS`.
- Services comerciais aplicam `organizationId` e escopo por vendedor/supervisor em `salesDocumentWhere`, `sellerScopeWhere`, `getScopedSalesDocument` e consultas de ranking/extratos.
- Upload comercial limita MIME no Express e no service, aplica `DOCUMENT_MAX_BYTES`, gera `fileKey` com `organizationId/sales-documents/sellerId/randomUUID` e normaliza nome do arquivo.
- Wiki attachments aceitam apenas `image/png`, `image/jpeg`, `image/webp`, limite raw de 11 MB e storage por provider.
- Prisma usa parametros estruturados, reduzindo risco classico de SQL injection.
- Acoes criticas gravam `AuditLog` em varios fluxos: login, upload, revisao, export CSV, FAQ/Wiki, Avisos e Scriptoteca.
- Paginacao recente limita telas criticas a `pageSize` maximo de 100 em services analisados.
- Legado publico fica atras de `ENABLE_LEGACY_SYLEMBRA=false` por padrao.

## Maiores ameacas
| ID | Ameaca | Ativo | Caminho provavel | Impacto | Prob. | Severidade | Evidencia | Task |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R1 | CSRF em mutacoes autenticadas | DANFE, Wiki, usuarios, campanhas | Site externo induz navegador logado a fazer `POST/PATCH` com cookie | Alteracao/aprovacao indevida e troca de dados | Alta se exposto web | Critica | Cookie em `requireAuth`, CORS com credenciais, sem middleware de Origin/CSRF em `app.ts` | TASK-AT-105 |
| R2 | Sessao sem expiracao/atributos fortes documentados | Conta e roles | Roubo/reuso de cookie ou sessao antiga | Tomada de conta persistente | Media | Critica | Token tem `issuedAt`, mas `parseSessionToken` nao valida TTL; atributos ficam nos handlers | TASK-AT-104 |
| R3 | Brute force/login stuffing | Conta ADMIN/GESTOR | Muitas tentativas em `/v1/auth/login` ou OAuth callback abuse | Tomada de conta | Alta se internet | Alta | `POST /v1/auth/login` publico sem rate limit em `app.ts` | TASK-AT-106 |
| R4 | Upload malicioso ou arquivo poliglota | Storage, navegador, parser/IA | PDF/imagem/XML com conteudo real diferente do `content-type` | Malware, parser crash, XSS via arquivo servido inline | Media | Alta | Upload confia em MIME header; Wiki serve anexo `inline` | TASK-AT-108 |
| R5 | IDOR por lacuna de escopo em rota nova | Dados entre vendedores/grupos/orgs | Recurso acessado por id direto sem `organizationId`/seller scope | Vazamento ou alteracao entre equipes | Media | Alta | Sales tem bons filtros; risco maior em novos dominios e legado | TASK-AT-109 |
| R6 | XSS persistente em Markdown/conteudo operacional | Sessao, conhecimento | Wiki/FAQ/Avisos/Scriptoteca aceitam Markdown/texto renderizado no web | Roubo de sessao, comando falso, defacement | Media | Alta | Conteudo persistido em `content`, `body`, `answer`; hardening de frontend nao esta neste baseline | TASK-AT-107 |
| R7 | Segredos fracos ou defaults em producao | Sessao, tokens, DB | `SESSION_SECRET` default ou env faltante | Sessao forjavel, integracao exposta | Media | Alta | `loadEnv` usa `dev-only-session-secret`; compose usa `.env.production` sem guard documentado | TASK-AT-110 |
| R8 | Webhook Meta sem assinatura obrigatoria | Notificacoes/logs | POST publico com payload falso | Status falso, log injection, abuso de processamento | Media | Media/Alta | Rota raw publica existe; revisar uso de `META_APP_SECRET` | TASK-AT-114 |
| R9 | Exports CSV vazando dados amplos | Extratos/ranking/dashboard | Usuario com role comercial exporta mais do que deveria | Vazamento comercial em planilhas | Media | Media/Alta | Rotas CSV usam roles comerciais; scope depende do service | TASK-AT-109 |
| R10 | Logs com metadados sensiveis | Auditoria/diagnostico | Erro ou payload inclui dados fiscais/tokens | Vazamento interno via diagnostico/admin | Media | Media | `console.error(error)`, `logEvent` com metadata operacional | TASK-AT-111 |
| R11 | Dependencias vulneraveis sem gate | API/web/build | Vulnerabilidade em Express, parser, PDF/XML libs, Vite | RCE/XSS/DoS por supply chain | Media | Media | Nao ha gate SCA descrito no roadmap atual | TASK-AT-112 |
| R12 | Backup/retencao insuficiente de SQLite/storage | Banco e arquivos | Perda de volume Docker ou corrupcao local | Perda de historico comercial/auditoria | Media | Alta operacional | `docker-compose.example.yml` usa volumes, sem rotina de backup | TASK-AT-113 |
| R13 | IA recebe conteudo fiscal sem politica clara | DANFE/rawText | Envio para OpenAI/Gemini em extracao | Exposicao a terceiro e risco LGPD/comercial | Baixa/Media | Media | `DOCUMENT_AI_PROVIDER` aceita openai/gemini; DANFE contem comprador/valores | TASK-AT-114 |
| R14 | Superficie legada ativada por engano | Upload publico, relatorios SyLembra | `ENABLE_LEGACY_SYLEMBRA=true` em ambiente comercial | Rotas publicas antigas e dados fora do recorte | Baixa/Media | Media | Rotas publicas/upload legado estao em `app.ts` atras de flag | TASK-AT-110 |

## Priorizacao de hardening
1. `TASK-AT-103` - Headers, CORS e perimetro web. Define base segura para navegador e proxy.
2. `TASK-AT-104` - Sessao/login. Reduz risco de conta tomada.
3. `TASK-AT-105` - CSRF/origem. E o maior risco por API cookie-based.
4. `TASK-AT-106` - Rate limit/abuso. Protege login, callbacks, webhooks, uploads e busca.
5. `TASK-AT-107` - Validacao runtime de entrada. Diminui XSS, payload inesperado e contratos ambiguos.
6. `TASK-AT-108` - Uploads. Valida assinatura real, extensao, sniffing e serving seguro.
7. `TASK-AT-109` - Autorizacao/tenancy/IDOR. Transforma escopos bons em regressao automatizada.
8. `TASK-AT-110` - Segredos/env/deploy. Remove defaults perigosos antes de producao.
9. `TASK-AT-111` a `TASK-AT-115` - Monitoramento, dependencias, backup, integracoes e incidente.
10. `TASK-AT-116` - Gate final antes de exposicao externa.

## Perguntas abertas antes de internet publica
- O AlwaysTrack ficara atras de VPN/rede corporativa ou publico na internet?
- O banco de producao continuara SQLite em volume Docker ou migrara para Postgres gerenciado?
- Anexos/DANFEs terao retencao definida por prazo comercial/fiscal?
- Provedores de IA poderao receber DANFE real em producao ou apenas fallback fake/local?
- O legado SyLembra pode ser removido do build comercial ou apenas mantido default-off?
