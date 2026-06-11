# TASK-AT-065 - Demo readiness, empty states and audit search

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-06-11
- source-of-truth: docs/tasks/TASK-AT-065-demo-readiness-empty-states-and-audit.md

## Modo
- mode: product-readiness

## Objetivo unico
Preparar o AlwaysTrack para apresentacao como produto acabado, com seed bonito, estados vazios úteis e auditoria consultavel.

## Contexto minimo
Um produto interno precisa parecer confiavel mesmo quando nao ha dados. Tambem precisa permitir explicar o que aconteceu via auditoria durante demo e operacao.

## Inputs
- Roteiro de demo desejado.
- Dados ficticios aceitaveis para apresentacao.

## Dependencias
- satisfeitas: seed comercial, auditoria e telas principais existem.
- em aberto: prints/ajustes visuais ficam para `TASK-AT-066`.

## Alvos explicitos
1. Criar checklist/roteiro de demo em docs.
2. Melhorar seed demo com vendedores, notas aprovadas, wiki, FAQ e notificacoes.
3. Revisar estados vazios das telas principais.
4. Melhorar filtros da auditoria por usuario, acao, entidade e data.
5. Garantir que estados vazios orientem a proxima acao sem texto excessivo.

## Fora de escopo
- Mudanca visual pixel-perfect por prints.
- Dados reais de cliente.
- Narrativa comercial/landing page.

## Checklist
1. Mapear telas da demo.
2. Ajustar seed/demo fixtures.
3. Revisar empty states.
4. Implementar filtros de auditoria faltantes.
5. Validar demo ponta a ponta.

## Acceptance Criteria
1. Demo limpa consegue mostrar vendas, ranking, wiki, FAQ e notificacoes.
2. Telas sem dados nao parecem quebradas.
3. Auditoria permite encontrar eventos por filtros principais.
4. Roteiro de demo esta documentado.

## Definition of Done
1. Demo checklist entregue.
2. Seed e estados vazios testados.
3. `npm run test:all` passa.

## Validacao
- comandos/checks: `npm run prisma:seed`, `npm run test --workspace @alwaystrack/api -- audit.service.test.ts`, `npm run test:all`
- revisao manual: seguir roteiro de demo em ambiente limpo.

## Evidencia esperada
- Documento de roteiro.
- Print de estados vazios principais e auditoria filtrada.

## Riscos
- Seed muito artificial pode mascarar falhas de fluxo real.
- Empty state com texto demais deixa UI com cara de manual.

## Blockers possiveis
- Falta de decisao sobre historia da demo.

## Retorno esperado
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Execucao
- `EXEC-AT-064`: roteiro de demo, seed comercial reforcado, estados vazios orientativos e auditoria com busca parcial por acao/data final inclusiva.
