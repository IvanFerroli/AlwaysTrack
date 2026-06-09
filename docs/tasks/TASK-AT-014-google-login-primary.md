# TASK-AT-014 - Google login primary

## Metadata
- status: completed
- owner: product-builder
- last-updated: 2026-06-04
- source-of-truth: docs/tasks/TASK-AT-014-google-login-primary.md
- execution-target: EXEC-AT-020

## Modo
- mode: implementation

## Objetivo unico
Tornar login Google a entrada principal do AlwaysTrack sem quebrar a sessao atual, roles comerciais ou smoke local.

## Contexto minimo
O produto comercial deve entrar por Google, mas a verificacao de codigo encontrou login atual por email/senha em `/v1/auth/login` e OAuth Google existente em `/v1/integrations/google/*` ligado a importacao/Google Sheets. Esse OAuth legado/import-related nao deve ser tratado como login ja implementado sem auditoria do ciclo.

## Inputs
- `services/api/src/core/auth/*`
- `services/api/src/core/integrations/google/*`
- `services/api/src/app.ts`
- `apps/web/src/main.tsx`
- `docs/tasks/ROADMAP.md`

## Dependencias
- satisfeitas: auth/session atual, usuarios comerciais seedados, roles comerciais em runtime.
- em aberto: credenciais Google reais para smoke manual em ambiente externo.

## Entregue
- Fluxo primario separado em `/v1/auth/google/start`, `/v1/auth/google/callback` e `/v1/auth/google/status`.
- Login Google usa OAuth `openid email profile`, PKCE, state assinado em cookie httpOnly e perfil Google via `userinfo`.
- Usuario so entra se o e-mail Google estiver verificado e corresponder a usuario ativo existente; nao ha signup aberto nem criacao automatica de organizacao.
- UI de login coloca Google como acao principal e mantem email/senha como fallback operacional.
- OAuth de Sheets/importacao segue separado em `/v1/integrations/google/*`.
- `GOOGLE_LOGIN_ALLOWED_DOMAINS` permite restringir dominios quando houver decisao operacional.

## Alvos explicitos
1. Endpoint de inicio/callback para login Google primario, separado ou claramente diferenciado do OAuth de Sheets/importacao.
2. UI de login com Google como acao principal e email/senha como fallback operacional quando permitido.
3. Associacao por e-mail verificado a usuario comercial existente; sem cadastro aberto e sem auto-criar organizacao.
4. Testes de service/handler com provider Google fake, sem chamada externa real.
5. Smoke local preservando login deterministico sem depender de Google real.

## Fora de escopo
- Reimplementar Google Sheets/importacao.
- Remover email/senha do backend.
- Criar signup publico, onboarding de organizacao ou convite de usuarios.
- Alterar roles comerciais, seed amplo ou schema fora do minimo exigido.
- Fazer chamada real a Google em teste automatizado.

## Checklist
1. Auditar o OAuth Google existente e confirmar quais trechos sao apenas importacao/Sheets.
2. Definir contrato pequeno para login Google: `sub`, e-mail verificado, nome opcional e foto opcional.
3. Implementar fluxo de login que cria a mesma sessao usada por `/v1/auth/me`.
4. Bloquear login quando o e-mail Google nao corresponde a usuario ativo da organizacao.
5. Atualizar tela de login para colocar Google como entrada principal e fallback discreto.
6. Cobrir sucesso, e-mail nao cadastrado, e-mail nao verificado, state invalido e preservacao de cookie.
7. Registrar evidencias em `EXEC-AT-020`.

## Acceptance Criteria
1. Usuario comercial existente consegue entrar com Google e recebe a mesma resposta/escopo de `/v1/auth/me`.
2. Usuario Google sem e-mail cadastrado nao ganha acesso nem cria organizacao automaticamente.
3. OAuth de Sheets/importacao continua funcionando ou fica explicitamente separado por rota/nome/teste.
4. O smoke local continua executavel sem provider externo real.
5. Logs, erros e testes nao imprimem token, code, refresh token ou segredo Google.

## Definition of Done
1. Manifest de execucao `EXEC-AT-020` registra arquivos alterados, validacao e riscos.
2. Testes automatizados cobrem o contrato de login Google com fetch/provider fake.
3. UI deixa claro que Google e a entrada principal do produto comercial.
4. Fallback email/senha permanece intencional e documentado se continuar visivel.

## Validacao
- comandos/checks: `npm run test --workspace @alwaystrack/api -- auth`, `npm run smoke:beta-local`, `npm run typecheck --workspace @alwaystrack/web`
- revisao manual: abrir tela de login; conferir acao primaria Google; confirmar que OAuth de importacao/Sheets nao foi reaproveitado sem separacao.

## Evidencia esperada
- Teste unitario/handler demonstrando criacao de sessao via Google fake.
- Registro de tentativa negada para e-mail desconhecido ou nao verificado.
- Saida do smoke local passando sem credenciais Google reais.
- `EXEC-AT-020` com resumo curto e riscos residuais.

## Riscos
- Misturar login primario com OAuth de Sheets pode revogar conexoes de importacao ou ampliar escopo indevidamente.
- Auto-provisionamento indevido pode abrir acesso fora da organizacao.
- Callback mal validado pode quebrar sessao ou expor tokens em logs.

## Blockers possiveis
- Falta de decisao sobre dominios/e-mails permitidos em producao.
- Ausencia de client OAuth real para smoke manual de ponta a ponta.
- Conflito entre rotas/cookies existentes e novo callback.

## Retorno esperado
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
