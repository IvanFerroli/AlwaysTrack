# Pipeline Bootstrap

## Objetivo
Iniciar qualquer projeto novo sem herdar assumptions do projeto anterior.

## Entrada esperada
- documento central em `doc/`;
- pedido do usuario ou objetivo operacional;
- restricoes conhecidas.

## Passos
1. Localizar a fonte canonica em `doc/`.
2. Ler apenas o necessario para entender objetivo, restricoes e decisoes ja tomadas.
3. Criar ou atualizar `docs/project/intake.md` usando `docs/project/_intake-template.md`.
4. Registrar decisoes estruturais como ADR somente quando forem duraveis.
5. Criar specs pequenas para capacidades reais.
6. Criar a primeira task implementavel a partir de uma spec aceita.

## Guardrails
- Nao assumir stack, dominio, arquitetura ou vendor por padrao.
- Nao copiar o documento central inteiro para `docs/`.
- Nao criar backlog amplo antes do primeiro recorte validavel.
- Nao registrar provider de LLM como dependencia do pipeline.

## Saida minima
- intake curto;
- primeira spec candidata ou task de descoberta;
- riscos e incertezas explicitas.
