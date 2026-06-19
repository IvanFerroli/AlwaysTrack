# TASK-AT-153 - Scriptoteca: drag/drop de pacotes e versionamento de roteiros

## Metadata
- status: proposed-watchlist
- owner: olympus-orchestrator
- last-updated: 2026-06-19
- source-of-truth: docs/tasks/TASK-AT-153-script-library-pack-drag-drop-versioning.md

## Modo
- mode: implementation

## Objetivo unico
Adicionar reordenacao por drag/drop e historico/versionamento mais claro em roteiros da Scriptoteca se o uso operacional mostrar dor real.

## Contexto minimo
A Scriptoteca ja tem pacotes, scripts, governanca, metricas e validacao runtime. Este follow-up melhora ergonomia, mas nao e bloqueador de produto.

## Inputs
- Feedback de uso real da Scriptoteca.
- Lista de roteiros que precisam reordenacao frequente.

## Dependencias
- satisfeitas: `TASK-AT-126`, `TASK-AT-140`, `TASK-AT-142`.
- em aberto: evidencia de dor de uso.

## Alvos explicitos
1. Web Scriptoteca/Fluxos.
2. Services de pacotes/roteiros.
3. Testes de regressao de ordem.

## Fora de escopo
- Redesenhar a Scriptoteca inteira.
- Criar colaboracao em tempo real.

## Checklist
1. Definir UX de reorder.
2. Persistir ordem de forma auditavel.
3. Expor historico de versao relevante.
4. Cobrir regressao.

## Acceptance Criteria
1. Admin reordena pacotes/roteiros sem perder conteudo.
2. Ordem persiste apos reload.
3. Historico indica quem alterou e quando.

## Definition of Done
1. Testes API/UI relevantes.
2. Docs de uso atualizadas.
3. Smoke de Scriptoteca passa.

## Validacao
- comandos/checks: typecheck web/api, testes API, smoke Playwright se aplicavel.
- revisao manual: reorder em tela real.

## Evidencia esperada
- EXEC com antes/depois e comandos.

## Riscos
- Adicionar complexidade visual sem ganho.
- Quebrar atendimento rapido.

## Blockers possiveis
- Falta de feedback operacional.

## Retorno esperado
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
