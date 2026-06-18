# EXEC-AT-141 - Validacao runtime da Scriptoteca

## Metadata
- status: completed
- task: TASK-AT-141
- date: 2026-06-18

## Entrega
1. Parsers da Scriptoteca passaram a usar o helper local de validacao runtime para payloads mutantes.
2. Foram adicionados limites para titulos, corpo, comentarios, tags, scripts de pacote, flowIds e placeholders.
3. Enums de canal/status/sugestao/pacote agora rejeitam valores invalidos em vez de serem ignorados silenciosamente.
4. Handlers da Scriptoteca retornam 400 generico para `InputValidationError`.
5. Testes de contrato cobrem array de scripts grande demais e placeholders malformados.

## Validacao esperada
- `npm run test --workspace @alwaystrack/api -- validation`
- `npm run test --workspace @alwaystrack/api -- script-library`
- `npm run typecheck --workspace @alwaystrack/api`

## Risco residual
- A migracao foi intencionalmente limitada a Scriptoteca; announcements, organizations, documents, notifications, imports e reports seguem como follow-ups de `TASK-AT-107`.
