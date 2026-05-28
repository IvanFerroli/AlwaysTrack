# Auditoria do Estado Atual e Prontidao para Template - SyLembra

## Metadata
- status: draft-for-template-decision
- owner: codex
- last-updated: 2026-05-27
- source-of-truth: docs/operations/auditoria-estado-atual-template-2026-05-27.md

## 1. Objetivo

Este documento descreve o que o repositorio **realmente e e faz hoje**, para orientar a conversao do SyLembra em um template reutilizavel.

O foco nao e preservar a narrativa ideal de produto. O foco e separar:

- capacidade presente no codigo ativo;
- capacidade condicionada a credencial, provider ou operacao externa;
- capacidade descrita, mas nao entregue ou nao comprovada;
- residuo historico ou dado de instancia que deve sair de um template.

## 2. Regra de verdade usada nesta auditoria

Quando ha conflito entre task, documento narrativo e implementacao, a classificacao abaixo prevalece:

1. Codigo atual, schema e rotas em `HEAD`.
2. Testes/build/checks executados neste checkout.
3. `git log` para provar quando uma entrega entrou ou foi removida.
4. Tasks e documentos operacionais como registro de intencao, aceite declarado ou drift a corrigir.

Legenda de classificacao:

| Classificacao | Significado |
| --- | --- |
| Confirmado | Existe no codigo ativo e tem evidencia local verificavel. |
| Condicionado | Existe no codigo, mas depende de credenciais, provider, aprovacao externa ou operacao nao executada nesta auditoria. |
| Parcial | Parte do fluxo existe; a promessa mais ampla nao esta conectada fim a fim. |
| Ausente | Nao foi encontrado no codigo ativo. |
| Historico | Existiu antes do pivo ou permanece apenas como documento/log. |

## 3. Conclusao executiva

O repositorio atual e uma aplicacao funcional de controle de licencas e documentos profissionais, com recorte forte de operacao de saude/COREN e marca SyLembra. Ele nao e mais o produto Olympus Climb de vagas, scraping e matching; esse produto esta apenas no historico Git e em um relatorio residual.

O SyLembra atual entrega um MVP tecnicamente consistente para ambiente local/demo:

- autenticacao e perfis `ADMIN`, `RT` e `SUPERVISOR`;
- estrutura de organizacao, unidades e setores;
- profissionais, tipos de licenca, licencas e calculo de status;
- links temporarios de upload e validacao de documentos;
- dashboard, relatorios CSV, auditoria e FAQ/ajuda publica;
- pipeline de notificacoes com provider fake e adaptador Meta WhatsApp;
- importacao CSV/XLSX e geracao de Google Sheet, inclusive OAuth por usuario;
- analise assistida de documentos por IA, com fallback local/fake e revisao humana.

Entretanto, **nao e defensavel copiar este repositorio como template sem limpeza previa**. Os bloqueadores principais sao:

1. Existe credencial pessoal de bootstrap em claro em script versionado.
2. Existe identificador real de integracao Meta registrado em task versionada.
3. Um script de smoke Google registra resposta bruta de autenticacao, podendo expor token temporario em logs.
4. Um ambiente Python temporario esta versionado: 1.131 arquivos, 78,7% dos arquivos rastreados no repositorio.
5. Documentacao e roadmap estao defasados em relacao ao codigo, especialmente Google Sheets/OAuth e arquitetura real.
6. O produto esta fortemente acoplado a marca, copy, demo, COREN, Meta e Google.
7. A arquitetura declarada no intake diverge da implementacao: PostgreSQL/Tailwind/storage externo foram planejados, enquanto o runtime atual usa SQLite/CSS proprio/storage local.
8. Ha promessas comerciais nao conectadas no fluxo atual, como enviar link magico dentro da notificacao e reenviar automaticamente apos recusa.

Recomendacao central: extrair um template somente apos separar `pipeline reutilizavel`, `starter tecnico` e `instancia SyLembra`, removendo dados de instancia e corrigindo a documentacao para refletir o runtime.

## 4. Snapshot verificavel do repositorio

### 4.1 Git e marco temporal

| Item | Estado observado |
| --- | --- |
| Branch | `main`, alinhada a `origin/main` antes da criacao deste documento |
| Primeiro commit | `2d62bf3`, 2026-04-23, bootstrap do pipeline/workspace |
| Ultimo commit em `HEAD` | `ba94a39`, 2026-05-07, ajuste do popup Google OAuth |
| Total de commits em `HEAD` | 110 |
| Fase Olympus Climb ate 2026-04-26 | 59 commits |
| Fase SyLembra a partir de 2026-04-29 | 51 commits |
| Arquivos rastreados antes deste documento | 1.438 |
| Arquivos rastreados em `.tmp-venv-parse/` | 1.131 |

### 4.2 Estrutura ativa

