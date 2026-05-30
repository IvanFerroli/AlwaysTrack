# TASK-AT-034 - Wiki content administration

## Metadata
- status: planned
- owner: olympus_taskyfier
- last-updated: 2026-05-30
- source-of-truth: docs/tasks/TASK-AT-034-wiki-content-admin.md

## Objetivo
Dar ao admin ferramentas de manutencao da Wiki sem perder historico.

## Escopo
- Arquivar/desarquivar paginas.
- Editar slug com validacao.
- Ver historico completo paginado.
- Restaurar revisao antiga como nova versao.
- Filtrar paginas por status.

## Aceite
- Admin arquiva sem deletar historico.
- Paginas arquivadas nao aparecem por padrao na busca.
- Restauracao cria nova revisao auditada.
- Slug duplicado ou perigoso e recusado.

## Riscos
- Slug alterado quebrar referencias internas.
- Restauracao ignorar imagens/anexos.
- Historico longo exigir paginacao real.
