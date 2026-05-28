# TASK-UX-002 - Componentes operacionais de UI

## Metadata
- status: completed
- owner: frontend implementer
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-UX-002-componentes-operacionais-ui.md

## Modo
- mode: implementation

## Agentes sugeridos
- frontend implementer
- UX reviewer
- `olympus_task_verifier`

## Objetivo unico
Padronizar tabelas, filtros, formularios e badges de status para evitar UI inconsistente.

## Inputs
- documento central, secoes 5.1, 7, 8 e 21.5

## Dependencias
- satisfeitas: `TASK-UX-001`
- em aberto: n/a

## Alvos explicitos
1. tabela operacional
2. filtros/busca/paginacao base
3. estados loading/empty/error/success
4. badges separados para LicenseStatus, DocumentStatus e NotificationStatus

## Fora de escopo
- design system extenso
- marketing/landing page

## Acceptance Criteria
1. Telas principais reutilizam componentes previsiveis.
2. Status de licenca, documento e notificacao sao visualmente distintos.
3. Estados vazios e de erro existem antes das telas ficarem cheias de dados.
4. Acoes destrutivas ou sensiveis pedem confirmacao.

## Validacao
- revisao visual desktop/mobile
- smoke em tela com zero, poucos e muitos registros

## Riscos
- UI parecer prototipo ou confundir status diferentes

## Execucao
- Criados componentes operacionais reutilizaveis para filtros, tabela, estados, resumo de paginacao, badges de status e confirmacao de acao sensivel.
- Tela de auditoria passou a usar os componentes compartilhados.
- Tela de configuracoes usa os mesmos componentes para organizacao, unidades e setores.
- Badges separados por tipo visual: licenca, documento, notificacao e ativo/inativo.

## Evidencias
- `apps/web/src/components/operational.tsx`
- `apps/web/src/main.tsx`
- `npm run build --workspace @alwaystrack/web`
- `npm run check`
