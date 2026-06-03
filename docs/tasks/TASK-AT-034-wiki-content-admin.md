# TASK-AT-034 - Wiki content administration

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-06-03
- source-of-truth: docs/tasks/TASK-AT-034-wiki-content-admin.md

## Objetivo
Dar ao admin ferramentas de manutencao da Wiki sem perder historico.

## Escopo
- Arquivar/desarquivar paginas.
- Editar slug com validacao.
- Ver historico completo paginado.
- Restaurar revisao antiga como nova versao.
- Filtrar paginas por status.

## Entregue
- API admin para arquivar e desarquivar paginas sem apagar historico.
- API admin para restaurar revisao antiga como nova versao auditada.
- UI admin para filtrar paginas ativas/arquivadas/todas, arquivar/desarquivar e restaurar uma revisao comparada.
- Listagem de paginas aceita filtro admin por `ACTIVE`, `ARCHIVED` e `ALL`; usuarios nao-admin continuam vendo apenas paginas ativas.
- Edicao direta admin passa a aceitar `slug` com normalizacao e bloqueio de duplicidade por organizacao.
- UI admin permite alterar slug ao publicar nova versao.
- Testes de service cobrem filtros de arquivadas, slug editavel, archive/unarchive e restore de revisao.

## Residual
- Historico completo ainda nao esta paginado; detalhe atual segue limitado pelas consultas existentes.
- Slug alterado ainda nao tem tela/aviso de referencias internas quebradas.

## Aceite
- Admin arquiva sem deletar historico.
- Paginas arquivadas nao aparecem por padrao na busca.
- Restauracao cria nova revisao auditada.
- Slug duplicado ou perigoso e recusado.

## Riscos
- Slug alterado quebrar referencias internas.
- Restauracao ignorar imagens/anexos.
- Historico longo exigir paginacao real.
