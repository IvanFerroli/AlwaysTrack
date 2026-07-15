# TASK-AT-312 - Evidencia local de acessibilidade

## Classificacao

- ambiente: local, Linux, Node.js, Vitest e JSDOM
- data: 2026-07-15
- commit: atribuido pelo orchestrator no handoff de integracao e push
- dados: fixtures sinteticas, sem credenciais, PII ou sistemas externos
- alcance: Web e side panel da extensao Chromium

Esta evidencia automatizada detecta regressoes conhecidas, mas nao equivale a certificacao WCAG nem a validacao com tecnologia assistiva real.

## Gate automatizado

| Superficie | Evidencia | Resultado |
| --- | --- | --- |
| Web P0 | nomes acessiveis, labels, IDs, relacionamentos ARIA, tabelas, tabs e paineis | PASS |
| Web teclado | notificacoes com Enter/Escape/retorno de foco; tabs com setas, Home e End | PASS |
| Web contraste | pares criticos de texto, acao, erro e foco | PASS, WCAG AA ou limiar nao textual |
| Web movimento | contrato global para `prefers-reduced-motion` | PASS estatico |
| Side panel | landmark, heading, botoes nomeados, progresso e live regions | PASS |
| Side panel teclado | controles nativos, foco de intervencao e atalhos configuraveis/desativaveis | PASS |
| Side panel contraste | texto, acao, erro e foco | PASS, WCAG AA ou limiar nao textual |
| Side panel zoom | layout fluido, quebra de palavras e breakpoint de coluna unica | PASS estatico |

Comandos executados nesta rodada:

```text
npm test --workspace @alwaystrack/web
npm test --workspace @alwaystrack/companion-extension
npm run typecheck --workspace @alwaystrack/web
npm run typecheck --workspace @alwaystrack/companion-extension
```

Todos encerraram com exit code `0`. A validacao agregada e os checks de repositorio devem ser registrados ao final da rodada, porque existem alteracoes concorrentes fora do ownership desta task.

## Validacao manual pendente

| Excecao | Justificativa | Owner | Prazo |
| --- | --- | --- | --- |
| NVDA + Chrome/Edge no fluxo Web P0 | JSDOM nao reproduz arvore de acessibilidade ou fala real | QA / TASK-AT-334 | antes do gate TASK-AT-335 |
| Leitor de tela no side panel Chromium | requer extensao empacotada e navegador autorizado | QA / TASK-AT-334 | antes do gate TASK-AT-335 |
| Zoom 200% e 400% sem sobreposicao | CSS foi validado estaticamente; composicao real requer browser | Frontend / TASK-AT-314 | antes do gate TASK-AT-335 |
| Contraste de estados fora das jornadas P0 | o gate cobre pares criticos, nao todas as combinacoes dinamicas | Frontend | 2026-07-31 |

Checklist para a execucao manual autorizada:

1. Percorrer login, navegacao, notificacoes e administracao CaseFlow somente com teclado.
2. Confirmar ordem de fala, nomes, estados e atualizacoes em leitor de tela.
3. Repetir Web em 200% e 400%, e side panel na menor largura suportada.
4. Ativar movimento reduzido no sistema e confirmar ausencia de transicoes perceptiveis.
5. Registrar navegador, SO, tecnologia assistiva, commit e capturas sanitizadas.

## Risco residual

O scanner e intencionalmente deterministico e sem dependencia nova. Ele impede as regressoes criticas codificadas, mas nao cobre toda a WCAG, comportamento de browser, reflow real ou qualidade da experiencia falada. Nenhum GO de rollout ou compatibilidade pode ser inferido desta evidencia local.
