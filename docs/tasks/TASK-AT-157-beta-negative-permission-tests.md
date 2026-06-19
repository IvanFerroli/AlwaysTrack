# TASK-AT-157 - Testes negativos de permissao do beta

## Metadata
- status: completed-mvp
- owner: olympus_orchestrator
- last-updated: 2026-06-19
- source-of-truth: docs/tasks/TASK-AT-157-beta-negative-permission-tests.md

## Modo
- mode: verification

## Objetivo unico
Criar regressao automatizada que prove que SAC nao acessa comercial/admin e VENDEDOR nao acessa dados de terceiros.

## Contexto minimo
O beta depende de confianca em permissoes. Sem teste negativo, um ajuste futuro pode reabrir vazamento sem ser percebido.

## Inputs
- `TASK-AT-154`
- `TASK-AT-156`

## Dependencias
- satisfeitas: matriz e backend hardening.
- em aberto: endpoints finais ajustados.

## Alvos explicitos
1. `services/api/src/**/*.test.ts`
2. `tests/e2e`
3. `docs/security/commercial-permission-matrix.md`

## Fora de escopo
- Polimento visual.
- Criar dados reais de beta.

## Checklist
1. Testar SAC contra notas, ranking, extratos, campanhas, usuarios, config, auditoria.
2. Testar VENDEDOR contra documento de outro vendedor.
3. Testar VENDEDOR contra extrato/ranking detalhado de terceiros.
4. Testar SUPERVISOR sem revisao de nota.
5. Testar FINANCEIRO sem campanha.
6. Testar ADMIN com acesso preservado em pelo menos um fluxo critico.

## Acceptance Criteria
1. Testes falham se SAC acessar dominio comercial/admin.
2. Testes falham se vendedor acessar dados identificaveis de terceiros.
3. Testes rodam no conjunto de regressao API.

## Definition of Done
1. Testes negativos versionados.
2. Comandos documentados.
3. Matriz e testes alinhados.

## Validacao
- comandos/checks: `npm run test --workspace @alwaystrack/api -- <testes-do-beta>`, `npm run test:e2e:api` se aplicavel.
- revisao manual: n/a.

## Evidencia esperada
- Saida de testes passando.
- Lista de casos negativos cobertos.

## Riscos
- Teste permissivo demais por mocks mal configurados.
- Escopo de vendedor falso positivo sem dados de dois vendedores.

## Blockers possiveis
- Seeds/fixtures insuficientes para dois vendedores.

## Retorno esperado
- resumo curto dos testes
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
