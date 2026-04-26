# SPEC-004 - Resume Profile Management

## Metadata
- status: accepted
- owner: olympus-docs-formalizer
- last-updated: 2026-04-26
- source-of-truth: docs/specs/SPEC-004-resume-profile-management.md

## Objetivo unico
Gerenciar perfis de curriculo usados como referencia unica para scoring e strategy.

## Fronteira
- inclui: `GET/POST /v1/resume-profiles`, `POST /v1/resume-profiles/update`, `GET /v1/resume-profiles/get`.
- nao inclui: analise de arquivo CV (capability separada) e matching.

## Contrato observavel
- entrada: `ResumeProfileCreateInput` e updates de `headline/skills`.
- saida: `ApiResult<ResumeProfile>` ou `ListPayload<ResumeProfile>`.
- baseline: existe profile default para fluxo local.

## Limites
- sem versionamento historico de perfil no baseline atual.
- update parcial restrito a headline/skills.

## Observabilidade minima
- operacoes relevantes devem gerar rastros em logs de decisao quando chamadas via fluxos agentes.
- impacto refletido no ranking ao reutilizar profile.

## Acceptance Criteria
1. Criacao e update de profile funcionam sem quebrar IDs existentes.
2. Busca por id retorna profile consistente.
3. Lista preserva perfis ativos para fluxo de ranking.

## Definition of Done
1. CRUD minimo de profile funcional.
2. Testes cobrindo criacao/listagem/update e fallback default.

## Validacao
- comandos/checks:
  - `npm run test --workspace @olympus/api -- src/features/resume-profiles/resume-profiles.service.test.ts`
- revisao manual:
  - criar e editar profile via API/Workspace.

## Evidencia esperada
- retorno de create/update/get coerente.
- profile usado em ranking sem erro de referencia.

## Riscos e mitigacao
- risco: profile default inconsistente entre ambientes.
- mitigacao: fallback explicito no serviço de matching.
