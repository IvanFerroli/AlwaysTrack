# TASK-ACQ-002 - ATS adapters especificos

## Metadata
- id: TASK-ACQ-002
- titulo: Adicionar adapters ATS especificos ao acquisition layer
- modo-de-geracao: continuidade guiada
- capability: job-acquisition
- origem-documental: TASK-ACQ-001, acquisition service, git log
- status: completed-with-remarks
- owner: codex
- last-updated: 2026-04-25

## Objetivo unico
Adicionar parsers isolados para plataformas ATS e job boards comuns, preservando o contrato existente de acquisition e sem abrir automacao externa.

## Escopo implementado
- `services/api/src/features/acquisition/ats-adapters.ts`
- Integracao em `services/api/src/features/acquisition/acquisition.service.ts`
- Cobertura em `services/api/src/features/acquisition/acquisition.service.test.ts`

## Plataformas cobertas
- Gupy
- Solides
- LinkedIn
- Indeed
- Glassdoor
- Infojobs
- Catho
- Trabalha Brasil

## Fora de escopo
- Login em plataformas fechadas.
- Bypass de paywall, captcha ou anti-bot.
- Crawling agentico persistente.
- Envio automatico de candidatura.

## Evidencia atual
- `npm run check` passou em 2026-04-25 com 50 testes.
- Testes cobrem parse basico por plataforma, bloqueio de hosts locais/privados e host matching contra suffix malicioso.
- `npm run build` passou em 2026-04-25.

## Riscos remanescentes
- HTML de terceiros muda frequentemente; adapters devem permanecer best-effort.
- Plataformas com conteudo renderizado via JS podem exigir browser capture/manual paste.
- Acquisition remoto ainda deve ser tratado como import assistido, nao crawler irrestrito.

## Proximo passo recomendado
Adicionar smoke test web/API automatizado antes de expandir mais a superficie de ingestion.
