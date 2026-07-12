# Companion Extension and Host Threat Model

## Metadata
- status: active
- owner: security-maintainers
- last-updated: 2026-07-12
- related-task: TASK-AT-197
- complements: docs/security/threat-model.md

## Escopo e ativos
Este documento complementa o threat model geral para extensao MV3, DOM de sistemas externos, perfil Chrome, WebSocket loopback, Companion Host, pairing e fatos enviados ao Core. Protege dados pessoais, conversa, pedido, pagamento, sessao do navegador, integridade do caso e autorizacao humana.

## Ameacas e mitigacoes
| ID | Ameaca | Mitigacao obrigatoria | Task de enforcement/teste |
|---|---|---|---|
| C1 | Listener exposto na LAN | bind exclusivo `127.0.0.1`, startup fail-closed | 211, 283 |
| C2 | Processo local injeta eventos | pairing, credencial rotativa, nonce, contexto correlacionado, rate limit | 201, 211, 212, 283 |
| C3 | Extensao falsa ou Origin arbitrario | allowlist de Origin/extension id e instalacao revogavel | 201, 203, 211, 283 |
| C4 | Replay ou troca de caso/run | `messageId`, timestamp, idempotencia e verificacao de ownership | 201, 212, 224, 283 |
| C5 | Permissoes de host excessivas | dominios explicitos por conector, revisao de manifest | 203, 263, 283 |
| C6 | Vazamento de DOM, conversa ou PII | coleta minima, normalizacao, sem HTML bruto, redaction e retencao | 206, 221, 291 |
| C7 | Roubo/exportacao de sessao externa | nunca ler/exportar cookie ou storage de auth; reutilizar apenas a aba | 206, 223, 283 |
| C8 | Bypass de login, captcha ou 2FA | detectar, pausar e pedir intervencao humana | 208, 223, 292 |
| C9 | Seletor alterado executa escrita | read-only default, detector de pagina, drift e action firewall | 222, 223, 288 |
| C10 | Rascunho vira envio/submit | capability condicionada, confirmacao explicita e ausencia de ferramenta generica | 199, 222, 223 |
| C11 | Automacao financeira/destrutiva | capabilities proibidas deny-by-default e regressao negativa | 199, 222, 223, 283 |
| C12 | Slack automatizado | nenhum acesso de extensao/Host; apenas texto/copia no Core | 199, 223, 277 |
| C13 | Dependencia/extension update comprometido | versao fixada, pacote verificavel, rollback e permissao revisada | 294, 306 |
| C14 | Cache/log/screenshot sensivel | cache efemero, logs mascarados, screenshot opt-in | 214, 221, 295 |

## Firewall de capabilities
`OPEN_TAB`, `FOCUS_TAB`, `NAVIGATE`, `SEARCH`, `READ`, `EXTRACT` e `COPY` sao consultivas. `INSERT_DRAFT` e `FILL_FORM` exigem interacao humana correlacionada e nunca incluem submit. Qualquer capability desconhecida ou proibida e bloqueada.

Nao existe capability de clique generico, browser irrestrito ou execucao arbitraria. `SUBMIT`, comunicacao externa, Slack, alteracao financeira, status, pedido, reversa, ticket, acareacao, reenvio, reembolso e cancelamento permanecem proibidos no core inicial.

## CaseFlow
Eventos de auditoria do CaseFlow usam uma allowlist minima: hash e identificador mascarado, status, duracao, conector, codigo de erro e versao. CPF, cartao, token, cookie, senha, conversa completa, HTML bruto e payloads livres nao entram na trilha. Valores fora do formato operacional esperado sao descartados, nao apenas truncados.

A retencao padrao mantem fatos normalizados e resumo, limita conversa integral a 30 dias, diagnosticos a 7 dias e cache a 15 minutos. Esses prazos sao configuraveis; expiracao de diagnosticos remove o conteudo e preserva os metadados do run. Exclusao explicita remove o caso e seus dados subordinados dentro do tenant. Screenshots ficam desativadas e exigem opt-in explicito de diagnostico; cookies e dados de autenticacao nunca podem ser capturados.

## Resposta
Falha de seguranca cancela apenas o run afetado quando possivel, revoga pairing em suspeita de identidade, preserva evidencias ja normalizadas e registra codigo, conector, versao e duracao sem payload sensivel. Nao tenta contornar bloqueios automaticamente.
