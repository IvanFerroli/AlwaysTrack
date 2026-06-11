# TASK-AT-057 - Google login restricted by company domain

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-06-11
- source-of-truth: docs/tasks/TASK-AT-057-google-domain-restricted-login.md

## Modo
- mode: auth-security

## Objetivo unico
Permitir Google login apenas para dominios corporativos autorizados, mantendo login local como fallback administrativo.

## Contexto minimo
O AlwaysTrack e uma ferramenta interna. Google login so faz sentido se o acesso puder ser restrito ao dominio da empresa. Sem essa restricao, qualquer conta Google cadastrada/acidental pode virar vetor de acesso indevido dependendo do fluxo de criacao de usuario.

## Inputs
- Dominio(s) corporativo(s) aceitos, por exemplo `alwaysfit.com.br`.
- Decisao operacional: empresa usa Google Workspace ou apenas contas Google comuns.
- Acesso ao Google Cloud Console/OAuth app, se a configuracao for feita fora do codigo.

## Dependencias
- satisfeitas: Google login ja existe como entrada principal.
- em aberto: confirmar dominio(s) reais e se ha Google Workspace.

## Alvos explicitos
1. Adicionar env `GOOGLE_LOGIN_ALLOWED_DOMAINS`, aceitando lista separada por virgula.
2. Validar o email retornado pelo Google antes de criar/usar sessao.
3. Bloquear login Google fora do dominio permitido com mensagem clara.
4. Manter login email/senha para admin e fallback operacional.
5. Documentar configuracao em docs de onboarding/env.
6. Adicionar testes para dominio aceito, dominio negado e config vazia.

## Guia operacional para configurar fora do codigo
1. No Google Cloud Console, abrir o projeto OAuth usado pelo AlwaysTrack.
2. Em OAuth consent screen:
   - se a empresa usa Google Workspace, preferir app tipo `Internal`;
   - se nao usa Workspace, manter `External`, mas depender da validacao por dominio no AlwaysTrack.
3. Confirmar os redirect URIs:
   - local: `http://localhost:<porta-api>/v1/auth/google/callback` ou rota atual do projeto;
   - producao/stage: URL publica equivalente.
4. Definir no ambiente do AlwaysTrack:
   - `GOOGLE_LOGIN_CLIENT_ID=<client-id>`;
   - `GOOGLE_LOGIN_CLIENT_SECRET=<client-secret>`;
   - `GOOGLE_LOGIN_REDIRECT_URI=<callback-url>`;
   - `GOOGLE_LOGIN_ALLOWED_DOMAINS=alwaysfit.com.br`.
5. Reiniciar API e validar:
   - conta `@alwaysfit.com.br` entra;
   - conta Gmail/pessoal recebe acesso negado;
   - admin local ainda consegue entrar por senha.

## Fora de escopo
- Migrar usuarios existentes automaticamente entre dominios.
- Implementar SSO SAML/SCIM.
- Remover login por senha.

## Checklist
1. Ler fluxo atual de Google login.
2. Implementar parser de dominios permitidos.
3. Aplicar validacao no callback/token exchange.
4. Padronizar erro de acesso negado.
5. Atualizar env check/docs.
6. Cobrir com testes unitarios/regressao.

## Acceptance Criteria
1. Google login com email fora dos dominios configurados e rejeitado.
2. Google login com email dentro do dominio configurado funciona para usuario permitido.
3. Config vazia nao abre acesso involuntariamente: comportamento deve ser documentado e seguro.
4. Login local admin continua funcionando.

## Definition of Done
1. Codigo, docs e testes entregues.
2. Variaveis necessarias documentadas em um bloco copiavel.
3. `npm run test:all` passa.

## Validacao
- comandos/checks: `npm run test --workspace @alwaystrack/api -- google-login.service.test.ts auth.service.test.ts`, `npm run env:check`, `npm run test:all`
- revisao manual: login com conta permitida e conta bloqueada.

## Evidencia esperada
- Print ou log controlado do acesso negado por dominio.
- Trecho de docs com `GOOGLE_LOGIN_ALLOWED_DOMAINS`.

## Riscos
- Config errada pode bloquear todos os usuarios Google.
- Se o app OAuth continuar `External`, a seguranca real depende da validacao da API.

## Blockers possiveis
- Falta de acesso ao Google Cloud Console.
- Empresa nao usar Google Workspace.

## Retorno esperado
- resumo curto do que mudou
- variaveis/configuracoes que o usuario precisa preencher
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Execucao 2026-06-11
- Google login agora exige `GOOGLE_LOGIN_ALLOWED_DOMAINS` para iniciar OAuth e para aceitar callback.
- `GET /v1/auth/google/status` so retorna `configured=true` quando client/secret/redirect e dominio permitido estao configurados.
- Callback Google rejeita email verificado fora dos dominios permitidos e tambem rejeita config vazia.
- Comparacao de dominio normaliza caixa/espacos.
- `scripts/check-env.js` falha quando Google OAuth esta parcialmente configurado sem `GOOGLE_LOGIN_ALLOWED_DOMAINS`.
- Runbooks local/producao documentam que dominio permitido e obrigatorio para habilitar Google login.

## Configuracao necessaria para o usuario
```env
GOOGLE_LOGIN_CLIENT_ID=<client-id-do-oauth>
GOOGLE_LOGIN_CLIENT_SECRET=<client-secret-do-oauth>
GOOGLE_LOGIN_REDIRECT_URI=https://sua-api.example.com/v1/auth/google/callback
GOOGLE_LOGIN_ALLOWED_DOMAINS=alwaysfit.com.br
```

No Google Cloud Console, cadastrar exatamente o valor de `GOOGLE_LOGIN_REDIRECT_URI` em Authorized redirect URIs. Se a empresa usa Google Workspace, preferir OAuth consent screen do tipo Internal; se nao usa, manter External e confiar na validacao de dominio da API.

## Validacao executada
- `npm run test --workspace @alwaystrack/api -- auth.service.test.ts google-login.service.test.ts users.service.test.ts`
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run env:check`
- `GOOGLE_LOGIN_CLIENT_ID=id GOOGLE_LOGIN_CLIENT_SECRET=secret GOOGLE_LOGIN_REDIRECT_URI=https://api.example.com/v1/auth/google/callback GOOGLE_LOGIN_ALLOWED_DOMAINS=alwaysfit.com.br npm run env:check`
- `GOOGLE_LOGIN_CLIENT_ID=id GOOGLE_LOGIN_CLIENT_SECRET=secret GOOGLE_LOGIN_REDIRECT_URI=https://api.example.com/v1/auth/google/callback npm run env:check` falhou como esperado exigindo `GOOGLE_LOGIN_ALLOWED_DOMAINS`.