| Area | Papel atual |
| --- | --- |
| `apps/web/` | Frontend React/Vite, com SPA e telas publicas/autenticadas. |
| `services/api/` | API Express, Prisma, jobs e providers externos. |
| `packages/shared/` | Contratos TypeScript compartilhados de roles/status/resultados. |
| `docs/pipeline/` | Processo documental/agentico generico e reutilizavel. |
| `docs/project/`, `docs/tasks/`, `docs/runbooks/`, `docs/operations/` | Instancia SyLembra, entregas e evidencias. |
| `.agents/`, `.codex/`, `.antigravity/` | Bundles/configuracoes Olympus de apoio ao fluxo agentico. |
| `doc/` | Fonte inicial do produto e documentos Meta WhatsApp especificos. |

### 4.3 Gates executados em 2026-05-27

| Validacao | Resultado |
| --- | --- |
| `npm run check` | Passou: lint/typecheck e 111 testes em 22 arquivos de teste da API. |
| `npm run build --workspace @sylembra/web` | Passou: build Vite de producao concluido. |
| `npx prisma validate --schema services/api/prisma/schema.prisma` | Passou: schema valido. |

Nao foram executados:

- seed/reset de banco, pois alteram dados locais;
- smoke real de Meta WhatsApp;
- conexao real Google Sheets/OAuth;
- analise real de documento com OpenAI ou Gemini;
- roteiro manual no browser;
- deploy Docker/cron.

## 5. Evolucao historica e pivo de produto

### 5.1 Produto original: Olympus Climb

De 2026-04-23 a 2026-04-26, o historico registra um produto para busca e processamento de vagas:

- ingestao de vagas e deduplicacao;
- matching entre vaga e curriculo;
- scraper multi-fonte e conectores ATS;
- filtros de dashboard, ranking, aprovacao e rastreabilidade;
- integracao de IA para analise/matching.

Fontes principais:

- commits ate `3ae975e` em 2026-04-26;
- `RELATORIO-PROJETO-2026-04-27.md`.

### 5.2 Troca para SyLembra

O commit `9984aad` em 2026-04-29 marca a troca efetiva de instancia:

- remove modulos ativos de vagas, matching, scraper, resume profiles e strategy;
- remove specs/tasks ativas do produto anterior;
- introduz autenticacao, auditoria e a nova fonte de produto de licencas;
- cria a base documental da instancia SyLembra.

A partir desse ponto, os commits passam a entregar organizacao, profissionais, licencas, documentos, notificacoes, dashboard, relatorios, UX, importacao e IA documental.

### 5.3 O que restou do produto anterior

| Residuo | Estado atual | Decisao para template |
| --- | --- | --- |
| `RELATORIO-PROJETO-2026-04-27.md` | Relatorio Olympus Climb ainda na raiz. | Mover para arquivo historico fora do starter ou remover da distribuicao. |
| Historico Git pre-pivo | Contem implementacoes e documentos do produto anterior. | Manter apenas se o template nao for publicado com historico; em extracao limpa, iniciar novo repo. |
| Nomes Olympus em agentes/pipeline | Relacionados ao processo, nao ao dominio ativo. | Decidir se o template inclui o kit agentico ou se ele vira pacote separado. |

## 6. Stack e arquitetura: planejado versus executavel

| Tema | Documentado/planejado | Realidade no codigo atual | Impacto para template |
| --- | --- | --- | --- |
| Frontend | React, TypeScript, Tailwind, Vite em `docs/project/intake.md` | React + TypeScript + Vite; estilos concentrados em `apps/web/src/styles.css`, sem Tailwind nas dependencias | Corrigir docs ou introduzir Tailwind somente em uma decisao futura. |
| Backend | Node, Express, TypeScript, Prisma | Confirmado | Bom candidato a base reutilizavel. |
| Banco | PostgreSQL | `provider = "sqlite"` em `services/api/prisma/schema.prisma` e migrations SQLite | Definir se template e local-first SQLite ou production-first PostgreSQL. |
| Storage | Externo privado | Apenas `LocalStorageProvider` e `storageProvider: "local"` | Nao anunciar storage externo; parametrizar/providerizar antes de template de producao. |
| Notificacoes | Meta Cloud API oficial | Adapter Meta existe; ambiente/demo usa `fake` por default | Marcar como integracao opcional e credencial-dependente. |
| IA documental | Planejamento inicialmente menciona OpenAI | Codigo suporta `fake`, `openai` e `gemini` | Atualizar docs e manter provider opcional. |
| Google Sheets | Tasks ainda `proposed` | Codigo, schema, endpoints, testes e commits implementam Service Account e OAuth por usuario | Corrigir imediatamente o status documental. |
| Deploy | Docker/cron de baixo custo | Compose para API/web/job com volume SQLite/storage local | Starter aceitavel para demo; nao representa arquitetura escalavel pronta. |

