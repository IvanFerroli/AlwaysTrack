# TASK-AT-112 - Seguranca: dependencias, SCA e gates no CI

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-15
- source-of-truth: docs/tasks/TASK-AT-112-dependency-sca-and-ci-security-gates.md

## Modo
- mode: implementation

## Objetivo unico
Criar verificacoes automaticas para vulnerabilidades conhecidas, segredos acidentais e regressao de seguranca.

## Contexto minimo
O projeto usa Node/TypeScript, npm lockfile, Express, Prisma, Playwright, Artillery e dependencias de parsing de PDF/XML. Bibliotecas de parsing e servidor web precisam ser monitoradas, porque vulnerabilidades novas surgem com o tempo.

SCA significa Software Composition Analysis: verificar se alguma dependencia instalada tem vulnerabilidade conhecida.

## Inputs
- `package.json`
- `package-lock.json`
- `.github/workflows/*` se existir
- `scripts/check-repo-hygiene.js`
- `docs/architecture/testing-and-docs.md`
- `services/api/package.json`
- `apps/web/package.json`

## Dependencias
- satisfeitas: scripts de check/test/docs ja existem.
- em aberto: acesso ao GitHub Actions se workflow ainda nao existir.

## Alvos explicitos
1. Script `security:deps` ou equivalente com `npm audit`/OSV.
2. Check de segredo acidental.
3. CI com job de seguranca.
4. Politica de severidade.
5. Documentacao de excecoes.

## Explicacao simples
Mesmo codigo bom pode ficar vulneravel se uma dependencia ganha CVE. O CI precisa avisar antes de publicar.

## Fora de escopo
- Corrigir todas as vulnerabilidades encontradas se exigirem grande upgrade.
- Comprar ferramenta paga.
- Pentest externo.

## Checklist
1. Avaliar `npm audit --audit-level=high` como gate inicial.
2. Avaliar OSV Scanner se for simples de integrar.
3. Adicionar busca de segredos em repo hygiene.
4. Criar workflow de CI ou estender existente.
5. Definir quando falha bloqueia merge e quando vira excecao documentada.
6. Documentar rotina mensal de atualizacao.

## Acceptance Criteria
1. CI falha para vulnerabilidade alta/critica sem excecao.
2. CI falha se segredo obvio for commitado.
3. Existe documento explicando como tratar falso positivo.
4. Lockfile continua versionado e revisado.
5. Checks rodam rapido o suficiente para uso diario.

## Definition of Done
1. Script local criado.
2. Workflow ou doc de CI atualizado.
3. Repo hygiene inclui padroes de segredo.
4. Primeira execucao registrada.

## Validacao
- comandos/checks: `npm run security:deps`, `npm run repo:hygiene`, `npm run check`
- revisao manual: conferir output de auditoria.

## Evidencia esperada
- Log do CI ou comando local.
- Lista de excecoes, se houver.

## Riscos
- `npm audit` pode gerar falso positivo ou exigir upgrade quebrador.
- Gate muito rigido pode travar desenvolvimento sem plano de excecao.

## Blockers possiveis
- Ausencia de GitHub Actions configurado.

## Retorno esperado
- Politica de severidade.
- Como rodar e interpretar os checks.
