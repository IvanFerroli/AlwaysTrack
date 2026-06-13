# EXEC-AT-078 - Curadoria clara de Wiki/FAQ

## Metadata
- task: TASK-AT-078
- status: completed
- executor: olympus_orchestrator
- completed-at: 2026-06-12

## Entrega
MVP de governanca visual para conhecimento operacional, sem migration nova.

## Mudancas
- FAQ: filtro "Sem resposta", contadores de threads promovidas para Wiki e resolvidas.
- FAQ: detalhe da thread agora explicita status, quantidade de respostas, pendencia sem resposta e Wiki validada vinculada.
- Wiki: lista mostra responsavel pela validacao/publicacao usando os dados de revisao/editor existentes.
- Wiki: detalhe mostra faixa de governanca com validador, leituras, pendencias e origem FAQ quando detectada.
- Wiki: artigos relacionados por tags compartilhadas, excluindo a pagina atual e conteudo arquivado.

## Arquivos principais
- `apps/web/src/views/faq.tsx`
- `apps/web/src/views/wiki.tsx`
- `apps/web/src/styles.css`

## Validacao
- `npm run typecheck --workspace @alwaystrack/web`

## Risco residual
- O selo "validada por" usa autor da revisao publicada/ultimo editor enquanto nao houver campo dedicado de aprovador final.
