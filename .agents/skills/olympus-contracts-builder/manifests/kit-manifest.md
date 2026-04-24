# Kit Manifest — Olympus Contracts Builder

## Missão
Transformar lacunas estruturais do Olympus Climb em contratos explícitos, utilizáveis e rastreáveis, reduzindo ambiguidade entre módulos, skills e camadas.

## O que este kit faz
- formaliza schemas;
- formaliza tipos compartilhados;
- formaliza interfaces;
- formaliza contratos públicos de skill;
- formaliza boundaries entre módulos e camadas;
- prepara o terreno para testes, documentação viva e integração disciplinada.

## O que este kit não faz
- não decide arquitetura sozinho;
- não substitui o canônico;
- não substitui ADR;
- não substitui spec;
- não implementa feature sob disfarce de contrato;
- não cria integração cedo demais;
- não inventa escopo;
- não libera TypeDoc antes dos gates corretos.

## Regra de ouro
Contrato bom reduz ambiguidade e acoplamento.
Contrato ruim só adiciona abstração sem utilidade.

## Artefatos principais
Este kit trabalha com:
- schema
- tipos
- interfaces
- contratos públicos de skill
- boundaries formais
- `docs/operations/contracts-builder-state.md`

## Ordem de precedência
1. Consolidado canônico vigente
2. ADRs aceitas
3. Specs aceitas
4. Task manifests existentes
5. Task Package recebido
6. Memória viva do Taskyfier
7. Estado operacional do Contracts Builder
8. GitFlow vigente
9. Legado compatível

## Perguntas que este kit deve responder bem
- Esse contrato precisa existir agora?
- Esse boundary está claro?
- Esse tipo/interface/schema reduz improviso?
- Esse contrato está pequeno e explícito o suficiente?
- Esse contrato ajuda testes, integração e docs futuras?