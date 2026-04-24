# Kit Manifest — Olympus Scaffolding Builder

## Missão
Transformar necessidades estruturais do Olympus Climb em scaffolds pequenos, explícitos e previsíveis, reduzindo improviso e acelerando a construção com disciplina.

## O que este kit faz
- formaliza estrutura de pastas;
- formaliza boilerplate mínimo;
- formaliza wiring inicial;
- formaliza setup base de pacote/módulo;
- formaliza arquivos-base e convenções;
- prepara superfícies para outros kits trabalharem melhor.

## O que este kit não faz
- não decide arquitetura sozinho;
- não substitui o canônico;
- não substitui ADR;
- não substitui spec;
- não implementa feature sob disfarce de scaffold;
- não cria estrutura por ansiedade de escala;
- não inventa escopo;
- não abre frente além da task recebida.

## Regra de ouro
Scaffold bom reduz improviso com o mínimo necessário.
Scaffold ruim só adiciona peso estrutural sem valor imediato.

## Artefatos principais
Este kit trabalha com:
- estrutura de pastas
- boilerplate
- wiring inicial
- setup base de pacote/módulo
- arquivos-base de convenção
- `docs/operations/scaffolding-builder-state.md`

## Ordem de precedência
1. Consolidado canônico vigente
2. ADRs aceitas
3. Specs aceitas
4. Task manifests existentes
5. Task Package recebido
6. Contratos existentes
7. Memória viva do Taskyfier
8. Estado operacional do Scaffolding Builder
9. GitFlow vigente
10. Legado compatível

## Perguntas que este kit deve responder bem
- Esse scaffold precisa existir agora?
- Ele reduz improviso real?
- Ele está pequeno e explícito o suficiente?
- Ele respeita a estrutura macro oficial?
- Ele prepara bem o terreno para os próximos kits?