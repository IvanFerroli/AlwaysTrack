# Security Dependency And CI Gates

## Metadata
- status: active
- owner: ops/security
- last-updated: 2026-06-17
- source-of-truth: docs/operations/security-dependency-ci-gates.md

## Objetivo
Definir os gates locais e de CI para dependencia vulneravel, segredo acidental e higiene de repositorio.

## Gates locais
```bash
npm run security:deps
npm run repo:hygiene
npm run env:check -- --production
```

- `security:deps` usa `npm audit --audit-level=high --omit=dev`.
- `repo:hygiene` bloqueia envs sensiveis, bancos locais, docs gerados e padroes obvios de segredo em arquivos versionados.
- `env:check -- --production` bloqueia configuracao local ou incompleta para deploy.

## Politica de severidade
- Alta ou critica em dependencia de producao: bloqueia release ate upgrade, mitigacao ou excecao documentada.
- Moderada em dependencia de producao: avaliar em ate 7 dias.
- Dev-only: avaliar risco real de CI, build e maquina de operador.
- Falso positivo: documentar regra, evidencia e data de revisao.

## Excecoes
Uma excecao deve ter:
- pacote, versao e advisory;
- motivo para nao corrigir agora;
- mitigacao aplicada;
- dono e data de expiracao;
- comando que reproduz o alerta.

## CI recomendado
O workflow existente deve adicionar, em job separado ou no job `quality`, os comandos:

```bash
npm run security:deps
npm run repo:hygiene
```

Este slice nao editou `.github/workflows/check.yml` porque `.github` esta fora do escopo de escrita definido para a tarefa.

## Primeira execucao
Em 2026-06-17:
- `npm run repo:hygiene`: passou apos ajuste de falsos positivos.
- `npm run env:check -- --production`: falhou corretamente sem envs de producao locais.
- `npm run security:deps`: passou no gate alto/critico apos `npm audit fix --omit=dev` e restauracao com `npm install`.
- Risco residual conhecido: `npm audit --omit=dev` ainda reporta itens baixos/moderados em `esbuild` e `uuid` transitivo via `exceljs`; nao foi usado `npm audit fix --force` para evitar downgrade/breaking change.
