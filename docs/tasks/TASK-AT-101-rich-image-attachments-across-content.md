# TASK-AT-101 - Anexos de imagem transversais em conteudo operacional

## Metadata
- status: proposed-backlog
- owner: olympus_taskyfier
- last-updated: 2026-06-13
- source-of-truth: docs/tasks/TASK-AT-101-rich-image-attachments-across-content.md

## Fase
- fase: C - Produto interno definitivo / Conteudo operacional
- prioridade: 15.1
- dependencias: `TASK-AT-032`, `TASK-AT-082`, `TASK-AT-088`

## Objetivo unico
Permitir imagens nos principais conteudos operacionais do AlwaysTrack, reaproveitando ao maximo a mecanica ja existente da Wiki.

## Contexto
A Wiki ja tem anexos de imagem, mas o produto cresceu para FAQ, Avisos e Scriptoteca. Para deixar a plataforma mais didatica, todo conteudo que explica processo, comunicado ou script operacional deve poder carregar imagens quando fizer sentido.

## Escopo funcional
1. Mapear os dominios que precisam de imagem: Wiki, FAQ, Avisos, Scriptoteca e, se aplicavel, comentarios/revisoes.
2. Reaproveitar modelo/servico de anexos da Wiki quando tecnicamente seguro.
3. Permitir upload, preview, ordenacao simples e remocao auditavel.
4. Renderizar imagens em leitura sem quebrar cards, listas, busca global ou exportacoes.
5. Respeitar permissoes: usuario comum pode sugerir/anexar onde ja tem permissao de criar conteudo; Supervisor/Admin pode moderar/remover.
6. Definir limites de tamanho, tipos aceitos e comportamento de erro.
7. Atualizar seed/demo com pelo menos um exemplo visual por frente relevante.

## Fora de escopo agora
1. Implementacao nesta rodada.
2. Editor de imagem, crop avancado ou OCR.
3. CDN externa ou storage definitivo se o storage atual for suficiente para MVP.

## Acceptance Criteria
1. O usuario consegue adicionar imagem em Wiki, FAQ, Avisos e Scriptoteca sem fluxo paralelo estranho.
2. A imagem aparece no modo leitura com tamanho responsivo e sem overflow.
3. Remover imagem gera evento auditavel quando o dominio ja possui auditoria.
4. Busca/global/listagens nao ficam lentas nem poluidas por blobs.
5. Permissoes respeitam a matriz atual de SAC, VENDAS, SUPERVISOR e ADMIN.
6. Documentacao explica onde as imagens ficam armazenadas e como migrar storage no futuro.

## Impacto na apresentacao
Ajuda a transformar conhecimento operacional em material visual consultavel: prints de plataforma, exemplos de pedido, modelos de comprovante, comunicados com imagem e scripts com referencia visual.

## Riscos
- Crescimento de storage sem limite.
- Conteudo visual sensivel sendo anexado sem governanca.
- Duplicar mecanicas de upload em vez de criar um componente reutilizavel.
- Piorar performance se imagens forem carregadas em listas.

## Ordem recomendada
1. Inventariar mecanica atual da Wiki.
2. Criar componente/contrato compartilhado de anexos.
3. Integrar Avisos e FAQ.
4. Integrar Scriptoteca.
5. Atualizar demo, docs e testes de regressao.
