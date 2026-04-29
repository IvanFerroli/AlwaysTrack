# Engineering Pipeline Protocol

## Finalidade
Padronizar ciclos pequenos de desenvolvimento com handoff, evidencia e validacao, sem depender de um produto, linguagem, framework ou provedor de LLM especifico.

## Modo padrao
`Compact Docs-First Mode`:
- chat curto para status, bloqueios e decisoes;
- detalhe permanente em arquivos;
- saida longa no chat apenas por pedido explicito, falha de gate, ambiguidade real ou risco relevante.

## Fluxo oficial
1. `task-planner` identifica a menor entrega util.
2. `orchestrator` confirma escopo, modo e criterios de aceite.
3. `specialist` executa ou retorna bloqueio com causa objetiva.
4. `verifier` valida evidencia, regressao e aderencia ao escopo.
5. `docs-keeper` atualiza apenas memoria necessaria.
6. `orchestrator` entrega resumo final e proximo passo.

## Contrato de handoff
Todo handoff material deve conter:
- `cycle_id`
- `task_id` ou `objective`
- `mode`
- `scope`
- `out_of_scope`
- `expected_artifacts`
- `acceptance_criteria`
- `validation_plan`
- `regression_risks`

## Regra de execucao material
Nao declarar execucao concluida sem pelo menos uma evidencia:
- patch aplicado;
- arquivo criado/alterado;
- comando executado com resultado;
- checklist manual verificavel;
- decisao registrada em ADR/spec/task.

Se escrita direta nao for possivel, entregar patch ou conteudo exato e marcar o ciclo como `blocked` ou `manual-apply-required`.

## Classificacao de fechamento
- `approved`: evidencia suficiente e sem ressalva material.
- `approved-with-notes`: entrega aceita com risco ou pendencia explicita.
- `rework`: precisa ajuste antes de ser considerada concluida.
- `blocked`: impedimento externo ou falta de insumo essencial.

## Gates minimos
Todo ciclo deve responder:
- O escopo ficou pequeno?
- O artefato certo foi alterado?
- Existe evidencia?
- O risco de regressao foi chamado?
- A memoria foi atualizada somente onde agrega continuidade?

## Politica de provider
Nenhum artefato do pipeline deve exigir um modelo especifico. Quando uma LLM for usada, registrar capacidade esperada, entrada/saida e limites. Nome de provider entra apenas como detalhe de execucao ou adaptador substituivel.
