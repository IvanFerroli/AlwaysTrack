# Security Monitoring And Alerts

## Metadata
- status: active
- owner: ops/security
- last-updated: 2026-06-17
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

## Pendencias de implementacao
- Painel admin dedicado para agregados `security.*`.
- Alertas internos para eventos criticos.
- Testes especificos de redaction em logs e auditoria.
