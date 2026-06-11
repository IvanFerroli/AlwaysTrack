# EXEC-AT-062 - Organization settings for internal product

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-11
- task: TASK-AT-063-organization-settings-internal-product.md

## Objetivo
Entregar configuracoes administrativas da organizacao para centralizar ajustes seguros do produto interno.

## Entregas
1. Adicionados `logoUrl` e `settingsJson` em `Organization`, com migration dedicada.
2. Criados endpoints admin `GET/PATCH /v1/organization/settings`.
3. Separados campos editaveis de configuracoes de ambiente: dominios Google aparecem somente leitura a partir de `GOOGLE_LOGIN_ALLOWED_DOMAINS`.
4. Criada tela `Configuracoes` para ADMIN com nome, documento, logo URL, tags padrao e defaults do dashboard.
5. Shell admin passa a refletir nome/logo salvos sem rebuild.
6. Alteracoes geram auditoria `organization.settings_update`.
7. Testes cobrem parsing, leitura readonly dos dominios Google e auditoria da atualizacao.

## Decisoes
- Logo fica como URL segura (`/caminho` ou `http(s)`) nesta etapa; upload/storage de imagem fica fora de escopo.
- Dominios Google permanecem em env para reduzir risco de lockout administrativo.
- Defaults operacionais sao persistidos em JSON controlado enquanto o produto ainda tem poucos campos configuraveis.

## Validacao
- `npm run prisma:generate`
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run test --workspace @alwaystrack/api -- organizations.service.test.ts audit.service.test.ts`

## Riscos residuais
- As tags padrao ficam gerenciaveis no admin, mas Wiki/FAQ ainda tem fallback local; consumo transversal pode ser uma rodada futura se o usuario quiser que esses defaults sejam carregados em todas as views.
- Upload de arquivo de logo ainda depende de uma task futura de storage publico.
