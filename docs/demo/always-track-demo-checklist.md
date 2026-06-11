# AlwaysTrack Demo Checklist

## Objetivo
Demonstrar o AlwaysTrack como ferramenta interna para acompanhar DANFEs, vendas aprovadas, ranking, extratos e conhecimento operacional.

## Preparacao
1. Rodar `npm run prisma:seed` em base limpa.
2. Entrar como `admin@example.com` usando a senha exibida no seed.
3. Confirmar que a organizacao carregou como `AlwaysTrack Local`.
4. Conferir que existem vendedores demo, campanha demo atual, notas aprovadas, nota pendente, Wiki, FAQ e notificacoes.

## Roteiro sugerido
1. Dashboard
   - Mostrar cards de notas, pendencias, vendedores ativos e vendas aprovadas.
   - Ajustar periodo e exportar CSV do dashboard.
   - Abrir a fila de notas pendentes pela central de acoes.

2. Notas
   - Mostrar nota pendente criada pelo seed.
   - Filtrar por status e vendedor.
   - Explicar aprovacao/rejeicao/revisao com comentario.

3. Ranking
   - Mostrar tres vendedores com totais diferentes.
   - Filtrar por campanha demo atual, grupo ou vendedor.
   - Exportar CSV do ranking.

4. Campanhas
   - Mostrar campanha demo atual.
   - Mostrar snapshot de ranking ja congelado.
   - Explicar que novos snapshots comparam posicoes.

5. Extratos
   - Mostrar consolidado por vendedor e por grupo.
   - Exportar CSV com metadados de filtros.

6. Wiki e FAQ
   - Abrir `Primeiros passos`.
   - Abrir FAQ resolvida sobre conferencia de DANFE.
   - Abrir a Wiki promovida a partir do FAQ.

7. Notificacoes
   - Abrir o sino no topo.
   - Mostrar notificacoes demo de nota pendente, FAQ promovida e snapshot.

8. Auditoria
   - Filtrar por `Notas comerciais`, `Ranking`, `FAQ` ou `Seed/demo`.
   - Filtrar por usuario executor.
   - Mostrar metadados redigidos quando houver chave sensivel.

## Contas do seed
- `admin@example.com`: administracao, auditoria, usuarios e configuracoes.
- `supervisor@example.com`: campanhas, ranking e FAQ.
- `vendedor@example.com`, `vendedor2@example.com`, `vendedor3@example.com`: visao de vendedor.
- `sac@example.com`: revisao de notas e suporte operacional.
- `financeiro@example.com`: revisao e extratos.

## Pontos de atencao
- O seed usa dados ficticios e provider fake.
- A task de polimento visual guiado por prints continua bloqueada ate receber imagens de referencia.
- Exports CSV incluem metadados antes do cabecalho tabular.
