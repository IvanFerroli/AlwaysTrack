# SPEC-AT-001 - AlwaysTrack Product Baseline

## Metadata
- status: accepted
- owner: product-builder
- last-updated: 2026-05-29
- source-of-truth: docs/specs/SPEC-AT-001-product-baseline.md

## Objetivo
Definir o baseline ativo do AlwaysTrack: uma ferramenta comercial para empresa de suplementos, usada por vendedores, SAC, financeiro, supervisores, gestores e admin.

## Produto
AlwaysTrack recebe DANFEs/notas fiscais enviadas por vendedores, extrai dados comerciais, atrela vendas ao perfil correto, alimenta rankings/campanhas e gera extratos por vendedor, grupo ou visao geral.

## Usuario-alvo inicial
- Vendedor: envia notas e acompanha seu desempenho.
- Supervisor: acompanha grupos/equipes e campanhas.
- SAC: acompanha fila operacional e ajuda em inconsistencias.
- Financeiro: revisa notas, extratos e valores aprovados.
- Gestor/Admin: configura usuarios, times, campanhas, ranking, wiki e auditoria.

## Fluxo principal
1. Usuario entra, inicialmente por seed local e depois por Google.
2. Vendedor envia DANFE/PDF autenticado.
3. Sistema salva nota, extrai dados e coloca em fila de revisao.
4. SAC/financeiro/admin aprova, rejeita, duplica ou reatribui a nota.
5. Notas aprovadas alimentam ranking, campanhas, dashboard e extratos.
6. Wiki registra procedimentos transversais da operacao.

## Reaproveitar do legado
- Layout, componentes operacionais, auth/session, auditoria, upload/storage, dashboard estrutural, relatorios/export e provider de IA documental.

## Legado a esconder/remover
- Profissionais, licencas, RT, COREN, vencimento, regularizacao e compliance de licencas.

## Vocabulario canonico
- `DANFE` / `nota`: documento enviado pelo vendedor.
- `vendedor`: perfil comercial que gera vendas.
- `grupo/time`: conjunto de vendedores sob supervisor.
- `campanha`: regra temporal usada para ranking.
- `extrato`: consulta/export de vendas aprovadas.

## Criterios de aceite
- UI ativa nao apresenta licencas/RT/compliance como produto principal.
- Schema possui dominio comercial de vendedores, grupos, notas, itens, campanhas e ranking.
- Seed local cria usuarios comerciais e dados comerciais demonstraveis.
- Validacao minima `npm run check` passa.
