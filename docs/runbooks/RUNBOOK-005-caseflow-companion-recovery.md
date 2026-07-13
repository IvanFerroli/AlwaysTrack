# RUNBOOK-005 - CaseFlow Companion Recovery

## Quando usar
Host indisponivel, drift de conector, atualizacao interrompida, retomada de notebook ou configuracao incorreta.

## Sequencia
1. Interromper novos runs e preservar resultados parciais.
2. Classificar: host/rede, pairing, drift isolado ou configuracao.
3. Host/rede: seguir `../operations/companion-local-runbook.md`.
4. Update/rollback: seguir `../operations/companion-update-rollback-runbook.md`.
5. Drift: marcar somente o conector afetado e seguir `../operations/connector-drift-runbook.md`.
6. Configuracao: export/restore aditivo em `../operations/companion-backup-restore-runbook.md`.
7. Validar fixture fake. Live smoke permanece separado em `../operations/connector-live-smoke-checklists.md`.

## Saida
GO somente com health local, auditoria, fixture verde, nenhum segredo e nenhum run cruzado. Pairing/sessao/firewall/suspensao ficam `PENDENTE_LIVE` sem evidencia manual real.
