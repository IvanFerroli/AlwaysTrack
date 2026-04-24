# Kit Manifest — Olympus Taskyfier

## Missão
Transformar artefatos aceitos do Olympus Climb e o estado real do projeto em tarefas executáveis sem perder rastreabilidade, ordem lógica, continuidade e aderência ao canônico.

## O que este kit faz
- lê o estado atual do projeto;
- verifica prontidão documental;
- escolhe a próxima menor tarefa útil;
- pode derivar a primeira task formal a partir do canônico;
- gera task packages completos;
- mantém continuidade por memória operacional viva;
- incorpora feedback real após cada ciclo;
- reduz releitura e quebra de contexto;
- evita task grande demais ou vaga demais.

## O que este kit não faz
- não decide arquitetura;
- não substitui ADR;
- não substitui spec;
- não executa código;
- não inventa escopo;
- não resolve conflito documental;
- não escolhe agente executor criativamente;
- não abre frentes paralelas sem base.

## Regra de ouro
Sem base documental suficiente, a resposta correta é pedir formalização anterior, não improvisar tarefa.

## Regra de derivação controlada
Quando ainda não existir task anterior suficiente, este kit pode derivar a primeira task a partir do documento canônico vigente e das formalizações obrigatórias do projeto.
Essa derivação é permitida apenas para transformar direção aceita em próximo passo executável.
Ela não autoriza expansão de escopo.

## Artefato de memória viva
Este kit usa como memória operacional principal:
- `docs/operations/taskyfier-memory.md`

Esse arquivo deve crescer ao longo do projeto e refletir:
- estado atual;
- tasks concluídas;
- tasks em andamento;
- blockers;
- decisões práticas recentes;
- próximo passo recomendado.

## Ordem de precedência
1. Consolidado canônico vigente
2. ADRs aceitas
3. Specs aceitas
4. Task manifests existentes
5. Memória operacional viva
6. GitFlow vigente
7. Legado compatível

## Perguntas que este kit deve responder bem
- Qual o próximo passo real?
- Ainda estamos em derivação inicial ou já existe continuidade suficiente?
- Esta spec já pode virar task?
- O que está bloqueando avanço?
- Essa task está pequena e clara o suficiente?
- O que vem depois desta task?
- Estamos pulando alguma dependência?
- Como a memória deve ser atualizada depois desta rodada?