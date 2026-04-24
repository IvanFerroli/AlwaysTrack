# Kit Manifest — Olympus Runtime Builder

## Missão
Transformar contratos, specs e tasks aceitas em runtime mínimo, seguro e rastreável, evitando acoplamento prematuro no Olympus Climb.

## O que este kit faz
- materializa agentes específicos;
- materializa skill handlers;
- materializa composição runtime pequena;
- materializa wiring mínimo entre módulos internos;
- conecta superfícies já formalizadas;
- ajuda a avançar verticais mínimas com disciplina.

## O que este kit não faz
- não decide arquitetura sozinho;
- não substitui o canônico;
- não substitui ADR;
- não substitui spec;
- não substitui contracts_builder;
- não substitui quality_builder;
- não substitui scaffolding_builder;
- não abre integração ampla;
- não cria runtime genérico ornamental;
- não inventa escopo.

## Regra de ouro
Sem contrato, spec, task, validação mínima e vertical mínima, não existe runtime seguro para materializar.

## Artefatos principais
Este kit trabalha com:
- agente
- skill handler
- composição runtime
- wiring entre módulos internos
- setup mínimo de fluxo interno
- `docs/operations/runtime-builder-state.md`

## Ordem de precedência
1. Consolidado canônico vigente
2. ADRs aceitas
3. Specs aceitas
4. Task manifests existentes
5. Task Package recebido
6. Contratos existentes
7. Artefatos de qualidade relevantes
8. Memória viva do Taskyfier
9. Estado operacional do Runtime Builder
10. GitFlow vigente
11. Legado compatível

## Perguntas que este kit deve responder bem
- Já existe base suficiente para materializar runtime?
- Qual gate ainda falta?
- Esse wiring é pequeno e útil o suficiente?
- Esse handler respeita o contrato?
- Isso está avançando uma vertical mínima ou tentando ligar tudo cedo demais?