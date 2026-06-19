# TASK-AT-160 - Ranking e extratos escopados para vendedor beta

## Metadata
- status: completed-mvp
- owner: olympus_orchestrator
- last-updated: 2026-06-19
- source-of-truth: docs/tasks/TASK-AT-160-beta-seller-ranking-statements-scope.md

## Modo
- mode: implementation

## Objetivo unico
Adaptar endpoints e UI para que VENDEDOR veja apenas seu proprio desempenho comercial e agregados nao identificaveis.

## Contexto minimo
Foi decidido que VENDEDOR nao ve ranking detalhado dos demais, faturamento individual de terceiros ou dados comerciais identificaveis. Pode ver propria posicao, propria pontuacao, evolucao e medias agregadas quando fizer sentido.

## Inputs
- `TASK-AT-154`
- `TASK-AT-156`

## Dependencias
- satisfeitas: matriz e backend hardening.
- em aberto: decisao final de quais agregados anonimos ja existem ou serao exibidos no MVP.

## Alvos explicitos
1. `services/api/src/core/sales-documents`
2. `apps/web/src/views/ranking.tsx`
3. `apps/web/src/views/statements.tsx`
4. `apps/web/src/views/notes.tsx`

## Fora de escopo
- Criar ranking publico competitivo novo.
- Criar analytics avancado.

## Checklist
1. Auditar resposta atual de ranking para role VENDEDOR.
2. Criar modo de resposta propria/anonimizada se necessario.
3. Garantir extratos apenas do vendedor logado.
4. Garantir notas apenas do vendedor logado.
5. UI de vendedor nao mostra tabela detalhada dos demais.
6. Testar vendedor A vs vendedor B.

## Acceptance Criteria
1. VENDEDOR ve propria posicao/desempenho.
2. VENDEDOR nao ve nomes, valores ou notas de outros vendedores.
3. VENDEDOR nao aprova/rejeita notas.
4. Extrato de VENDEDOR e sempre escopado ao proprio `SellerProfile`.

## Definition of Done
1. Endpoints comerciais escopados.
2. UI de vendedor coerente.
3. Testes negativos cobrindo terceiros.

## Validacao
- comandos/checks: testes API de ranking/extratos/documentos, typecheck web.
- revisao manual: logar com dois vendedores.

## Evidencia esperada
- Payload exemplo de vendedor sem terceiros.
- Checklist de UI vendedor.

## Riscos
- Ranking agregado ainda permitir inferencia de faturamento individual.
- Filtros manuais sobrescreverem escopo do usuario logado.

## Blockers possiveis
- Falta de dados controlados com dois vendedores.

## Retorno esperado
- resumo curto do escopo vendedor
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
