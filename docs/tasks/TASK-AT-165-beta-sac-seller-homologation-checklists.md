# TASK-AT-165 - Checklists de homologacao Beta SAC e Beta Vendedor

## Metadata
- status: completed-docs
- owner: olympus_taskyfier
- last-updated: 2026-06-19
- source-of-truth: docs/tasks/TASK-AT-165-beta-sac-seller-homologation-checklists.md

## Modo
- mode: planning

## Objetivo unico
Criar checklists praticos para validar Beta SAC e Beta Vendedor com participantes controlados.

## Contexto minimo
O beta precisa validar experiencia real e tambem permissoes negativas. Os participantes nao devem receber uma tela quebrada nem conseguir acessar dominios indevidos.

## Inputs
- Decisoes congeladas do beta.
- `TASK-AT-154`.
- `TASK-AT-164`.

## Dependencias
- satisfeitas: matriz e estrategia de beta.
- em aberto: implementacoes de permissao devem estar prontas antes da execucao do checklist.

## Alvos explicitos
1. `docs/demo/`
2. `docs/runbooks/`
3. `docs/security/commercial-permission-matrix.md`

## Fora de escopo
- Implementar funcionalidades.
- Coletar feedback real.

## Checklist
1. Criar checklist Beta SAC: Wiki, FAQ, Avisos, Scriptoteca, Fluxos, Busca, Perfil.
2. Criar checklist negativo Beta SAC: sem notas/ranking/extratos/campanhas/admin/auditoria.
3. Criar checklist Beta Vendedor: conhecimento, perfil, proprias notas, proprio extrato, proprio desempenho.
4. Criar checklist negativo Beta Vendedor: sem terceiros/admin/auditoria/campanhas administrativas/revisao.
5. Criar campos para feedback: confuso, lento, util, faltante, risco.

## Acceptance Criteria
1. Checklist SAC cobre fluxos positivos e negativos.
2. Checklist Vendedor cobre fluxos positivos e negativos.
3. Checklists sao executaveis por pessoa nao tecnica com orientacao minima.
4. Checklists geram evidencias simples para proxima rodada de polimento.

## Definition of Done
1. Documentos versionados.
2. Ligacao com runbook Tailscale.
3. Matriz beta referenciada.

## Validacao
- comandos/checks: n/a.
- revisao manual: leitura do proprietario.

## Evidencia esperada
- Checklist pronto para imprimir/copiar.
- Secao de feedback padronizada.

## Riscos
- Checklist longo demais cansar participante.
- Checklist curto demais nao pegar vazamento de permissao.

## Blockers possiveis
- Implementacao de permissao ainda pendente.

## Retorno esperado
- resumo curto dos checklists
- riscos ou ressalvas
- proximo passo recomendado
