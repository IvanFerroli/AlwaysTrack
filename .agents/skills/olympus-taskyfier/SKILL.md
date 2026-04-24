# olympus-taskyfier

## Finalidade
Transformar artefatos aceitos do Olympus Climb e o estado real do projeto em tarefas executáveis, pequenas, rastreáveis, validáveis e coerentes com a continuidade do trabalho.

## Quando usar
Use esta skill quando o objetivo for:
- perguntar qual é o próximo passo real;
- derivar a primeira task formal a partir do consolidado canônico;
- quebrar uma spec aceita em tarefas menores;
- gerar task packages completos;
- revisar se uma tarefa proposta está boa o suficiente;
- manter continuidade entre sessões de trabalho;
- decidir a menor entrega útil possível sem inventar arquitetura;
- atualizar o rumo com base no feedback real da task anterior.

## Fontes prioritárias
1. Consolidado canônico vigente
2. ADRs aceitas
3. Specs aceitas
4. Task manifests existentes
5. Memória operacional viva em `docs/operations/taskyfier-memory.md`
6. GitFlow vigente
7. Legado reaproveitável somente se ainda compatível

## Princípio central
Nenhuma task executável deve nascer sem base suficiente.
Quando ainda não existir task anterior, a primeira task pode ser derivada diretamente do canônico e das formalizações obrigatórias do projeto.
Essa derivação deve ser controlada, conservadora e restrita ao que já foi decidido.

## Modos formais de operação

### Modo 1 — Derivação inicial
Use quando o projeto ainda não tiver tasks formais suficientes.

Objetivo:
- derivar a primeira task executável a partir do documento canônico vigente, da memória de decisão e do estado atual do projeto.

Restrições:
- não abrir escopo novo;
- não inventar capability nova;
- não pular formalizações obrigatórias;
- não derivar tarefa fora do trilho canônico.

### Modo 2 — Continuidade guiada
Use quando já existir histórico mínimo de tasks, feedback e evidência.

Objetivo:
- usar a task anterior, a evidência real, os blockers e a memória operacional viva para decidir a próxima menor task útil.

Restrições:
- não ignorar blocker real;
- não fingir continuidade quando o estado estiver ambíguo;
- não gerar próxima task sem absorver o feedback recebido.

### Modo 3 — Pipeline kickoff
Use quando o objetivo for iniciar o ciclo completo com um único prompt.

Objetivo:
- derivar a próxima menor task útil;
- gerar task package completo;
- emitir handoff formal para o Orchestrator;
- preparar o bloco de retorno esperado do ciclo completo.

Restrições:
- nunca parar a saída apenas em task package;
- não simular execução/autonomia inexistente no ambiente;
- manter o handoff estrito ao escopo já decidido.

## Processo obrigatório

### Etapa 1 — Leitura de estado
Identificar:
- o que já foi concluído;
- o que está em andamento;
- o que está bloqueado;
- quais dependências estão abertas;
- qual capability está ativa;
- qual spec ou ADR está conduzindo a execução atual;
- qual é o macro-objetivo atual;
- qual foi o último feedback real recebido.

### Etapa 2 — Escolha do modo
Determinar explicitamente:
- derivação inicial
ou
- continuidade guiada

### Etapa 3 — Verificação de prontidão
Antes de gerar task, verificar:
- existe spec aceita?
- existem ADRs necessárias?
- a task depende de outra task ainda não concluída?
- a task tem saída observável?
- a task tem critério de validação?
- a task é pequena o suficiente para revisão curta?
- a task está dentro do escopo já decidido?

### Etapa 4 — Escolha da próxima task
A próxima task deve obedecer, nesta ordem:
1. menor entrega útil;
2. menor risco estrutural;
3. maior clareza de validação;
4. menor dependência aberta;
5. maior ganho de continuidade;
6. maior aderência ao canônico vigente.

### Etapa 5 — Montagem do Task Package
Toda task gerada deve conter:
- ID sugerido
- título
- modo de geração
- capability
- origem documental
- objetivo único
- contexto mínimo
- inputs
- dependências satisfeitas
- dependências em aberto
- alvos explícitos
- fora de escopo
- checklist
- acceptance criteria
- Definition of Done
- validação
- evidência
- risco
- blockers possíveis
- próximo passo provável
- feedback esperado após execução

### Etapa 6 — Handoff formal para Orchestrator
Emitir bloco explícito contendo:
- `handoff_to: olympus-orchestrator`
- `task_package`
- `execution_expectation` (task executada ou bloqueada, evidência, validação, updates sugeridos de `docs/operations`, próximo passo recomendado)
- `constraints` (sem escopo novo, sem implementação fora da task)

### Etapa 7 — Atualização de memória
Após cada rodada, propor atualização explícita da memória viva com:
- tasks concluídas
- tasks em andamento
- blockers
- decisões práticas tomadas
- próximo passo recomendado
- observações de continuidade

## Regras
- Não inventar tarefa a partir de ideia vaga.
- Não fundir múltiplas capacidades numa única task sem justificativa documental.
- Não gerar tarefa sem alvo explícito.
- Não gerar tarefa sem validação.
- Não gerar tarefa sem evidência esperada.
- Não tratar DoD como checklist genérico vazio.
- Não avançar sem dependências satisfeitas.
- Não usar “implementar tudo” ou “montar base completa” como task.
- Não escapar do canônico usando memória como desculpa.
- Não tratar feedback parcial como evidência conclusiva.
- No modo pipeline kickoff, não encerrar sem handoff formal e retorno esperado do ciclo.

## Saída esperada
Modo padrão: `Compact Docs-First Mode`.

Regra:
- Chat é resumo operacional.
- Docs são a superfície principal de detalhe.

No pipeline kickoff, por padrão:
- gravar task package completo em `docs/tasks/<task-id>.md` (ou patch exato);
- gravar update de memória em `docs/operations/taskyfier-memory.md` (ou patch exato);
- responder no chat apenas com:
  - task id
  - título
  - status
  - especialista esperado
  - próximo passo imediato

Só usar saída longa no chat quando houver:
- erro
- bloqueio
- ambiguidade real
- falha de gate
- pedido explícito do usuário

## Fallback
Se faltar base suficiente:
- dizer exatamente qual artefato falta
- dizer por que ele é necessário
- sugerir a menor task anterior de formalização

Se não conseguir escrever no arquivo de destino:
- dizer explicitamente que não conseguiu materializar;
- entregar patch/conteúdo exato;
- manter o chat curto.
