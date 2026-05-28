# TASK-BRD-001 - Aplicar favicon e identidade web da marca

## Metadata
- status: done
- owner: olympus_taskyfier
- executor: olympus_orchestrator
- last-updated: 2026-04-30
- source-of-truth: docs/tasks/TASK-BRD-001-aplicar-favicon-identidade-web.md

## Objetivo
Fazer o projeto passar a apresentar a marca SyLembra no navegador e em instalacao web app, usando os assets oficiais de favicon fornecidos localmente.

## Contexto
Os assets foram fornecidos em:
`C:\Users\ACER\Downloads\sylembra-brand-assets\sylembra-brand-assets\favicon`

No WSL, a origem usada foi:
`/mnt/c/Users/ACER/Downloads/sylembra-brand-assets/sylembra-brand-assets/favicon`

## Escopo
- Copiar favicons e icones de app para `apps/web/public/favicon`.
- Declarar favicons no `apps/web/index.html`.
- Criar manifest web app em `apps/web/public/site.webmanifest`.
- Manter a mudanca restrita ao frontend.

## Fora de escopo
- Alterar logo dentro da interface.
- Alterar paleta visual, tipografia ou componentes.
- Mexer em `.env`, secrets, Meta ou jobs.
- Otimizar/regerar imagens.

## Arquivos envolvidos
- `apps/web/index.html`
- `apps/web/public/site.webmanifest`
- `apps/web/public/favicon/*`

## Acceptance Criteria
- Navegadores modernos usam `favicon.svg` quando suportado.
- Fallback `.ico` e PNGs existem para browsers antigos.
- Apple touch icon aponta para imagem 180x180.
- Manifest referencia icones 192x192 e 512x512.
- Build do frontend permanece verde.

## Execucao 2026-04-30
- Assets copiados para `apps/web/public/favicon`.
- `index.html` atualizado com `theme-color`, favicons, Apple touch icon e manifest.
- `site.webmanifest` criado com nome, cores e icones da marca.

## Validacao
- `npm run build --workspace @alwaystrack/web`
- `npm run check`

## Riscos
- Browser pode manter favicon antigo em cache; validar com hard refresh ou aba anonima.
- A identidade dentro da UI ainda usa marca textual/avatar existente; troca de logo interna fica para task separada.
