# TASK-AT-038 - Sales document AI dedupe and reprocess overhaul

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-06-09
- source-of-truth: docs/tasks/TASK-AT-038-sales-document-ai-reprocess-feedback.md

## Modo
- mode: implementation

## Objetivo unico
Fazer um overhaul do fluxo de extracao/reprocessamento de DANFE para eliminar duplicata falsa, tornar upload/reprocessamento idempotentes quando cabivel e garantir feedback observavel ao usuario em sucesso, warning, duplicidade real ou erro.

## Contexto minimo
Na tela Notas, perfil ADMIN, o usuario clicou em `Reprocessar IA` e nao recebeu retorno observavel. Depois, ao subir um pacote de DANFEs gerados pelo proprio sistema em um banco recem-limpo, o fluxo marcou ao menos uma nota como `DUPLICATE`. Em teoria isso nao deveria acontecer: pacote limpo, DB limpo e DANFEs originadas pelo proprio sistema devem produzir notas novas ou pendentes de revisao, nao duplicidade falsa.

O runtime atual usa `POST /v1/sales/documents/:documentId/analyze?forceAi=1` para reprocessamento por IA. A extracao aplica dedupe por `accessKey` contra outro `SalesDocument` da mesma organizacao e, quando acha conflito, grava status `DUPLICATE`, zera `accessKey` na nota atual, nao cria itens e registra `sales_document.extract_duplicate`. Tambem existe constraint `@@unique([organizationId, accessKey])` em `SalesDocument`. Esse criterio precisa ser auditado contra upload em lote, DANFE PDF com multiplas notas, reprocessamento do mesmo arquivo, retries e normalizacao de chave.

## Inputs
- Pedido do usuario em 2026-06-08 sobre clique em `Reprocessar IA` sem saida observavel.
- Nova observacao do usuario em 2026-06-08: pacote de DANFEs geradas pelo proprio sistema, DB recem-limpo, nota marcada como `DUPLICATE`.
- Print observado: tela Notas, ADMIN, registros `PENDING_REVIEW` e acao `Reprocessar IA`.
- `docs/tasks/TASK-AT-025-sales-danfe-diagnostic-logs.md`
- `docs/tasks/TASK-AT-026-commercial-flow-upload-smoke.md`
- `apps/web/src/main.tsx`
- `services/api/prisma/schema.prisma`
- `services/api/src/core/sales-documents/sales-documents.handlers.ts`
- `services/api/src/core/sales-documents/sales-documents.service.ts`
- `services/api/src/core/sales-documents/sales-documents.service.test.ts`
- `services/api/src/core/sales-documents/danfe-deterministic.ts`

## Dependencias
- satisfeitas: endpoint de analise/reprocessamento, extracao deterministica de PDF/XML, provider de Document AI, storage, logs estruturados, rollback de status quando a extracao falha.
- em aberto: pacote real ou fixture equivalente que reproduza a duplicata falsa em DB limpo; decisao de produto sobre quando upload repetido deve ser idempotente, bloqueado como duplicado ou tratado como nova tentativa do mesmo documento.

## Alvos explicitos
1. `services/api/src/core/sales-documents/sales-documents.service.ts`: revisar criterio de duplicidade, normalizacao de `accessKey`, transacao de extracao, upload/reprocess idempotente e retorno rico do endpoint.
2. `services/api/src/core/sales-documents/sales-documents.handlers.ts`: mapear duplicidade real, erro de provider/storage e payload invalido para mensagens claras.
3. `services/api/src/core/sales-documents/danfe-deterministic.ts`: verificar se PDFs gerados pelo sistema estao extraindo chaves corretas por pagina/nota e sem repetir chave por bug de parsing.
4. `services/api/prisma/schema.prisma`: confirmar se `@@unique([organizationId, accessKey])` e suficiente ou se precisa de chave operacional adicional, mantendo migracao minima.
5. `services/api/src/core/sales-documents/sales-documents.service.test.ts`: cobertura para DB limpo, pacote multi-DANFE, reprocessamento do mesmo documento, upload repetido e duplicidade real.
6. `apps/web/src/main.tsx`: estado de andamento e resultado do reprocessamento por nota, incluindo status final, chave, provider/model, warnings, duplicate real/falso e erro acionavel.
7. `apps/web/src/styles.css`: estilos pequenos para feedback de sucesso, erro, warning ou resultado recente, se necessario.

