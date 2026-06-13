# TASK-AT-088 - Scriptoteca Operacional do SAC

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-12
- source-of-truth: docs/tasks/TASK-AT-088-sac-operational-script-library.md

## Fase
- fase: C - Produto interno definitivo / Frente SAC
- prioridade: 14
- dependencias: Wiki/FAQ existentes; tags e busca combinada recomendadas.

## Objetivo unico
Criar uma Scriptoteca Operacional para centralizar textos prontos do SAC, organizados por categoria, canal, tags e status de validacao.

## Contexto
Dor real trazida pelo Maicon: scripts/textos de atendimento ficam soltos em bloco de notas, WhatsApp, documentos ou memoria individual. A ferramenta precisa permitir classificar scripts por categoria e navegar por um menu/indice ate o texto certo.

## Escopo funcional macro
1. Scripts com titulo, categoria, canal recomendado, texto, tags, status, autores e validadores.
2. Navegacao por categorias para reproduzir o "menuzinho" pedido pela operacao.
3. Busca por titulo, categoria, tags e palavras do texto.
4. Preview confortavel com botao de copiar em um clique.
5. Placeholders simples como `{nome_cliente}`, `{numero_pedido}`, `{produto}`, `{codigo_rastreio}`, `{prazo}`, `{valor}` e `{atendente}`.
6. Selo de script validado por Supervisor/Admin.
7. Historico/versionamento simples.
8. Relacao com Wiki/FAQ sem competir com elas.
9. Permissoes: SAC visualiza/copia/sugere; Supervisor cria/edita/aprova; Admin controla tudo.

## Subtasks planejadas
1. `TASK-AT-089`: modelo de dados, status e permissoes.
2. `TASK-AT-090`: tela de listagem, menu lateral por categoria e preview.
3. `TASK-AT-091`: busca, filtros e tags.
4. `TASK-AT-092`: copiar texto e placeholders.
5. `TASK-AT-093`: CRUD, sugestoes e fluxo de validacao.
6. `TASK-AT-094`: historico/versionamento de scripts.
7. `TASK-AT-095`: vinculos com Wiki/FAQ.
8. `TASK-AT-096`: seeds/demo com scripts reais.
9. `TASK-AT-097`: metricas de uso da Scriptoteca.

## Acceptance Criteria macro
1. SAC encontra script por categoria.
2. SAC busca script por palavra-chave.
3. SAC copia texto com um clique.
4. Supervisor/Admin cria, edita, valida e marca script como obsoleto.
5. Script validado exibe selo claro.
6. Script obsoleto nao aparece como recomendacao principal.
7. Cada alteracao registra criacao/atualizacao e historico.
8. Tela permanece confortavel com muitos scripts.
9. Dados demo mostram valor em apresentacao.
10. Documentacao diferencia Wiki, FAQ e Scriptoteca.

## Impacto na apresentacao
Mostra que o AlwaysTrack resolve dor real do SAC alem de vendas/ranking: padronizacao, velocidade de atendimento e treinamento de novos operadores.

## Riscos
- Virar CMS grande demais antes do MVP.
- Misturar procedimento completo de Wiki com texto pronto de atendimento.
- Scripts obsoletos continuarem em destaque.
