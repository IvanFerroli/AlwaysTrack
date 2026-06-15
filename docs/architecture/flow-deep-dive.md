# AlwaysTrack - Flow Deep Dive

## Objetivo
Este documento complementa o TypeDoc com uma leitura humana dos fluxos. Use quando quiser entender "o que acontece depois que clico" ou "onde eu mexo se isso quebrar".

## Fluxo 1: DANFE -> revisao -> ranking -> extrato
1. O usuario envia PDF/XML/imagem na tela de Notas.
2. A view chama `POST /v1/sales/documents`.
3. A rota passa por `requireAuth`, `requireRole(commercialAllRoles)` e body raw.
4. `uploadSalesDocument` valida ator, vendedor, MIME, tamanho e storage.
5. O arquivo vai para `StorageProvider`; o registro vai para `SalesDocument`.
6. A extracao deterministica tenta resolver XML/PDF textual antes da IA.
7. Se a extracao for suficiente, itens e campos sao aplicados e a nota fica em revisao.
8. Se nao for suficiente, a nota segue para diagnostico/reprocessamento por IA.
9. Revisor aprova, rejeita ou marca duplicidade em `reviewSalesDocument`.
10. Apenas `APPROVED` deve alimentar ranking, dashboard, campanhas e extratos.
11. Eventos importantes viram auditoria, timeline e notificacoes.

Arquivos de leitura:
- `services/api/src/core/sales-documents/sales-documents.handlers.ts`
- `services/api/src/core/sales-documents/sales-documents.service.ts`
- `services/api/src/core/sales-documents/danfe-deterministic.ts`
- `services/api/src/core/document-ai/document-ai.service.ts`
- `services/api/src/core/audit/audit.service.ts`
- `apps/web/src/views/notes.tsx`
- `apps/web/src/views/ranking.tsx`
- `apps/web/src/views/statements.tsx`

Perguntas de manutencao:
- O usuario tinha permissao para o vendedor escolhido?
- O arquivo foi salvo no storage?
- A extracao gerou `accessKey`?
- A nota duplicou por chave real ou por bug?
- A nota aprovada entrou no periodo/campanha certo?
- A auditoria explica quem fez o que?

## Fluxo 2: duvida -> FAQ -> Wiki
1. Usuario cria pergunta na FAQ.
2. Outros usuarios comentam ou reagem.
3. Supervisor/Admin pode alterar status e promover para Wiki.
4. A FAQ continua existindo como thread.
5. A Wiki criada vira conhecimento validado, com slug consultavel.
6. Backlinks mantem rastreabilidade entre pergunta original e artigo final.

Arquivos de leitura:
- `services/api/src/core/faq/faq.service.ts`
- `services/api/src/core/wiki/wiki.service.ts`
- `apps/web/src/views/faq.tsx`
- `apps/web/src/views/wiki.tsx`
- `services/api/src/core/notifications/notifications.service.ts`

Perguntas de manutencao:
- Quem criou a pergunta?
- Quem podia promover?
- O slug ficou unico e acessivel?
- A Wiki preserva fonte e contexto?
- A notificacao chegou para quem precisava?

## Fluxo 3: Avisos
1. Supervisor/Admin cria aviso.
2. Aviso pode ter vigencia, links e status.
3. Quando publicado, aparece na central e pode gerar notificacao/ciencia.
4. Usuario visualiza e reconhece quando aplicavel.

Arquivos de leitura:
- `services/api/src/core/announcements/announcements.service.ts`
- `apps/web/src/views/announcements.tsx`
- `services/api/src/core/operations/operations.service.ts`
- `services/api/src/core/notifications/notifications.service.ts`

Perguntas de manutencao:
- O aviso esta dentro da vigencia?
- O link aponta para entidade existente?
- O usuario ja deu ciencia?
- O aviso aparece na central operacional?

## Fluxo 4: Scriptoteca
1. SAC ou usuario busca script por texto, categoria, canal ou tag.
2. O sistema registra busca sem resultado para revelar lacunas.
3. Usuario copia script e preenche placeholders.
4. Supervisor/Admin valida, recertifica ou obsoleta scripts.
5. Sugestoes podem virar scripts formais.

Arquivos de leitura:
- `services/api/src/core/script-library/script-library.service.ts`
- `apps/web/src/views/script-library.tsx`
- `services/api/src/core/search/search.service.ts`

Perguntas de manutencao:
- O script esta validado ou vencido?
- A copia registrou metrica sem guardar dado sensivel?
- A sugestao foi decidida por role correta?
- Tags/filtros estao combinando corretamente?

## Fluxo 5: Central Operacional Hoje
A central nao deve ser decorativa. Cada card precisa representar uma fila real e levar para acao com filtro aplicado.

Arquivos de leitura:
- `services/api/src/core/operations/operations.service.ts`
- `apps/web/src/views/dashboard.tsx`

Perguntas de manutencao:
- O numero do card bate com a tela destino?
- O filtro aplicado na navegacao e o mesmo da query?
- O card representa algo acionavel hoje?

## Fluxo 6: seguranca transversal
Antes de expor externamente, a leitura obrigatoria e:

- `docs/tasks/TASK-AT-102-security-threat-model-and-baseline-audit.md`
- `docs/tasks/TASK-AT-103-http-security-headers-cors-perimeter.md`
- `docs/tasks/TASK-AT-104-auth-session-and-login-hardening.md`
- `docs/tasks/TASK-AT-105-csrf-origin-protection-for-cookie-api.md`
- `docs/tasks/TASK-AT-106-rate-limit-and-abuse-protection.md`
- `docs/tasks/TASK-AT-116-security-release-gate-before-external-exposure.md`

Perguntas de manutencao:
- Esta rota exige login?
- Esta rota exige role correta?
- O recurso pertence a organizacao do usuario?
- Upload valida tipo real, tamanho e storage?
- Mutacoes estao protegidas contra CSRF/origem indevida?
- Existe auditoria para acao sensivel?
