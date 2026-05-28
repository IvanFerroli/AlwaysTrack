# TASK-IMP-003 - OAuth Google por usuario para geracao de planilhas de importacao

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-05-28
- source-of-truth: docs/tasks/TASK-IMP-003-oauth-google-usuario-planilhas-importacao.md

## Modo
- mode: verification

## Objetivo unico
Planejar a integracao Google Sheets baseada em OAuth 2.0 por usuario, para que a planilha de importacao seja criada no Drive do proprio usuario humano, preservando CSV como contrato final de importacao e mantendo o fluxo atual por Service Account apenas como modo opcional para ambientes Workspace/Shared Drive.

## Contexto minimo
O SyLembra ja possui:
- importador CSV autenticado para profissionais/licencas;
- template CSV simples;
- modelo XLSX guiado;
- geracao de Google Sheet nativo baseada em Service Account.

O fluxo com Service Account foi investigado e confirmou:
- `GOOGLE_APPLICATION_CREDENTIALS` esta sendo lido corretamente;
- o JSON da credencial existe e o token OAuth e emitido;
- os scopes explicitos atuais incluem:
  - `https://www.googleapis.com/auth/spreadsheets`
  - `https://www.googleapis.com/auth/drive.file`
- o fallback por `GOOGLE_SHEETS_TEMPLATE_FOLDER_ID` foi implementado;
- a pasta unica em Meu Drive pessoal foi compartilhada com a Service Account como editora;
- o backend passou a usar `Drive API files.create` dentro da pasta;
- o erro real atual no fluxo por pasta e `403 storageQuotaExceeded`.

Decisao arquitetural desta task:
- **Nao insistir em Service Account + Meu Drive pessoal como fluxo principal de produto**.
- **OAuth por usuario passa a ser o caminho recomendado para contas Google/Gmail comuns**.
- **Service Account permanece apenas como fallback opcional para Workspace/Shared Drive**.

## Problema
Criar planilhas com Service Account em contexto de Meu Drive pessoal se mostrou operacionalmente fragil:
- Service Accounts nao sao boas candidatas a ownership de arquivos em Drive pessoal;
- houve erro real de quota (`storageQuotaExceeded`) mesmo com pasta compartilhada corretamente;
- o usuario final nao deve ser obrigado a criar pasta, compartilhar pasta ou entender setup tecnico de Google.

Isso conflita com o objetivo de um fluxo assistido simples:
1. usuario logado clica em gerar;
2. backend cria a planilha;
3. usuario abre a planilha no proprio Google Sheets.

## Inputs
- fluxo atual de importacao CSV:
  - `professional_name,cpf,email,phone,position,unit_name,sector_name,rt_email,license_type,license_number,issuer,uf,issued_at,expires_at,status,notes`
- task atual de Google Sheets por Service Account:
  - `docs/tasks/TASK-IMP-002-modelo-google-sheets-nativo.md`
- auth atual da app:
  - sessao propria por cookie HTTP-only
  - `req.user` preenchido pelo backend com `id`, `email`, `role`, `organizationId`
- endpoint atual:
  - `GET /v1/imports/professionals-licenses/template/google-sheet`
- conclusao tecnica registrada nesta rodada:
  - Service Account + Meu Drive pessoal nao e caminho principal suportavel

## Dependencias
- satisfeitas:
  - `TASK-AUT-001` login e sessao
  - `TASK-AUT-002` roles e escopo
  - `TASK-IMP-001` importacao CSV de profissionais e licencas
  - `TASK-IMP-002` modelo Google Sheets nativo com dropdowns baseados no banco
- em aberto:
  - projeto Google Cloud com OAuth 2.0 configurado
  - consent screen Google
  - estrategia de armazenamento seguro de refresh token
  - definicao de criptografia/segredo para tokens externos

## Dependencias tecnicas
- Google OAuth 2.0
- Google Sheets API
- Google Drive API
- armazenamento seguro de refresh token
- definicao de expiracao, revogacao e reconexao da conta Google
- decisao de tenancy entre token por usuario ou por organizacao