## 7. Como o sistema funciona hoje

### 7.1 Entrada, autenticacao e escopo

O frontend e uma SPA React. As rotas publicas detectadas sao:

- `/upload/:token`: envio publico de documento por link temporario;
- `/faq`: FAQ publica e geracao de link `wa.me` para suporte.

O restante exige sessao via cookie `sylembra_session`.

O backend autentica usuarios internos e aplica tres roles:

| Role | Acesso efetivo principal |
| --- | --- |
| `ADMIN` | Configuracao global, CRUDs, importacao, tokens, notificacoes, auditoria e integracoes Google. |
| `RT` | Consulta de dados em seu escopo; validacao e analise assistida de documentos dos profissionais vinculados. |
| `SUPERVISOR` | Consulta por unidade/setor escopado; sem validacao documental e sem configuracao global. |

Observacao importante: o profissional monitorado nao recebe login no fluxo atual. Seu acesso visivel e pelo token publico de upload.

A API permite consultar/editar a organizacao corrente e criar/editar unidades e setores. Nao foi encontrada rota de criacao de uma nova organizacao/tenant; hoje a organizacao inicial e fornecida por seed ou estado preexistente.

### 7.2 Modelo de dominio atual

O Prisma possui os seguintes agregados ativos:

- `Organization`, `Unit`, `Sector`;
- `User`, com role e escopos;
- `Professional`, associado a unidade, setor e RT;
- `LicenseType`, `License`;
- `Document`, `DocumentAiExtraction`, `UploadToken`;
- `NotificationTemplate`, `NotificationRule`, `NotificationJob`, `NotificationLog`;
- `FaqItem`;
- `GoogleConnection`, `GoogleOauthState`;
- `AuditLog`.

Este modelo e especifico para controle de conformidade/licencas, nao um template de produto totalmente agnostico.

### 7.3 Ciclo de licenca

O status de licenca e derivado no backend, usando documentos, validade e regras:

| Status | Comportamento implementado |
| --- | --- |
| `INACTIVE` | Preservado quando marcado inativo. |
| `PENDING_VALIDATION` | Existe documento com status `UPLOADED`. |
| `PENDING_DOCUMENT` | Nao existe documento aprovado. |
| `EXPIRED` | Ha documento aprovado e validade ja passou. |
| `EXPIRING` | Ha documento aprovado e validade esta dentro da janela configurada. |
| `REGULAR` | Documento aprovado e validade fora da janela, ou sem validade valida. |

As janelas combinam `LicenseType.defaultWarningDays` e regras de notificacao ativas.

### 7.4 Upload e documentos

Fluxo publico implementado:

1. `ADMIN` cria manualmente um `UploadToken` para profissional/licenca.
2. A UI apresenta o link em um `window.prompt`.
3. O profissional acessa `/upload/:token`.
4. O upload aceita PDF/JPEG/PNG/WEBP, com limite configuravel.
5. O token e consumido em uso unico.
6. O documento vira `UPLOADED` e a licenca vai para `PENDING_VALIDATION`.
7. `ADMIN` ou `RT` no escopo aprova ou recusa.
8. A validacao gera auditoria e recalcula o status da licenca.

Tambem existe endpoint autenticado de upload administrativo em `POST /v1/documents`, mas nao foi encontrada tela de upload manual administrativo na SPA atual.

### 7.5 Notificacoes

Fluxo implementado:

1. `ADMIN` cadastra templates e regras.
2. O scanner busca licencas `REGULAR`, `EXPIRING` ou `EXPIRED` em datas compativeis com regras.
3. Sao criados `NotificationJob` deduplicados por licenca/regra/periodo/destinatario.
4. Regras podem destinar avisos ao profissional e/ou ao RT.
5. O worker processa jobs com provider `fake` ou Meta.
6. Status e logs de envio ficam persistidos.
7. Webhook tenta registrar estados recebidos (`SENT`, `DELIVERED`, `READ`, `FAILED`).
8. `ADMIN` tambem pode disparar notificacao manual por licenca.

Limitacao decisiva: o job nao gera link de upload nem inclui botao dinamico Meta. Essa limitacao esta explicitamente registrada em `doc/meta-whatsapp-templates/`.

### 7.6 Document AI

Fluxo implementado:

1. `ADMIN` ou `RT` solicita analise de um documento acessivel.
2. Provider configurado analisa imagem/PDF; sem credencial, retorna fallback `fake`.
3. Resultado estruturado e persistido em `DocumentAiExtraction`.
4. A UI mostra dados, confiancas e avisos.
5. Somente uma acao humana aplica campos ao profissional/licenca.
6. A aplicacao e auditada.

Providers presentes no codigo:

- `fake`;
- OpenAI Responses API;
- Gemini GenerateContent API.

