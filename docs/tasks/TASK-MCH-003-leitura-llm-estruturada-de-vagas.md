# TASK-MCH-003 - Leitura LLM estruturada de vagas

## Metadata
- status: completed-with-remarks
- owner: olympus-taskyfier
- last-updated: 2026-04-26
- source-of-truth: docs/tasks/TASK-MCH-003-leitura-llm-estruturada-de-vagas.md

## Modo
- mode: runtime

## Objetivo unico
Adicionar leitura assistida por LLM para extrair estrutura da vaga (skills, senioridade, idioma, stack, sinais de risco) com retorno tipado e confiança, sem quebrar fallback determinístico atual.

## Contexto minimo
O diferencial do projeto depende de IA/agentes além de regex e tokens simples. Precisamos de camada inteligente para enriquecer a vaga com estrutura útil ao matching.

## Inputs
- `services/api/src/core/llm/gemini.ts`
- `services/api/src/features/acquisition/acquisition.service.ts`
- `services/api/src/features/match/match.service.ts`
- `packages/shared-types/src/index.ts`

## Dependencias
- satisfeitas: TASK-ACQ-002, TASK-MCH-002
- em aberto: policy de custo/uso de LLM por rodada

## Alvos explicitos
1. Criar função `analyzeJobPostingWithLLM` com saída JSON tipada:
   - `normalizedSkills[]`
   - `seniority`
   - `language`
   - `workModel` (remote/hybrid/on-site/unknown)
   - `confidence`
   - `signals[]`
2. Persistir enriquecimento em campo dedicado (ou estrutura anexa) sem sobrescrever dado bruto.
3. Definir fallback local quando `GEMINI_API_KEY` ausente/erro de modelo.
4. Integrar enriquecimento ao ranking como sinal adicional opcional.

## Fora de escopo
- tornar LLM obrigatório para ingestão;
- armazenar dados sensíveis desnecessários;
- acoplamento forte a um único provedor.

## Checklist
1. Definir contrato tipado compartilhado para enriquecimento de vaga.
2. Implementar chamada LLM com timeout e tratamento de erro.
3. Garantir fallback sem quebrar pipeline.
4. Cobrir com testes (mock de resposta válida/inválida/timeout).

## Acceptance Criteria
1. Vaga enriquecida contém estrutura tipada e confiança.
2. Pipeline continua funcional sem chave LLM.
3. Ranking pode consumir sinal LLM sem regressão quando indisponível.

## Definition of Done
1. Camada de leitura inteligente adicionada com fallback robusto.
2. Evidência de custo/latência por chamada documentada.

## Validacao
- comandos/checks:
  - `npm run typecheck`
  - `npm run lint`
  - `npm run test --workspace @olympus/api`
- revisao manual:
  - simular uma vaga ambígua e verificar enriquecimento estruturado.

## Evidencia esperada
- payload enriquecido em exemplo real;
- logs de fallback local em cenário sem API key.

## Riscos
- latência/custo do LLM;
- extração inconsistente em textos ruidosos.

## Blockers possiveis
- limites de quota/chave LLM;
- necessidade de revisão de policy de privacidade.

## Feedback obrigatorio de retorno
- quais campos estruturados tiveram melhor precisão na prática?
- qual foi impacto de latência por vaga enriquecida?
