# CaseFlow Engine + AlwaysTrack Companion

## Metadata
- status: active
- owner: architecture-maintainers
- last-updated: 2026-07-11
- source-of-truth: docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md

## Objetivo
Definir as fronteiras obrigatorias da frente CaseFlow e impedir que scraping, navegacao externa ou automacoes criticas contaminem o AlwaysTrack Core.

## Camadas

### AlwaysTrack Core
Persiste casos e fatos normalizados, resolve conflitos e heuristicas, compila fluxos versionados, monta mensagens pela Scriptoteca e mantem auditoria, historico, metricas e administracao. Reutiliza `ServiceFlow`, `ServiceFlowStep`, `ServiceFlowSession` e os contratos de scripts existentes.

O Core nao le DOM, nao controla abas, nao guarda cookies de terceiros e nao depende de IA ou de uma API externa para o caminho principal.

Essa independencia e um contrato verificavel: heuristica, reconciliacao, compilador de plano e mensagens nao importam provedores de IA, nao leem chaves de IA e nao fazem chamadas de rede. O teste arquitetural em `services/api/src/core/case-flow/architecture.test.ts` protege essa fronteira. ChatGPT pode continuar como ferramenta externa de uso livre do operador, sem integrar o runtime, receber contexto automaticamente ou se tornar requisito do caso.

### Companion Host
Processo local separado, com bind futuro somente em `127.0.0.1`. Orquestra consultas progressivas, concorrencia, timeout e cache efemero; intermedeia Core e extensao; reporta saude e resultados normalizados. Nao persiste credenciais dos sistemas consultados.

### Extensao Chromium
Extensao Manifest V3 instalada no perfil exclusivo de trabalho do Chrome Stable. Microsoft Edge e compatibilidade secundaria; Opera nao e navegador de referencia. Mantem o side panel, content scripts e service worker; reutiliza abas e sessoes abertas; le DOM e detecta login, captcha e 2FA. Pode preencher apenas rascunhos explicitamente autorizados e nunca confirma a acao final.

### Conectores
Adaptadores isolados por sistema. Cada conector declara dominio, chaves, capacidades, risco, seletores, estados de autenticacao, campos, transformacoes, fixtures e versao. Falha, timeout ou drift de um conector produz estado explicito e nao derruba os demais nem muda sozinho o caso para `FAILED`.

## Fluxo de dados

```text
AlwaysChat aberto
  -> Extensao coleta intake somente leitura
  -> Companion Host agenda conectores aplicaveis
  -> Conectores devolvem resultados progressivos
  -> Core persiste fatos normalizados e conflitos
  -> Core resolve heuristica e compila ServiceFlow
  -> Side panel apresenta resumo, evidencias, passos e mensagens
  -> Usuario confirma qualquer acao critica fora do sistema
```

Raw HTML nao entra no Core por padrao. Cookies nunca sao extraidos. Cache de navegacao permanece local e efemero. O contrato entre componentes deve transportar identidade de instalacao, perfil, usuario e caso sem transportar segredos dos sites externos.

Drift gera um diagnostico por allowlist (`connectorId`, versoes, codigo, tipo de pagina, duracao, horario, `caseId` e `runId`). URL, HTML e screenshot nao sao persistidos por padrao. O conector fica degradado e sem retry automatico ate um health posterior indicar recuperacao; outros conectores e o estado central do caso seguem independentes.

## Scriptoteca e interoperabilidade

A Scriptoteca no AlwaysTrack e a fonte canonica de snippets e o compilador CaseFlow continua responsavel por montar mensagens com fatos do caso atual. SmartScript captura e propoe conteudo no modulo local isolado; nao substitui o compilador. Copia por botao funciona no modo padrao `COPY_ONLY`, sem Espanso.

Espanso e uma interoperabilidade opcional de exportacao (`ESPANSO_EXPORT`). Ele recebe somente snippets revisados e nao recebe fatos, `caseId`, navegacao ou captura CaseFlow. Como Espanso nao conhece semanticamente o campo do atendimento, expansao automatica deve ser desabilitada onde o contexto nao puder ser validado; nesses locais, usar copia explicita.

## Acoes e limites

Permitido no escopo inicial: consultar, abrir, buscar, ler, extrair, normalizar, resumir, classificar, compilar fluxo e mensagem, copiar, focar aba e preparar rascunho explicitamente autorizado.

Proibido automatizar: enviar ou resolver atendimento, transferir ou tabular, postar ou ler Slack, movimentar status no OMIE, confirmar pagamento, pedido, reenvio, reversa, acareacao, ticket, estorno, reembolso, cancelamento ou qualquer submit destrutivo/financeiro. Login, captcha e 2FA sempre interrompem o conector para intervencao humana; senha e cookies nao sao armazenados.

Slack permanece manual. O Core pode montar texto, resumir evidencias, gerar checklist, copiar a mensagem e registrar que ela foi preparada; extensao e Host nao abrem canal, pesquisam, leem, preenchem, postam, reagem, editam ou excluem conteudo no Slack.

Playwright fica restrito a testes, fixtures, paginas simuladas, smoke e prototipos. Nao controla o perfil diario. IA generativa, OCR como caminho principal, marketplace, SaaS, multiusuario corporativo e agente livre nao fazem parte desta fase.

## Propriedade da interface

O side panel oferece a operacao diaria guiada e progressiva. O app web administra fluxos, regras, scripts, metricas, historico, configuracao e diagnostico. O grafo interno de fluxo nao vira um canvas operacional: o atendente recebe passo atual, contexto curto, evidencias, orientacao, mensagem e opcoes grandes.

## Evolucao e ordem

| Bloco da SPEC | Responsabilidade | Faixa principal do backlog |
|---|---|---|
| A | contratos e seguranca | TASK-AT-194 a TASK-AT-202 |
| B | extensao base | TASK-AT-203 a TASK-AT-209 |
| C | Companion Host | TASK-AT-210 a TASK-AT-215 |
| D | caso, evidencia e APIs | TASK-AT-216 a TASK-AT-237 |
| E | heuristica deterministica | TASK-AT-238 a TASK-AT-243 |
| F | ServiceFlow executavel | TASK-AT-244 a TASK-AT-251 |
| G | UI guiada | TASK-AT-252 a TASK-AT-256 |
| H | Scriptoteca e mensagens | TASK-AT-257 a TASK-AT-262 |
| I | conectores | TASK-AT-263 a TASK-AT-282 |
| J | seguranca, performance e operacao | TASK-AT-283 a TASK-AT-300 |
| K | demo, rollout e agente futuro | TASK-AT-301 a TASK-AT-307 |

A ordem de produto e contratos, shells, intake, caso/evidencia, Rastreio, resumo parcial, heuristica, fluxo compilado, stepper, mensagens, demais conectores, rascunhos e hardening. Agente futuro recebe somente caso, fatos, plano, no atual, capabilities, gates e ferramentas permitidas; nunca recebe navegador irrestrito, clique generico, Slack, submit, senha, cookies ou poder financeiro.

## Decisoes ainda isoladas

- `TASK-AT-195` valida a topologia Windows, WSL e Chrome do ambiente local atual.
- `TASK-AT-196` fecha autenticacao e confianca entre componentes.
- `TASK-AT-197` consolida o threat model.
- `TASK-AT-199` define capabilities e firewall formal.
- `TASK-AT-200` e `TASK-AT-201` fecham conector e protocolo antes dos shells.