### 7.7 Importacao e Google Sheets

Capacidades presentes:

- modelo CSV;
- workbook XLSX guiado com validacoes;
- validacao e commit de importacao de profissionais/licencas;
- geracao nativa de Google Sheet a partir de dados da organizacao;
- fallback Service Account;
- OAuth Google por usuario com estado PKCE, refresh token cifrado e desconexao;
- UI para conectar conta Google e abrir a planilha gerada.

O CSV permanece como contrato final de importacao; a planilha Google e uma interface assistida para preparar os dados.

### 7.8 Leitura operacional e suporte

O frontend implementa:

- dashboard com metricas e filas;
- relatorios e exportacao CSV;
- auditoria administrativa;
- configuracoes de organizacao, usuarios, templates, regras e FAQ;
- ajuda interna `Como usar`;
- FAQ publica e link de contato via WhatsApp.

## 8. Inventario de capacidades atuais

| Capacidade | Estado real | Evidencia principal | Observacao para template |
| --- | --- | --- | --- |
| Login/logout/me | Confirmado | `services/api/src/core/auth`, rotas em `src/app.ts`, testes | Generalizavel, mas requer endurecimento de sessao. |
| Roles e escopo | Confirmado | `access-policy.ts`, filtros de services, testes | Reutilizavel se o template assumir tenancy organizacional. |
| Organizacao/unidades/setores | Parcial | Modulo `organizations`, UI settings | Edita tenant existente; onboarding/criacao de tenant nao existe. |
| Gestao de usuarios | Confirmado | Modulo `users`, UI settings | Remover dados/credenciais de demo. |
| Profissionais | Confirmado | Modulo `professionals`, UI | Especifico do vertical. |
| Licencas/tipos | Confirmado | Modulo `licenses`, UI | Especifico do vertical. |
| Calculo automatico de status | Confirmado | `licenses/status.ts`, testes | Bom componente de vertical starter. |
| Upload token publico | Confirmado | Modulo `documents/upload-tokens`, SPA publica, testes | Reutilizavel; hoje criacao e manual por admin. |
| Upload administrativo | Parcial | Endpoint existe; UI administrativa nao encontrada | Nao documentar como fluxo de tela pronto. |
| Validacao/recusa de documento | Confirmado | `documents.service.ts`, UI, testes | Recusa nao dispara nova mensagem automaticamente. |
| Analise de documento por IA | Condicionado | `document-ai`, migration, testes | Funciona de verdade apenas com provider/credencial. |
| Templates/regras de notificacao | Confirmado | Modulo `notifications`, UI | Copy/template e especifico de SyLembra. |
| Scanner e worker | Confirmado | `notifications.service.ts`, `src/jobs/notifications.ts` | Requer cron/execucao externa em producao. |
| Provider Meta WhatsApp | Condicionado | `provider.ts`, smoke script, docs Meta | Envio real nao foi comprovado nesta auditoria. |
| Webhook Meta | Parcial/risco | Rotas e handler presentes | Ver risco de assinatura com body reserializado. |
| Escalonamento ao RT | Confirmado no job | `notifyRt`, scanner, commits de 2026-05-05 | Depende de telefone/template/provider real. |
| Link de upload na mensagem | Ausente | Docs Meta declaram bloqueio atual | Necessario para promessa de link magico via WhatsApp. |
| Notificacao automatica de recusa | Ausente | `validateDocument` nao cria/processa job | Dossie comercial superestima comportamento. |
| Dashboard | Confirmado | Modulo `dashboard`, UI, testes | Reutilizavel com o dominio. |
| Relatorios JSON/CSV | Confirmado | Modulo `reports`, UI, testes | RT/Supervisor podem ter filtros auxiliares incompletos na UI. |
| Auditoria | Confirmado | Modulo `audit`, UI, testes | Reutilizavel; rever dados sensiveis em logs. |
| FAQ administrativa/publica | Confirmado | Modulo `faq`, `/faq`, testes | Default publico `demo-org` precisa parametrizacao. |
| Ajuda por `wa.me` | Confirmado | `buildPublicHelpLink` | Nao e mensagem automatica Meta; abre WhatsApp do usuario. |
| Importacao CSV | Confirmado | Modulo `imports`, UI, testes | Especifico do modelo de profissionais/licencas. |
| XLSX guiado | Confirmado | Import service e commit de 2026-05-06 | Opcional na base generica. |
| Google Sheet nativo | Condicionado | Codigo, UI, testes e commit `8391266` | Task ainda diz `proposed`; corrigir docs. |
| OAuth Google por usuario | Condicionado | Schema, rotas, UI, testes e commit `6dca974` | Task ainda diz `proposed`; integracao opcional. |
| Seed/demo local | Confirmado | `prisma/seed.ts`, runbook | Deve virar exemplo anonimo e seguro. |
| Deploy Compose/cron | Parcial | `deploy/`, runbook | Desenha deploy SQLite/local; nao garante producao escalavel. |

