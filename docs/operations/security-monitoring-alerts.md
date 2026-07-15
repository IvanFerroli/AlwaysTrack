# Security Monitoring And Alerts

## Metadata
- status: active
- owner: ops/security
- last-updated: 2026-07-15
- source-of-truth: docs/operations/security-monitoring-alerts.md

## Objetivo
Definir quais sinais de seguranca devem aparecer em auditoria, logs e painel operacional sem gravar segredo, token, cookie, senha ou corpo bruto de arquivo.

## Taxonomia `security.*`
- `security.auth.login_failed`: falhas de login por usuario, email ou IP.
- `security.auth.forbidden`: respostas 403 em rotas autenticadas.
- `security.auth.unauthorized`: respostas 401 repetidas.
- `security.auth.session_rotated`: troca de sessao, senha ou segredo.
- `security.tenancy.cross_org_blocked`: tentativa bloqueada de acessar outra organizacao.
- `security.upload.rejected`: arquivo recusado por tipo, tamanho ou validacao.
- `security.ai.reprocess_spike`: reprocessamentos IA repetidos no mesmo documento.
- `security.user.role_changed`: alteracao de role.
- `security.user.password_changed`: alteracao de senha.
- `security.config.changed`: mudanca de configuracao operacional sensivel.
- `security.export.admin_csv`: export administrativo.

## Onde registrar
- Com ator logado: trilha de auditoria com `actorId`, `organizationId`, evento, alvo e metadados redigidos.
- Sem ator logado: log estruturado com request id, rota, metodo, status e IP quando disponivel.
- Eventos criticos: notificacao interna para admins quando a infraestrutura de notificacoes estiver habilitada.

## Redaction obrigatoria
Nunca registrar:
- senhas ou hashes;
- tokens, cookies, API keys e secrets;
- `DATABASE_URL` ou `REDIS_URL` completos;
- corpo bruto de upload;
- chave privada Google;
- resposta completa de provedores externos.

Use apenas identificadores, contagens, extensao/tamanho de arquivo e motivo de rejeicao.

## Investigacao rapida
1. Identifique evento, janela de tempo, organizacao e usuario alvo.
2. Compare ocorrencias no painel operacional e na auditoria.
3. Procure repeticao por IP, usuario, rota ou documento.
4. Para tentativa cross-org, verifique se houve 403 e se nenhum dado foi retornado.
5. Para segredo suspeito, siga `docs/operations/security-secrets-runbook.md`.

## Retencao minima
- Auditoria de alteracoes sensiveis: manter enquanto houver requisito comercial/legal.
- Logs anonimos de seguranca: manter pelo menor periodo operacional suficiente para investigacao.
- Artefatos com dados pessoais devem ser expurgados ou anonimizados antes de compartilhamento.

## SLOs e alertas operacionais

| Sinal | Formula e janela inicial | Threshold | Owner |
| --- | --- | --- | --- |
| Erro API | respostas 5xx / requests em 5 min | maior que 1% | api-oncall |
| Latencia API | P95 da duracao em 5 min | maior que 500 ms | api-oncall |
| Backlog de jobs | waiting e idade do item mais antigo | mais de 100 ou 300 s | platform-oncall |
| Falha de job | jobs terminais com falha na janela | maior que 0 | platform-oncall |
| Banco/storage | probe allowlisted | diferente de `UP` | data/platform-oncall |
| Conector | success / total e health | abaixo de 90% ou degradado | integrations-oncall |
| Drift | eventos `SELECTOR_DRIFT` na janela | maior que 0 | companion-oncall |
| Companion | Host, pairing e falhas de reconnect | desconectado ou mais de 3 | companion-oncall |

`services/api/src/core/diagnostics/slo-alerts.ts` materializa as formulas e o modelo de dashboard. Estados sao `HEALTHY`, `PARTIAL_FAILURE`, `DEGRADED` e `UNAVAILABLE`; alertas possuem owner, severidade e transicoes `FIRING`/`RESOLVED`. O Host possui o mesmo contrato de estados em `services/companion-host/src/diagnostics/slo.ts`.

Correlacao aceita somente `requestId` e `runId` com charset/tamanho allowlisted. `caseId` e convertido para SHA-256 antes de entrar em sinal; URL, erro bruto, cookie, token, payload e PII nao fazem parte do modelo.

## Exercicio controlado
```bash
npm run test --workspace @alwaystrack/api -- --run src/core/diagnostics/slo-alerts.test.ts
npm run test --workspace @alwaystrack/companion-host -- --run src/diagnostics/slo.test.ts
```

Os testes disparam e resolvem alertas e diferenciam falha parcial, degradacao e indisponibilidade. Essa evidencia e `local`/fake. Roteamento para pager/notificacao, dashboards production-like e calibracao com carga sustentada dependem das TASK-AT-323 e TASK-AT-335.
