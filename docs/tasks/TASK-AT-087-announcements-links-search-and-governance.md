# TASK-AT-087 - Avisos: vinculos, busca e governanca

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-12
- source-of-truth: docs/tasks/TASK-AT-087-announcements-links-search-and-governance.md

## Fase
- fase: C - Produto interno definitivo
- prioridade: 13.5
- dependencias: `TASK-AT-083`, `TASK-AT-084`, busca/tags existentes.

## Objetivo unico
Transformar Avisos em uma ferramenta governada e navegavel, conectada a Wiki, FAQ, campanhas e outros avisos.

## Escopo funcional
1. Links relacionados para Wiki, FAQ, campanhas, notas, outros avisos e URL externa.
2. Busca por titulo, resumo, conteudo e tags.
3. Filtros combinaveis por recente, prioridade, status, tag e autor.
4. Historico de versoes/alteracoes simples ou trilha de auditoria visivel.
5. Relacionados no detalhe: "Leia tambem", "Substitui aviso", "Aviso relacionado".
6. Regras de arquivamento/expiracao documentadas.

## Acceptance Criteria
1. Aviso pode referenciar Wiki/FAQ/outro aviso.
2. Busca e filtros funcionam juntos.
3. Auditoria mostra criacao, publicacao e arquivamento.
4. Usuario entende se o aviso ainda vale ou foi substituido.

## Riscos
- Criar grafo complexo demais; primeira versao pode ter links simples tipados.

