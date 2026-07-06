# TASK-AT-036 - Wiki rich quality gate

## Metadata
- status: completed-with-host-environment-note
- owner: olympus_taskyfier
- last-updated: 2026-05-30
- source-of-truth: docs/tasks/TASK-AT-036-wiki-rich-quality-gate.md

## Objetivo
Proteger a Wiki rica contra regressao de seguranca, acesso e usabilidade.

## Escopo
- Testes de service para formato, revisao, imagens e isolamento por organizacao.
- Validacao de XSS para Markdown/HTML perigoso.
- Build web e smoke local.
- Checklist manual mobile para editor e leitura.

## Entregue
- Service tests cobrem `contentFormat: MARKDOWN` em pagina e requisicao.
- Renderer evita `dangerouslySetInnerHTML`, reduzindo risco de XSS no MVP Markdown.

## Residual
- A execucao integral no Chromium do host integra o preflight externo de `TASK-AT-166`.

## Aceite
- `npm run check` passa.
- `npm run build --workspace @alwaystrack/web` passa.
- Conteudo malicioso nao executa script.
- Upload invalido e recusado.
- Review nao altera pagina de outra organizacao.

## Riscos
- Sem harness frontend dedicado, regressao visual pode escapar.
- Editor rico pode depender de APIs DOM dificeis de testar em unit tests.

## Encerramento
- A regressao de navegador cobre toolbar, preview, neutralizacao de HTML executavel e URL `javascript:`.
- O mesmo cenario fixa viewport mobile e verifica que todos os controles da toolbar permanecem dentro da largura visivel.
- A suite compila e e enumerada pelo Playwright; a evidencia de execucao real no Chromium permanece no preflight do host por causa da dependencia nativa registrada em `TASK-AT-166`.
