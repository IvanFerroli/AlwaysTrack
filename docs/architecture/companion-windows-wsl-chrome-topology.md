# Companion Windows, WSL e Chrome

## Metadata
- status: accepted-for-current-environment
- owner: architecture-maintainers
- last-updated: 2026-07-12
- related-task: TASK-AT-195

## Decisao
O ambiente local atual usa Chrome Stable no Windows e AlwaysTrack no Ubuntu WSL2. Essa e uma topologia suportada para desenvolvimento, nao um requisito universal do produto. A extensao acessa o Companion Host por `localhost`; o Host faz bind somente em `127.0.0.1` e nunca em `0.0.0.0`.

## Evidencia coletada
- Kernel: `microsoft-standard-WSL2`, distro `Ubuntu`.
- PowerShell 5.1 e interoperabilidade Windows/WSL disponiveis.
- Chrome Stable encontrado em `C:\Program Files\Google\Chrome\Application\chrome.exe`.
- Em 2026-07-12, um servidor HTTP descartavel no WSL, em `127.0.0.1:38471`, respondeu ao `Invoke-WebRequest` executado no Windows via `http://localhost:38471`.
- O IP WSL observado foi `172.18.30.86`; ele e efemero e nao entra em configuracao persistente.

A prova confirma o encaminhamento HTTP no estado atual. WebSocket autenticado, Origin e reconexao pertencem a `TASK-AT-211` e `TASK-AT-283`.

## Gate e fallback
Antes dos shells (`202`, `203`, `210`, `211`), concluir e registrar o checklist em `docs/operations/companion-topology-gate.md`. Se `localhost` deixar de encaminhar com confiabilidade:

1. preferir Companion Host Node executado no Windows, mantendo os mesmos contratos;
2. como alternativa temporaria, usar proxy local explicitamente configurado e restrito ao loopback;
3. nunca abrir `0.0.0.0`, IP da LAN ou regra ampla de firewall para contornar o problema.

Firewall do Windows deve permitir apenas o executavel/local loopback necessario. Mudanca de IP WSL nao pode exigir configuracao manual. Falha do Host gera estado offline no side panel, preserva o caso no Core e inicia backoff com jitter; nao cria polling agressivo nem loading global.

## Operacao esperada
- Bancada local inicia API, Host e extensao em ordem observavel.
- Extensao reconecta apos reinicio do Host sem reutilizar pairing revogado.
- Host indisponivel, WSL parado ou maquina retomada de suspensao aparecem como diagnostico acionavel.
- Chrome usa perfil exclusivo de trabalho; Edge e compatibilidade secundaria e Opera nao e referencia.
