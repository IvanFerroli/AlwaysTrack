# TASK-AT-064 - Dashboard and ranking export polish

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-06-11
- source-of-truth: docs/tasks/TASK-AT-064-dashboard-ranking-export-polish.md

## Modo
- mode: reporting-polish

## Objetivo unico
Melhorar exportacoes comerciais para que dashboard/ranking/extratos possam virar material simples de reuniao.

## Contexto minimo
Para apresentacao e uso interno, gestores costumam precisar levar ranking e resumo de vendas para reunioes. CSV existe em partes, mas falta polimento de exportacao alinhada aos filtros atuais.

## Inputs
- Formatos desejados: CSV primeiro; PDF simples se couber.
- Campos obrigatorios por relatorio.

## Dependencias
- satisfeitas: ranking/extratos ja existem.
- em aberto: dashboard grafico dinamico pode enriquecer export depois da `TASK-AT-060`.

## Alvos explicitos
1. Garantir export CSV usando os mesmos filtros da tela.
2. Adicionar export de ranking com periodo, vendedor/grupo e totais.
3. Adicionar export de resumo dashboard, se `TASK-AT-060` estiver pronta.
4. Nomear arquivos com data/range.
5. Registrar auditoria para exportacoes sensiveis.

## Fora de escopo
- Relatorio financeiro completo.
- Designer PDF sofisticado.
- Envio automatico por email.

## Checklist
1. Revisar exports atuais.
2. Corrigir inconsistencias de filtros.
3. Adicionar metadados no arquivo.
4. Testar permissao por role.

## Acceptance Criteria
1. Export reflete exatamente os filtros ativos.
2. Arquivo inclui periodo e data de geracao.
3. Role sem permissao nao exporta dados indevidos.
4. Export funciona com dados vazios.

## Definition of Done
1. Exportacoes revisadas e testadas.
2. `npm run test:all` passa.

## Validacao
- comandos/checks: `npm run test --workspace @alwaystrack/api -- reports.service.test.ts`, `npm run test:all`
- revisao manual: comparar tela filtrada com CSV gerado.

## Evidencia esperada
- CSV de exemplo gerado por seed.
- Teste de filtros aplicados.

## Riscos
- Export pode vazar dados entre vendedores/grupos se escopo nao for reaplicado no backend.

## Blockers possiveis
- Definicao de campos finais.

## Retorno esperado
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Execucao
- `EXEC-AT-063`: CSV de ranking, dashboard e extrato alinhados aos filtros da tela, com metadados, nomes por periodo/data e auditoria de exportacao.
