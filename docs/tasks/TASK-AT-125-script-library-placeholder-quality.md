# TASK-AT-125 - Scriptoteca: qualidade de placeholders

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-06-18
- source-of-truth: docs/tasks/TASK-AT-125-script-library-placeholder-quality.md

## Modo
- mode: quality

## Objetivo unico
Transformar placeholders da Scriptoteca em campos mais seguros: exemplos, obrigatoriedade, mascara simples e alerta antes de copiar texto incompleto.

## Contexto
Hoje placeholders sao extraidos do corpo do script e viram inputs livres. Para atendimento real, campos como pedido, rastreio, prazo e nome do cliente precisam de ajuda e validacao basica.

## Escopo funcional
1. Definir metadados opcionais por placeholder: label, exemplo, obrigatorio, ajuda e mascara simples.
2. Mostrar campos com labels amigaveis.
3. Avisar se copiar com placeholder obrigatorio vazio.
4. Registrar no evento de copia apenas nomes de placeholders preenchidos, sem expor dados sensiveis.

## Acceptance Criteria
1. Scripts antigos continuam funcionando com placeholders automaticos.
2. Scripts novos podem definir qualidade dos campos.
3. Copia incompleta exige confirmacao ou destaca lacunas.
4. Nao salvar valores sensiveis preenchidos pelo SAC.

## Riscos
- Excesso de configuracao para o gestor. Comecar com metadados opcionais e defaults bons.

## Resultado
- Entregue em `EXEC-AT-125`.
- Placeholders recebem label amigavel, exemplo, obrigatoriedade default e alerta antes de copia incompleta.
- O evento de copia registra apenas nomes de placeholders preenchidos, sem persistir valores digitados pelo SAC.
