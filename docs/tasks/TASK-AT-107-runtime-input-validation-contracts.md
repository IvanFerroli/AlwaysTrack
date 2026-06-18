# TASK-AT-107 - Seguranca: validacao runtime de entrada e contratos de API

## Metadata
- status: completed-first-slice
- owner: olympus_taskyfier
- last-updated: 2026-06-18
- source-of-truth: docs/tasks/TASK-AT-107-runtime-input-validation-contracts.md

## Modo
- mode: implementation

## Objetivo unico
Padronizar validacao de inputs da API com contratos runtime, reduzindo payload malformado, injection logica e comportamento inesperado.

## Contexto minimo
O projeto ja possui parsers manuais em varios services (`parseSalesDocumentReviewInput`, `parseWikiPageInput`, `parseFaqThreadInput`, etc.). Eles funcionam, mas a regra fica espalhada e alguns campos fazem cast direto com `String`, `Number` ou `body as Record<string, unknown>`.

Validacao runtime significa conferir o dado enquanto a API esta rodando, nao apenas confiar no TypeScript. TypeScript protege o dev; atacante manda JSON livre.

## Inputs
- `services/api/src/core/sales-documents/sales-documents.service.ts`
- `services/api/src/core/wiki/wiki.service.ts`
- `services/api/src/core/faq/faq.service.ts`
- `services/api/src/core/announcements/announcements.service.ts`
- `services/api/src/core/script-library/script-library.service.ts`
- `services/api/src/core/users/users.service.ts`
- `services/api/src/core/organizations/organizations.service.ts`

## Dependencias
- satisfeitas: parsers manuais existentes.
- em aberto: decidir biblioteca de schema (`zod`, `joi` ou helper local). Preferencia: menor dependencia que resolva bem.

## Alvos explicitos
1. Padrao de schema/parse reutilizavel.
2. Contratos para rotas mutantes criticas.
3. Mensagens de erro seguras, sem ecoar payload sensivel.
4. Testes de payload invalido.
5. Documentacao de como criar novo endpoint seguro.

## Explicacao simples
Sem validacao forte, alguem pode mandar campos enormes, tipos errados, valores negativos, status inexistentes ou arrays gigantes. Mesmo que nao vire invasao direta, pode gerar bug, lentidao ou dado corrompido.

## Fora de escopo
- Reescrever todos os parsers do projeto de uma vez.
- Gerar OpenAPI completo.
- Mudar frontend.

## Checklist
1. Escolher abordagem de schema.
2. Comecar por rotas criticas: auth/login, users, sales review/manual correction, wiki page/edit request, FAQ thread/comment, announcements, script library.
3. Limitar tamanho de strings e arrays por campo.
4. Validar enums usando listas canonicas do shared.
5. Garantir page/pageSize com teto maximo.
6. Testar payloads maliciosos: objeto aninhado gigante, string enorme, numero negativo, enum invalido.

## Acceptance Criteria
1. Rotas criticas rejeitam payload invalido com 400.
2. Erro nao devolve stack trace nem payload sensivel.
3. Existe padrao documentado para novas rotas.
4. Page size maximo e respeitado.
5. Testes cobrem pelo menos cinco payloads malformados.

## Definition of Done
1. Helper/schema base criado.
2. Primeira leva de endpoints migrada.
3. Testes unitarios/API atualizados.
4. Documento de convencao criado em `docs/architecture/api-input-validation.md`.

## Validacao
- comandos/checks: `npm run test --workspace @alwaystrack/api -- validation`, `npm run test:e2e:api`
- revisao manual: tentar payloads invalidos em rotas principais.

## Evidencia esperada
- Testes de 400 para payload invalido.
- Exemplo de schema no documento.

## Riscos
- Mudanca ampla demais pode quebrar telas por pequenas diferencas de payload.
- Mensagens muito genericas podem dificultar debug; equilibrar seguranca e operacao.

## Blockers possiveis
- Escolha de dependencia nova se o projeto quiser evitar pacote extra.

## Retorno esperado
- Lista de endpoints cobertos.
- Lista de endpoints restantes para rodada futura.

## Execution notes
- 2026-06-17: EXEC-AT-107 abriu a primeira fatia pequena com helper local em `services/api/src/core/validation/input-validation.ts`, handlers 400-safe e parsers criticos em auth/users/sales-documents/wiki/faq.
- Evidencia: `npm run test --workspace @alwaystrack/api -- validation`, suite focada de parsers tocados e `npm run typecheck --workspace @alwaystrack/api` passaram.
- Documento de convencao criado em `docs/architecture/api-input-validation.md`.
- Restante: announcements, script-library, organizations e demais parsers em rodadas futuras.
