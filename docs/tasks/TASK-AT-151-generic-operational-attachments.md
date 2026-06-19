# TASK-AT-151 - Entidade generica de anexos operacionais

## Metadata
- status: completed-mvp-slice
- owner: olympus-orchestrator
- last-updated: 2026-06-19
- source-of-truth: docs/tasks/TASK-AT-151-generic-operational-attachments.md

## Modo
- mode: implementation

## Objetivo unico
Unificar anexos de Wiki, FAQ, Avisos, Fluxos e Scriptoteca em um contrato operacional comum se a duplicacao virar custo real.

## Contexto minimo
`TASK-AT-146` fechou arquivamento auditavel de anexos da Wiki. A dor transversal ficou comprovada quando Avisos, FAQ, Fluxos e Scriptoteca passaram a usar `uploadWikiImage`, gravando imagens operacionais como anexos de Wiki.

## Inputs
- Lista de superficies com anexo ativo.
- Dores reais de duplicacao ou bug.

## Dependencias
- satisfeitas: `TASK-AT-101`, `TASK-AT-146`.
- satisfeitas nesta fatia: evidencia de dor transversal e endpoint operacional separado.

## Alvos explicitos
1. Prisma models de conteudo rico.
2. Services de Wiki/FAQ/Avisos/Fluxos/Scriptoteca.
3. API de upload/download.

## Fora de escopo
- Migrar anexos Wiki antigos para a entidade generica.
- Migrar arquivos sem plano de compatibilidade.
- Criar galeria/gestao visual de anexos em cada superficie.

## Resultado entregue
1. Novo model `OperationalAttachment` com organizacao, uploader, superficie, entidade vinculada, storage key, metadados e arquivamento auditavel.
2. Endpoints autenticados:
   - `POST /v1/attachments/operational`
   - `GET /v1/attachments/operational/:attachmentId/file`
   - `DELETE /v1/attachments/operational/:attachmentId`
3. Superficies aceitas no MVP: `announcement`, `faq`, `service-flow`, `script-library`, `profile`, `settings`.
4. Avisos, FAQ, Fluxos e Scriptoteca usam `uploadOperationalImage`.
5. Wiki continua usando `WikiAttachment`, preservando compatibilidade de markdown ja publicado.

## Checklist
1. Mapear anexos existentes.
2. Definir contrato generico.
3. Planejar migration compatível.
4. Implementar em slice pequeno.

## Acceptance Criteria
1. Nenhuma superficie perde anexos existentes.
2. Acesso respeita organizacao e role.
3. Arquivamento preserva auditoria.

## Definition of Done
1. Migration validada.
2. Testes anti-IDOR.
3. Docs de compatibilidade.

## Validacao
- comandos/checks:
  - `npm run prisma:generate`
  - `npm run typecheck --workspace @alwaystrack/api`
  - `npm run typecheck --workspace @alwaystrack/web`
  - `npm run test --workspace @alwaystrack/api -- operational-attachments.service.test.ts storage.test.ts env.test.ts`
- revisao manual: upload/download/arquivamento por superficie.

## Evidencia esperada
- Matriz antes/depois de entidades.
- Smoke de pelo menos duas superficies.

## Riscos
- Markdown antigo da Wiki segue no contrato antigo por compatibilidade.
- Ainda nao ha UI de inventario/galeria de anexos por superficie.

## Blockers possiveis
- Falta de evidencia de necessidade.

## Retorno esperado
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
