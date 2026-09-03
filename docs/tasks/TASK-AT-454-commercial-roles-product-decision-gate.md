# TASK-AT-454 - Decidir destino dos papéis comerciais ativos

## Metadata
- status: proposed-human-input-required
- pipeline: BLOCKED_BY_DECISION
- classified-by: olympus-taskyfier run #2 (2026-09-03) — audit repo-wide `docs/testing/product-ux-repo-wide-audit-2026-09-03.md`, finding `ATUX-001` (seção K.1, Grupo A: nenhuma derivação do domínio comercial antes desta decisão)
- owner: Product Owner
- last-updated: 2026-09-02
- source-of-truth: docs/tasks/TASK-AT-454-commercial-roles-product-decision-gate.md
- mode: discovery-decision
- priority: P0
- severity: critical
- confidence: high
- estimated-effort: 2-4h de decisão e consolidação documental
- execution-order: gate humano em paralelo; antecede qualquer mudança em papéis, navegação ou sunset de Vendas

## Objetivo único
Registrar uma decisão explícita e aceita de produto para `FINANCEIRO`, `VENDEDOR` e `SUPERVISOR`: preservar seus jobs comerciais ativos ou promover formalmente o sunset de Vendas e governar o destino das contas e permissões remanescentes.

## Contexto e evidência referenciada
O finding `UX-001` do audit `UXREQ-ALWAYSTRACK-ACTIVE-AUDIT-20260902-001` encontrou os três papéis autenticando e chegando a Perfil com apenas Perfil/Como usar, enquanto `SPEC-AT-001` e a concluída `TASK-AT-351` ainda atribuem jobs/grupo de Vendas. Em sentido oposto, `TASK-AT-362` e `TASK-AT-381` propõem aposentadoria, mas não foram promovidas como nova autoridade aceita. O código compartilhado ainda declara papéis e permissões comerciais; testes unitários ocultam Vendas e E2E ainda esperam os jobs comerciais.

Evidência visual é apenas a referência advisory `INS-019`, `INS-020` e `INS-021` dentro do audit. Os PNGs transitórios não são copiados, promovidos nem usados para fechar este gate.

## Escopo
1. PO escolher e registrar uma das duas direções: preservar jobs comerciais ou promover sunset.
2. Identificar a fonte canônica que substitui/reafirma `SPEC-AT-001` e resolve o conflito com `TASK-AT-351`/`381`.
3. Para cada um dos três papéis, declarar estado futuro da conta, job de entrada, navegação, permissões, ajuda e testes.
4. Se a decisão for sunset, ratificar ou ajustar o contrato de `TASK-AT-362` antes da cadeia `365`/`366`/`381`/`385`/`389`.
5. Se a decisão for preservação, abrir task(s) de implementação separadas somente após o job e o destino de cada papel estarem aprovados.

## Fora de escopo
- Alterar código, permissões, dados, contas, navegação ou testes.
- Escolher silenciosamente uma direção com base no runtime atual.
- Executar a cadeia de aposentadoria proposta ou restaurar Vendas nesta task.

## Dependências
- satisfeitas: audit canônico, `SPEC-AT-001`, `TASK-AT-351`, propostas `TASK-AT-362`/`381` e contratos/testes atuais disponíveis.
- em aberto: decisão explícita do Product Owner e, quando aplicável, responsáveis por dados/operação para contas existentes.

## Critérios de aceite
1. Há uma decisão datada, com aprovador e fonte canônica, escolhendo preservação ou sunset.
2. `FINANCEIRO`, `VENDEDOR` e `SUPERVISOR` têm destino individual explícito: job alcançável ou descontinuação/encaminhamento governado.
3. A decisão enumera impactos obrigatórios em IA, cadastro de papéis, permissões, ajuda, testes unitários/E2E e documentação.
4. A decisão informa quais tasks existentes continuam válidas, são canceladas ou precisam ser reescritas.
5. Nenhuma implementação é roteada enquanto os itens 1 a 4 estiverem incompletos.

## Plano de validação
- Revisão conjunta PO + engenharia do registro de decisão e da matriz papel × destino.
- Conferir consistência contra `SPEC-AT-001`, `TASK-AT-351`, `TASK-AT-362`, `TASK-AT-381`, `packages/shared/src/index.ts`, testes de bootstrap/navigation e E2E de papéis críticos.
- Após decisão, Taskyfier deduplica e materializa apenas o delta de execução necessário.

## Riscos
- Aprovar sunset sem plano de contas/dados pode bloquear usuários ou apagar capacidade ainda contratada.
- Preservar jobs sem owner e fonte canônica pode reintroduzir UI incompatível com a migração SAC.
- Atualizar apenas navegação ou apenas testes perpetua o produto híbrido encontrado no audit.

## Limitações e lacunas
- O audit usou ambiente fake e não mede usuários ativos, contratos ou impacto comercial live.
- Não há evidência fornecida de decisão posterior que torne `TASK-AT-381` autoridade aceita.
- Este gate não estima implementação; o esforço de código depende da direção escolhida.

## Definição de pronto
- Decisão aceita e rastreável, matriz dos três papéis completa e handoff explícito para replanejamento técnico.

## Sugestão de commit semântico
- `docs(product): decide destino dos papeis comerciais ativos`
