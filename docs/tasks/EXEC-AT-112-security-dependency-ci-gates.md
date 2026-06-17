# EXEC-AT-112 - Seguranca: dependencias, SCA e gates no CI

## Resultado
- status: completed
- date: 2026-06-17
- task: docs/tasks/TASK-AT-112-dependency-sca-and-ci-security-gates.md

## Entrega
Criado gate local de dependencias e ampliado repo hygiene para segredo acidental.

## Escopo coberto
1. `package.json` recebeu `security:deps` com `npm audit --audit-level=high --omit=dev`.
2. `scripts/check-repo-hygiene.js` agora escaneia arquivos versionados para padroes obvios de segredo.
3. Politica de severidade, excecoes e CI recomendado em `docs/operations/security-dependency-ci-gates.md`.
4. Workflow GitHub nao foi editado porque `.github` esta fora do escopo de escrita deste slice.

## Validacao
- `npm run repo:hygiene`
- `npm run security:deps` passou no gate alto/critico apos atualizacao nao forcada de dependencias.
- `git diff --check`

## Risco residual
- `npm audit --omit=dev` ainda reporta itens baixos/moderados em `esbuild` e `uuid` transitivo via `exceljs`; nao foi aplicado `npm audit fix --force` por risco de breaking change.