## Fora de escopo
- Trocar provider/model de IA.
- Melhorar ranking/campanhas fora do impacto direto da deduplicacao.
- Aprovar/rejeitar notas em lote; isso pertence a `TASK-AT-037`.
- Criar painel completo de observabilidade.
- Reprocessar retroativamente toda a base de producao sem task propria.

## Perguntas de investigacao obrigatorias
1. Em DB limpo, a duplicata nasce no upload inicial, na extracao deterministica, no `forceAi`, no split de PDF multi-nota ou em retry/reload do mesmo arquivo?
2. A chave `accessKey` extraida de cada DANFE gerada pelo sistema e realmente unica e normalizada para 44 digitos?
3. O parser pode estar repetindo a mesma chave em paginas diferentes do PDF ou usando evidencia de pagina anterior?
4. O fluxo cria um documento por nota dentro do pacote ou reanalisa o mesmo documento com outra nota extraida?
5. O dedupe atual deveria comparar apenas `accessKey` ou tambem precisa registrar `fileHash`, `sourceBatchId`, `invoiceNumber`, `series`, `issuerDocument` e/ou `sellerProfileId` como chaves auxiliares de diagnostico?
6. Reprocessar o proprio documento com a mesma chave deve ser no-op/idempotente e nunca marcar o proprio registro como duplicado.
7. Upload repetido do mesmo arquivo pelo mesmo vendedor deve retornar documento existente, criar nova tentativa ligada ao original ou bloquear com mensagem explicita?
8. O endpoint de reprocessamento retorna dados suficientes para a UI explicar o que aconteceu sem depender apenas de reload?

## Checklist
1. Reproduzir com DB limpo e pacote de DANFEs geradas pelo sistema, registrando quantidade de arquivos/notas, chaves extraidas, status final e logs.
2. Criar fixture reduzida que represente o pacote problemático ou documentar por que nao pode ser versionada.
3. Auditar `applySalesDocumentExtraction`: `where { organizationId, accessKey, id: { not: document.id } }`, limpeza de `accessKey`, status `DUPLICATE`, exclusao/criacao de itens e auditoria.
4. Garantir que reprocessar a mesma nota com a mesma `accessKey` seja idempotente: atualiza extracao/itens da propria nota sem virar duplicata.
5. Garantir que upload/extracao de pacote multi-DANFE em DB limpo nao gere `DUPLICATE` quando as chaves forem distintas.
6. Se houver duas DANFEs com a mesma chave no mesmo pacote, marcar duplicidade real com referencia segura ao documento conflitante ou retornar erro operacional claro.
7. Definir e documentar chaves de dedupe: chave fiscal principal (`accessKey`) e chaves auxiliares para diagnostico/idempotencia (`fileHash`, indice da nota no pacote, filename original ou outro campo escolhido).
8. Tornar logs/telemetria suficientes: `documentId`, `batch/fileHash` quando houver, `invoiceIndex`, provider/model, `forceAi`, `usedAi`, chave mascarada, motivo de duplicate, id do conflito mascarado/seguro, duracao e contagem de itens/warnings.
9. Confirmar que falhas de storage/provider/API restauram status anterior e aparecem como erro visivel na UI.
10. Exibir resultado apos reprocessamento: status final, provider/model, `usedAi`/deterministico, quantidade de itens, warnings, chave mascarada e motivo quando `DUPLICATE`.
11. Evitar que um reload sem mudanca visual seja o unico feedback do usuario.
12. Adicionar testes unitarios e/ou e2e pequeno para DB limpo + pacote limpo, duplicidade real e reprocessamento idempotente.
13. Registrar no EXEC correspondente a causa raiz da duplicata falsa e o contrato final de idempotencia.

