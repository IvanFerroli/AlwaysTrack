# TASK-AT-072 - Modo demo guiado

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-12
- source-of-truth: docs/tasks/TASK-AT-072-guided-demo-mode.md

## Fase
- fase: A - Impacto para apresentacao
- prioridade: 4
- dependencias: TASK-AT-069, TASK-AT-070 e TASK-AT-071 recomendadas.

## Objetivo unico
Consolidar uma demo previsivel e bonita para apresentacao interna, cobrindo os dois fluxos centrais sem depender de sorte ou banco vazio.

## Contexto
A apresentacao precisa vender processo, governanca e maturidade. O modo demo deve guiar a narrativa: Central -> nota -> aprovacao -> ranking -> explicacao -> auditoria -> FAQ -> Wiki -> notificacao.

## Escopo funcional
1. Seed demo reforcado e idempotente para dados comerciais convincentes.
2. Roteiro dentro de `docs/demo` com passos e checkpoints.
3. Opcional: banner/estado "modo demo" somente em ambiente local/demo.
4. Dados previsiveis para nota pendente, aprovacao, ranking alteravel, FAQ promovida e notificacoes.
5. Script/atalho seguro para resetar demo local sem tocar dados reais.

## Arquivos candidatos
- `apps/api/prisma/seed*`
- `scripts/**`
- `docs/demo/**`
- `docs/tasks/**`
- `apps/web/src/**` se houver banner/atalhos visuais

## Plano de execucao
1. Revisar seed atual e lacunas da jornada.
2. Criar/atualizar dados demo idempotentes com nomes e valores criveis.
3. Documentar roteiro de 5-7 minutos.
4. Criar comando seguro para resetar demo local/teste.
5. Validar manualmente a jornada principal.

## Acceptance Criteria
1. Rodar seed demo sempre produz o mesmo cenario base sem duplicar dados.
2. O roteiro permite mostrar os dois fluxos centrais em sequencia.
3. A demo tem dados suficientes para Central, Ranking explicavel, Timeline, FAQ/Wiki e notificacoes.
4. O comando de demo e claramente marcado como local/demo.
5. Documentacao explica riscos e como restaurar ambiente.

## Impacto na apresentacao
Reduz risco de falha ao vivo e aumenta percepcao de produto acabado.

## Riscos
- Confundir dados demo com dados reais se nao houver guardas.
- Seed grande demais ficar fragil.

