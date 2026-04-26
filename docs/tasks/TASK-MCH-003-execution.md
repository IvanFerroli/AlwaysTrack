# TASK-MCH-003 - Execution Report

## Metadata
- task-id: TASK-MCH-003
- execution-id: EXEC-MCH-003
- specialist: olympus-runtime-builder
- support-specialist: olympus-quality-builder
- execution-mode: execution artifact mode
- orchestrator: olympus-orchestrator
- date: 2026-04-26
- status: completed-with-remarks

## Escopo executado
1. Criada leitura estruturada de vaga por LLM: `analyzeJobPostingWithLLM`.
2. Contrato tipado compartilhado para enriquecimento (`JobPostingLLMEnrichment`, `JobWorkModel`).
3. Fallback local determinístico para ausência de `GEMINI_API_KEY`, timeout e JSON inválido.
4. Persistência anexa do enriquecimento por vaga via `MemoryEntry` (`STRATEGY_HINT`, chave `job-enrichment:<jobId>`), sem sobrescrever dados brutos da vaga.
5. Integração opcional ao ranking com `includeLlmEnrichment=true` e reforço de score por sobreposição de skills enriquecidas.
6. Cobertura de testes para resposta válida/inválida/timeout/falta de chave e integração no ranking.

## Artefatos materiais
- `services/api/src/core/llm/gemini.ts`
- `services/api/src/core/llm/gemini.test.ts`
- `services/api/src/features/match/match.service.ts`
- `services/api/src/features/match/match.handlers.ts`
- `services/api/src/features/match/match.service.test.ts`
- `packages/shared-types/src/index.ts`
- `services/api/package.json`

## Evidencias de gate
- `npm run test --workspace @olympus/api -- src/core/llm/gemini.test.ts` passou.
- `npm run test --workspace @olympus/api -- src/features/match/match.service.test.ts` passou.
- `npm run lint` passou.
- `npm run typecheck` passou.

## Evidência operacional (fallback sem chave)
Amostra gerada com `includeLlmEnrichment=true` e `GEMINI_API_KEY` ausente:
- `llmEnrichment.provider = "fallback"`
- `signals = ["fallback:missing-api-key"]`
- enriquecimento persistido em `MemoryEntry` com `key=job-enrichment:job-000001`

Payload resumido observado:
```json
{
  "title": "Senior Backend Engineer (Node + TypeScript)",
  "score": 84,
  "llmEnrichment": {
    "normalizedSkills": ["node", "node.js", "typescript", "postgresql", "postgres"],
    "seniority": "senior",
    "language": "en",
    "workModel": "remote",
    "confidence": 0.5,
    "provider": "fallback",
    "latencyMs": 0
  }
}
```

## Campos com melhor precisão prática
- `normalizedSkills`: alta no fallback para stacks comuns (`node`, `typescript`, `postgresql`).
- `workModel`: alta em descrições com pistas explícitas (`remote`, `hybrid`, `on-site`).
- `seniority`: boa em títulos claros (`junior/senior/lead/principal`).

## Impacto de latência por vaga enriquecida
- fallback local: `~0ms` (campo `latencyMs=0`).
- timeout configurado para LLM remoto: `LLM_ENRICHMENT_TIMEOUT_MS` (default usado: `6000ms`) para limitar impacto por rodada.
- budget de rodada: `LLM_ENRICHMENT_MAX_JOBS_PER_ROUND` (default usado: `3`).

## Ressalvas
- sem `GEMINI_API_KEY`, a enriquecimento real de modelo fica desabilitado (pipeline segue por fallback).
- confiança no fallback é conservadora por desenho (`0.2` a `0.7`).
