# TASK-AT-349 - Presentation Hub integrado e catalogo do produto

## Metadata
- status: completed-local-validation
- owner: olympus_orchestrator
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/TASK-AT-349-integrated-presentation-product-hub.md

## Objetivo unico
Transformar o workbench local na porta de entrada unica para compreender, demonstrar e auditar o AlwaysTrack sem abrir cada servico, report ou documento em uma aba separada.

## Escopo
- Criar navegacao por visao geral, capacidades, qualidade, operacao, evolucao e documentacao.
- Indexar modulos, funcionalidades, conectores, evidencias e fontes de verdade em pesquisa global.
- Explicar para cada capacidade o estado entregue, a visao final, as pendencias e a razao intencional da lacuna.
- Incorporar Web, Prisma Studio, coverage, Playwright, TypeDoc, carga e documentos em visualizador interno com fallback para nova aba.
- Exibir separadamente a decisao da demo, do rollout CaseFlow e da exposicao externa.
- Consultar dinamicamente a saude dos servicos locais sem expor arquivos fora das allowlists.
- Fazer `npm run up` abrir somente o Hub por padrao e preservar `--open-all` como opt-in.

## Acceptance Criteria
1. A primeira pagina comunica tese, numeros, arquitetura e as tres decisoes de prontidao sem alegar readiness produtiva.
2. Pesquisa global encontra capacidades, conectores, reports e documentacao.
3. Catalogo permite filtrar grupo e maturidade e detalha entrega, visao final, TODO e justificativa.
4. Relatorios e ferramentas podem ser vistos dentro do Hub e abertos separadamente quando necessario.
5. Desktop e mobile nao apresentam overflow incoerente; teclado e semantica basica permanecem funcionais.
6. Servidor continua bloqueando traversal, secrets e caminhos fora da allowlist.
7. Startup abre uma aba por padrao, com comportamento legado disponivel apenas por `--open-all`.

## Validacao
- `node --test tests/startup/local-workbench.test.mjs`
- `npm run test:startup`
- `npm run check`
- `npm run check:docs`
- `npm run repo:hygiene`
- Inspecao Playwright em desktop e mobile no Hub servido localmente.

## Resultado
- Hub multipagina local com 25 capacidades catalogadas e pesquisa transversal.
- Evidencias locais integradas sem alterar as decisoes `GO-WITH-RISK`/`NO-GO` vigentes.
- Abertura padrao consolidada em uma unica aba.

## Handoff
- handoff_to: presentation-owner
- execution_expectation: usar o Hub como pagina inicial e abrir ferramentas isoladas apenas quando o iframe for bloqueado pela propria ferramenta.
- constraints: nao converter status de task ou evidencia local em autorizacao de rollout/exposicao.
