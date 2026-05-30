# TASK-AT-028 - Deterministic DANFE extraction

## Metadata
- status: completed-mvp
- owner: olympus_orchestrator
- last-updated: 2026-05-30
- source-of-truth: docs/tasks/TASK-AT-028-danfe-deterministic-extraction.md

## Objetivo
Reduzir custo e dependencia de IA na extracao de DANFE, usando parser deterministico como caminho principal quando o PDF possui texto pesquisavel.

## Entregue
- Parser `deterministic-pdf-text` baseado em texto de PDF e regex.
- Parser `deterministic-nfe-xml` baseado em XML NF-e estruturado.
- Extracao de chave de acesso, numero, serie, data de emissao, emitente, comprador, total e itens.
- Upload passa a tentar extracao deterministica imediatamente e gravar os dados no Prisma.
- PDFs com multiplas DANFEs podem gerar multiplas linhas comerciais a partir do mesmo arquivo.
- IA deixa de ser caminho silencioso principal e fica para fallback do endpoint de reprocessamento.
- UI ganhou secao colapsavel de dados extraidos puxando direto do banco.
- Botao `Extrair` fica restrito a notas ainda `UPLOADED`.
- Revisores podem usar `Reprocessar IA` em nota `PENDING_REVIEW` quando quiserem ignorar o caminho deterministico.
- Parser registra warning quando a soma dos itens diverge do total da nota, preservando desconto/frete como caso revisavel.

## Aceite
- DANFE PDF textual e XML NF-e populam `SalesDocument`, `SalesDocumentExtraction` e `SalesItem` sem chamada externa.
- Ranking, dashboard e extratos continuam dependentes apenas de dados aprovados no banco.
- Revisor consegue ver dados extraidos sem depender do arquivo original existir.
- Logs indicam `provider=deterministic-pdf-text` quando o caminho barato foi usado.
- Reprocessamento forcado com IA registra `forceAi=true`.

## Residual
- PDF escaneado/imagem ainda exige fallback IA ou revisao manual.
- Parser PDF pode variar conforme layout de DANFE; XML NF-e e mais robusto, mas ainda nao cobre ZIP/lote.
- Editor granular de campos/itens continua em `AT-018B`.
- Upload multi-DANFE ainda retorna o primeiro documento como contrato principal da API; o front recarrega a lista como fonte de verdade.
