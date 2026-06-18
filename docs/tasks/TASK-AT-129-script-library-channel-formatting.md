# TASK-AT-129 - Scriptoteca: formatacao por canal

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-06-18
- source-of-truth: docs/tasks/TASK-AT-129-script-library-channel-formatting.md

## Modo
- mode: product

## Objetivo unico
Permitir que um script tenha variantes ou transformacoes por canal, garantindo que WhatsApp, e-mail, telefone e Instagram tenham formato adequado.

## Contexto
O campo `channel` ja existe, mas textos podem precisar de pequenas diferencas por canal. A dor aparece quando um script bom para WhatsApp fica ruim em e-mail ou telefone.

## Escopo funcional
1. Permitir variantes por canal ou conversao leve de markdown para texto plano.
2. Preview do resultado exatamente como sera copiado.
3. Alertas para elementos nao ideais por canal, como link muito longo ou markdown incompatível.
4. Manter fallback para corpo principal.

## Acceptance Criteria
1. SAC copia texto adequado ao canal escolhido.
2. Gestor consegue cadastrar variante sem duplicar script inteiro quando nao precisa.
3. Preview e copia usam a mesma renderizacao.
4. Scripts existentes continuam validos.

## Execucao
- entregue em: EXEC-AT-129
- resumo: copia/preview passam por formatador leve por canal, limpando Markdown em WhatsApp/Instagram/Telefone e exibindo alertas operacionais quando ha risco de uso.
- ressalva: variantes persistidas por canal ficaram fora do MVP para evitar duplicacao prematura do modelo.

## Riscos
- Variante por canal pode virar duplicacao. Priorizar fallback e transformacoes simples.
