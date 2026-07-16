# TASK-AT-353 - Dados persistentes do caso para Fluxos e macros

## Metadata
- status: in-progress
- owner: olympus_orchestrator
- last-updated: 2026-07-16
- source-of-truth: docs/tasks/TASK-AT-353-service-flow-session-case-data.md

## Objetivo unico
Manter uma ficha editavel durante todo o atendimento e reutilizar seus valores em todas as macros da sessao, sem preenchimento repetido por script.

## Escopo
- Persistir na sessao somente campos explicitamente preenchidos pelo atendente.
- Derivar os campos iniciais dos placeholders dos scripts vinculados ao fluxo.
- Permitir editar e salvar a ficha a qualquer momento enquanto a sessao estiver aberta.
- Renderizar e copiar scripts canonicos com os valores compartilhados da ficha.
- Recarregar os valores ao retomar a mesma sessao.
- Limitar chaves, valores, quantidade e tamanho do payload; nao registrar valores pessoais no audit log.

## Acceptance Criteria
1. Um valor preenchido uma vez aparece em todas as macros que usam o mesmo placeholder.
2. Valores persistidos retornam no GET da sessao e continuam editaveis.
3. Copia de macro usa o snapshot atual da ficha.
4. Auditoria registra apenas nomes dos campos alterados, nunca seus valores.
5. Payload malformado ou excessivo e rejeitado.

## Dependencias
- TASK-AT-133
- TASK-AT-352
