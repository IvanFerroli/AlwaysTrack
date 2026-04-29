# TASK-QLT-004 - Revisao LGPD e seguranca

## Metadata
- status: proposed
- owner: security-reviewer
- last-updated: 2026-04-29
- source-of-truth: docs/tasks/TASK-QLT-004-revisao-lgpd-seguranca.md

## Modo
- mode: audit

## Agentes sugeridos
- security reviewer
- `olympus_orchestrator`
- `olympus_task_verifier`

## Objetivo unico
Auditar dados sensiveis, acesso, tokens, storage, logs e exports antes do aceite final.

## Inputs
- documento central, secao 19.2
- implementacao completa da V1

## Dependencias
- satisfeitas: `TASK-QLT-003`
- em aberto: n/a

## Alvos explicitos
1. relatorio de seguranca
2. ajustes pequenos obrigatorios
3. checklist LGPD operacional

## Fora de escopo
- parecer juridico formal

## Acceptance Criteria
1. Storage privado e links temporarios verificados.
2. Tokens usam hash e expiracao.
3. Roles nao vazam dados fora do escopo.
4. Logs nao expõem secrets/documentos indevidos.
5. Exports respeitam autorizacao.

## Validacao
- checklist manual
- testes de acesso negativo

## Riscos
- dado pessoal aparecer em log ou export
