# TASK-QLT-003 - Smoke Web/API automatizado no fluxo local

## Metadata
- status: completed-with-remarks
- owner: olympus-taskyfier
- last-updated: 2026-04-26
- source-of-truth: docs/tasks/TASK-QLT-003-smoke-web-api-automatizado.md

## Modo
- mode: quality

## Objetivo unico
Criar baseline de smoke tests automatizados para validar rota web principal e endpoints API criticos alem dos unitarios.

## Contexto minimo
Existe dependencia aberta explicita para smoke tests web/API. Hoje o gate principal depende majoritariamente de testes de servico.

## Inputs
- `apps/web/src/main.ts`
- `services/api/src/main.ts`
- `docs/runbooks/README.md`
- `package.json`

## Dependencias
- satisfeitas: TASK-QLT-001, TASK-QLT-002, TASK-RTM-002
- em aberto: ambiente de teste para subir web+api simultaneamente

## Alvos explicitos
1. Criar suite smoke automatizada cobrindo no minimo:
   - `GET /` (web)
   - `GET /health` (web/api)
   - `GET /v1/jobs/ranked`
   - `POST /v1/pipeline/run` com payload minimo
2. Integrar script de smoke ao workflow local de validacao (com comando dedicado).
3. Documentar pre-condicoes e troubleshooting do smoke no runbook.

## Fora de escopo
- E2E visual completo;
- testes de carga;
- cobertura de todos os endpoints de produto.

## Checklist
1. Definir harness para subir/encerrar processos de teste com isolamento.
2. Implementar assertions de status/payload minimo por endpoint critico.
3. Adicionar comando de execucao no monorepo (`npm run smoke` ou equivalente).
4. Registrar no runbook quando executar smoke e como interpretar falhas.

## Acceptance Criteria
1. Suite smoke roda de forma automatizada e repetivel.
2. Falha de rota critica quebra o smoke de forma clara.
3. Comando de smoke fica documentado e acessivel para outras IAs.

## Definition of Done
1. Gate complementar de sanidade web/api disponivel.
2. Runbook atualizado com procedimento padrao de smoke.

## Validacao
- comandos/checks:
  - `npm run smoke`
  - `npm run check`
- revisao manual:
  - simular falha em endpoint e confirmar quebra do smoke.

## Evidencia esperada
- novo arquivo de testes smoke;
- comando de execucao no `package.json`;
- secao dedicada no runbook.

## Riscos
- flakiness por ordem de subida de processos;
- tempo de pipeline crescer alem do aceitavel.

## Blockers possiveis
- dependencia de porta ocupada no ambiente local;
- diferencas entre ambiente dev e ambiente de teste.

## Feedback obrigatorio de retorno
- quais rotas foram cobertas no baseline smoke?
- quanto tempo medio o smoke adiciona ao ciclo?
