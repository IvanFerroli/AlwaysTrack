# TASK-AT-037 - Sales document approval workflow

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-06-08
- source-of-truth: docs/tasks/TASK-AT-037-sales-document-approval-workflow.md

## Modo
- mode: implementation

## Objetivo unico
Colocar em vigencia a fila operacional de aprovacao de notas na tela Notas, com filtros por data, vendedor e status, selecao multipla, select all visivel, acoes claras de aprovacao/rejeicao/revisao, acoes em lote para aprovar/rejeitar notas e comentario operacional rastreavel.

## Contexto minimo
A tela Notas, no perfil ADMIN, mostra uma lista de DANFEs com muitos registros `PENDING_REVIEW`, um registro `DUPLICATE` e a acao visivel `Reprocessar IA`. O MVP `TASK-AT-018` e a execucao `EXEC-AT-017` ja entregaram endpoint de review, acoes de aprovar/reprovar e editor visual para `PENDING_REVIEW`, mas deixaram como residual uma fila dedicada com filtros por status/vendedor/grupo. O usuario quer explicitar o workflow de aprovacao, tornar a tela operacional e permitir que o operador selecione varias notas, use select all visivel e aplique aprovacao/rejeicao em lote.

## Inputs
- Pedido do usuario em 2026-06-08 sobre vigencia do sistema de aprovacao de notas.
- Pedido documental paralelo em 2026-06-08 para registrar selecao multipla, select all visivel e acoes em lote de aprovar/rejeitar notas, sem implementar runtime.
- Print observado: tela Notas, perfil ADMIN, lista com `PENDING_REVIEW`, `DUPLICATE` e acao `Reprocessar IA`.
- `docs/tasks/TASK-AT-018-sales-document-review.md`
- `docs/tasks/EXEC-AT-017-sales-document-review-editor.md`
- `apps/web/src/main.tsx`
- `services/api/src/core/sales-documents/*`

## Dependencias
- satisfeitas: upload de DANFE, extracao estruturada, status `PENDING_REVIEW`/`APPROVED`/`REJECTED`/`DUPLICATE`, endpoint `PATCH /v1/sales/documents/:documentId/review`, editor visual de revisao.
- em aberto: filtro visual na tela Notas, filtro por data na listagem de documentos, escolha final do nome persistente para comentario/nota operacional se o schema atual nao tiver campo dedicado.

## Alvos explicitos
1. `apps/web/src/main.tsx`: controles de filtro da tela Notas e acoes de linha/detalhe com labels operacionais.
2. `apps/web/src/styles.css`: ajustes visuais pequenos para filtros, toolbar e estados das acoes, se necessario.
3. `services/api/src/core/sales-documents/sales-documents.service.ts`: suporte minimo a filtros de listagem por data quando ainda ausente e persistencia/auditoria de comentario operacional quando necessario.
4. `services/api/src/core/sales-documents/sales-documents.handlers.ts`: passagem segura dos filtros aceitos, se o contrato de query precisar ser expandido.
5. `services/api/src/core/sales-documents/sales-documents.service.test.ts`: cobertura de filtros e comentario/review sem regressao de aprovacao.

## Fora de escopo
- Recriar o endpoint de review ja entregue em `TASK-AT-018`.
- Refatorar toda a tela Notas ou criar um modulo separado se a tela atual puder receber a fila com mudanca pequena.
- Alterar ranking, campanhas, extratos ou dashboard fora do necessario para preservar o contrato de notas aprovadas.
- Criar automacao de pagamento/comissao ou integracao fiscal externa.
- Implementar observabilidade completa de auditoria alem do comentario operacional exigido para esta fila.

## Checklist
1. Confirmar contrato atual de `GET /v1/sales/documents` e reutilizar filtros ja existentes por status/vendedor/grupo.
2. Adicionar filtro por periodo de data para a lista de notas, preferindo `createdAt`/data de envio para o controle da fila e documentando qualquer decisao diferente.
3. Expor filtros visuais por data, vendedor e status na tela Notas para perfis com permissao operacional.
4. Garantir que ADMIN/GESTOR/SAC/FINANCEIRO consigam filtrar a fila sem perder escopo por organizacao, grupo ou role.
5. Deixar as acoes finais claras: aprovar/aceitar, rejeitar/negar, revisar/editar e adicionar comentario/nota operacional.
6. Expor selecao multipla na fila e manter um select all visivel para selecionar as notas exibidas no filtro atual.
7. Disponibilizar acoes em lote para aprovar e rejeitar notas selecionadas, mantendo feedback claro de sucesso, erro e itens inelegiveis quando aplicavel.
8. Reusar o editor visual existente para revisao/edicao de dados fiscais e itens antes de aprovar/rejeitar.
9. Persistir ou auditar o comentario operacional de modo recuperavel para a nota revisada, sem confundir com motivo obrigatorio de rejeicao.
10. Atualizar testes de service e, quando possivel, checks web para cobrir query, estados, payload de review e comportamento de lote.

