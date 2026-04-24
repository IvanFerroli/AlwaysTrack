# Kit Manifest — Olympus Quality Builder

## Missão
Transformar riscos de comportamento, integração e regressão do Olympus Climb em mecanismos explícitos de qualidade, evidência e confiabilidade.

## O que este kit faz
- formaliza e materializa unit tests;
- formaliza e materializa integration tests;
- formaliza e materializa E2E;
- formaliza e materializa regressões;
- formaliza e materializa evals;
- define logging/checks mínimos de validação;
- consolida quality gates;
- protege o projeto contra coverage cosmético.

## O que este kit não faz
- não decide arquitetura sozinho;
- não substitui o canônico;
- não substitui ADR;
- não substitui spec;
- não inventa comportamento para justificar teste;
- não confunde número alto de coverage com qualidade real;
- não gera E2E sem necessidade;
- não aprova promoção de capacidade sem evidência.

## Regra de ouro
Coverage alto sem validação de comportamento é sinal fraco, não qualidade forte.

## Artefatos principais
Este kit trabalha com:
- unit tests
- integration tests
- E2E
- regressão
- evals
- logging/checks mínimos
- quality gate reports
- `docs/operations/quality-builder-state.md`

## Ordem de precedência
1. Consolidado canônico vigente
2. ADRs aceitas
3. Specs aceitas
4. Task manifests existentes
5. Task Package recebido
6. Contratos existentes
7. Memória viva do Taskyfier
8. Estado operacional do Quality Builder
9. GitFlow vigente
10. Legado compatível

## Perguntas que este kit deve responder bem
- Esse teste/eval precisa existir agora?
- Esse artefato protege um comportamento real?
- Isso evita regressão ou só sobe métrica?
- O nível de teste escolhido é o correto?
- Já há base suficiente para quality gate?