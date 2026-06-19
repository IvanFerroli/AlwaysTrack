# TASK-AT-164 - Runbook Beta Fechado via Tailscale

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-19
- source-of-truth: docs/tasks/TASK-AT-164-beta-tailscale-runbook.md

## Modo
- mode: planning

## Objetivo unico
Documentar como rodar, validar e encerrar o beta local controlado via Tailscale.

## Contexto minimo
O beta nao sera publico na internet. Sera local, em maquina do proprietario, com acesso remoto controlado por Tailscale e allowlist nominal.

## Inputs
- Decisoes congeladas do beta.
- Scripts locais existentes: `npm run up`, seed/reset, checks.
- Tailscale instalado/configurado pelo proprietario.

## Dependencias
- satisfeitas: estrategia de homologacao local.
- em aberto: detalhes de hostname/porta Tailscale podem ser preenchidos durante execucao.

## Alvos explicitos
1. `docs/runbooks/`
2. `docs/demo/`
3. `README.md`

## Fora de escopo
- Configurar VPS publica.
- Automatizar Tailscale via codigo.
- Expor app sem VPN.

## Checklist
1. Pre-requisitos locais.
2. Env beta-local.
3. Allowlist.
4. Seed/reset.
5. Subida do app.
6. Como compartilhar URL Tailscale.
7. Checklist de seguranca antes de convidar.
8. Checklist de encerramento.
9. Como coletar feedback.

## Acceptance Criteria
1. Proprietario consegue seguir runbook do zero.
2. Runbook diferencia beta local de producao.
3. Runbook inclui rollback/encerramento.
4. Runbook inclui cuidados com dados reais minimos.

## Definition of Done
1. Runbook versionado.
2. Checklist operacional claro.
3. Links para tasks/checklists relacionados.

## Validacao
- comandos/checks: revisao manual do runbook.
- revisao manual: simular leitura passo a passo.

## Evidencia esperada
- Documento em `docs/runbooks`.
- Checklist pronto para uso.

## Riscos
- Usuario confundir Tailscale com exposicao publica segura para producao.
- Dados reais ficarem no banco local sem politica de limpeza.

## Blockers possiveis
- n/a.

## Retorno esperado
- resumo curto do runbook
- riscos ou ressalvas
- proximo passo recomendado