## 9. O que o projeto nao faz hoje

Os pontos abaixo nao devem aparecer como capacidades prontas do template sem implementacao adicional:

1. Nao envia automaticamente um link magico de upload nas mensagens Meta.
2. Nao envia botao URL dinamico nos templates WhatsApp.
3. Nao cria automaticamente uma notificacao ao profissional quando um documento e recusado.
4. Nao oferece na UI atual um fluxo claro de upload administrativo manual de documento, embora a API exista.
5. Nao usa PostgreSQL no runtime versionado atual.
6. Nao possui provider de storage externo; usa diretorio local privado.
7. Nao usa Tailwind no frontend atual.
8. Nao comprova envio Meta real, aprovacao final dos templates ou webhook real em ambiente externo nesta auditoria.
9. Nao comprova extracao real por IA sem credenciais e documentos de teste externos.
10. Nao comprova operacao Google real nesta auditoria; existe implementacao e teste local do contrato.
11. Nao possui E2E de browser configurado; o E2E atual e de dominio/API com mocks.
12. Nao contem mais, no codigo ativo, scraping de vagas, matching de CV, aplicacao de emprego ou conectores ATS do Olympus Climb.
13. Nao contem specs ativas de capacidade SyLembra alem dos templates em `docs/specs/`.
14. Nao fornece fluxo de criacao/onboarding de uma nova organizacao; opera sobre organizacao existente.

## 10. Diferencas entre narrativa, tasks e realidade

### 10.1 Drift documental que deve ser corrigido

| Documento/task | O que diz | O que o codigo/log prova | Acao |
| --- | --- | --- | --- |
| `TASK-IMP-002` | `status: proposed`; nao implementar na rodada | Google Sheet nativo implementado em commits de 2026-05-06; endpoint/UI/testes presentes | Atualizar para entregue/condicionado e registrar limite externo. |
| `TASK-IMP-003` | `status: proposed`; endpoints apenas sugeridos | OAuth por usuario, schema, handlers e UI implementados em 2026-05-07 | Atualizar status, evidencias e riscos reais. |
| `docs/tasks/ROADMAP.md` | Roadmap ainda `proposed` | Quase todo o roadmap foi implementado; dois itens propostos tambem viraram codigo | Transformar em baseline de release ou arquivar. |
| `docs/project/intake.md` | Tailwind, PostgreSQL, storage externo | Runtime versionado usa CSS proprio, SQLite e storage local | Atualizar para `planejado` versus `implementado`. |
| `TASK-AI-001` | Entrega menciona fake/OpenAI | Codigo tambem possui Gemini, sustentado por commits de 2026-05-05 | Sincronizar provider real disponivel. |
| `.env.example` | Inclui Meta e Google, mas nao lista configuracao de IA | `env.ts` consome `DOCUMENT_AI_PROVIDER`, `DOCUMENT_AI_MODEL`, `OPENAI_API_KEY` e `GEMINI_API_KEY`. | Completar onboarding das integracoes opcionais. |
| `docs/operations/v1-demo-acceptance-2026-04-30.md` e `lgpd-security-review-2026-04-30.md` | Fechados antes de Google/OAuth/Gemini | O codigo ganhou novas superficies externas entre 2026-05-05 e 2026-05-07. | Atualizar aceite e revisao de dados/seguranca. |

### 10.2 Claims de apresentacao que nao representam comportamento fim a fim

| Claim no dossie atual | Realidade encontrada |
| --- | --- |
| Cobranca 100% autonoma via WhatsApp com link de documento | Scanner/provider existem, mas templates atuais nao carregam link/token/botao de upload. |
| Recusar documento automaticamente avisa o profissional | Recusa registra auditoria e recalcula status; nao cria job de notificacao. |
| RT cadastra profissionais e licencas | Rotas de criacao/edicao sao `ADMIN` only; RT valida/analisar documentos no escopo. |
| Envio manual de arquivo pelo RH/RT na interface | API de upload autenticado existe; a SPA nao apresenta formulario administrativo equivalente. |
| Sistema pronto para operacao oficial Meta | Adaptador existe; demo e aceite usam provider `fake`, e a aprovacao/execucao externa nao foi confirmada. |

O arquivo `docs/Dossie_Apresentacao_Sylembra.md` e util como visao de produto, mas nao deve ser usado como manual tecnico sem revisao.

## 11. Riscos reais antes de virar template

### 11.1 Criticos: remover antes de compartilhar ou publicar

