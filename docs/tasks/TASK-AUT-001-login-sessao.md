# TASK-AUT-001 - Login e sessao

## Metadata
- status: completed
- owner: runtime-builder
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-AUT-001-login-sessao.md

## Modo
- mode: implementation

## Agentes sugeridos
- runtime builder
- security reviewer
- `olympus_task_verifier`

## Objetivo unico
Implementar login para usuarios superiores com senha hash e sessao segura.

## Inputs
- documento central, secao 6.1

## Dependencias
- satisfeitas: `TASK-DAT-001`, `TASK-AUD-001`
- em aberto: estrategia de cookie/JWT local

## Alvos explicitos
1. `core/auth`
2. rotas de login/logout/me
3. tela de login

## Fora de escopo
- login de profissional
- SSO

## Acceptance Criteria
1. Usuario ativo consegue autenticar.
2. Usuario inativo nao consegue autenticar.
3. Senha nunca e salva em texto puro.
4. Login relevante gera auditoria.

## Validacao
- testes de auth service/handlers
- teste manual de login/logout

## Riscos
- sessao insegura
- misturar Professional com User

## Evidencia de execucao
- Implementado login com senha hash `scrypt` em `services/api/src/core/auth`.
- Implementadas rotas `POST /v1/auth/login`, `POST /v1/auth/logout` e `GET /v1/auth/me`.
- Sessao usa cookie HTTP-only assinado por HMAC.
- Usuario inativo e senha invalida sao rejeitados.
- Login registra `AuditLog`.
- Implementada tela de login em `apps/web/src/main.tsx`.
- Seed demo: `admin@example.com` / `admin123`.
- Validacao executada: `npm run check`, `npm run build --workspace @sylembra/web`, smoke de login via `curl`.
