# TASK-AT-029 - Wiki rich content format

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-05-30
- source-of-truth: docs/tasks/TASK-AT-029-wiki-rich-content-format.md

## Objetivo
Definir um contrato seguro para conteudo rico da Wiki antes de trocar o textarea por editor avancado.

## Decisao recomendada
Usar Markdown como formato canonico inicial, com renderizacao sanitizada e compatibilidade com paginas antigas em texto puro. Evitar HTML livre vindo do usuario.

## Escopo
- Adicionar metadado de formato do conteudo quando necessario.
- Preservar leitura de paginas antigas.
- Garantir que revisoes e requisicoes carreguem o mesmo formato.
- Definir politica de sanitizacao/renderizacao.

## Aceite
- Paginas antigas continuam abrindo sem migracao manual.
- Conteudo rico nao executa HTML/JS arbitrario.
- API retorna formato suficiente para editor e leitor renderizarem corretamente.
- Revisao admin continua comparando base/publicado/proposta.

## Riscos
- XSS se HTML for aceito sem sanitizacao.
- Quebra de historico se o formato for alterado sem fallback.
- Diff de conteudo rico pode ficar enganoso se misturar HTML e texto.
