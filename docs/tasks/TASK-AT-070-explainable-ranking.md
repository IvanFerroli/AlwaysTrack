# TASK-AT-070 - Ranking explicavel

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-12
- source-of-truth: docs/tasks/TASK-AT-070-explainable-ranking.md

## Fase
- fase: A - Impacto para apresentacao
- prioridade: 2
- dependencias: TASK-AT-069 recomendada; ranking/campanhas/extratos/notas existentes.

## Objetivo unico
Transformar o ranking em uma composicao auditavel por vendedor/posicao, mostrando de onde vieram total, quantidade, ticket medio, campanhas e pendencias.

## Contexto
Ranking contestavel mata confianca. O sistema precisa responder "por que esse vendedor esta nessa posicao?" com provas: notas, periodo, campanha, status e ultima atualizacao.

## Escopo funcional
1. Detalhe por vendedor no ranking com notas que entraram no calculo.
2. Mostrar periodo, campanhas aplicadas, total aprovado, quantidade de notas/itens e ticket medio.
3. Mostrar pendencias/rejeicoes relacionadas ao vendedor no periodo.
4. Mostrar origem/ultima atualizacao do snapshot quando aplicavel.
5. Link para extrato/notas filtradas e timeline da nota quando existir.

## Arquivos candidatos
- `apps/web/src/views/ranking.tsx`
- `apps/web/src/views/statements.tsx`
- `apps/api/src/**/ranking*`
- `apps/api/src/**/sales*`
- `packages/shared/src/**`
- `prisma/schema.prisma` se faltar persistencia de composicao/snapshot

## Plano de execucao
1. Auditar contrato atual de ranking e snapshots.
2. Criar endpoint de explicacao por vendedor/campanha/periodo.
3. Reusar dados aprovados e filtros atuais sem duplicar regra de calculo.
4. Adicionar drawer/painel de "Composicao do ranking".
5. Adicionar links para notas e extratos filtrados.
6. Cobrir calculo com teste de servico/API.

## Acceptance Criteria
1. Cada linha do ranking permite abrir composicao auditavel.
2. A soma das notas exibidas bate com o total do ranking.
3. Periodo/campanha/filtros exibidos sao os mesmos usados no calculo.
4. Pendencias/rejeicoes aparecem separadas de valores aprovados.
5. Testes provam pelo menos um ranking com multiplos vendedores e campanha.

## Impacto na apresentacao
Permite responder contestacoes ao vivo e vende governanca comercial.

## Riscos
- Duplicar regra de ranking no endpoint de explicacao e gerar divergencia.
- Tentar resolver historico complexo demais antes da demo.