## Acceptance Criteria
1. Na tela Notas, um ADMIN consegue filtrar DANFEs por periodo de data, vendedor e status.
2. A lista filtrada chama a API com parametros explicitos e nao depende apenas de filtro client-side quando houver suporte backend necessario.
3. Uma nota `PENDING_REVIEW` tem acoes visiveis e compreensiveis para aprovar/aceitar, rejeitar/negar, revisar/editar e registrar comentario operacional.
4. O operador consegue selecionar multiplas notas na fila e usar um select all visivel para marcar as notas exibidas no recorte filtrado.
5. As notas selecionadas podem ser aprovadas ou rejeitadas em lote, respeitando as mesmas regras de permissao, status e auditoria das acoes individuais.
6. Aprovar uma nota com itens continua mudando o status para `APPROVED` e mantendo os itens comerciais revisados.
7. Rejeitar uma nota continua mudando o status para `REJECTED` e preserva o motivo operacional exigido.
8. O comentario/nota operacional fica rastreavel na resposta da nota, em auditoria ou campo persistido definido pela implementacao.
9. Perfis sem permissao de review nao passam a aprovar, rejeitar ou editar notas por causa dos novos controles individuais ou em lote.
10. O status `DUPLICATE` continua visivel e filtravel sem ser confundido com pendencia aprovavel.

## Definition of Done
1. Fila de Notas apresenta filtros por data, vendedor e status com estado de carregamento/erro preservado.
2. Fila de Notas apresenta selecao multipla, select all visivel e acoes em lote para aprovar/rejeitar notas.
3. Workflow de aprovacao fica explicito no texto das acoes individuais, das acoes em lote e no detalhe da nota.
4. Comentario operacional tem contrato claro e evidencia recuperavel.
5. Testes relevantes de API e typecheck/build web passam ou qualquer impossibilidade fica documentada na execucao.
6. Escopo residual de `TASK-AT-018` sobre fila dedicada com filtros fica fechado ou substituido por novo residual mais especifico.

## Validacao
- comandos/checks: `npm run test --workspace @alwaystrack/api -- sales-documents.service.test.ts`, `npm run typecheck --workspace @alwaystrack/api`, `npm run typecheck --workspace @alwaystrack/web`, `npm run build --workspace @alwaystrack/web`
- revisao manual: login ADMIN; abrir Notas; filtrar por periodo, vendedor e status; selecionar multiplas notas; usar select all visivel; aprovar notas em lote; rejeitar notas em lote com motivo/comentario quando exigido; revisar/editar uma `PENDING_REVIEW`; adicionar comentario; aprovar; rejeitar outra nota; confirmar visibilidade de `DUPLICATE`.

## Evidencia esperada
- Print ou relato da tela Notas com filtros preenchidos e lista reduzida.
- Print ou relato da fila com selecao multipla, select all visivel e acoes em lote de aprovar/rejeitar habilitadas para notas selecionadas.
- Saida de teste demonstrando filtro por status/vendedor/data e review com comentario operacional.
- Registro da nota aprovada/rejeitada com revisor, data de revisao, status final e comentario/auditoria recuperavel.
- Registro de aprovacao/rejeicao em lote preservando status final, revisor, data de revisao e auditoria por nota afetada.
- Confirmacao de que ranking/extratos continuam considerando apenas `APPROVED`.

## Riscos
- Misturar comentario operacional com motivo de rejeicao pode perder contexto em aprovacoes.
- Filtro por data pode ser ambiguo entre data de envio (`createdAt`) e data de emissao (`issuedAt`); a task deve escolher e deixar claro na UI.
- Adicionar campo persistente pode exigir migration; se isso for necessario, manter a mudanca minima e testada.
- Filtro client-side isolado pode parecer funcionar em listas pequenas, mas falhar com paginacao ou volume futuro.
- Select all deve deixar claro se seleciona apenas a pagina/recorte visivel ou todos os resultados filtrados, para evitar aprovacao/rejeicao acidental em volume maior que o esperado.
- Acoes em lote devem lidar com notas inelegiveis (`DUPLICATE`, ja aprovadas/rejeitadas ou sem permissao) sem mascarar sucesso parcial.

## Blockers possiveis
- Schema atual nao possuir campo adequado para comentario operacional sem migration.
- Tela atual nao listar vendedores disponiveis para popular filtro sem endpoint auxiliar ou derivacao local.
- Dados de seed/smoke nao incluirem notas suficientes em status variados para validacao manual.

## Retorno esperado
- resumo curto do workflow ativado
- evidencia de validacao documental, automatizada e manual
- riscos ou ressalvas, especialmente sobre data escolhida e persistencia do comentario
- proximo passo recomendado

## Execucao
- `EXEC-AT-026-sales-document-approval-workflow.md`
