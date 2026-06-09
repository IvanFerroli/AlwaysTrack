# TASK-AT-046 - Commercial ranking validation gate

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-06-09
- source-of-truth: docs/tasks/TASK-AT-046-commercial-ranking-validation-gate.md

## Modo
- mode: validation-first

## Objetivo unico
Validar o ranking comercial com multiplos vendedores e notas aprovadas antes de declarar ranking finalizado; se a validacao mostrar falha ou inconsistencia, transformar esta task em correcao/overhaul do ranking.

## Contexto minimo
O ranking atual ainda e incerto. O usuario nao conseguiu aprovar notas e a base local nao tinha vendedores suficientes para comparar posicoes de forma confiavel. Depois que `TASK-AT-037` colocar aprovacao/rejeicao de notas em vigencia, esta task deve criar uma validacao operacional com ao menos dois vendedores adicionais, DANFEs subidas para vendedores diferentes e notas aprovadas/rejeitadas conforme necessario. O resultado esperado e confirmar pontuacao, total e posicao no ranking ou mapear a causa raiz caso o ranking nao reflita os dados comerciais.

## Inputs
- Pedido do usuario em 2026-06-08 sobre ranking ainda incerto.
- `docs/tasks/TASK-AT-037-sales-document-approval-workflow.md`
- `docs/tasks/TASK-AT-016-seller-danfe-upload.md`
- `docs/tasks/TASK-AT-017-danfe-structured-extraction.md`
- `docs/tasks/TASK-AT-019-ranking-campaigns-mvp.md`
- `docs/tasks/TASK-AT-026-commercial-flow-upload-smoke.md`
- `docs/tasks/TASK-AT-038-sales-document-ai-reprocess-feedback.md`
- `docs/tasks/EXEC-AT-022-ranking-seller-filter-snapshot-comparison.md`
- `services/api/prisma/seed.ts`
- `services/api/src/core/sales-documents/*`
- `services/api/src/core/ranking/*`, se existir no runtime atual.
- `apps/web/src/main.tsx`

## Dependencias
- obrigatoria: `TASK-AT-037` concluida ou suficientemente funcional para aprovar/rejeitar notas pelo fluxo operacional.
- relacionadas: upload autenticado de DANFE (`TASK-AT-016`), extracao estruturada/IA (`TASK-AT-017`), smoke de upload comercial (`TASK-AT-026`) e dedupe/reprocessamento observavel (`TASK-AT-038`) quando a validacao depender de reprocessar ou diagnosticar DANFEs.
- em aberto: disponibilidade de fixtures DANFE/XML/PDF com valores e vendedores distintos o bastante para comparar ranking.

## Alvos explicitos
1. Validacao manual e/ou automatizada do fluxo comercial: seed/criacao de vendedores, upload, revisao, aprovacao/rejeicao e leitura do ranking.
2. Seed ou setup local com ao menos dois vendedores adicionais vinculados a grupo/organizacao, sem quebrar usuarios existentes.
3. Ranking/campanhas/snapshots somente se a validacao revelar falha de calculo, filtro, periodo ou escopo.
4. Evidencia documental no EXEC correspondente com dados usados, resultado esperado, resultado observado e decisao final.

## Fora de escopo
- Declarar ranking finalizado sem evidencia comparativa com multiplos vendedores.
- Implementar overhaul preventivo sem primeiro reproduzir e mapear a inconsistencia.
- Alterar extracao de DANFE, dedupe ou reprocessamento fora do necessario para validar ranking; problemas nessa camada devem ser ligados a `TASK-AT-038`.
- Criar regras novas de comissao, metas ou campanhas sem demanda explicita.
- Reabrir legado SyLembra/licencas/compliance.

## Checklist
1. Confirmar que `TASK-AT-037` permite aprovar e rejeitar notas com status final confiavel.
2. Criar ou seedar ao menos dois vendedores adicionais na mesma organizacao e vinculados a grupo comercial valido.
3. Garantir que cada vendedor tenha usuario/perfil comercial suficiente para receber DANFEs no fluxo atual.
4. Subir DANFEs por vendedor, preferindo fixtures com valores, datas e chaves distintas.
5. Quando necessario, acionar extracao deterministica/IA ou reprocessamento e registrar warnings, duplicidades e provider usado.
6. Aprovar notas que devem entrar no ranking e rejeitar ao menos uma nota quando util para confirmar que `REJECTED` nao pontua.
7. Conferir se apenas notas `APPROVED` entram no calculo de pontuacao, total vendido e posicao.
8. Comparar manualmente o total esperado por vendedor com o total exibido no ranking.
9. Validar ordenacao/posicao com pelo menos tres vendedores comparaveis quando possivel.
10. Validar filtros e periodo do ranking se existirem: data inicial/final, campanha, vendedor, grupo e snapshot.
11. Validar estado vazio: sem notas aprovadas no periodo/filtro, o ranking deve explicar ausencia de dados sem mostrar posicao enganosa.
12. Validar estado com multiplos vendedores: nenhum vendedor deve sumir por falta de join, escopo, grupo, role ou snapshot.
13. Registrar evidencia: vendedores usados, documentos/notas, status final, periodo, totais esperados, totais exibidos, posicoes e prints ou logs.
14. Se houver divergencia, mapear camada provavel: seed/usuario, upload, extracao, aprovacao, snapshot, filtro, query, agregacao, ordenacao ou UI.
15. Se a divergencia for no ranking, converter esta task em correcao/overhaul com escopo de causa raiz, testes e validacao regressiva.

