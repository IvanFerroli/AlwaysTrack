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
- [ ] WebSocket autenticado validado com Origin permitido e rejeitado com Origin arbitrario (`TASK-AT-211`).
- [ ] Bind externo (`0.0.0.0`/LAN) impedido por teste (`TASK-AT-211`, `TASK-AT-283`).
- [ ] Host indisponivel e reconexao com backoff verificados (`TASK-AT-211`).
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
