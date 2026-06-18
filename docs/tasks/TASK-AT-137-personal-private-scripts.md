# TASK-AT-137 - Scripts pessoais privados por atendente

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-06-18
- source-of-truth: docs/tasks/TASK-AT-137-personal-private-scripts.md

## Objetivo unico
Permitir que cada atendente crie scripts privados no proprio perfil operacional, vinculados a nenhum, um ou varios Fluxos de Atendimento, e possa sugerir esses textos para virarem scripts canonicos da Scriptoteca.

## Contexto
Nem todo texto usado no atendimento deve nascer canonico. O atendente precisa de um espaco privado para adaptar abordagens sem poluir a Scriptoteca, mas os bons textos precisam ter caminho simples para curadoria por Admin/Supervisor.

## Escopo funcional
1. Criar modelo de scripts pessoais por usuario e organizacao.
2. Permitir vinculo N:N entre script pessoal e Fluxos.
3. Listar scripts pessoais apenas para o proprio dono.
4. Permitir copiar scripts pessoais durante o atendimento.
5. Permitir sugerir script pessoal para canon da Scriptoteca.
6. Notificar gestores quando uma sugestao pessoal for enviada.

## Acceptance Criteria
1. Um atendente nao ve scripts pessoais de outro atendente.
2. Script pessoal pode ficar sem fluxo ou vinculado a multiplos fluxos.
3. Sugestao para canon entra na fila existente de sugestoes da Scriptoteca.
4. Valores de placeholders continuam locais ao navegador e nao viram dado sensivel persistido.

## Resultado
- Entregue em `EXEC-AT-137`.

## Riscos
- Versionamento/edicao completa de scripts pessoais pode crescer; MVP cobre criar, copiar e sugerir.
