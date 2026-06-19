# TASK-AT-152 - Google Sheets/Drive com timeout e redaction

## Metadata
- status: completed
- owner: olympus-orchestrator
- last-updated: 2026-06-19
- completed: 2026-06-19
- source-of-truth: docs/tasks/TASK-AT-152-google-sheets-drive-external-fetch-hardening.md

## Modo
- mode: implementation

## Objetivo unico
Migrar chamadas do template Google Sheets/Drive para o helper `externalFetch`, padronizando timeout operacional e preparando redaction de erro externo.

## Contexto minimo
`TASK-AT-148` cobriu OAuth Google e Meta WhatsApp. O template nativo de Sheets ainda chamava `fetcher` diretamente.

## Inputs
- `services/api/src/core/integrations/external-http.ts`
- `services/api/src/core/imports/google-sheets-template.service.ts`

## Dependencias
- satisfeitas: `TASK-AT-148`.
- em aberto: n/a.

## Alvos explicitos
1. `services/api/src/core/imports/google-sheets-template.service.ts`
2. `services/api/src/core/imports/google-sheets-template.service.test.ts`
3. `docs/tasks/ROADMAP.md`

## Fora de escopo
- Trocar credenciais Google.
- Reescrever o fluxo legado de importacao de profissionais.

## Checklist
1. Importar `externalFetch`.
2. Envolver token, Sheets e Drive calls com operation name.
3. Validar testes existentes.
4. Registrar EXEC.

## Acceptance Criteria
1. Todas as chamadas Google do template usam timeout.
2. Testes existentes continuam passando.
3. Docs apontam task como concluida.

## Definition of Done
1. Typecheck API verde.
2. Teste de Google Sheets template verde.
3. Roadmap atualizado.

## Validacao
- comandos/checks: `npm run typecheck --workspace @alwaystrack/api`, `npm run test --workspace @alwaystrack/api -- google-sheets-template.service.test.ts`.
- revisao manual: n/a.

## Evidencia esperada
- EXEC com arquivos alterados e comandos.

## Riscos
- Testes que inspecionam argumentos do fetch precisam aceitar `signal`.

## Blockers possiveis
- n/a.

## Retorno esperado
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Resultado
- `google-sheets-template.service.ts` passou a usar `externalFetch` em:
  - token service account;
  - criacao de spreadsheet;
  - criacao em pasta Drive;
  - leitura de metadados;
  - batch update de valores;
  - batch update de formatacao;
  - compartilhamento Drive.
- Cada chamada ganhou `operation` nomeada e timeout de 15s.