## Escopo
- mapear a arquitetura atual de auth do SyLembra para suportar uma integracao OAuth externa por usuario
- definir modelo de dados para armazenar token Google com seguranca
- definir os endpoints de conexao, callback, status e desconexao
- definir a estrategia de selecao de auth para geracao de planilha:
  1. OAuth do usuario conectado
  2. Service Account + Shared Drive, se configurado
  3. erro amigavel se nenhum modo valido existir
- registrar que Service Account com pasta de Meu Drive pessoal nao e suportado como fluxo principal
- registrar que Shared Drive e opcional e voltado a Google Workspace
- preservar CSV como contrato final de importacao
- preservar CSV/XLSX e o importador atual sem refatoracao nesta task

## Dados usados do banco
No fluxo futuro de geracao, o backend continuara buscando no banco da organizacao autenticada:
- unidades ativas
- setores ativos
- usuarios ativos com role `RT`
- tipos de licenca ativos
- statuses validos do dominio

No fluxo OAuth, o backend tambem precisara persistir metadados da conexao Google, sugeridos como:
- `organizationId`
- `userId`
- `provider` = `google`
- `googleEmail`
- `refreshTokenEncrypted`
- `scopesGranted`
- `connectedAt`
- `lastUsedAt`
- `revokedAt` ou flag equivalente

## APIs necessarias
- Google OAuth 2.0
- Google Sheets API
- Google Drive API

## Envs necessarias
Sugestao de envs futuras para a implementacao OAuth:
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `GOOGLE_OAUTH_SCOPES` opcional, se quiser externalizar
- `GOOGLE_TOKEN_ENCRYPTION_KEY` ou usar segredo central ja existente, conforme decisao de seguranca

