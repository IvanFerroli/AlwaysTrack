# EXEC-AT-095 - Scriptoteca: vinculos com Wiki e FAQ

## Resultado
- status: completed
- date: 2026-06-13
- task: docs/tasks/TASK-AT-095-script-library-wiki-faq-links.md

## Entrega
Scripts agora podem apontar para uma pagina Wiki e/ou thread FAQ relacionada, mantendo a separacao de dominio: Wiki como procedimento, FAQ como pergunta e Scriptoteca como texto pronto de atendimento.

## Escopo coberto
1. Campos `wikiPageId` e `faqThreadId` no modelo `OperationalScript`.
2. Relacoes Prisma com `WikiPage` e `FaqThread`.
3. API valida que Wiki/FAQ pertencem a mesma organizacao antes de salvar.
4. UI gerencial permite escolher Wiki/FAQ relacionada ao criar ou editar script.
5. Preview mostra botoes para abrir Wiki, FAQ e Wiki originada da FAQ.
6. Seed demo vincula script a Wiki/FAQ de conferencia de DANFE.

## Validacao
- `npm run test --workspace @alwaystrack/api -- script-library.service.test.ts`
- `npm run db:test:migrations`
- `npm run build --workspace @alwaystrack/web`

## Risco residual
- A abertura da FAQ ainda leva para a aba FAQ geral; deep-link por thread pode virar uma melhoria futura se a tela ganhar selecao por ID.
