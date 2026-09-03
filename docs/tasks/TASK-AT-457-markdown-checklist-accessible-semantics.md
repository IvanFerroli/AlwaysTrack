# TASK-AT-457 - Corrigir semântica acessível de checklists Markdown

## Metadata
- status: completed-with-risk
- owner: Runtime Builder Web
- last-updated: 2026-09-02
- source-of-truth: docs/tasks/TASK-AT-457-markdown-checklist-accessible-semantics.md
- mode: implementation
- priority: P1
- severity: medium
- confidence: high
- estimated-effort: 4-6h
- execution-order: 2, independente de TASK-AT-454 e TASK-AT-456

## Objetivo único
Fazer o renderer compartilhado de checklist Markdown expor estado e texto com semântica coerente, sem controles sem nome acessível em Fluxos, Wiki e FAQ.

## Contexto e evidência referenciada
O finding `UX-004` do audit `UXREQ-ALWAYSTRACK-ACTIVE-AUDIT-20260902-001` encontrou `unnamed-interactive` nas três superfícies. Em `apps/web/src/components/markdown-editor.tsx`, cada linha `- [ ] texto` vira um `input[type=checkbox][readOnly]` separado do `<span>` textual, sem associação programática. O conteúdo atual é renderizado como informativo; tornar checklist editável exigiria regra de negócio e persistência não existentes.

As referências advisory são `INS-011`, `INS-013` e `INS-014`; os PNGs não devem ser copiados ou promovidos. Validação task-backed deve readquirir evidência.

## Escopo
1. Definir e implementar no `MarkdownContent` um contrato informativo único para itens marcados/desmarcados, preservando texto e estado perceptíveis sem simular ação disponível.
2. Ajustar estilos de `.wiki-check-item` somente quando necessário para manter diferenciação visual.
3. Cobrir o renderer compartilhado em teste unitário e validar consumidores em Fluxos, Wiki e FAQ.
4. Garantir que checklists no preview do editor usem o mesmo contrato.

## Fora de escopo
- Tornar checklists interativos, persistir marcação por usuário ou adicionar workflow.
- Trocar biblioteca/reescrever o parser Markdown.
- Corrigir checkboxes reais de formulários, que já possuem outro contrato.

## Dependências
- satisfeitas: renderer compartilhado e gate de acessibilidade `TASK-AT-312` disponíveis.
- em aberto: nenhuma para o contrato informativo. Se PO pedir checklist acionável, interromper e abrir task de produto separada.

## Critérios de aceite
1. Fluxos, Wiki e FAQ retornam zero `unnamed-interactive` para conteúdo com checklists.
2. Cada item marcado/desmarcado possui texto e estado determináveis por tecnologia assistiva, sem foco/ação de teclado falsa.
3. A distinção visual entre marcado e desmarcado permanece perceptível e não depende apenas de cor.
4. Listas Markdown comuns e demais recursos do renderer não regridem.
5. Preview e conteúdo publicado produzem a mesma semântica.

## Plano de testes
- Expandir `apps/web/test/accessibility.test.tsx` com `MarkdownContent` contendo itens marcado/desmarcado; consultar por semântica esperada e executar o helper crítico.
- Teste de regressão para lista não-checklist e preview do `MarkdownEditor`.
- Playwright task-backed nas três superfícies seedadas; executar o sinal `unnamed-interactive`.
- Revisão manual com ao menos uma tecnologia assistiva disponível; se indisponível, registrar `manual-needed` e não declarar essa parcela concluída.
- Rodar Vitest focal, E2E focal, build/typecheck Web e `git diff --check`.

## Riscos
- Apenas adicionar `aria-label` pode manter a falsa expectativa de interatividade do checkbox read-only.
- Remover o input sem expor o estado programaticamente perde informação para leitor de tela.
- Alteração no renderer compartilhado afeta Scriptoteca, Avisos e outros consumidores além das três telas auditadas.

## Limitações e lacunas
- O audit usou automação/inspeção estrutural e não executou NVDA, VoiceOver ou TalkBack.
- O comportamento desejado é assumido como informativo a partir do código atual; interatividade depende de decisão de produto futura.

## Definição de pronto
- Testes do renderer e das três superfícies passam, zero controles sem nome é comprovado e a leitura manual do estado é registrada.

## Fechamento — 2026-09-02
- implementação: commits `56f2f35f` (`fix(web): torna checklist markdown semanticamente acessivel`) e `3dfa6bbd` (`test(e2e): cobre checklists markdown compartilhados`), publicados em `origin/main`.
- validação do builder: Vitest focal 6/6; Web completo 28 arquivos/171 testes; typecheck e build aprovados; Playwright focal 1/1 com Fluxos, Wiki e FAQ; três snapshots task-backed inspecionados em resolução original.
- verificação independente: `GO-WITH-RISK`; toda a validação automatizada foi reexecutada e aprovada, sem regressão funcional identificada.
- critérios fechados: zero checkbox/tabstop falso; estado `Concluído`/`Pendente` associado ao texto na árvore de acessibilidade; distinção visual por glifo e tachado, não apenas cor; lista comum preservada; preview e publicado reutilizam `MarkdownContent` com a mesma semântica.
- risco residual aceito: demais recursos Markdown não receberam um teste focal novo, embora a suíte Web completa tenha passado; anúncio exato varia por leitor/browser.
- manual-needed: Orca, NVDA e Narrator não estavam disponíveis no host, portanto leitura com tecnologia assistiva real não foi alegada nem registrada como concluída.

## Sugestão de commit semântico
- `fix(web): torna checklist markdown semanticamente acessivel`
