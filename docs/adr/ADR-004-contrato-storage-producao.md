# ADR-004 - Contrato de storage de documentos para producao

## Metadata
- status: accepted
- owner: olympus_orchestrator
- last-updated: 2026-05-28
- source-of-truth: docs/adr/ADR-004-contrato-storage-producao.md

## Contexto
O runtime atual usa apenas `LocalStorageProvider`: documentos sao gravados em `.storage/private/` no sistema de arquivos local da API.
A documentacao inicial mencionava "storage externo privado", mas o codigo nunca implementou um provider externo (S3, GCS, Azure Blob etc.).
A auditoria em `docs/operations/auditoria-estado-atual-template-2026-05-27.md` (secao 6 e 11.2) aponta que a diferenca entre narrativa e realidade e um risco de template.
O ROADMAP item 4 exige que essa decisao seja tomada antes de prometer beta externo.

## Decisao
O starter AlwaysTrack adota **storage local privado como contrato local-first** para desenvolvimento, demo e ambientes com controle total do filesystem.

A interface `StorageProvider` ja existe no codigo e permite substituicao futura. Para producao com alta disponibilidade, backup gerenciado ou deploy multi-instancia, o contrato correto e um **provider externo** (ex.: S3-compatible, GCS). A implementacao de um provider externo exige uma task propria com:
- criacao de um novo adapter implementando `StorageProvider`;
- configuracao de credenciais e bucket via env;
- revisao de URLs de download (assinadas vs. proxiadas);
- ajuste do Compose de producao para nao montar volume local como fonte de verdade.

## Alternativas consideradas
1. Manter storage local e nao documentar provider externo: rejeitado porque omite risco operacional real de persistencia em deploy multi-instancia ou container efemero.
2. Implementar provider S3 imediatamente: rejeitado porque exige credenciais e decisao de provedor antes de haver alvo beta claro.
3. Usar volume Docker persistente com backup externo: valido para instancias pequenas mono-host, mas nao escalavel; pode ser documentado como receita opcional no Compose.

## Consequencias
- positivas: starter funciona localmente sem credenciais externas; arquivos nunca saem do servidor na demo.
- negativas: deploy multi-instancia ou container efemero perde arquivos se o volume nao for persistido externamente.
- trade-offs: zero dependencia externa agora, migracao de provider quando houver necessidade real de escala ou resiliencia.

## Impacto em artefatos
- specs relacionadas: n/a
- tasks relacionadas: docs/tasks/ROADMAP.md item 4
- runbooks relacionados: docs/runbooks/RUNBOOK-001-ambiente-local.md, docs/runbooks/RUNBOOK-002-deploy-producao-jobs.md

## Validacao e evidencia esperada
- validacao: `STORAGE_PROVIDER=local` em `.env.example`; `LocalStorageProvider` e o unico adapter presente.
- evidencia: este ADR registrado, ROADMAP item 4 fechado.

## Fora de escopo
Esta ADR nao implementa o provider externo. A implementacao deve ser feita em task propria quando houver decisao de deploy sem filesystem local persistente.
