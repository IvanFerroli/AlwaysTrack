# TASK-AT-140 - Scriptoteca: editar e reordenar pacotes

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-06-18
- source-of-truth: docs/tasks/TASK-AT-140-script-pack-edit-reorder.md

## Modo
- mode: implementation

## Objetivo unico
Completar o MVP de pacotes da Scriptoteca permitindo editar pacotes existentes e ajustar a ordem dos scripts sem depender de migration nova.

## Contexto minimo
`TASK-AT-126` criou pacotes e a API ja expos `PATCH /v1/script-library/packs/:packId`, mas a UI inicial so criava novos roteiros. Para uso real, Supervisor/Admin precisa corrigir nome, vinculos, status, tags e ordem dos passos.

## Inputs
- Follow-up registrado no roadmap apos `EXEC-AT-126`.
- API de update ja entregue em `TASK-AT-126`.

## Dependencias
- satisfeitas: `TASK-AT-126`.
- em aberto: n/a.

## Alvos explicitos
1. `apps/web/src/views/script-library.tsx`
2. `apps/web/src/styles.css`
3. `docs/tasks/ROADMAP.md`

## Fora de escopo
- Drag and drop.
- Exclusao definitiva de pacote.
- Historico/versionamento de pacote.

## Checklist
1. Permitir carregar um pacote existente no formulario.
2. Salvar via `PATCH` quando houver pacote em edicao.
3. Permitir subir/descer/remover scripts do roteiro antes de salvar.
4. Preservar criacao de novo pacote.
5. Registrar execucao no roadmap.

## Acceptance Criteria
1. Supervisor/Admin edita pacote sem recriar.
2. Ordem dos scripts pode ser alterada visualmente.
3. Salvar pacote editado chama endpoint de update.
4. Limpar formulario volta ao modo de criacao.

## Definition of Done
1. UI implementada.
2. Typecheck web aprovado.
3. Documentacao atualizada.

## Validacao
- comandos/checks: `npm run typecheck --workspace @alwaystrack/web`
- revisao manual: abrir Scriptoteca > Gestao, editar um roteiro, reordenar passos e salvar.

## Evidencia esperada
- Botao `Editar` em roteiros.
- Controles `Subir`, `Descer`, `Remover`.
- Botao alterna entre `Criar roteiro` e `Salvar roteiro`.

## Riscos
- Controles de ordem por botoes sao menos fluidos que drag and drop, mas sao mais seguros para MVP.

## Blockers possiveis
- n/a.

## Retorno esperado
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
