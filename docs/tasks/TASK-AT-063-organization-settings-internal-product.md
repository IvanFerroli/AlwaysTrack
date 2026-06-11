# TASK-AT-063 - Organization settings for internal product

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-11
- source-of-truth: docs/tasks/TASK-AT-063-organization-settings-internal-product.md

## Modo
- mode: admin-settings

## Objetivo unico
Criar configuracoes administrativas da organizacao para centralizar nome, logo, dominio permitido, tags padrao e defaults operacionais.

## Contexto minimo
Como ferramenta interna, algumas configuracoes nao devem depender de alteracao manual em codigo/env para cada ajuste visual/operacional simples.

## Inputs
- Campos que podem ser configurados via UI versus apenas env.
- Logo/brand oficial.
- Dominio(s) permitidos para login Google.

## Dependencias
- satisfeitas: organizacoes existem no banco.
- em aberto: restricao Google por dominio pode depender da `TASK-AT-057`.

## Alvos explicitos
1. Criar tela/area Configuracoes da organizacao para ADMIN.
2. Permitir editar nome exibido e logo quando seguro.
3. Exibir dominios Google permitidos e orientar quando vierem de env.
4. Permitir gerenciar tags padrao se `TASK-AT-061` estiver entregue.
5. Definir defaults de range do dashboard quando fizer sentido.
6. Auditar alteracoes.

## Fora de escopo
- Multi-tenant self-service completo.
- Billing/planos.
- Alterar secrets OAuth pela UI.

## Checklist
1. Definir contrato de configuracao.
2. Separar dados editaveis de env/secrets.
3. Criar UI admin simples.
4. Adicionar auditoria e testes.

## Acceptance Criteria
1. ADMIN consegue ver/editar configuracoes permitidas.
2. Secrets nunca aparecem na UI.
3. Alteracoes geram auditoria.
4. Configuracoes impactam UI sem rebuild quando aplicavel.

## Definition of Done
1. Configuracoes basicas entregues.
2. Limites entre env e UI documentados.
3. `npm run test:all` passa.

## Validacao
- comandos/checks: `npm run test --workspace @alwaystrack/api -- organizations.service.test.ts audit.service.test.ts`, `npm run typecheck --workspace @alwaystrack/web`, `npm run test:all`
- revisao manual: editar nome/logo/default permitido.

## Evidencia esperada
- Print da tela admin.
- Evento de auditoria da alteracao.

## Riscos
- Permitir alterar dominio pela UI pode criar lockout se nao houver fallback.
- Upload de logo exige validacao de arquivo.

## Blockers possiveis
- Storage definitivo para logo.

## Retorno esperado
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