## Acceptance Criteria
1. Existem ao menos tres vendedores comparaveis na validacao, incluindo os dois adicionais criados/seedados para esta task.
2. DANFEs conseguem ser subidas para vendedores diferentes e ficam associadas ao vendedor correto.
3. Notas aprovadas entram no ranking e notas rejeitadas/pendentes/duplicadas nao entram.
4. Total vendido e/ou pontuacao exibidos batem com a soma manual das notas aprovadas usadas na validacao.
5. Posicao no ranking respeita a regra de ordenacao atual e e explicada quando houver empate.
6. Filtros de periodo, vendedor, grupo, campanha ou snapshot, quando disponiveis, alteram o ranking de forma consistente com os dados esperados.
7. Estado vazio e estado com multiplos vendedores aparecem de forma compreensivel e sem dados fantasmas.
8. Evidencia da validacao fica registrada no EXEC correspondente antes de marcar ranking como validado/finalizado.
9. Se houver inconsistencia, a task documenta causa provavel, impacto, caminho de correcao e deixa de ser apenas validacao para virar overhaul do ranking.

## Definition of Done
1. Gate executado depois da aprovacao/rejeicao de notas estar operacional.
2. Base de validacao tem vendedores suficientes, DANFEs por vendedor e ao menos uma decisao de aprovacao/rejeicao relevante.
3. Resultado esperado versus observado do ranking esta documentado.
4. Ranking so pode ser declarado validado se totais, pontuacao, posicao e filtros passarem na comparacao.
5. Falha de ranking vira backlog corretivo no proprio EXEC ou em task derivada, com causa e impacto claros.

## Validacao
- comandos/checks documentais: revisar esta task, `ROADMAP.md` e `orchestrator-state.md` para confirmar ordem e dependencia apos `TASK-AT-037`.
- comandos/checks de execucao futura: `npm run setup`, `npm run smoke:beta-local`, `npm run test --workspace @alwaystrack/api -- main-flow.e2e.test.ts`, `npm run test --workspace @alwaystrack/api -- sales-documents.service.test.ts`, `npm run check`, conforme a correcao/validacao implementada exigir.
- revisao manual futura: login ADMIN; criar/confirmar vendedores; subir DANFEs por vendedor; aprovar/rejeitar notas; abrir Ranking; comparar totais, pontuacao, posicao, periodo e filtros.

## Evidencia esperada
- Tabela curta com vendedor, grupo, DANFE/chave mascarada, status final, valor esperado e valor computado.
- Print ou relato do ranking com multiplos vendedores e periodo usado.
- Print ou relato de estado vazio para periodo/filtro sem notas aprovadas.
- Registro da decisao: ranking validado ou convertido em overhaul/correcao.
- Se houver falha, descricao da camada causadora e contrato esperado apos correcao.

## Riscos
- Validacao pode culpar ranking quando a causa estiver em upload, extracao, dedupe ou aprovacao; por isso a evidencia deve separar cada etapa.
- Fixtures com datas fora do periodo selecionado podem gerar falso negativo.
- Vendedores sem grupo/organizacao correta podem sumir por escopo de tenant, nao por erro de ranking.
- Snapshot antigo pode mascarar mudanca recente se a UI nao recalcular ou selecionar snapshot esperado.
- Rejeicoes, pendencias e duplicidades podem parecer "perda" de venda se o status final nao for registrado.

## Blockers possiveis
- `TASK-AT-037` ainda nao permitir aprovar/rejeitar notas de forma confiavel.
- Falta de DANFEs/fixtures suficientes com chaves distintas e valores controlaveis.
- Falha pendente de dedupe/reprocessamento em `TASK-AT-038` impedir criacao de notas aprovaveis.
- CRUD/seed de vendedores insuficiente para criar perfis adicionais sem ajuste previo.

## Retorno esperado
- resumo curto da validacao do ranking
- arquivos/dados usados e evidencia registrada
- decisao final: ranking validado ou convertido em overhaul
- riscos ou ressalvas, especialmente sobre fixtures, periodo e snapshots
- sugestao de commit

## Execucao
- `EXEC-AT-028-commercial-ranking-validation-gate-setup.md`: base do gate preparada com tres vendedores no seed, endpoint de vendedores e upload administrativo por vendedor. Validacao final do ranking segue pendente.
- `EXEC-AT-035-backlog-final-validation.md`: ranking validado com tres vendedores, multiplos documentos aprovados e filtro explicito `APPROVED`.
