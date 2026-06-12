# TASK-AT-079 - Busca global simples

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-12
- source-of-truth: docs/tasks/TASK-AT-079-global-search-initial.md

## Fase
- fase: C - Produto interno definitivo
- prioridade: 11
- dependencias: contratos de notas, vendedores, campanhas, Wiki e FAQ.

## Objetivo unico
Criar busca global inicial cobrindo notas/DANFEs, vendedores, campanhas, Wiki e FAQ, sem sofisticacao excessiva.

## Contexto
Ferramenta interna forte precisa achar informacao rapido. Busca global aumenta percepcao de produto integrado.

## Escopo funcional
1. Campo de busca global no header ou atalho dedicado.
2. Resultados agrupados por tipo: Nota, Vendedor, Campanha, Wiki, FAQ.
3. Link profundo para abrir entidade/tela correta.
4. Respeito a permissoes e escopo de role.
5. Limite de resultados por grupo para manter performance.

## Arquivos candidatos
- `apps/web/src/main.tsx`
- `apps/web/src/components/**`
- `apps/api/src/**/search*`
- `apps/api/src/**/sales*`
- `apps/api/src/**/wiki*`
- `apps/api/src/**/faq*`

## Plano de execucao
1. Criar endpoint `/v1/search?q=...` com consultas limitadas.
2. Reusar filtros/escopos existentes por role.
3. Implementar UI simples com grupos e teclado basico se couber.
4. Adicionar links profundos.
5. Cobrir endpoint com teste de permissao e resultados.

## Acceptance Criteria
1. Busca retorna pelo menos um resultado de cada dominio quando existir.
2. Usuario nao ve resultado fora do escopo permitido.
3. Resultados abrem a tela correta.
4. Busca vazia/curta tem estado controlado.
5. API limita resultados e nao faz query pesada sem necessidade.

## Impacto na apresentacao
Mostra integracao: tudo esta conectado e consultavel.

## Riscos
- Tentar fazer busca semantica antes da hora.
- Vazamento de dados por escopo mal aplicado.

