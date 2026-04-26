# SPEC-002 - Job Acquisition

## Metadata
- status: accepted
- owner: olympus-docs-formalizer
- last-updated: 2026-04-26
- source-of-truth: docs/specs/SPEC-002-job-acquisition.md

## Objetivo unico
Converter entradas multimodais em payload de ingestao confiavel com trilha de evidencia.

## Fronteira
- inclui: `POST /v1/jobs/acquire`.
- nao inclui: scraping automatico de fontes e ranking.

## Contrato observavel
- entrada: `JobAcquisitionInput`.
- saida: `ApiResult<JobAcquisitionResult>`.
- metodos suportados: `smart-paste`, `url-import`, `ats-adapter`, `browser-capture`, `email-alert`, `provider-json`.
- evidencia obrigatoria: `JobAcquisitionEvidence` com parser/confidence/notes.

## Limites
- hosts locais/privados devem ser bloqueados na aquisicao URL.
- sem scraping autenticado/captcha bypass.

## Observabilidade minima
- logs de decisao e skill execution em caso de sucesso/falha.
- dedupe refletido no bloco `ingestion` da resposta.

## Acceptance Criteria
1. Cada metodo valido resulta em payload de ingest ou erro controlado.
2. Resposta inclui bloco de evidencia da aquisicao.
3. Dedupe em acquisition nao duplica vaga persistida.

## Definition of Done
1. Endpoint de acquisition estavel para metodos declarados.
2. Fluxo de dedupe/evidencia validado por testes.

## Validacao
- comandos/checks:
  - `npm run test --workspace @olympus/api -- src/features/acquisition/acquisition.service.test.ts`
- revisao manual:
  - executar acquisition com `smart-paste` e validar `evidence`.

## Evidencia esperada
- resposta com `data.evidence` preenchido.
- cenario deduplicado com `ingestion.deduplicated=true`.

## Riscos e mitigacao
- risco: parser frouxo gerar ingestao com baixa qualidade.
- mitigacao: validar campos obrigatorios e confidence por metodo.
