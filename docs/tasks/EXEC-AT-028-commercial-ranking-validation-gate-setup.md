# EXEC-AT-028 - Commercial ranking validation gate setup

## Metadata
- task-id: AT-046
- execution-id: EXEC-AT-028
- mode: runtime
- execution-mode: orchestrator
- specialist: codex
- status: completed-partial
- date: 2026-06-08

## Sequencia operacional aplicada
1. Revisado o gate de ranking e identificado bloqueio operacional: ADMIN nao tinha como subir DANFE escolhendo vendedor.
2. Criado endpoint leve `GET /v1/sales/sellers` com o mesmo escopo comercial de vendedores ja usado em notas/ranking.
3. Atualizada a tela Notas para carregar vendedores ativos e permitir upload administrativo com select de vendedor.
4. Seed local passou a garantir tres vendedores comerciais: `VD-001`, `VD-002` e `VD-003`.
5. Seed tornou-se resiliente a bases ja limpas/manuais que tenham `SellerProfile` existente por `userId` com outro codigo.
6. Seed local foi executado e confirmou tres vendedores ativos na base local.

## Artefatos materiais
1. `services/api/src/core/sales-documents/sales-documents.service.ts`
2. `services/api/src/core/sales-documents/sales-documents.handlers.ts`
3. `services/api/src/app.ts`
4. `services/api/src/core/sales-documents/sales-documents.service.test.ts`
5. `services/api/prisma/seed.ts`
6. `apps/web/src/main.tsx`
7. `docs/tasks/EXEC-AT-028-commercial-ranking-validation-gate-setup.md`

## Evidencias observaveis
1. ADMIN/GESTOR/SAC/FINANCEIRO ve formulario de upload em Notas com select de vendedor.
2. `GET /v1/sales/sellers` retorna vendedores ativos dentro do escopo do usuario.
3. Seed local criou/garantiu:
   - `VD-001` - Vendedor Demo
   - `VD-002` - Vendedor Demo 2
   - `VD-003` - Vendedor Demo 3

## Validacao
1. `npm run prisma:seed` - passou.
2. Consulta local Prisma confirmou tres `SellerProfile` ativos.
3. `npm run test --workspace @alwaystrack/api -- sales-documents.service.test.ts` - passou, 19 testes.
4. `npm run typecheck --workspace @alwaystrack/api` - passou.
5. `npm run typecheck --workspace @alwaystrack/web` - passou.
6. `npm run build --workspace @alwaystrack/web` - passou.

## Riscos e ressalvas
1. Esta execucao prepara o gate; ela ainda nao declara ranking validado.
2. A validacao final ainda precisa subir DANFEs para vendedores distintos, aprovar/rejeitar e comparar totais/posicoes.
3. Se a duplicata falsa reaparecer no pacote real, a validacao do ranking deve voltar para `TASK-AT-038`.

## Nota para proximo ciclo
Usar o formulario ADMIN de Notas para subir DANFEs em `VD-001`, `VD-002` e `VD-003`, aprovar algumas, rejeitar ao menos uma, e entao comparar o Ranking com os totais esperados.
