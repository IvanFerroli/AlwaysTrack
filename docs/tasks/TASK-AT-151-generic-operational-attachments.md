# TASK-AT-151 - Entidade generica de anexos operacionais

## Metadata
- status: proposed-watchlist
- owner: olympus-orchestrator
- last-updated: 2026-06-19
- source-of-truth: docs/tasks/TASK-AT-151-generic-operational-attachments.md

## Modo
- mode: planning

## Objetivo unico
Unificar anexos de Wiki, FAQ, Avisos, Fluxos e Scriptoteca em um contrato operacional comum se a duplicacao virar custo real.

## Contexto minimo
`TASK-AT-146` fechou arquivamento auditavel de anexos da Wiki. Ainda nao ha prova de que uma entidade generica traga ganho maior que o risco de refatoracao.

## Inputs
- Lista de superficies com anexo ativo.
- Dores reais de duplicacao ou bug.

## Dependencias
- satisfeitas: `TASK-AT-101`, `TASK-AT-146`.
- em aberto: evidencia de dor transversal.

## Alvos explicitos
1. Prisma models de conteudo rico.
2. Services de Wiki/FAQ/Avisos/Fluxos/Scriptoteca.
3. API de upload/download.

## Fora de escopo
- Refatorar sem necessidade demonstrada.
- Migrar arquivos sem plano de compatibilidade.

## Checklist
1. Mapear anexos existentes.
2. Definir contrato generico.
3. Planejar migration compatível.
4. Implementar em slice pequeno.

## Acceptance Criteria
1. Nenhuma superficie perde anexos existentes.
2. Acesso respeita organizacao e role.
3. Arquivamento preserva auditoria.

## Definition of Done
1. Migration validada.
2. Testes anti-IDOR.
3. Docs de compatibilidade.

## Validacao
- comandos/checks: typecheck, testes API, migrations.
- revisao manual: upload/download/arquivamento por superficie.

## Evidencia esperada
- Matriz antes/depois de entidades.
- Smoke de pelo menos duas superficies.

## Riscos
- Refatoracao ampla sem ganho visivel.
- Quebra de markdown antigo.

## Blockers possiveis
- Falta de evidencia de necessidade.

## Retorno esperado
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
