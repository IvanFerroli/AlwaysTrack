# TASK-AT-116 - Seguranca: gate antes de exposicao externa

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-15
- source-of-truth: docs/tasks/TASK-AT-116-security-release-gate-before-external-exposure.md

## Modo
- mode: verification

## Objetivo unico
Definir um checklist de liberacao para impedir que o AlwaysTrack seja exposto na internet sem controles minimos.

## Contexto minimo
O usuario pediu para "pegar pesado" em cyber seguranca e deixar blindado contra ataques externos. Nenhum sistema fica 100% blindado, mas podemos criar um gate: se nao passar, nao expoe.

Essa task e o fechamento da fase. Ela nao implementa controles; ela verifica se os controles existem e se o risco residual foi aceito conscientemente.

## Inputs
- `docs/security/threat-model.md`
- `docs/security/security-baseline-audit.md`
- tasks `TASK-AT-103` a `TASK-AT-115`
- `docs/operations/*`
- CI/checks

## Dependencias
- satisfeitas: nenhuma no momento.
- em aberto: deve vir depois das tasks principais de seguranca.

## Alvos explicitos
1. `docs/security/external-exposure-release-gate.md`
2. Checklist tecnico.
3. Checklist operacional.
4. Registro de riscos aceitos.
5. Smoke de seguranca local/CI.

## Explicacao simples
E o "nao sobe sem cinto, freio e documento". Antes de abrir para acesso externo, alguem confere login, rate limit, CSRF, headers, upload, segredos, backup, logs e CI.

## Fora de escopo
- Garantir aprovacao juridica.
- Pentest profissional completo.
- Hospedar o app.

## Checklist
1. Confirmar:
   - HTTPS e dominio final;
   - CORS/CSP/headers;
   - cookies seguros;
   - sessao expira no servidor;
   - CSRF/origin check;
   - rate limit;
   - upload validado;
   - roles/tenancy testados;
   - envs/segredos seguros;
   - backup/restore testado;
   - logs/alertas;
   - dependencias auditadas;
   - runbook de incidente.
2. Rodar suite de seguranca.
3. Registrar riscos aceitos e mitigacoes pendentes.
4. Gerar decisao final: `go`, `go-with-risk`, `no-go`.

## Acceptance Criteria
1. Existe checklist claro para liberar ou bloquear exposicao.
2. Cada item aponta evidencia objetiva.
3. Risco pendente tem dono e prazo.
4. Resultado final fica documentado.
5. Gate pode ser repetido em releases futuras.

## Definition of Done
1. Documento de gate criado.
2. Comandos de validacao listados.
3. Primeiro dry-run executado em ambiente local/demo.
4. Roadmap atualizado.

## Validacao
- comandos/checks: `npm run check`, `npm run test:e2e:api`, `npm run env:check -- --production`, `npm run repo:hygiene`, `npm run security:deps`
- revisao manual: checklist preenchido.

## Evidencia esperada
- Gate preenchido com status por item.
- Decisao `go/no-go`.

## Riscos
- Gate virar burocracia se nao tiver dono.
- Marcar `go-with-risk` sem entender impacto.

## Blockers possiveis
- Ambiente de producao ainda nao existir.

## Retorno esperado
- Resumo executivo para superiores.
- Lista curta do que falta para exposicao externa segura.
