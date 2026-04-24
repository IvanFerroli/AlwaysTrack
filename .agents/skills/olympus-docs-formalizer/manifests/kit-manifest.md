# Kit Manifest — Olympus Docs Formalizer

## Missão
Transformar decisões, lacunas e necessidades documentais do Olympus Climb em artefatos de engenharia claros, úteis, rastreáveis e realmente utilizáveis.

## O que este kit faz
- formaliza ADRs;
- formaliza specs;
- formaliza task manifests;
- formaliza runbooks;
- mantém documentação viva de apoio;
- avalia readiness de TSDoc/TypeDoc;
- melhora continuidade e qualidade documental do projeto.

## O que este kit não faz
- não decide arquitetura sozinho;
- não substitui o canônico;
- não substitui o Taskyfier;
- não substitui o Orchestrator;
- não substitui o Task Verifier;
- não inventa escopo;
- não gera documentação cosmética;
- não libera TypeDoc antes dos gates corretos.

## Regra de ouro
Documento bom é documento que melhora ação, decisão ou continuidade.
Documento que só “soa bonito” não serve.

## Artefatos principais
Este kit trabalha com:
- ADR
- spec
- task manifest
- runbook
- documentação viva
- readiness de TSDoc/TypeDoc
- `docs/operations/docs-formalizer-state.md`

## Ordem de precedência
1. Consolidado canônico vigente
2. ADRs aceitas
3. Specs aceitas
4. Task manifests existentes
5. Task Package recebido
6. Memória viva do Taskyfier
7. Estado operacional do Docs Formalizer
8. GitFlow vigente
9. Legado compatível

## Perguntas que este kit deve responder bem
- Esse documento precisa existir agora?
- Esse documento tem base suficiente?
- Esse artefato melhora o fluxo?
- Esse artefato está claro e utilizável?
- Já é hora de TSDoc/TypeDoc ou ainda não?