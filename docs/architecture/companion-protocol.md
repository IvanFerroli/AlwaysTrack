# Companion Protocol Boundaries

## Metadata
- status: trust-contract
- owner: architecture-maintainers
- last-updated: 2026-07-12
- related-task: TASK-AT-196

## Canais
```text
Side panel/web -- sessao AlwaysTrack --> API Core
Extensao -- WebSocket autenticado em 127.0.0.1 --> Companion Host
Companion Host -- credencial local de instalacao --> API Core
Content script -- mensagens MV3 validadas --> service worker/extensao
```

O WebSocket valida Origin, pairing, versao, tamanho e rate limit antes de aceitar eventos. CORS aberto nao substitui Origin e nao e permitido. O listener nao aceita interface externa.

## Envelope minimo
Todo evento operacional inclui `protocolVersion`, `messageId`, `timestamp`, `installationId`, `browserProfileId`, `userId`, `caseId` e, quando houver conector, `runId` e `connectorId`. Eventos sem contexto exigido ou fora de ordem sao rejeitados e auditados sem payload sensivel.

Eventos canonicos permanecem os definidos na SPEC: hello/pairing, browser ready, inicio/intake, execucao/progresso/resultado, intervencao, rascunho, cancelamento e health. Schemas e transporte executavel pertencem a `TASK-AT-201` e `TASK-AT-211`.

## Regras
- `messageId` e idempotency key evitam replay acidental.
- `caseId` e `runId` nunca sao inferidos apenas pela aba ativa.
- Reconexao exige nova validacao da instalacao e continua somente runs ainda ativos.
- `INSERT_DRAFT` e `FILL_FORM` carregam `authorizationRef` opaca emitida pelo Core, de uso unico e vinculada ao contexto; nunca implicam `SUBMIT`.
- Mensagens desconhecidas, capabilities desconhecidas e versoes incompatíveis sao bloqueadas.
- HTML bruto, cookies, senhas e tokens externos nao atravessam o protocolo.
