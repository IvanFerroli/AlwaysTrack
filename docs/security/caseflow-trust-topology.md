# CaseFlow Trust Topology

## Metadata
- status: accepted
- owner: security-maintainers
- last-updated: 2026-07-12
- related-task: TASK-AT-196

## Identidades
- `userId`: usuario SAC autenticado no AlwaysTrack.
- `installationId`: instalacao local registrada e revogavel.
- `browserProfileId`: perfil de trabalho pareado; nao e cookie nem caminho do perfil.
- `extensionInstanceId`: instancia MV3 instalada e pareada.
- `caseId`: caso criado no Core a partir do AlwaysChat.
- `runId`: execucao unica de conector dentro do caso.

Toda escrita de fatos correlaciona esses identificadores. `caseId` deve pertencer ao usuario/organizacao, `runId` ao caso e conector, e instalacao/perfil devem estar ativos. Ausencia ou divergencia bloqueia a operacao e gera auditoria redigida.

## Chamadores
O app web e o side panel usam a sessao normal do AlwaysTrack para acoes do usuario. O Companion Host chama endpoints dedicados com credencial local de instalacao, de escopo minimo, emitida pela API apos pairing autenticado. A extensao nao envia fatos diretamente ao Core: comunica-se com o Host pelo protocolo loopback.

O cookie `alwaystrack_session` nunca e credencial local. Nenhum segredo do Companion autoriza login web ou acesso a outros dominios da API.

## Ciclo da credencial local
Tres artefatos distintos participam do fluxo:

| Artefato | Emissor -> receptor | Armazenamento | Ciclo |
|---|---|---|---|
| `pairingChallenge` | API -> UI autenticada -> Host local | somente memoria ate uso | TTL curto, uso unico, invalidado ao concluir/falhar |
| `hostApiCredential` | API -> Host apos prova do challenge | storage local restrito do Host, nunca na extensao | escopo CaseFlow, rotacao, revogacao por instalacao/logout/suspeita |
| `extensionSessionToken` | Host -> extensao pareada pelo WebSocket | memoria da extensao/service worker | TTL da conexao, rotaciona na reconexao, revoga ao fechar/desparear |

1. Usuario autenticado solicita `pairingChallenge` curto e de uso unico.
2. UI entrega o challenge ao Host por interacao local explicita; Host o apresenta a API junto da identidade da instalacao.
3. API registra instalacao/perfil e emite `hostApiCredential` diretamente ao Host.
4. Host valida Origin e instancia da extensao e emite `extensionSessionToken` apenas para a sessao WebSocket local.
5. Rotacao nunca reaproveita valor anterior. Logout, troca de perfil, reinstalacao, suspeita ou acao administrativa revogam instalacao e sessoes derivadas.

Credenciais nunca aparecem em URL, log ou payload de conector. A UI pode transportar apenas o `pairingChallenge` efemero durante o gesto de pairing. Requisicoes usam nonce/idempotency key quando aplicavel, timestamp, limite de payload e rate limit dedicado.

Confirmacao de `INSERT_DRAFT` ou `FILL_FORM` gera no Core uma autorizacao opaca, vinculada a usuario, caso, action id, capability, digest do alvo, expiracao e uso unico. Host e extensao apenas apresentam `authorizationRef`; nunca declaram quem confirmou ou quando.

## Dados por fronteira
| Fronteira | Permitido | Proibido |
|---|---|---|
| Pagina -> Extensao | campos visiveis necessarios, estado de login/captcha | cookies, senha, storage de autenticacao, HTML bruto persistente |
| Extensao -> Host | snapshots minimos, progresso, intervencao, resultado | cookie, senha, token de terceiro, clique generico |
| Host -> Core | fatos normalizados, status, duracao, versao, hashes | sessao externa, cache DOM, screenshot padrao, segredo de pairing |
| Core -> Host | caso minimo, plano de consulta, capability autorizada | cookie web, segredo de API amplo, poder financeiro |

## Anti-injecao
O Host aceita somente extensao pareada, Origin exato, schema/versionamento valido, payload limitado e sequencia esperada. A API aceita somente instalacao ativa e verifica `userId + installationId + browserProfileId + caseId + runId`. Outro processo local, uma extensao falsa ou mensagem repetida falham de modo deny-by-default.
