# ENGINEERING PIPELINE PROTOCOL — OLYMPUS CLIMB

## Finalidade
Padronizar o ciclo operacional único de engenharia para reduzir operação por kits isolados e garantir handoff formal, evidência e validação.

## Escopo
- este protocolo coordena Taskyfier, Orchestrator, especialistas e Task Verifier;
- não substitui o documento canônico;
- não cria kit novo;
- não autoriza escopo novo fora da task.

## Modo padrão de saída
`Compact Docs-First Mode` é o padrão obrigatório do pipeline:
- Chat é resumo operacional.
- Docs são a superfície principal de detalhe.
- Saída longa no chat só em erro, bloqueio, ambiguidade real, falta de artefato material, falha de gate ou pedido explícito do usuário.

## Limitação de ambiente
Se o ambiente não suportar chamada autônoma real entre agentes, o fluxo deve rodar em modo equivalente operacional:
- um único prompt de entrada;
- handoffs formais por seção;
- ciclo consolidado no mesmo turno pelo Orchestrator.

## Fluxo oficial
1. Taskyfier (`pipeline kickoff`) deriva a próxima menor task útil.
2. Taskyfier entrega task package + handoff formal ao Orchestrator.
3. Orchestrator (`single-turn pipeline mode`) valida roteabilidade e escolhe especialista.
4. Especialista executa em `execution artifact mode` ou retorna `plan mode`.
5. Orchestrator consolida execution report e evidências e monta pacote para Task Verifier.
6. Task Verifier classifica (`aprovado`, `aprovado com ressalvas`, `reprovado`, `bloqueado`).
7. Orchestrator consolida retorno final ao Taskyfier.
8. Taskyfier atualiza continuidade e recomenda próximo passo.

## Contrato de handoff por etapa

### 1) Taskyfier -> Orchestrator
Deve conter:
- `task_package` completo;
- `handoff_to: olympus-orchestrator`;
- `constraints` de escopo;
- `expected_cycle_return`.

Persistência padrão:
- task package completo em `docs/tasks/<task-id>.md` (ou patch exato);
- update de memória macro em `docs/operations/taskyfier-memory.md` (ou patch exato).

Chat curto padrão:
- task id
- título
- status
- especialista esperado
- próximo passo imediato

### 2) Orchestrator -> Especialista
Deve conter:
- `execution_id`;
- `task_id`;
- `specialist`;
- `execution_mode` (`plan mode` ou `execution artifact mode`);
- `expected_artifacts`;
- `what_not_to_touch`.

Persistência padrão:
- execution brief/report em arquivo de trabalho (ex.: `docs/tasks/<task-id>-execution.md`) ou patch exato;
- update de `docs/operations/orchestrator-state.md` quando aplicável.

Chat curto padrão:
- task id
- execution id
- especialista escolhido
- status do roteamento
- execução seguiu ou travou

### 3) Especialista -> Orchestrator
Deve conter:
- `execution_report`;
- status (`executada` ou `bloqueada`);
- evidências materiais;
- updates sugeridos para `docs/operations/<specialist>-state.md`.

Chat curto padrão:
- o que foi criado/alterado
- onde foi salvo
- status
- ressalva curta (se houver)

### 4) Orchestrator -> Task Verifier
Deve conter:
- `task_package`;
- `execution_report`;
- evidências materiais;
- updates sugeridos de memória/estado para validação.

### 5) Task Verifier -> Orchestrator/Taskyfier
Deve conter:
- classificação final;
- justificativa;
- retorno recomendado ao Taskyfier;
- patch/update sugerido para `docs/operations` validado.

Persistência padrão:
- verification report/decision em arquivo de trabalho (ex.: `docs/tasks/<task-id>-verification.md`) ou patch exato;
- validação e update dos estados/memória quando aplicável.

Chat curto padrão:
- task id
- classificação final
- motivo curto
- próximo passo recomendado

## Regra de execução material
No `execution artifact mode`, não é permitido declarar execução sem artefato real. Artefato real aceito:
- conteúdo integral de arquivo;
- patch explícito;
- comandos shell prontos;
- instruções exatas de criação/substituição.

Sem esse material, a saída deve ser tratada como `plan mode`.

Se escrita direta não for possível:
- declarar explicitamente que não conseguiu materializar;
- entregar patch/conteúdo exato;
- manter chat curto.

## Critérios de encerramento de task no ciclo
- `concluída`: classificada pelo Task Verifier como `aprovado` ou `aprovado com ressalvas`.
- `refatoração`: classificada como `reprovado` com ajuste exigido.
- `bloqueada`: classificada como `bloqueado` por impedimento legítimo.

## Comportamento obrigatório de updates em docs/operations
- cada etapa propõe update do seu state próprio quando aplicável;
- Taskyfier mantém memória macro em `docs/operations/taskyfier-memory.md`;
- Orchestrator consolida o ciclo e organiza o pacote de retorno;
- Task Verifier valida também os updates de memória/estado antes de aceite.

## Saída final mínima do pipeline
Ao final de cada ciclo, o retorno consolidado deve conter:
- task executada ou bloqueada;
- evidência;
- validação;
- atualização sugerida de `docs/operations`;
- próximo passo recomendado.
