# TASK-AT-163 - Seeds e usuarios controlados do beta

## Metadata
- status: proposed
- owner: olympus_orchestrator
- last-updated: 2026-06-19
- source-of-truth: docs/tasks/TASK-AT-163-beta-controlled-seeds-users.md

## Modo
- mode: implementation

## Objetivo unico
Criar ou ajustar seed local para usuarios e dados controlados do Beta SAC e Beta Vendedor.

## Contexto minimo
O beta tera participantes externos controlados, emails autorizados e usuarios do proprietario para validar roles. Um unico banco sera usado; separacao ocorre por role, escopo e dados.

## Inputs
- Lista nominal de emails do beta.
- Roles desejadas.
- Dados comerciais minimos para vendedor confiavel.

## Dependencias
- satisfeitas: decisoes de produto.
- em aberto: emails reais podem ser preenchidos depois via env.

## Alvos explicitos
1. `services/api/prisma/seed.ts`
2. scripts de reset/demo local
3. `.env.example`
4. docs/runbook beta

## Fora de escopo
- Importar massa real grande.
- Criar banco separado.
- Automatizar convite por email.

## Checklist
1. Definir usuarios beta controlados por env ou seed clara.
2. Incluir SAC beta.
3. Incluir VENDEDOR beta com `SellerProfile`.
4. Incluir usuarios do proprietario para roles relevantes.
5. Criar dados comerciais minimos e escopados.
6. Evitar legado SyLembra.

## Acceptance Criteria
1. Seed local cria usuarios suficientes para validar SAC e VENDEDOR.
2. Vendedor beta tem dados proprios e nao dados de terceiros indevidos.
3. Admin local consegue gerenciar usuarios.
4. Allowlist pode ser preenchida com os emails seedados.

## Definition of Done
1. Seed documentada.
2. Reset local preserva experiencia beta.
3. Senhas/segredos nao sao commitados.

## Validacao
- comandos/checks: `npm run prisma:seed`, testes de migrations se schema mudar.
- revisao manual: login por usuarios beta.

## Evidencia esperada
- Lista de usuarios gerados sem senhas reais.
- Checklist de login por role.

## Riscos
- Misturar dado real com demo sem sinalizacao.
- Seed apagar dados locais inesperados.

## Blockers possiveis
- Emails reais ainda nao definidos.

## Retorno esperado
- resumo curto dos seeds
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
