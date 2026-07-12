# Companion Extension Permissions

## Metadata
- status: active
- owner: security-maintainers
- last-updated: 2026-07-12
- related-task: TASK-AT-203

O shell MV3 solicita apenas `sidePanel`. Nao declara `cookies`, `tabs`, `scripting`, `storage`, `activeTab` ou `host_permissions`. O service worker apenas configura a abertura do painel pelo botao da extensao.

Permissoes de dominio entram somente com cada conector, de forma explicita e revisavel. O shell atual nao le paginas, nao injeta scripts, nao acessa sistemas externos e nao abre WebSocket.

Qualquer ampliacao exige atualizar o threat model, fixture/teste do manifest e task proprietaria do conector ou capability.
