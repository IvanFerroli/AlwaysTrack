# TASK-PRD-004 - Domínio: Status, Tags e Datas de Vagas

## Metadata
- status: pending
- owner: olympus-taskyfier
- last-updated: 2026-04-24

## Modo
- mode: planning

## Objetivo unico
Expandir os contratos e a camada de ingestão para suportar metadados gerenciais (status de candidatura, tags de usuário e data de publicação) nas vagas.

## Contexto minimo
Para que o usuário possa filtrar e organizar vagas, a base estrutural de dados `JobPosting` precisa comportar novos campos que o Scraper passará a coletar (como data de postagem) e campos mutáveis que a API gerenciará (como `tags` e `status`).

## Alvos explicitos
1. Adicionar campos em `JobPosting` (`postedAt`, `tags`, `userStatus`).
2. Adicionar os equivalentes em `IngestJobPostingInput`.
3. Ajustar `scraper.parser.ts` para tentar capturar `postedAt` de Remotive, Arbeitnow, RemoteOK e Jobicy.
4. Ajustar `ingestion.service.ts` para inicializar campos padrão (`tags: []`, `userStatus: 'new'`).

## Definition of Done
- Types atualizados e parsers capturando datas quando existirem.
- Typecheck passando.
