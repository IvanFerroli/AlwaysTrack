# TASK-AT-358 - Finalizacao do cockpit do fluxo Always Fit

## Metadata
- status: completed
- owner: olympus_orchestrator
- last-updated: 2026-07-16
- source-of-truth: docs/tasks/TASK-AT-358-always-fit-flow-cockpit-finalization.md

## Modo
- mode: implementation

## Objetivo unico
Transformar a ficha lateral do primeiro fluxo Always Fit em um cockpit persistente e ergonomico, eliminando preenchimentos repetidos de produtos sem alterar a maquina de estados que ja esta funcional.

## Contexto minimo
- A progressao, persistencia, retomada e conclusao atuais estao funcionando e devem permanecer protegidas.
- O atendimento real descobre dados progressivamente e referencia os mesmos itens em varias etapas.
- Tres placeholders fixos de produto, campos livres duplicados e controles distantes aumentam erro e tempo operacional.

## Inputs
- feedback operacional de 2026-07-16 e print da tela de Fluxos;
- `fluxo_saude_caseflow_always_fit.md`;
- contratos normalizados `{ name, quantity }` dos conectores Yampi, Rastreio, OMIE e Lancador.

## Dependencias
- satisfeitas: TASK-AT-350, TASK-AT-352, TASK-AT-353, TASK-AT-354, TASK-AT-355, TASK-AT-356
- em aberto: nenhuma para a entrega local

## Alvos explicitos
1. `apps/web/src/views/service-flows.tsx` e estilos/testes associados.
2. `services/api/src/core/service-flows/` e catalogo do piloto Always Fit.
3. Scriptoteca/compilador de placeholders de produtos.

## Fora de escopo
- alterar conectores, executar scraping ou criar pedidos reais;
- resolver as pendencias de negocio declaradas da v0.1 por suposicao;
- redesenhar outras telas ou mudar a taxonomia de navegacao;
- substituir o motor de grafo, rewind ou action firewall existentes.

## Checklist
1. Manter ficha, status, concluir e reiniciar em coluna sticky ao lado do fluxo.
2. Criar restart auditado e confirmado sem deixar sessao anterior aberta.
3. Aplicar mascara de CPF e exigir CPF somente nas escolhas que afirmam sua obtencao.
4. Modelar produtos como listas estruturadas, pesquisaveis, removiveis e com quantidade.
5. Reutilizar produtos do pedido como opcoes nos campos relacionados das etapas seguintes.
6. Tornar forma/periodo de uso opcional e remover o campo livre de escopo sem uso.
7. Eliminar o limite visual de tres produtos nas macros do piloto.
8. Exibir o resumo somente no encerramento, dentro da coluna lateral.
9. Diagnosticar e testar ETAPA-004/005 com dados progressivos.

## Acceptance Criteria
1. A coluna lateral acompanha o scroll em desktop e volta ao fluxo normal em viewport estreito.
2. Concluir atendimento e reiniciar permanecem visiveis durante o percurso; restart exige confirmacao e gera auditoria.
3. CPF recebe mascara `000.000.000-00`, e uma escolha que declara CPF obtido fica bloqueada sem 11 digitos validos.
4. Produtos do pedido aceitam quantidade ilimitada de itens, busca, inclusao manual, incremento, decremento e remocao.
5. Campos de produtos relacionados, concomitantes, abertos, lacrados, devolvidos, retidos e troca reutilizam a lista-base e suportam `Todos` quando aplicavel.
6. Quantidades nunca excedem silenciosamente as disponiveis no pedido nos campos que representam subconjuntos.
7. `order.products` passa a ser a fonte unica para macros do pedido, sem `produto_1..3` na mensagem do piloto.
8. ETAPA-008 nao exige forma/periodo de uso; ETAPA-012 nao exige campo livre de escopo sem uso.
9. O resumo para sussurro aparece somente com sessao concluida na coluna lateral.
10. Todos os testes anteriores de execucao, seguranca, grafo e navegacao continuam passando.

## Definition of Done
1. Task, API, UI, catalogo, scripts e testes atualizados de forma rastreavel.
2. `npm run check`, integridade documental, higiene e validacao Prisma aprovados.
3. Commits semanticos publicados na branch remota.

## Validacao
- comandos/checks: testes focados API/Web/catalogo, `npm run check`, `npm run check:docs`, `npm run repo:hygiene`, `git diff --check`
- revisao manual: desktop sticky, mobile linear, teclado, quantidades, mascara, restart e resumo final

## Resultado
- cockpit lateral sticky com ficha persistente, concluir, reiniciar confirmado e resumo final;
- produtos estruturados sem limite de tres slots, com catalogo, busca, quantidades e subconjuntos validados;
- CPF mascarado e exigido apenas nas escolhas positivas de identificacao;
- forma/periodo de uso, permanencia do mal-estar e escopo livre removidos da ficha por ja serem capturados nas decisoes;
- ETAPA-012 reutiliza o pedido existente sem nova selecao; classificacoes posteriores so aparecem quando alteram a rota;
- cabecalho operacional do piloto reduzido ao titulo e acesso a Wiki;
- seed local aplicado com nova versao publicada e historico anterior preservado.

## Follow-up 2026-07-16 - Classificacao por lacrados
- status: in-progress
- substituir a dupla selecao de itens abertos e lacrados por um unico seletor de itens lacrados;
- oferecer `Todos` e `Nenhum` sobre os produtos do pedido;
- considerar implicitamente abertas as unidades nao marcadas como lacradas;
- eliminar a ETAPA-014 e os campos de lacrados devolvidos/retidos; havendo lacrados, seguir diretamente para a reversa;
- manter apenas o saldo final calculado, sem exigir o valor separado de itens retidos.

## Evidencia de conclusao
- `npm run check`: aprovado, com 1 teste Redis opcional ignorado por configuracao;
- `npm run check:docs` e `npm run repo:hygiene`: aprovados apos regenerar o coverage HTML da API;
- API focada: 70 testes aprovados apos a simplificacao final;
- Web focada: 18 testes aprovados apos a simplificacao final;
- coverage API: 700 testes aprovados, 1 Redis opcional ignorado;
- build Web e `git diff --check`: aprovados;
- captura Playwright indisponivel por ausencia de `libnspr4.so` no Chromium local; nenhuma dependencia foi instalada.

## Evidencia esperada
- testes automatizados para listas, CPF, restart, regras das etapas e regressao do fluxo;
- task concluida com resultados e riscos residuais explicitos.

## Riscos
- serializacao inconsistente de listas antigas em texto;
- confundir subconjunto de itens do pedido com nova composicao de troca;
- restart criar sessoes abertas duplicadas;
- sticky ocupar altura excessiva em telas menores.

## Blockers possiveis
- catalogo comercial incompleto; inclusao manual deve manter o atendimento desbloqueado;
- produtos historicos podem ter nomes divergentes e exigem deduplicacao case-insensitive.

## Retorno esperado
- resumo curto do que mudou;
- evidencia de validacao;
- pendencias de negocio preservadas;
- proximo passo recomendado somente se houver risco real restante.
