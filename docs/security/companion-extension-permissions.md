# Companion Extension Permissions

## Metadata
- status: active
- owner: security-maintainers
- last-updated: 2026-07-12
- related-task: TASK-AT-203

O shell MV3 solicita `sidePanel` e `tabs`. `tabs` e necessario ao registro controlado para descobrir/reutilizar `tabId`, focar e reabrir uma unica aba por sistema; URLs sao reduzidas a dominio e nunca persistem query ou fragmento. Nao declara `cookies`, `scripting`, `storage`, `activeTab` ou `host_permissions`.

Permissoes de dominio entram somente com cada conector, de forma explicita e revisavel. O shell atual nao le paginas, nao injeta scripts, nao acessa sistemas externos e nao abre WebSocket.

Qualquer ampliacao exige atualizar o threat model, fixture/teste do manifest e task proprietaria do conector ou capability.
