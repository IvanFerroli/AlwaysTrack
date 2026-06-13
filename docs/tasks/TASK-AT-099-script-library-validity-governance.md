# TASK-AT-099 - Scriptoteca: validade e recertificacao de scripts

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-06-13
- source-of-truth: docs/tasks/TASK-AT-099-script-library-validity-governance.md

## Fase
- fase: C - Produto interno definitivo / Frente SAC
- prioridade: 14.10
- dependencias: `TASK-AT-089`, `TASK-AT-090`, `TASK-AT-092`

## Objetivo unico
Evitar que a Scriptoteca vire deposito de textos velhos, criando validade operacional e revisao periodica de scripts por Supervisor/Admin.

## Contexto
A Scriptoteca resolve a dor de textos soltos, mas perde valor se scripts desatualizados continuarem sendo copiados. Como os textos do SAC podem depender de politica comercial, transportadora, prazo, campanha ou procedimento interno, precisa existir um sinal simples de frescor.

## Escopo funcional
1. Adicionar `reviewDueAt` opcional no script.
2. Exibir selo `Validado`, `Revisao pendente` ou `Obsoleto`.
3. Filtro de scripts com revisao vencida para Supervisor/Admin.
4. Acao `Recertificar` que atualiza validador/data e registra comentario.
5. Notificacao ou alerta interno quando scripts importantes vencerem.
6. Seed/demo com um script validado e um script com revisao pendente.

## Acceptance Criteria
1. Scripts vencidos continuam rastreaveis, mas ficam visualmente diferentes.
2. SAC nao precisa entender governanca para copiar scripts validos.
3. Supervisor/Admin consegue encontrar rapidamente scripts pendentes de revisao.
4. Recertificacao registra evento auditavel.
5. Scripts obsoletos seguem fora da recomendacao principal.

## Impacto na apresentacao
Mostra maturidade operacional: a empresa nao apenas centraliza textos, mas governa quais textos ainda sao confiaveis.

## Riscos
- Criar burocracia demais para textos simples.
- Notificar demais e gerar ruido.
- Tratar validade como bloqueio duro antes de entender a rotina real do SAC.

## Execucao
- execution-log: docs/tasks/EXEC-AT-099-script-library-validity-governance.md
