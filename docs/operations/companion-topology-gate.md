# Companion Topology Gate

## Metadata
- status: required-before-runtime-shells
- owner: operations-maintainers
- last-updated: 2026-07-12
- related-task: TASK-AT-195

Este gate operacional complementa o spike documental concluido. Cada item possui uma task de aplicabilidade para evitar o ciclo em que testes de runtime bloqueiam o scaffolding que os torna possiveis.

## Checklist
- [x] WSL2 e Chrome Stable detectados no ambiente atual.
- [x] Windows acessou endpoint HTTP descartavel com bind WSL em `127.0.0.1` via `localhost`.
- [x] Endpoint descartavel encerrado e nenhum dado real utilizado.
- [ ] Probe repetido apos `wsl --shutdown` (`TASK-AT-211`, exige Host shell reiniciavel).
- [ ] Probe repetido apos suspensao/retomada do Windows (`TASK-AT-211`, validacao manual).
- [ ] Probe repetido com mudanca de rede ou VPN aplicavel (`TASK-AT-211`, validacao manual).
- [x] WebSocket autenticado validado automaticamente com Origin permitido e rejeitado com Origin arbitrario (`TASK-AT-211`); smoke com ID real ainda pendente.
- [x] Bind externo (`0.0.0.0`/LAN) impedido por teste (`TASK-AT-211`); verificacao Windows/LAN manual ainda pendente.
- [x] Host indisponivel, rotacao e reconexao cobertos por testes (`TASK-AT-211`); confirmacao visual ainda pendente.
- [x] Fallback Host no Windows documentado com o mesmo protocolo em `docs/architecture/companion-windows-wsl-chrome-topology.md`.

Cada evidencia registra data, topologia, resultado e duracao, sem IP persistente, payload, cookie ou segredo. Falha em item obrigatorio bloqueia runtime dependente ate escolha e validacao do fallback local-first.

## Matriz de conclusao
| Task | Gate exigido para concluir |
|---|---|
| `TASK-AT-202` | deteccao WSL/Chrome, HTTP loopback atual, endpoint encerrado e fallback documentado |
| `TASK-AT-203` | mesmos itens da 202; sem teste WebSocket porque ainda nao existe Host runtime |
| `TASK-AT-210` | bind configurado para loopback e fallback preservado; teste de rede ocorre na 211 |
| `TASK-AT-211` | todos os probes de lifecycle, Origin, bind e reconexao aplicaveis |

O subconjunto de `TASK-AT-202` esta concluido. Suspensao, rede/VPN e WebSocket permanecem explicitamente deferidos para `TASK-AT-211`, sem serem tratados como aprovados.

## Evidencia de shells
- [x] `TASK-AT-203`: manifest MV3 validado com somente `sidePanel`, sem host permissions; pacote gera e valida manifest, service worker e side panel.
- [x] `TASK-AT-210`: health testado em porta efemera com endereco `127.0.0.1`; binds `0.0.0.0`, LAN, IPv6 aberto e alias `localhost` foram rejeitados; `SIGINT` e `SIGTERM` liberam a porta.
- Lifecycle WSL, suspensao, VPN, carga unpacked com ID real e confirmacao visual continuam abertos para `TASK-AT-211`.

## Evidencia automatizada de protocolo
- 20 testes do Host cobrem token forte, expiracao, uso unico, rotacao, Origin exata, rate limit, payload maximo, versao, direcao, replay, shutdown e porta liberada.
- Token de pairing trafega somente no primeiro `COMPANION_HELLO`; query string nao autentica e expira por timeout pre-auth.
- Allowlist exige `chrome-extension://` com extension ID explicito de 32 caracteres; nenhum wildcard ou origem HTTP e aceito.
- A conclusao formal da `TASK-AT-211` permanece pendente dos itens manuais desmarcados acima.