| Risco | Evidencia | Consequencia | Acao recomendada |
| --- | --- | --- | --- |
| Credencial pessoal em claro em script versionado | `scripts/flush-local-demo.js` contem identidade e senha de bootstrap hardcoded | Exposicao de acesso e clonagem insegura | Remover do codigo, usar env/seed anonimo e rotacionar a credencial exposta. |
| Identificador real de conta Meta em doc versionado | `docs/tasks/TASK-NOT-007-templates-oficiais-meta-whatsapp.md` | Vazamento de dado de integracao/instancia | Redigir/remover do template e revisar historico de publicacao. |
| Log de resposta bruta de token Google | `services/api/src/scripts/smoke-google-sheets.ts` imprime `TOKEN_RESPONSE` completo | Token temporario pode parar em terminal, CI ou log compartilhado | Redigir resposta e imprimir apenas status/erros seguros antes de reutilizar o script. |
| Virtualenv temporario versionado | `.tmp-venv-parse/`, 1.131 arquivos | Template inflado, ruido e supply-chain desnecessaria | Remover do tracking e adicionar ignore explicito. |

### 11.2 Altos: decidir ou corrigir antes de anunciar template de producao

| Risco | Evidencia tecnica | Consequencia |
| --- | --- | --- |
| Validacao de assinatura Meta sobre body reserializado | `express.json()` precede webhook e `handleMetaWebhook` calcula HMAC sobre `JSON.stringify(body)` | Webhook real assinado pode ser rejeitado ou ter verificacao incorreta; exigir corpo bruto para validacao. |
| Banco SQLite no deploy descrito | Prisma e Compose usam arquivo/volume SQLite | Concorrencia, backup, migracao e escalabilidade diferem da arquitetura Postgres anunciada. |
| Storage local unico | Apenas `LocalStorageProvider` existe | Persistencia/backup/alta disponibilidade ficam a cargo do host; nao e storage externo privado. |
| Sessao sem expiracao validada no token | Cookie recebe `maxAge`, mas `parseSessionToken` valida assinatura e nao expira `issuedAt` | Token capturado pode ser reutilizado fora do prazo do cookie enquanto usuario permanecer ativo. |
| Integracoes externas opcionais misturadas ao produto base | Meta, Google e IA compartilham UI/copy principal | Template exige secrets e onboarding complexo antes de demonstrar valor. |

### 11.3 Medios: divida tecnica de template/manutencao

| Risco | Evidencia | Consequencia |
| --- | --- | --- |
| Frontend centralizado | `apps/web/src/main.tsx` tem 4.740 linhas e `styles.css` 1.437 linhas | Customizacao de template aumenta risco de regressao. |
| Documentacao sem specs ativas | `docs/specs/` contem apenas README/template | Dificulta separar contrato generico de comportamento SyLembra. |
| Default publico amarrado a demo | `/faq` usa `demo-org` quando nao ha parametro | Novo projeto herda comportamento de instancia/demo. |
| Ausencia de onboarding de tenant | Rotas editam organizacao existente, mas nao criam nova | Starter nao se instancia sem seed ou procedimento adicional. |
| Operacoes locais destrutivas/acopladas | `scripts/start-all.js` mata portas; `flush-local-demo.js` reseta banco/storage | Scripts precisam ser renomeados, protegidos e parametrizados para distribuicao. |
| Textos e assets de marca disseminados | Web, seed, docs, scripts, templates e envs | Rename parcial produz starter inconsistente. |

## 12. Matriz de limpeza para extracao do template

### 12.1 Remover ou excluir da distribuicao

| Item | Motivo |
| --- | --- |
| `.tmp-venv-parse/` | Artefato temporario rastreado; nao e codigo do produto. |
| `.openclaw/workspace-state.json` | Estado local da maquina/workspace, sem valor para consumidor do template. |
| Credenciais e dados pessoais em `scripts/flush-local-demo.js` | Dado sensivel e acoplamento de instancia. |
| Identificadores reais Meta em docs/tasks | Dado de integracao do cliente/instancia. |
| Logging bruto em `services/api/src/scripts/smoke-google-sheets.ts` | Pode registrar resposta contendo token de acesso. |
| `RELATORIO-PROJETO-2026-04-27.md` na raiz do starter | Historico de produto substituido, confunde a nova instancia. |
| Prints/placeholders e dossie comercial nao auditado, caso o template seja tecnico | Promessas nao equivalem ao contrato do starter. |

### 12.2 Parametrizar