Envs atuais que permanecem para modo opcional de Service Account:
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_APPLICATION_CREDENTIALS`
- `GOOGLE_SHEETS_TEMPLATE_FOLDER_ID`
- `GOOGLE_SHEETS_TEMPLATE_SHARE_EMAIL`
- `GOOGLE_SHEETS_TEMPLATE_SHARE_ROLE`

## Fluxo esperado
1. Usuario logado no SyLembra acessa a integracao Google.
2. Clica em `Conectar Google Drive/Sheets`.
3. Backend inicia fluxo OAuth 2.0.
4. Usuario autoriza os scopes minimos.
5. Backend recebe `authorization code`.
6. Backend troca por `access_token` e `refresh_token`.
7. Backend armazena o `refresh_token` de forma segura associado ao usuario ou organizacao, conforme decisao final.
8. Quando o usuario clicar em `Gerar Google Sheet`:
   - backend usa OAuth do usuario conectado;
   - cria a planilha no Drive do proprio usuario;
   - preenche abas `Modelo` e `Listas`;
   - aplica dropdowns nativos;
   - retorna `spreadsheetId` e `spreadsheetUrl`.
9. A planilha pertence ao usuario humano, nao a uma Service Account.
10. O usuario preenche a planilha no Google Sheets.
11. O usuario exporta para CSV.
12. O CSV continua sendo a fonte final de importacao pelo importador atual.

## Endpoints sugeridos
- `GET /v1/integrations/google/oauth/start`
- `GET /v1/integrations/google/oauth/callback`
- `DELETE /v1/integrations/google`
- `GET /v1/integrations/google/status`

Adaptacao futura do endpoint existente:
- `GET /v1/imports/professionals-licenses/template/google-sheet`
  - tenta OAuth do usuario, se conectado;
  - tenta Service Account + Shared Drive, se configurado;
  - retorna erro amigavel se nenhum modo valido existir.

Observacao:
- nao implementar agora;
- nao criar importacao direta da Google Sheet;
- nao substituir o endpoint de importacao CSV.

## Services sugeridos
- `services/api/src/core/integrations/google/google-oauth.service.ts`
  - montar URL de autorizacao
  - trocar code por tokens
  - refresh de access token
  - revogar conexao
- `services/api/src/core/integrations/google/google-connection.service.ts`
  - persistir e recuperar conexao Google por usuario/org
  - criptografar/decriptar refresh token
- `services/api/src/core/imports/google-sheets-template.service.ts`
  - evoluir para escolher estrategia de auth sem quebrar o fluxo atual
- `services/api/src/core/integrations/google/google.handlers.ts`
  - endpoints de start/callback/status/disconnect

Observacao:
- estes arquivos sao sugestoes de encaixe;
- nada deve ser implementado nesta rodada.

## Alvos explicitos
1. `docs/tasks/TASK-IMP-003-oauth-google-usuario-planilhas-importacao.md`
2. `docs/tasks/ROADMAP.md`

## Fora de escopo
- importar diretamente de Google Sheets para o banco
- sincronizacao continua ou bidirecional com planilhas
- OAuth Microsoft/OneDrive na mesma task
- revamp generico de autenticacao da app inteira
- remocao do CSV atual
- remocao do XLSX atual
- remocao do codigo existente de Service Account
- refatorar o importador CSV atual
- billing Google Cloud
- commitar credenciais
- implementar nesta rodada

## Decisoes em aberto
- armazenar refresh token por usuario ou por organizacao?
- qual mecanismo de criptografia/secret sera usado para tokens externos?
- a feature sera visivel apenas para `ADMIN` ou para outros perfis tambem?
- o fallback de Service Account sera automatico ou explicitamente selecionado por modo/destino?
- Shared Drive sera suportado no MVP ou apenas em fase posterior?

## Checklist
1. Registrar a decisao de pivot arquitetural sem reabrir o escopo da `TASK-IMP-002`.
2. Documentar que `storageQuotaExceeded` e Service Accounts sem quota inviabilizam Meu Drive pessoal como caminho principal.
3. Definir o fluxo alvo de OAuth 2.0 por usuario.
4. Definir endpoints sugeridos e estrategia de auth dual-path futura.
5. Definir estrategia de armazenamento seguro de tokens.
6. Definir riscos, rollback e fora de escopo.
7. Atualizar o roadmap com a nova task.

## Acceptance Criteria
1. Existe uma task formal para planejar Google OAuth por usuario no fluxo de geracao de planilha.
2. A task registra explicitamente a decisao de nao usar Service Account + Meu Drive pessoal como fluxo principal.
3. A task define:
   - objetivo
   - contexto
   - problema
   - escopo
   - fora de escopo
   - dependencias tecnicas
   - envs necessarias
   - APIs necessarias
   - dados usados do banco
   - fluxo esperado
   - endpoints sugeridos
   - services sugeridos
   - riscos
   - rollback/contingencia
4. A task preserva explicitamente:
   - CSV atual
   - XLSX atual
   - importador atual
   - codigo atual de Service Account
5. A task deixa claro que OAuth Google e integracao opcional e separada da sessao da app.

## Definition of Done
1. Arquivo `TASK-IMP-003` criado no padrao do projeto.
2. Roadmap atualizado com a nova task.
3. Nenhum codigo de producao alterado nesta rodada.
4. Nenhuma dependencia instalada nesta rodada.
5. Nenhuma credencial ou env real commitada nesta rodada.
6. Os proximos passos de implementacao ficaram claros.

## Execucao
- Normalizada como `completed-mvp` apos verificacao material em 2026-05-28.
- A implementacao existente cobre status, inicio OAuth, callback e desconexao em `services/api/src/core/integrations/google/google.handlers.ts`.
- A logica de OAuth por usuario, PKCE/state, criptografia de refresh token, refresh de access token e fallback Service Account esta em `services/api/src/core/integrations/google/google-oauth.service.ts`.
- A persistencia esta modelada em `GoogleConnection` e `GoogleOauthState`, com migration `20260507182901_google_oauth_user_connections`.
- A UI administrativa expõe conexao Google, desconexao e geracao do template em `apps/web/src/main.tsx`.
- O endpoint de geracao de planilha prefere OAuth do usuario conectado e cai para Service Account quando aplicavel.

## Evidencias
- `services/api/src/core/integrations/google/google-oauth.service.ts`
- `services/api/src/core/integrations/google/google-oauth.service.test.ts`
- `services/api/src/core/integrations/google/google.handlers.ts`
- `services/api/prisma/schema.prisma`
- `services/api/prisma/migrations/20260507182901_google_oauth_user_connections/migration.sql`
- `apps/web/src/main.tsx`
- `npm run check`
- `npm run build --workspace @sylembra/web`

## Riscos residuais
- Smoke real do OAuth depende de `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` e consent screen configurados.
- O armazenamento de refresh token continua sendo superficie sensivel e depende da guarda correta de `GOOGLE_TOKEN_ENCRYPTION_KEY` ou `SESSION_SECRET`.
- Popups/callbacks devem ser validados manualmente no navegador do ambiente alvo.
- O listener de `postMessage` da UI ainda deve validar `event.origin` antes de fechamento final.
- A desconexao local remove a conexao persistida, mas nao revoga o token diretamente no Google.
- Em modo OAuth, a resposta pode listar o proprio usuario em `sharedWith` embora a planilha ja pertença a ele.

## Validacao
- comandos/checks:
  - revisar consistencia da task com `TASK-IMP-001`
  - revisar consistencia da task com `TASK-IMP-002`
  - revisar consistencia da task com `TASK-AUT-001` e `TASK-AUT-002`
  - revisar consistencia da task com `docs/tasks/_template.md`
- revisao manual:
  - confirmar que a recomendacao de produto para Gmail comum passou a ser OAuth por usuario
  - confirmar que Shared Drive ficou como fallback opcional para Workspace
  - confirmar que CSV continua como contrato final

## Evidencia esperada
- task criada em `docs/tasks/TASK-IMP-003-oauth-google-usuario-planilhas-importacao.md`
- roadmap atualizado com referencia a `TASK-IMP-003`
- decisao arquitetural registrada de forma explicita

## Riscos
- aumento de superficie de seguranca ao armazenar refresh tokens
- consent screen Google e revisoes de escopo podem atrasar entrega
- escolha errada de scopes pode dar privilegio demais ou quebrar UX
- ownership por usuario complica troubleshooting e suporte
- conexao Google pode ser revogada ou expirar fora do controle da app
- risco de vincular conta Google ao tenant errado se o fluxo nao respeitar `organizationId`

## Mitigacoes
- scopes minimos recomendados:
  - `https://www.googleapis.com/auth/spreadsheets`
  - `https://www.googleapis.com/auth/drive.file`
