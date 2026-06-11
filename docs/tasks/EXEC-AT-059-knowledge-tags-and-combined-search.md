# EXEC-AT-059 - Knowledge tags and combined search

## Metadata
- status: completed
- owner: olympus_orchestrator
- date: 2026-06-11
- task: TASK-AT-061-knowledge-tags-and-combined-search.md

## Objetivo
Entregar tags padrao/customizadas em Wiki e FAQ, com filtros combinados por texto, tag e recencia.

## Entregas
1. Adicionado `tagsJson` em `WikiPage` e `FaqThread`, com migracao dedicada.
2. Normalizacao unica de tags para lowercase, sem acento, sem `#`, com dedupe e limite de tamanho.
3. Wiki passa a criar/editar tags explicitas e continua extraindo hashtags do conteudo.
4. FAQ passa a criar threads com tags explicitas e hashtags no titulo/corpo.
5. Busca de Wiki e FAQ considera titulo/pergunta, conteudo/corpo, comentarios/respostas e tags.
6. Filtros combinados por `query`, `tags`, `recent` e status continuam compondo o mesmo `where`.
7. Promocao FAQ -> Wiki preserva tags da thread promovida.
8. UI de Wiki/FAQ ganhou campos de tags, tags padrao e filtros por tag/recencia.

## Decisoes
- A mecanica inicial persiste tags como JSON normalizado nas entidades existentes para evitar uma tabela transversal prematura.
- Tags padrao ficam como opcoes iniciais na UI; tags customizadas sao aceitas nos formulários.
- Administracao global de taxonomia e permissao granular fica para configuracoes/hardening futuro.

## Validacao
- `npm run prisma:generate`
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run test --workspace @alwaystrack/api -- wiki.service.test.ts faq.service.test.ts`

## Riscos residuais
- Busca por `contains` em JSON textual e suficiente para o volume atual; em escala maior pode virar tabela relacional ou indice full-text.
- UI cobre criacao/edicao e filtros, mas ainda nao ha tela administrativa global de tags.