| Item atual | Parametro/abstracao desejada |
| --- | --- |
| Nome `SyLembra`, favicon, manifest, textos, cookie `sylembra_session` | Configuracao de marca/app gerada no bootstrap. |
| Seed demo COREN/hospital/profissionais | Fixture anonima e opcional do exemplo vertical. |
| `demo-org` na FAQ publica | Tenant obtido por slug/config ou exemplo explicitamente separado. |
| Organizacao criada apenas por seed/estado existente | Comando de bootstrap neutro ou fluxo de onboarding definido pelo template. |
| Templates WhatsApp e regras de vencimento | Pack opcional do vertical de licencas. |
| Google Sheets/OAuth | Feature flag/modulo opcional com onboarding proprio. |
| IA OpenAI/Gemini | Feature flag/provider opcional; default sem envio externo. |
| SQLite/storage local | Perfil local; provider de producao escolhido explicitamente. |
| Compose/cron | Recipes opcionais por infraestrutura. |

### 12.3 Manter como base reaproveitavel

| Area | Por que vale preservar |
| --- | --- |
| Workspaces npm, TypeScript, Vite e Express | Scaffold simples e funcional. |
| `packages/shared` e padrao `ApiResult` | Contrato leve entre web/API. |
| Middleware de auth/role e filtros de escopo | Bom ponto de partida para app organizacional. |
| Auditoria transversal | Valor generico alto. |
| Interfaces de provider (`NotificationProvider`, `DocumentAiProvider`, storage) | Facilitam substituicao, apesar de storage ainda precisar outro adapter. |
| Testes unitarios e E2E de dominio | Baseline util para nao quebrar a extracao. |
| `docs/pipeline/` e templates documentais | Ja foram concebidos como superficie reutilizavel. |

### 12.4 Manter apenas se o template for vertical de conformidade

| Area | Justificativa |
| --- | --- |
| `Professional`, `LicenseType`, `License`, status e relatorios | Sao core do produto SyLembra, nao de um SaaS generico. |
| Upload/validacao de documento | Excelente para template de conformidade; excessivo em starter generico. |
| Scanner de vencimentos e escalonamento RT | Regra de negocio do vertical. |
| Copy COREN/WhatsApp/licenca | Exemplo setorial, nao fundacao neutra. |

## 13. Decisao de produto necessaria: que template sera extraido?

Antes de editar o codigo, e necessario escolher uma destas formas de template:

| Tipo de template | O que inclui | O que sai |
| --- | --- | --- |
| Template de pipeline agentico | `.agents`, `.codex`, `docs/pipeline`, templates documentais | Toda aplicacao SyLembra e dados de dominio. |
| Starter SaaS organizacional | Auth, roles, auditoria, shell web/API, configuracao de providers | Profissionais/licencas/docs/notificacoes setoriais ficam como exemplo opcional. |
| Starter vertical de licencas/compliance | Quase toda a aplicacao atual, apos saneamento | Branding, credenciais, tenant demo e claims nao entregues. |

Pelo codigo existente, a extracao de menor custo e maior fidelidade e o **starter vertical de licencas/compliance**. Transformar diretamente em starter SaaS generico exige refatoracao de dominio maior e nao e apenas limpeza.

## 14. Plano recomendado de transformacao

### Fase 0 - Saneamento obrigatorio

1. Remover/rotacionar credenciais ou identificadores reais versionados.
2. Sanitizar logs de smoke e quaisquer rotas/scripts que possam imprimir tokens ou respostas brutas de providers.
3. Remover `.tmp-venv-parse/` e estados locais rastreados.
4. Decidir se o novo template nasce em repositorio sem historico do produto anterior.
5. Marcar documentos de apresentacao como narrativos ate serem reconciliados com o codigo.

### Fase 1 - Baseline de realidade

1. Atualizar `docs/project/intake.md` para separar arquitetura pretendida da implementada.
2. Atualizar status/evidencias de `TASK-IMP-002` e `TASK-IMP-003`.
3. Atualizar `ROADMAP.md` para refletir release atual e backlog real.
4. Criar specs ativas para auth/tenancy, documentos, notificacoes e importacao.
5. Reescrever o dossie de apresentacao removendo claims nao conectados.

### Fase 2 - Separacao template versus exemplo

1. Definir configuracao de marca, nome de pacote, cookie, tenant demo e assets.
2. Separar fixtures/demo e copy COREN do scaffold central.
3. Isolar Meta, Google e IA como modulos opcionais.
4. Escolher perfil de persistencia: SQLite local e Postgres/provedor real para producao, ou assumir SQLite conscientemente.
5. Implementar provider de storage de producao caso esse seja requisito do template.

### Fase 3 - Fechamento tecnico

1. Corrigir verificacao raw-body do webhook Meta antes de alegar operacao real.
2. Endurecer sessao, logging/redacao, secrets e endpoints publicos.
3. Decidir se link de upload e recusa-notificacao entram no starter ou ficam no backlog.
4. Acrescentar E2E browser para o fluxo demonstravel.
5. Validar template criado do zero em pasta/repo limpo.

## 15. Backlog real sugerido para o template

