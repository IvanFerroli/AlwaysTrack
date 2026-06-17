# TASK-AT-111 - Seguranca: auditoria, monitoramento e alertas

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-06-17
- source-of-truth: docs/tasks/TASK-AT-111-security-audit-monitoring-and-alerts.md

## Modo
- mode: implementation

## Objetivo unico
Tornar eventos suspeitos visiveis para admin sem transformar logs em vazamento de dados.

## Contexto minimo
O AlwaysTrack ja tem auditoria, logs estruturados e painel de observabilidade operacional. A proxima camada e diferenciar evento operacional normal de sinal de seguranca:
- muitas falhas de login;
- muitas respostas 403/401;
- rate limit estourado;
- tentativa de acessar recurso de outra organizacao;
- upload rejeitado;
- reprocessamento IA repetido;
- alteracao de role/senha/configuracao;
- export CSV administrativo.

## Inputs
- `services/api/src/core/audit/*`
- `services/api/src/core/diagnostics/*`
- `services/api/src/core/notifications/*`
- `apps/web/src/views/settings.tsx`
- `apps/web/src/views/audit.tsx`

## Dependencias
- satisfeitas: auditoria e observabilidade existem.
- em aberto: `TASK-AT-106` para rate limit e `TASK-AT-109` para IDOR geram sinais importantes.

## Alvos explicitos
1. Taxonomia de eventos de seguranca.
2. Dashboard simples para admin.
3. Alertas/notificacoes internas para eventos criticos.
4. Redacao de dados sensiveis em logs.
5. Retencao minima de eventos.

## Explicacao simples
Seguranca nao e so impedir ataque; e perceber quando algo estranho acontece. Se alguem tenta 80 senhas, sobe 50 PDFs invalidos ou tenta acessar dado de outra organizacao, o admin precisa ver.

## Fora de escopo
- SIEM corporativo completo.
- Integracao Slack/Email obrigatoria.
- Deteccao por IA.

## Checklist
1. Definir eventos `security.*`.
2. Registrar eventos em auditoria quando houver ator logado.
3. Registrar eventos anonimos em log estruturado quando nao houver usuario.
4. Criar agregados no painel admin:
   - falhas de login;
   - bloqueios 403;
   - rate limit;
   - upload rejeitado;
   - alteracoes de usuario/role/senha.
5. Criar notificacao para admin em eventos criticos.
6. Garantir redaction de tokens, cookies, senha, API keys, arquivo bruto.

## Acceptance Criteria
1. Admin consegue ver sinais de seguranca recentes.
2. Eventos sensiveis nao incluem segredo nem corpo de arquivo.
3. Alteracao de role/senha/configuracao sempre aparece em auditoria.
4. Eventos criticos geram notificacao interna.
5. Documento explica como investigar um alerta.

## Definition of Done
1. Taxonomia criada em doc.
2. Eventos principais instrumentados.
3. Painel/aba de observabilidade atualizado.
4. Testes cobrem redaction e evento critico.

## Validacao
- comandos/checks: `npm run test --workspace @alwaystrack/api -- audit`, `npm run typecheck --workspaces --if-present`
- revisao manual: simular falha de login e upload rejeitado.

## Evidencia esperada
- Print/descrição do painel com eventos.
- Teste garantindo que senha/token nao aparece no log.

## Riscos
- Alertar demais e gerar ruido.
- Guardar dados sensiveis por engano.

## Blockers possiveis
- Falta de politica de retencao de logs.

## Retorno esperado
- Lista de eventos de seguranca instrumentados.
- Guia rapido de investigacao para admin.

## Execucao
- completed-by: ops/ci/security-docs-slice
- exec: docs/tasks/EXEC-AT-111-security-audit-monitoring-alerts.md
- notes: Taxonomia e runbook criados; instrumentacao de codigo/painel ficou como pendencia explicita por esta fatia ser documental/ops.