- criptografar refresh token em repouso
- auditar conectar/desconectar/usar integracao
- manter CSV/XLSX como trilha segura independente da integracao Google
- manter Service Account apenas para cenarios Workspace/Shared Drive

## Rollback/contingencia
1. Se OAuth por usuario falhar ou nao estiver configurado, o sistema continua operando com:
   - CSV simples;
   - XLSX guiado;
   - Service Account apenas onde o ambiente Workspace/Shared Drive suportar.
2. A integracao Google deve poder ser desabilitada por env/flag sem afetar o importador CSV.
3. Tokens Google ja emitidos devem poder ser revogados/desconectados sem bloquear o restante do produto.
4. Em incidente de permissao ou consentimento, o usuario deve cair para o fluxo atual de template manual + exportacao CSV.

## Blockers possiveis
- projeto Google Cloud sem OAuth 2.0 configurado
- consent screen nao publicado ou restrito demais
- ausencia de estrategia aprovada para criptografar refresh token
- falta de decisao sobre tenancy da conexao Google
- necessidade de revisao juridica/seguranca para token externo persistido

## Observacoes arquiteturais
- Service Account com pasta de Meu Drive pessoal nao e fluxo principal suportado.
- Shared Drive e opcional e voltado a ambientes Google Workspace.
- OAuth por usuario e o caminho recomendado para Gmail/Drive pessoal.
- `TASK-IMP-002` permanece valida para o fluxo de modelo nativo via Service Account, mas nao deve ser inflada para absorver OAuth.
- O importador CSV continua sendo a fonte canonica de validacao/importacao.

## Proximo passo recomendado
1. Validar a task com quem define operacao e seguranca da integracao Google.
2. Decidir tenancy do token e mecanismo de criptografia.
3. Abrir a rodada de implementacao OAuth em uma entrega separada, sem misturar com ajustes do importador CSV.

## Retorno esperado
- resumo da decisao arquitetural
- impacto esperado na implementacao futura
- riscos principais e fallback operacional
- proximo passo recomendado
