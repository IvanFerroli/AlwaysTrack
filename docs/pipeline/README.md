# Pipeline Reutilizavel

## Objetivo
Fornecer um pipeline de desenvolvimento de codigo que seja:
- agnostico de projeto;
- agnostico de LLM/engine;
- leve em uso de contexto;
- rastreavel o bastante para explicar o que foi feito, como foi feito e por que foi feito.

## Principios
- Menor mudanca defensavel.
- Docs como memoria duravel; chat como controle operacional.
- Uma task pequena por ciclo.
- Evidencia material antes de declarar execucao.
- Validacao explicita antes de promover estado.
- Providers de LLM sao adaptadores, nao parte do contrato do pipeline.

## Artefatos centrais
- `bootstrap.md`: entrada limpa para qualquer projeto novo.
- `protocol.md`: fluxo operacional.
- `documentation-budget.md`: regras para reduzir token usage sem perder historia.
- `llm-engine-policy.md`: contrato para manter independencia de modelos/providers.

## Papeis logicos
Os nomes abaixo sao papeis, nao ferramentas obrigatorias:
- `task-planner`: define a menor proxima task util.
- `orchestrator`: valida roteabilidade, escolhe modo e coordena handoffs.
- `specialist`: executa ou devolve plano bloqueado.
- `verifier`: valida evidencia, risco e aceite.
- `docs-keeper`: atualiza memoria operacional quando necessario.

Um unico agente pode simular todos os papeis no mesmo turno, desde que os handoffs fiquem registrados quando houver decisao material.

## Modos de execucao
- `planning`: decompor problema e criar artefato de task/spec.
- `implementation`: alterar codigo, docs ou infra.
- `verification`: testar, revisar e classificar resultado.
- `audit`: mapear estado, riscos e lacunas sem alterar comportamento.
- `migration`: adaptar padrao de um projeto para outro.

## Saida minima por ciclo
- task ou objetivo executado;
- artefatos alterados;
- evidencia de validacao;
- riscos/regressoes;
- proximo passo recomendado.
