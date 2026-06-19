# TASK-AT-161 - Allowlist nominal beta-local por email

## Metadata
- status: completed-mvp
- owner: olympus_orchestrator
- last-updated: 2026-06-19
- source-of-truth: docs/tasks/TASK-AT-161-beta-email-allowlist.md

## Modo
- mode: implementation

## Objetivo unico
Implementar allowlist por email para entrada no beta-local, compativel com login tradicional e Google Login.

## Contexto minimo
Allowlist define quem entra; role define o que pode fazer. O beta sera local via Tailscale, mas ainda precisa impedir login de emails fora da lista nominal.

## Inputs
- Decisao congelada: allowlist baseada em email.
- Sugestao de env: `APP_MODE=beta-local` e `BETA_ALLOWED_EMAILS`.

## Dependencias
- satisfeitas: decisoes de produto.
- em aberto: confirmar nomes finais de env durante execucao, se necessario.

## Alvos explicitos
1. `services/api/src/config/env.ts`
2. `services/api/src/core/auth`
3. `.env.example`
4. `scripts/check-env.js`

## Fora de escopo
- Criar painel admin para allowlist.
- Enviar convites por email.

## Checklist
1. Adicionar env de modo beta-local.
2. Adicionar env de emails permitidos.
3. Bloquear login tradicional fora da allowlist quando beta ativo.
4. Bloquear Google Login fora da allowlist quando beta ativo.
5. Registrar erro seguro sem indicar lista completa.
6. Documentar formato da env.

## Acceptance Criteria
1. `APP_MODE=beta-local` ativa allowlist.
2. Email fora de `BETA_ALLOWED_EMAILS` nao autentica.
3. Email permitido autentica conforme senha/Google e depois respeita role.
4. Fora do beta-local, comportamento normal e preservado.

## Definition of Done
1. Allowlist implementada nos dois caminhos de login.
2. Testes de permitido/negado.
3. Env documentada.

## Validacao
- comandos/checks: testes auth, `npm run env:check`.
- revisao manual: login com email permitido e nao permitido.

## Evidencia esperada
- Testes de login tradicional e Google path/mocks.
- Exemplo de `.env.example`.

## Riscos
- Lockout acidental do admin local.
- Mensagem de erro revelar demais.

## Blockers possiveis
- n/a.

## Retorno esperado
- resumo curto da allowlist
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