| Prioridade | Item | Razao |
| --- | --- | --- |
| P0 | Remover credencial pessoal hardcoded e rotacionar acesso | Seguranca. |
| P0 | Redigir identificadores Meta reais nos docs distribuiveis | Seguranca/privacidade da instancia. |
| P0 | Redigir resposta de autenticacao no smoke Google | Evitar vazamento de token em logs. |
| P0 | Remover virtualenv temporario do Git | Higiene basica do template. |
| P1 | Sincronizar tasks/roadmap/intake com codigo atual | Documento deve espelhar realidade. |
| P1 | Definir categoria de template e fronteira do dominio | Evita refatoracao sem alvo. |
| P1 | Corrigir assinatura webhook usando raw body | Integracao Meta real. |
| P1 | Escolher banco/storage de producao | Contrato arquitetural verdadeiro. |
| P1 | Parametrizar marca, seed, tenant publico e templates | Reuso seguro. |
| P1 | Definir bootstrap/onboarding de nova organizacao | Starter precisa iniciar sem dados da instancia original. |
| P2 | Implementar link de upload em notificacao, se promessa for mantida | Fecha fluxo comercial principal. |
| P2 | Implementar notificacao apos recusa, se promessa for mantida | Fecha fluxo de correcao. |
| P2 | Modularizar frontend e criar E2E browser | Reduz regressao em customizacoes. |

## 16. Fontes consultadas

### Codigo e runtime

- `package.json`, `apps/web/package.json`, `services/api/package.json`
- `services/api/src/app.ts`
- `services/api/prisma/schema.prisma` e migrations
- `services/api/src/config/env.ts`
- `services/api/src/core/auth/`
- `services/api/src/core/licenses/`
- `services/api/src/core/documents/`
- `services/api/src/core/notifications/`
- `services/api/src/core/document-ai/`
- `services/api/src/core/imports/`
- `services/api/src/core/integrations/google/`
- `services/api/src/core/faq/`
- `services/api/prisma/seed.ts`
- `apps/web/src/main.tsx`
- `scripts/start-all.js`, `scripts/flush-local-demo.js`, `scripts/check-env.js`
- `services/api/src/scripts/smoke-google-sheets.ts`, `services/api/src/scripts/smoke-whatsapp.ts`
- `deploy/docker-compose.example.yml`

### Documentacao e tasks

- `doc/Projeto-—-Sistema-Modular-de-Controle-de-Licenças-COREN-com-Notificações-WhatsAp.txt`
- `docs/project/intake.md`
- `docs/tasks/ROADMAP.md`
- tasks `TASK-DOC`, `TASK-DAT`, `TASK-AUT`, `TASK-LIC`, `TASK-FIL`, `TASK-NOT`, `TASK-RPT`, `TASK-REL`, `TASK-PAT`, `TASK-AI`, `TASK-IMP` e `TASK-UX`
- `docs/operations/pipeline-audit-2026-04-29.md`
- `docs/operations/lgpd-security-review-2026-04-30.md`
- `docs/operations/v1-demo-acceptance-2026-04-30.md`
- `docs/Dossie_Apresentacao_Sylembra.md`
- `doc/meta-whatsapp-templates/`
- `RELATORIO-PROJETO-2026-04-27.md`

### Historico Git

- `git log --all` e `git log --reverse`
- commits de pivo/entrega citados: `9984aad`, `8391266`, `6dca974`, `ba94a39`
- comparacao do antes/depois do pivo em 2026-04-29

## 17. Checklist final de validacao desta auditoria

- [x] Estrutura e stack lidas diretamente no repositorio.
- [x] Rotas e schema confrontados com documentos/tasks.
- [x] Historico Git usado para identificar pivo e entregas posteriores.
- [x] Claims de apresentacao confrontados com fluxos conectados no codigo.
- [x] `npm run check` passou com 111 testes.
- [x] Build de producao do frontend passou.
- [x] Schema Prisma validado.
- [x] Itens sensiveis identificados sem reproduzir segredos neste documento.
- [ ] Integracoes externas validadas com credenciais reais.
- [ ] Roteiro manual de browser executado.
- [ ] Limpeza/rotacao/parametrizacao implementada.

## 18. Parecer final

O SyLembra e hoje um MVP operacional de licencas/compliance bem mais completo do que algumas tasks indicam, particularmente em importacao Google e OAuth. Ao mesmo tempo, ele e menos completo do que o dossie comercial afirma em automacao de WhatsApp com link de upload e fluxo de recusa.

Para virar template, a direcao correta nao e simplesmente apagar branding: e primeiro limpar dados e artefatos de instancia, corrigir a fonte documental, decidir o nivel de genericidade desejado e somente entao extrair uma base limpa. O caminho mais curto e confiavel e um starter vertical de licencas/compliance, com integracoes externas opcionais e exemplos anonimos.

## Sugestao de commit semantico

`docs(operations): audit current sylembra state for template extraction`
