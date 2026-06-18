# TASK-AT-141 - Scriptoteca: validacao runtime de inputs

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-06-18
- source-of-truth: docs/tasks/TASK-AT-141-script-library-runtime-validation.md

## Modo
- mode: implementation

## Objetivo unico
Migrar os parsers mutantes da Scriptoteca para o helper local de validacao runtime, rejeitando payload malformado com erro 400 generico.

## Contexto minimo
`TASK-AT-107` deixou a Scriptoteca como follow-up. Depois da criacao de scripts, sugestoes, scripts pessoais e pacotes, a area passou a receber payloads maiores e mais variados; portanto precisa de limites explicitos em strings, arrays, enums e placeholders.

## Inputs
- `TASK-AT-107-runtime-input-validation-contracts.md`
- `services/api/src/core/script-library/script-library.service.ts`
- `services/api/src/core/script-library/script-library.handlers.ts`

## Dependencias
- satisfeitas: helper local `services/api/src/core/validation/input-validation.ts`
- em aberto: n/a

## Alvos explicitos
1. `services/api/src/core/script-library/script-library.service.ts`
2. `services/api/src/core/script-library/script-library.handlers.ts`
3. `services/api/src/core/validation/input-validation.test.ts`
4. `docs/architecture/api-input-validation.md`

## Fora de escopo
- OpenAPI/Zod.
- Migrar announcements, organizations, documents, notifications, imports e reports.
- Validacao de query/filtros fora da Scriptoteca.

## Checklist
1. Aplicar `parseObjectPayload` nos payloads da Scriptoteca.
2. Limitar strings longas, arrays de tags/IDs e mapa de placeholders.
3. Validar enums de canal/status/sugestao/pacote.
4. Handler retorna erro generico para `InputValidationError`.
5. Cobrir payloads malformados em testes.

## Acceptance Criteria
1. Payload nao-objeto ou campo com tipo incorreto gera `InputValidationError`.
2. Arrays grandes de scripts/tags sao rejeitados.
3. Placeholder com valor nao-string e rejeitado.
4. Cliente recebe 400 generico sem eco de payload.
5. Fluxos validos existentes continuam passando.

## Definition of Done
1. Parsers migrados.
2. Handler conectado ao erro generico.
3. Testes atualizados.
4. Roadmap atualizado.

## Validacao
- comandos/checks: `npm run test --workspace @alwaystrack/api -- validation`, `npm run test --workspace @alwaystrack/api -- script-library`, `npm run typecheck --workspace @alwaystrack/api`
- revisao manual: tentar criar pacote com `scriptIds` gigante ou placeholder objeto.

## Evidencia esperada
- Testes de validação cobrindo Scriptoteca.
- Documentacao de cobertura atualizada.

## Riscos
- Frontend com payload divergente pode receber 400. Typecheck/testes atuais cobrem formato usado pelo app.

## Blockers possiveis
- n/a.

## Retorno esperado
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
