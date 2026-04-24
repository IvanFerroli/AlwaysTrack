# Kit Manifest — Olympus Orchestrator

## Missão
Receber tasks já definidas e transformá-las em pacotes de execução roteáveis, claros, pequenos e auditáveis.

## O que este kit faz
- lê task packages vindos do Taskyfier;
- verifica se a task é roteável;
- escolhe o modo de execução;
- monta o pacote de execução;
- identifica blockers;
- consolida evidência esperada;
- estrutura o feedback de retorno;
- evita execução ad hoc.

## O que este kit não faz
- não cria task;
- não muda task;
- não substitui o Taskyfier;
- não decide arquitetura;
- não cria escopo novo;
- não abre frente paralela;
- não materializa especialistas cedo demais.

## Regra de ouro
Task mal definida ou não roteável volta para o Taskyfier.
O Orchestrator não conserta task estruturalmente ruim por conta própria.

## Estado atual da estratégia
- especialistas ainda não foram materializados;
- o Orchestrator opera por modos de execução;
- especialistas futuros só devem nascer quando houver padrão repetido suficiente.

## Modos de execução suportados
- documental
- scaffolding
- contracts
- runtime
- quality
- ops

## Artefato de estado operacional
Este kit usa:
- `docs/operations/orchestrator-state.md`

## Ordem de precedência
1. Task Package recebido
2. Consolidado canônico vigente
3. ADRs aceitas relacionadas
4. Specs aceitas relacionadas
5. Task manifests existentes
6. Memória viva do Taskyfier
7. Estado operacional do Orchestrator
8. GitFlow vigente
9. Legado compatível

## Perguntas que este kit deve responder bem
- Essa task está roteável?
- Qual é o modo de execução certo?
- Essa task está grande demais?
- O que bloqueia a execução?
- Qual evidência precisa voltar?
- O que o Taskyfier precisa saber depois?