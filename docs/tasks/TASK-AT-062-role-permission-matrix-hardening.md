# TASK-AT-062 - Commercial role permission matrix hardening

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-11
- source-of-truth: docs/tasks/TASK-AT-062-role-permission-matrix-hardening.md

## Modo
- mode: access-control-hardening

## Objetivo unico
Documentar e reforcar a matriz de permissoes das roles SAC, VENDAS, SUPERVISOR e ADMIN em todas as telas e endpoints ativos.

## Contexto minimo
O produto esta perto de apresentacao. Antes de demo/beta, precisa estar claro o que cada role pode ver e executar, evitando surpresa operacional.

## Inputs
- Regras de negocio finais por role.
- Fluxos permitidos por area: notas, ranking, campanhas, extratos, wiki, FAQ, usuarios, auditoria.

## Dependencias
- satisfeitas: roles comerciais existem.
- em aberto: confirmar se SAC e financeiro devem ter visoes diferentes.

## Alvos explicitos
1. Criar matriz documentada em docs.
2. Auditar endpoints ativos contra essa matriz.
3. Auditar navegacao/sidebar/botoes contra essa matriz.
4. Adicionar testes de acesso negado para endpoints criticos.
5. Ajustar mensagens de acesso negado.

## Fora de escopo
- RBAC dinamico configuravel por tenant.
- Permissoes customizadas por usuario.

## Checklist
1. Levantar rotas API e views.
2. Criar tabela role x acao.
3. Implementar/ajustar checks faltantes.
4. Esconder acoes indisponiveis na UI.
5. Testar acesso direto via API.

## Acceptance Criteria
1. Matriz de permissoes existe e esta atualizada.
2. Endpoint critico nega role indevida.
3. UI nao sugere acao que a role nao pode executar.
4. Admin segue com acesso completo operacional.

## Definition of Done
1. Docs, testes e ajustes entregues.
2. `npm run test:all` passa.

## Validacao
- comandos/checks: `npm run test --workspace @alwaystrack/api -- access-policy.test.ts auth.service.test.ts`, `npm run test:all`
- revisao manual: logar com VENDAS, SUPERVISOR, SAC e ADMIN.

## Evidencia esperada
- Matriz em docs.
- Testes de acesso negado/permitido.

## Riscos
- Esconder botao na UI sem proteger API nao e suficiente.
- SUPERVISOR pode precisar escopo por grupo, nao acesso global.

## Blockers possiveis
- Regra de negocio ambigua para SAC/financeiro.

## Retorno esperado
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
