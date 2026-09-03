# TASK-AT-460 - Decidir picker-only ou upload híbrido com drop

## Metadata
- status: proposed-human-input-required
- owner: Product Owner / Design Owner
- last-updated: 2026-09-03
- source-of-truth: docs/tasks/TASK-AT-460-markdown-file-drop-product-decision.md
- mode: discovery-decision
- priority: P2
- severity: low
- confidence: high para ausência; valor de produto não medido
- estimated-effort: 1-3h de discovery e decisão
- execution-order: gate humano em paralelo; não bloqueia TASK-AT-458/459/461/462

## Objetivo único
Decidir e documentar se o `MarkdownEditor` continuará `picker-only` ou adotará modelo híbrido `picker + drag-and-drop` para um único arquivo de imagem.

## Contexto e evidência referenciada
O finding `UX-C03` do audit `UXREQ-ALWAYSTRACK-COMPLEMENTARY-AUDIT-20260903-001` confirma ausência de affordance/handlers de drop, mas os contratos aceitos `TASK-AT-101/131/151` nunca tornaram essa interação obrigatória. `TASK-AT-153` é reordenação de scripts e não upload. O job já é possível pelo picker; o valor incremental de drop não foi medido.

As referências advisory `INS-C004-C008`, `INS-C012`, `INS-C017` e `INS-C018` não são promovíveis e não substituem decisão humana ou teste de usabilidade.

## Escopo
1. PO/Design escolher `picker-only` ou `hybrid` e registrar justificativa.
2. Confirmar superfícies abrangidas: exclusivamente os cinco consumidores do `MarkdownEditor` compartilhado.
3. Se `hybrid`, definir contrato mínimo de um arquivo, área de drop, drag-over, invalid/multiple, loading/error/retry e fallback por botão/teclado/touch.
4. Se `picker-only`, registrar que `TASK-AT-458/459` fecham a UX aprovada sem task adicional.
5. Somente após `hybrid` aprovado, o Taskyfier materializa implementação separada.

## Fora de escopo
- Implementar handlers, dropzone, CSS ou testes.
- Suporte múltiplo, upload de pasta, reordenação ou paste de clipboard.
- DANFE, CSV de profissionais, licença pública e qualquer fluxo comercial condicionado à `TASK-AT-454`.

## Dependências
- satisfeitas: inventário estrutural e audit complementar.
- em aberto: decisão explícita de Product Owner/Design Owner e evidência mínima de valor quando exigida pelo owner.

## Matriz de decisão

| Opção | Condições mínimas |
|---|---|
| picker-only | botão acessível, erro/retry resolvidos por TASK-AT-458/459 |
| hybrid | drop explícito em desktop, um arquivo, fallback universal por botão, todos os estados definidos |
| adiar | hipótese permanece backlog de discovery, sem implementação parcial |

## Critérios de aceite
1. Há decisão datada, owner e justificativa entre as opções válidas.
2. A decisão declara superfícies, arquivo único/múltiplo e fallback mobile/teclado.
3. Se `hybrid`, a matriz de estados e os limites de escopo estão aprovados antes de task técnica.
4. Nenhuma implementação é inferida ou roteada a partir deste manifesto.

## Validação
- Revisão PO/Design/engenharia do registro e do impacto no componente compartilhado.
- Conferência de que `TASK-AT-153`, DANFE, CSV e licença pública não foram incorporados.

## Riscos
- Implementar drop sem sinal de valor aumenta estados, testes e manutenção de cinco superfícies.
- Remover o picker como fallback excluiria teclado e mobile/touch.
- Ambiguidade sobre múltiplos arquivos amplia o escopo silenciosamente.

## Limitações
- Não houve drag real, upload mobile ou pesquisa com usuários.
- Ausência atual é fato; preferência e ganho de produtividade são desconhecidos.

## Definição de pronto
- Decisão humana rastreável e, se híbrido, handoff para nova task técnica; nenhum código nesta task.

## Sugestão de commit semântico
- `docs(product): decide contrato de upload por picker ou drop`
