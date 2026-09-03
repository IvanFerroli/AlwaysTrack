# TASK-AT-461 - Preservar relação tab/panel no vazio de Escalas

## Metadata
- status: proposed
- owner: Runtime Builder Web
- last-updated: 2026-09-03
- source-of-truth: docs/tasks/TASK-AT-461-schedules-empty-tabpanel-relationship.md
- mode: implementation
- priority: P1
- severity: medium
- confidence: high
- estimated-effort: 2-4h
- execution-order: 3

## Objetivo único
Garantir que a aba ativa de Escalas sempre controle um `tabpanel` existente e nomeado, inclusive para GESTOR sem equipe selecionada e nos estados loading/error.

## Contexto e evidência referenciada
O finding `UX-C04` do audit `UXREQ-ALWAYSTRACK-COMPLEMENTARY-AUDIT-20260903-001` encontrou `active-aria-controls-missing:1`. Em `apps/web/src/views/support-schedules.tsx`, as tabs sempre apontam para `support-schedules-${key}-panel`, mas o ramo `canManage && !teamId` renderiza `OperationalState` fora de qualquer painel. As tasks amplas `TASK-AT-312/411` não corrigem esse ramo específico.

Referência advisory: `INS-C001`. Não copiar ou promover sua captura; adquirir evidência task-backed.

## Escopo
1. Ajustar o ramo de vazio/loading/error em `support-schedules.tsx` para manter painel coerente com a aba ativa.
2. Preservar o tablist, roving `tabIndex`, setas/Home/End e painéis após selecionar equipe.
3. Adicionar teste focal para GESTOR sem equipe e regressão com equipe/calendário.

## Fora de escopo
- Alterar regra de seleção explícita de equipe, dados, permissões ou layout das escalas.
- Corrigir cenários de Performance bloqueados no audit.
- Redesenhar `OperationalState` ou o contrato global de tabs.

## Dependências
- satisfeitas: `TASK-AT-312`, `394`, `411`; helper `keyboardTabIndex` e testes de Escalas existentes.
- em aberto: nenhuma.

## Matriz de estados

| Estado | Relação esperada |
|---|---|
| sem equipe | aba selecionada aponta para tabpanel com estado vazio |
| roster loading | mesmo painel contém loading |
| roster error | mesmo painel contém erro e descrição disponível |
| equipe selecionada/loading | painel ativo existe durante carregamento do calendário |
| calendário success | alternância de tabs aponta para painel correspondente |
| keyboard | setas/Home/End movem seleção/foco sem relação órfã |

## Critérios de aceite
1. Em todos os estados da matriz, existe exatamente uma aba selecionada.
2. `document.getElementById(activeTab.getAttribute("aria-controls"))` resolve para elemento `role="tabpanel"`.
3. O painel é nomeado pela aba via `aria-labelledby` e contém o estado relevante.
4. Selecionar equipe e alternar abas preserva foco por setas/Home/End e conteúdo correto.
5. O check `active-aria-controls-missing` retorna zero.

## Validação
- Expandir `apps/web/test/support-schedules.test.tsx` para vazio, loading, erro e calendário.
- Teste de teclado/ARIA focal e Playwright task-backed de GESTOR sem equipe.
- Web typecheck/build, Vitest focal e suíte de scheduling proporcional, `git diff --check`.

## Riscos
- Envolver todos os estados num painel fixo pode associar conteúdo à aba errada quando `tab` muda.
- Renderizar tabpanel duplicado durante transição pode quebrar o critério de aba única.
- Mudança no ramo de erro pode ocultar retry ou descrição existente.

## Limitações
- O audit cobriu um viewport desktop fake e não executou leitor de tela real.
- Outros componentes de tabs não fazem parte deste escopo.

## Definição de pronto
- Toda a matriz passa sem referência ARIA órfã, teclado não regride e evidência task-backed é revisada.

## Sugestão de commit semântico
- `fix(web): associa vazio de escalas ao tabpanel ativo`
