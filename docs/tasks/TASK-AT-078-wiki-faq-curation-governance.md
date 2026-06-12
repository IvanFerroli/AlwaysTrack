# TASK-AT-078 - Curadoria clara de Wiki/FAQ

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-12
- source-of-truth: docs/tasks/TASK-AT-078-wiki-faq-curation-governance.md

## Fase
- fase: C - Produto interno definitivo
- prioridade: 10
- dependencias: Wiki, FAQ, tags, busca e promocao FAQ->Wiki existentes.

## Objetivo unico
Melhorar sinais de governanca da base de conhecimento: validacao, pendencias, perguntas sem resposta, conteudos acessados e relacao FAQ/Wiki.

## Contexto
O fluxo de conhecimento precisa parecer vivo e governado, nao uma wiki solta.

## Escopo funcional
1. Selo "validado por Supervisor/Admin" em Wiki quando aplicavel.
2. Lista/filtro de perguntas sem resposta no FAQ.
3. Indicadores de artigos mais acessados/recentes quando dados existirem.
4. Link claro entre FAQ promovida e Wiki criada.
5. Artigos relacionados por tag se for viavel sem busca semantica.

## Arquivos candidatos
- `apps/web/src/views/wiki.tsx`
- `apps/web/src/views/faq.tsx`
- `apps/api/src/**/wiki*`
- `apps/api/src/**/faq*`
- `prisma/schema.prisma` se faltar campo de validacao

## Plano de execucao
1. Mapear campos atuais de autor/revisor/revisao/leitura.
2. Implementar selo com dados existentes antes de migrar schema.
3. Adicionar filtros/listas de pendencia de FAQ.
4. Adicionar relacionados por tags compartilhadas.
5. Testar promocao FAQ->Wiki preservando backlink.

## Acceptance Criteria
1. Wiki publicada indica se foi validada e por quem/quando quando houver dado.
2. FAQ permite identificar perguntas sem resposta.
3. FAQ promovida aponta para Wiki, e Wiki aponta origem quando aplicavel.
4. Relacionados por tag nao exibem duplicatas nem conteudo arquivado indevido.
5. Build e testes relevantes passam.

## Impacto na apresentacao
Mostra transformacao de duvida operacional em conhecimento validado.

## Riscos
- Criar selo de validacao falso se confundir "publicado" com "validado".
- Relacionados ruins podem poluir a tela.

