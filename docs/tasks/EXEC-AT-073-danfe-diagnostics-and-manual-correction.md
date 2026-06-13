# EXEC-AT-073 - Diagnostico de DANFE e correcao manual auditavel

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-12
- task: TASK-AT-073

## Entrega
Foi criado um fluxo operacional para abrir o diagnostico de uma DANFE diretamente na tela de Notas. O painel mostra arquivo, vendedor, status operacional, provider, confianca, campos extraidos, disponibilidade de texto bruto, itens atuais, falhas recentes de extracao e possiveis duplicidades por chave de acesso.

## Backend
- `GET /v1/sales/documents/:documentId/diagnostics`
  - Retorna documento escopado por role/organizacao.
  - Consolida extracao mais recente, falhas `sales_document.extract_failed` e candidatos duplicados.
- `PATCH /v1/sales/documents/:documentId/manual-correction`
  - Restrito a roles revisores.
  - Exige comentario de correcao.
  - Bloqueia nota ja aprovada para evitar alteracao silenciosa de ranking.
  - Regrava campos e itens, volta para `PENDING_REVIEW` e audita `sales_document.manual_correction`.

## Frontend
- A tabela de Notas ganhou acao `Diagnostico`.
- O painel permite reprocessar por IA com feedback visivel e salvar correcao manual auditavel usando o rascunho de revisao da nota.
- O desenho segue o mesmo padrao de paineis operacionais da timeline.

## Testes
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run test --workspace @alwaystrack/api -- sales-documents.service.test.ts`
- `npm run build --workspace @alwaystrack/web`

## Riscos residuais
- A correcao manual nao altera notas `APPROVED`; se isso virar necessidade real, deve existir fluxo separado de estorno/reabertura com impacto explicito no ranking.
- O diagnostico ainda usa dados ja persistidos; nao abre preview visual do PDF/XML original dentro da UI.
