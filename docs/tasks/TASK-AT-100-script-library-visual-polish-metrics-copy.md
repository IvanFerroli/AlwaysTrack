# TASK-AT-100 - Scriptoteca: polimento visual de metricas e copia

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-06-13
- source-of-truth: docs/tasks/TASK-AT-100-script-library-visual-polish-metrics-copy.md

## Fase
- fase: C - Produto interno definitivo / Frente SAC
- prioridade: 14.11
- dependencias: `TASK-AT-097`, `TASK-AT-092`

## Objetivo unico
Corrigir a leitura visual das metricas da Scriptoteca e deixar a acao de copiar script mais clara e compacta.

## Contexto
O painel de metricas estava reaproveitando a estrutura visual da matriz de permissoes, deixando texto e numeros colados. A acao principal de copiar tambem precisava parecer uma acao rapida de atendimento, nao um botao pesado no painel lateral.

## Escopo funcional
1. Criar layout proprio para cards de metricas da Scriptoteca.
2. Separar listas de "mais copiados" e "buscas sem resultado" com espaçamento e hierarquia.
3. Adicionar estado vazio legivel nas listas gerenciais.
4. Trocar o botao de copiar por botao compacto com icone e feedback visual.
5. Preservar a mecanica atual de copia, placeholders, validacao, recertificacao e obsolescencia.

## Acceptance Criteria
1. Numeros das metricas nao ficam grudados nos rotulos.
2. O painel continua legivel em desktop e em larguras menores.
3. O botao de copiar fica identificavel sem ocupar largura desnecessaria.
4. O feedback de copia continua aparecendo.
5. Nao ha regressao nos fluxos de validacao, recertificacao e obsolescencia.

## Impacto na apresentacao
Melhora a percepcao de ferramenta pronta para uso real do SAC, especialmente na area que mostra aprendizado operacional e lacunas de scripts.

## Riscos
- Ajustes CSS podem afetar painéis que compartilham `.wiki-reader-panel`.
- Botao compacto demais pode reduzir discoverability se o usuario nao entender o icone; por isso o texto curto permanece.

## Execucao
- execution-log: docs/tasks/EXEC-AT-100-script-library-visual-polish-metrics-copy.md
