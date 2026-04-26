# TASK-DOC-003 - Formalizar specs minimas por capability ativa

## Metadata
- status: pending
- owner: olympus-taskyfier
- last-updated: 2026-04-26
- source-of-truth: docs/tasks/TASK-DOC-003-specs-minimas-por-capability.md

## Modo
- mode: documental

## Objetivo unico
Formalizar specs executaveis minimas para cada capability ativa do produto, conectando intencao canonica a contrato observavel de runtime.

## Contexto minimo
A memoria operacional aponta ausencia de specs minimas por capability. Sem esse baseline, novas tasks correm risco de abrir escopo sem criterio uniforme.

## Inputs
- `docs/operations/taskyfier-memory.md`
- `docs/README.md`
- `docs/adr/ADR-001-governanca-documental-operacional.md`
- `services/api/src/main.ts`
- `packages/shared-types/src/index.ts`

## Dependencias
- satisfeitas: TASK-DOC-002, TASK-CTR-001, TASK-RTM-002
- em aberto: n/a

## Alvos explicitos
1. Criar specs em `docs/specs/` para capabilities ativas listadas na memoria do Taskyfier.
2. Definir para cada capability: objetivo, fronteira, contrato de entrada/saida, limites e observabilidade.
3. Criar matriz de rastreabilidade capability -> endpoints -> tipos -> testes.
4. Registrar criterio de evolucao: quando task deve alterar spec e quando nao deve.

## Fora de escopo
- implementar funcionalidade nova de runtime;
- alterar regras de negocio sem task de runtime dedicada;
- substituir ADRs existentes.

## Checklist
1. Levantar lista canonica de capabilities ativas da memoria operacional.
2. Materializar um arquivo de spec por capability com metadados obrigatorios.
3. Adicionar criterios de aceite e indicadores minimos por capability.
4. Revisar consistencia com `docs/README.md` e superfices reais da API.

## Acceptance Criteria
1. Todas as capabilities ativas possuem spec minima com contrato observavel.
2. Existe rastreabilidade explicita entre spec e implementacao atual.
3. Pipeline passa a ter referencia objetiva para aprovar/recusar novas tasks de produto.

## Definition of Done
1. `docs/specs/` deixa de estar vazio e vira superficie util para execucao.
2. Taskyfier memory referencia as specs como base de priorizacao.

## Validacao
- comandos/checks:
  - `npm run typecheck`
  - `npm run lint`
- revisao manual:
  - conferir coverage de todas as capabilities listadas em `taskyfier-memory`.

## Evidencia esperada
- novos arquivos em `docs/specs/`;
- matriz de rastreabilidade capability-runtime-test;
- update de memoria operacional apontando specs criadas.

## Riscos
- specs virarem documento abstrato sem relacao com runtime;
- excesso de detalhe travar evolucao incremental.

## Blockers possiveis
- divergencia entre claims historicos e comportamento real do codigo;
- falta de criterio uniforme entre capabilities semelhantes.

## Feedback obrigatorio de retorno
- quais capabilities ficaram com spec e quais ficaram pendentes?
- qual gap mais critico entre o idealizado e o implementado atual?