## Acceptance Criteria
1. Em DB recem-limpo, upload do pacote limpo de DANFEs geradas pelo sistema nao marca nota como `DUPLICATE` quando as chaves fiscais sao distintas.
2. Quando duas notas tem a mesma chave fiscal real, o sistema marca/bloqueia como duplicidade real com mensagem clara e auditavel.
3. Reprocessar a mesma nota, inclusive com `forceAi=1`, nao considera a propria nota como duplicata.
4. Reprocessamento atualiza extracao/itens/status da propria nota de forma idempotente ou retorna no-op explicito quando nada mudou.
5. A UI mostra andamento imediato por nota e bloqueia duplo clique na mesma linha durante a requisicao.
6. Ao concluir, a UI mostra feedback persistente o bastante para ler, mesmo que o status continue `PENDING_REVIEW`.
7. O feedback de sucesso informa ao menos status final e evidencia do processamento: provider/model, origem deterministica ou IA, itens atualizados, warnings, chave mascarada ou horario da conclusao.
8. Se o resultado for `DUPLICATE`, a UI diferencia duplicidade real de erro/falha e mostra o motivo operacional sem vazar dados sensiveis.
9. Se a API retornar erro, a tela mostra erro claro e acionavel, por exemplo provider indisponivel, arquivo ausente no storage ou payload invalido.
10. Logs/auditoria registram inicio, sucesso, duplicate e falha com `forceAi`, `usedAi`, chave mascarada e motivo de dedupe.
11. A mudanca nao altera aprovar/rejeitar notas nem escopo de roles ja definido.

## Definition of Done
1. Causa raiz da duplicata falsa documentada no EXEC correspondente.
2. Contrato de dedupe/idempotencia documentado no EXEC e refletido em testes.
3. UI exibe andamento, sucesso/warnings, duplicate real e erro do reprocessamento por IA.
4. Contrato de retorno do endpoint e usado explicitamente pela UI, sem depender apenas de recarregar a lista.
5. Teste automatizado cobre pelo menos: pacote limpo sem duplicata falsa, duplicidade real e reprocessamento idempotente.
6. Validacao manual confirma o pacote limpo em DB limpo e o clique `Reprocessar IA` com feedback observavel.

## Validacao
- comandos/checks: `npm run test --workspace @alwaystrack/api -- sales-documents.service.test.ts`, `npm run test --workspace @alwaystrack/api -- main-flow.e2e.test.ts`, `npm run typecheck --workspace @alwaystrack/api`, `npm run typecheck --workspace @alwaystrack/web`, `npm run build --workspace @alwaystrack/web`, `npm run check`
- revisao manual: limpar DB local; subir pacote de DANFEs geradas pelo sistema; confirmar zero `DUPLICATE` falso; repetir upload/reprocessamento controlado; criar duplicidade real controlada; clicar `Reprocessar IA` em nota `PENDING_REVIEW`; observar andamento e resultado.

## Evidencia esperada
- Relato ou print do pacote limpo em DB limpo com status final por nota.
- Tabela curta com chaves mascaradas extraidas e status gerado.
- Print ou relato mostrando feedback apos reprocessamento bem-sucedido.
- Print ou relato mostrando duplicidade real com motivo claro.
- Print ou relato mostrando erro claro quando provider/storage falha.
- Logs com `sales_document.extract.start`, `forceAi`, `usedAi`, provider/model, chave mascarada, motivo de duplicate e duracao.

## Riscos
- O pacote real pode conter DANFEs repetidas de fato; validar chave fiscal antes de assumir bug.
- PDF multi-nota pode exigir ajuste cuidadoso de split por pagina para nao misturar evidencias.
- Constraint unica em `accessKey` pode conflitar com tentativa de armazenar duplicatas reais; decidir se duplicata real guarda chave em campo proprio, referencia conflito ou falha antes de persistir.
- Provider externo pode responder lentamente ou falhar intermitentemente; a UI deve diferenciar demora de erro.
- Mensagens de erro detalhadas demais podem vazar informacao sensivel; manter mascaramento.
- Teste automatizado com provider real seria fragil; preferir fake/mock local e fixture deterministica.

## Blockers possiveis
- Falta do pacote real ou fixture equivalente para reproduzir a duplicata falsa.
- Falta de credenciais/provider configurado no ambiente onde a falha foi observada.
- Arquivo original ausente no storage local para a nota que o usuario tentou reprocessar.
- Decisao de produto pendente sobre comportamento de upload repetido do mesmo arquivo.

## Retorno esperado
- resumo curto do diagnostico e da causa raiz
- contrato final de dedupe/idempotencia
- evidencia de validacao automatizada e manual
- riscos ou ressalvas, especialmente se depender de provider externo
- proximo passo recomendado

## Execucao
- `EXEC-AT-027-sales-document-dedupe-reprocess-feedback.md`: dedupe interno de pacote deterministico e feedback observavel de reprocessamento entregues; validacao com pacote real segue pendente.
- `EXEC-AT-035-backlog-final-validation.md`: adicionada validacao automatizada de reprocessamento idempotente da propria nota com mesma chave fiscal, sem `DUPLICATE`.
