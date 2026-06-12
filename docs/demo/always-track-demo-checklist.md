# AlwaysTrack Demo Checklist

## Objetivo
Demonstrar o AlwaysTrack como ferramenta interna para acompanhar DANFEs, vendas aprovadas, ranking, extratos e conhecimento operacional.

## Preparacao
1. Rodar `npm run demo:reset:local` em base local/demo.
2. Entrar como `admin@example.com` usando a senha exibida no seed.
3. Confirmar que a organizacao carregou como `AlwaysTrack Local`.
4. Conferir que existem vendedores demo, campanha demo atual, notas aprovadas, nota pendente, Wiki, FAQ e notificacoes.
5. Para exibir o guia visual no app, subir o web com `VITE_DEMO_MODE=true`.

## Roteiro sugerido
1. Dashboard
   - Abrir pela Central Operacional Hoje.
   - Mostrar notas pendentes, aprovadas do dia, duplicidades, ranking parcial, FAQ sem resposta e notificacoes.
   - Clicar em um card real para provar que nao e decorativo.

2. Notas
   - Mostrar nota pendente criada pelo seed.
   - Filtrar por status e vendedor.
   - Abrir `Timeline` para mostrar envio, extracao, auditoria e decisao.
   - Explicar aprovacao/rejeicao/revisao com comentario.

3. Ranking
   - Mostrar tres vendedores com totais diferentes.
   - Filtrar por campanha demo atual, grupo ou vendedor.
   - Clicar em `Explicar` para provar composicao por nota, pendencias e ticket medio.
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
   - Explicar que a task de Avisos vai reutilizar o mesmo centro para comunicados internos.

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

## Roteiro de 7 minutos
1. 45s: abrir Central Operacional Hoje e resumir o estado da operacao.
2. 90s: abrir nota pendente, timeline, comentario e decisao.
3. 90s: abrir Ranking, explicar a posicao de um vendedor e mostrar prova por nota.
4. 60s: abrir Extratos e CSV para mostrar lastro financeiro.
5. 90s: abrir FAQ resolvida, Wiki promovida e notificacao.
6. 45s: abrir Auditoria/Configuracoes para mostrar governanca e permissoes.
7. 30s: fechar com a tese: venda com nota vira ranking confiavel; duvida vira conhecimento governado.

## Pontos de atencao
- O seed usa dados ficticios e provider fake.
- `npm run demo:reset:local` recusa `NODE_ENV=production` e banco nao-local.
- `VITE_DEMO_MODE=true` e apenas visual; nao altera permissoes nem dados.
- A task de polimento visual guiado por prints continua bloqueada ate receber imagens de referencia.
- Exports CSV incluem metadados antes do cabecalho tabular.
