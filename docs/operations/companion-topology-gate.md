# Companion Topology Gate

## Metadata
- status: required-before-runtime-shells
- owner: operations-maintainers
- last-updated: 2026-07-12
- related-task: TASK-AT-195

Este gate operacional complementa o spike documental concluido. `TASK-AT-202`, `203`, `210` e `211` nao podem ser marcadas como concluidas enquanto os itens aplicaveis nao tiverem evidencia local registrada.

## Checklist
- [x] WSL2 e Chrome Stable detectados no ambiente atual.
- [x] Windows acessou endpoint HTTP descartavel com bind WSL em `127.0.0.1` via `localhost`.
- [x] Endpoint descartavel encerrado e nenhum dado real utilizado.
- [ ] Probe repetido apos `wsl --shutdown`.
- [ ] Probe repetido apos suspensao/retomada do Windows.
- [ ] Probe repetido com mudanca de rede ou VPN aplicavel.
- [ ] WebSocket autenticado validado com Origin permitido e rejeitado com Origin arbitrario (`TASK-AT-211`).
- [ ] Bind externo (`0.0.0.0`/LAN) impedido por teste (`TASK-AT-211`, `TASK-AT-283`).
- [ ] Host indisponivel e reconexao com backoff verificados.
- [ ] Fallback Host no Windows documentado com o mesmo protocolo, caso algum probe obrigatorio falhe.

Cada evidencia registra data, topologia, resultado e duracao, sem IP persistente, payload, cookie ou segredo. Falha em item obrigatorio bloqueia runtime dependente ate escolha e validacao do fallback local-first.
