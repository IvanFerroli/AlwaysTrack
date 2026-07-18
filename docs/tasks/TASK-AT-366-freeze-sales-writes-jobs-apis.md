# TASK-AT-366 - Congelamento de escritas, jobs e APIs de Vendas

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-07-17
- source-of-truth: docs/tasks/TASK-AT-366-freeze-sales-writes-jobs-apis.md

## Modo
- mode: migration

## Objetivo unico
Impedir novas mutacoes e processamento comercial, mantendo uma ponte read-only temporaria e observavel para consumidores legados.

## Contexto minimo
Uploads, analise/revisao de notas, CRUD de campanhas e snapshots ainda podem criar ou alterar estado. Jobs de ranking tambem prolongam a operacao de Vendas.

## Dependencias
- satisfeitas: TASK-AT-362 e TASK-AT-365.
- em aberto: TASK-AT-389 define a data efetiva de sunset.

## Alvos explicitos
1. Rotas `/v1/sales/**` e modulo sales-documents.
2. Worker/fila de ranking snapshots e configuracao de deploy.
3. Headers/telemetria de deprecacao e respostas de escrita congelada.

## Fora de escopo
- Remover tabelas, arquivos ou codigo de leitura historica.
- Retirar a navegacao Web nesta task.

## Checklist
1. Colocar escritas atras de flag default-off e retornar erro de dominio estavel quando congeladas.
2. Parar enfileiramento e consumo de novos snapshots sem perder jobs ja persistidos.
3. Manter GETs estritamente necessarios durante a janela de compatibilidade.
4. Emitir `Deprecation`/`Sunset` e contadores por rota sem PII.
5. Garantir que retries, metodos alternativos e chamadas diretas nao contornem o freeze.

## Acceptance Criteria
1. Nenhum endpoint legado cria, corrige, revisa ou recalcula dado comercial com freeze ativo.
2. Jobs pendentes possuem estrategia explicita de drain, cancelamento ou quarentena auditada.
3. Leituras permitidas continuam tenant-scoped e anunciam sunset.
4. Reativacao emergencial exige flag, owner e registro operacional; nao ocorre por fallback silencioso.

## Validacao
- comandos/checks: testes HTTP de todos os metodos de escrita, teste do worker/fila, OpenAPI contract e `git diff --check`.
- revisao manual: observar metricas de uso da ponte e ausencia de novos registros.

## Riscos
- Um script, seed ou job chamar service interno e ignorar a protecao da rota.

## Proximo passo provavel
TASK-AT-367

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: freeze verificavel antes de retirar qualquer superficie visual.
