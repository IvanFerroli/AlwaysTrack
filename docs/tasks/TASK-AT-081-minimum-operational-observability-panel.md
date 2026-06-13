# TASK-AT-081 - Painel minimo de observabilidade operacional

## Metadata
- status: completed-mvp
- owner: olympus_orchestrator
- last-updated: 2026-06-12
- source-of-truth: docs/tasks/TASK-AT-081-minimum-operational-observability-panel.md

## Fase
- fase: B - Confiabilidade operacional
- prioridade: extra
- dependencias: observabilidade HTTP/Prisma ja iniciada; auditoria existente.

## Objetivo unico
Criar uma visao minima para admins acompanharem saude operacional: falhas recentes, tempos lentos, jobs/reprocessamentos e volume por fluxo.

## Contexto
Nao e APM completo. E uma tela/admin simples para demonstrar maturidade tecnica e reduzir risco operacional.

## Escopo funcional
1. Falhas recentes de extracao/reprocessamento.
2. Endpoints/operacoes lentas agregadas quando dado existir.
3. Status de jobs BullMQ/snapshots se disponivel.
4. Volume recente de notas, aprovacoes, rejeicoes, FAQ e Wiki.
5. Links para auditoria/diagnostico.

## Arquivos candidatos
- `apps/web/src/views/settings.tsx` ou nova view admin
- `apps/api/src/**/observability*`
- `apps/api/src/**/audit*`
- `apps/api/src/**/jobs*`
- `docs/architecture/**`

## Plano de execucao
1. Definir indicadores que ja existem sem grande schema novo.
2. Criar endpoint admin limitado.
3. Adicionar painel simples em Configuracoes/Auditoria.
4. Documentar limites do painel.
5. Testar permissao ADMIN.

## Acceptance Criteria
1. Apenas ADMIN acessa o painel.
2. Pelo menos falhas recentes e volumes por fluxo aparecem.
3. Links levam para auditoria/diagnostico quando possivel.
4. Sem coleta invasiva ou grande overhead.
5. Typecheck/build passam.

## Impacto na apresentacao
Mostra que a ferramenta nao apenas opera, mas tambem se monitora.

## Riscos
- Virar dashboard tecnico amplo demais.
- Mostrar metricas incompletas sem explicar escopo.

## Execucao
- `EXEC-AT-081-minimum-operational-observability-panel.md`
