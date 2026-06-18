# TASK-AT-124 - Scriptoteca: modo atendimento rapido

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-18
- source-of-truth: docs/tasks/TASK-AT-124-script-library-fast-attendance-mode.md

## Modo
- mode: product

## Objetivo unico
Criar um modo compacto de atendimento para SAC usar a Scriptoteca sem rolar a pagina inteira: busca, lista curta, placeholders e copiar ficam no primeiro viewport.

## Contexto
A tela atual e poderosa para gestao, mas o operador de SAC precisa de velocidade. A jornada principal deveria ser: buscar por problema, preencher placeholders e copiar em poucos segundos.

## Escopo funcional
1. Criar toggle ou rota/aba "Atendimento" dentro da Scriptoteca.
2. Layout compacto com busca no topo, categorias como chips, lista de resultados e preview.
3. Placeholders destacados ao lado do texto.
4. Botao de copia fixo/visivel.
5. Manter modo Gestao para Supervisor/Admin.

## Acceptance Criteria
1. SAC consegue buscar e copiar sem acessar formularios de gestao.
2. Placeholders obrigatorios ficam visiveis antes da copia.
3. A tela funciona bem em notebook com pouco espaco vertical.
4. Nao remove recursos atuais de gestao.

## Riscos
- Duplicar UI demais. Preferir extrair componentes reutilizaveis da view atual.
