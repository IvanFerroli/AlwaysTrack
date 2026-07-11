# TASK-AT-195 - Companion: spike Windows + WSL + Chrome

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-07-11
- source-of-truth: docs/tasks/TASK-AT-195-windows-wsl-chrome-topology-spike.md

## Modo
- mode: documentation
- generation-mode: corrective-spec-breakdown

## Capability
Companion / Topology Spike

## Origem documental
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Cobertura: SPEC secoes 4.10, 5.2, 5.3, 12.4, 20.11, 21, 22

## Objetivo unico
Provar documentalmente e com plano de verificacao a topologia do ambiente local atual, com Chrome Stable no Windows, extensao Chromium e Companion Host no WSL quando esse for o ambiente de execucao, antes de qualquer implementacao dependente.

## Contexto minimo
Esta task faz parte da derivacao corretiva da frente CaseFlow Engine + AlwaysTrack Companion. A SPEC prevalece sobre qualquer inferencia, e esta rodada nao implementa codigo, nao instala dependencias, nao usa credenciais e nao executa scraping real.

## Inputs
- `docs/project/SPEC-AT-CF-001-CaseFlow-Engine-AlwaysTrack-Companion.md`
- Revisao corretiva solicitada em 2026-07-11.
- Tasks dependentes: `TASK-AT-194`.

## Dependencias
- satisfeitas: SPEC consolidada e backlog corretivo materializado.
- em aberto: `TASK-AT-194`.

## Alvos explicitos
1. docs/architecture/companion-windows-wsl-chrome-topology.md
2. docs/operations/companion-local-runbook.md

## Fora de escopo
- Implementar fora da task ou antecipar dependencias posteriores.
- Usar credenciais, sistemas reais ou scraping real.
- Executar acoes criticas proibidas pela SPEC.
- Transformar Windows/WSL em requisito universal de produto; se a topologia falhar, registrar alternativa controlada como host no Windows, bind local/proxy ou outro desenho local-first.

## Checklist de execucao
1. Definir testes para Chrome Windows conectar no host em WSL por HTTP/WebSocket loopback.
2. Cobrir resolucao de endereco, reinicio do WSL, suspensao, mudanca de IP interno e firewall do Windows.
3. Definir comportamento offline, recuperacao, inicializacao via bancada local e reconexao.
4. Marcar esta task como no-go gate antes de `TASK-AT-202`, `TASK-AT-203`, `TASK-AT-210` e `TASK-AT-211`.
5. Registrar decisao alternativa se WSL nao for viavel no host real.

## Acceptance Criteria
1. Existe decisao verificavel para loopback Windows-WSL antes de host/extensao.
2. Falhas de host indisponivel e reconexao estao previstas.
3. Nenhuma task de runtime dependente ignora esse spike.
4. O resultado da task declara se WSL e apenas caminho do ambiente atual ou se outro desenho local-first deve substituir essa premissa.

## Definition of Done
1. Artefatos previstos nos alvos explicitos foram criados ou atualizados.
2. Dependencias e restricoes da SPEC foram respeitadas.
3. Evidencia de validacao foi registrada no retorno da task.

## Validacao
- comandos/checks: n/a para task documental; quando houver codigo em rodada futura, rodar typecheck/testes do workspace afetado.
- revisao manual: comparar a task contra SPEC secoes 4.10, 5.2, 5.3, 12.4, 20.11, 21, 22 da SPEC e contra o relatorio corretivo.

## Evidencia esperada
- Arquivos alterados listados no retorno.
- Resumo de validacao executada.
- Riscos residuais e proximo passo recomendados.

## Riscos
- Premissa Windows/WSL falhar e invalidar o desenho local-first.
- Tratar uma decisao de ambiente local como requisito universal da arquitetura.

## Blockers possiveis
- Dependencia anterior ainda nao executada.
- Decisao operacional externa necessaria para validar ambiente real.
- Divergencia entre fixture fake e comportamento live do sistema externo.

## Proximo passo provavel
`TASK-AT-196`

## Feedback obrigatorio de retorno
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Handoff
- handoff_to: olympus-orchestrator
- execution_expectation: executar apenas esta task, com artefato material e evidencia objetiva.
- constraints: sem escopo novo, sem scraping real, sem credenciais, sem acoes externas criticas.
