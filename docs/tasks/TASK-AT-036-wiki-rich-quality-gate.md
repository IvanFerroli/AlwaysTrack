# TASK-AT-036 - Wiki rich quality gate

## Metadata
- status: planned
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

## Aceite
- `npm run check` passa.
- `npm run build --workspace @alwaystrack/web` passa.
- Conteudo malicioso nao executa script.
- Upload invalido e recusado.
- Review nao altera pagina de outra organizacao.

## Riscos
- Sem harness frontend dedicado, regressao visual pode escapar.
- Editor rico pode depender de APIs DOM dificeis de testar em unit tests.
