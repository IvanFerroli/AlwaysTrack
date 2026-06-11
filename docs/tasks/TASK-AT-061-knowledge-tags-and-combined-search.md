# TASK-AT-061 - Wiki and FAQ tags with combined search

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-11
- source-of-truth: docs/tasks/TASK-AT-061-knowledge-tags-and-combined-search.md

## Modo
- mode: knowledge-discovery

## Objetivo unico
Criar tags padrao/customizadas para Wiki e FAQ, com busca e filtros combinados por titulo, conteudo, pergunta, tags e recencia.

## Contexto minimo
O AlwaysTrack tambem e base transversal de conhecimento. Para a equipe achar processos, plataformas e fluxos, Wiki e FAQ precisam de taxonomia leve e busca funcional combinada.

## Inputs
- Lista inicial de tags padrao sugeridas.
- Quem pode criar tags customizadas: qualquer usuario ou apenas roles superiores.

## Dependencias
- satisfeitas: Wiki, FAQ, promocao FAQ->Wiki e busca basica existem.
- em aberto: definir permissao de criacao/edicao de tags.

## Tags padrao sugeridas
- `vendas`
- `notas`
- `ranking`
- `campanhas`
- `extratos`
- `faq`
- `wiki`
- `sac`
- `processo`
- `plataforma`
- `financeiro`
- `operacao`
- `treinamento`

## Alvos explicitos
1. Criar modelo/contrato para tags reutilizaveis entre Wiki e FAQ.
2. Permitir tags padrao e tags customizadas.
3. Permitir aplicar multiplas tags em paginas Wiki.
4. Permitir aplicar multiplas tags em threads FAQ.
5. Implementar filtros combinados:
   - busca textual;
   - titulo/pergunta;
   - corpo/conteudo;
   - tags;
   - status;
   - recentes/mais recentes.
6. Garantir que filtros funcionem juntos, nao isoladamente.
7. Preservar vinculo FAQ promovida -> Wiki.

## Fora de escopo
- Motor de busca externo.
- Full-text ranking sofisticado.
- Permissoes granulares por tag.

## Checklist
1. Definir schema de tags.
2. Seedar tags padrao.
3. Criar endpoints de listagem/criacao/associacao.
4. Atualizar Wiki e FAQ UI.
5. Adicionar testes combinando filtros.
6. Validar migracao sem perder tags atuais extraidas do conteudo.

## Acceptance Criteria
1. Usuario encontra Wiki por titulo, conteudo e tag.
2. Usuario encontra FAQ por pergunta, texto da thread/respostas e tag.
3. Filtros por tag + texto + recente funcionam juntos.
4. Tags customizadas podem ser criadas conforme permissao definida.
5. Tags padrao aparecem como opcoes iniciais.

## Definition of Done
1. Wiki e FAQ compartilham mecanica coerente de tags.
2. Busca combinada testada em backend e UI.
3. `npm run test:all` passa.

## Validacao
- comandos/checks: `npm run test --workspace @alwaystrack/api -- wiki.service.test.ts faq.service.test.ts`, `npm run typecheck --workspace @alwaystrack/web`, `npm run test:e2e -- --project=api`, `npm run test:all`
- revisao manual: filtrar por combinacoes reais.

## Evidencia esperada
- Teste com pelo menos duas tags e busca textual combinada.
- Print de Wiki/FAQ com filtros ativos.

## Riscos
- Tags duplicadas por caixa/acentos se nao normalizar.
- Busca pesada pode precisar indice conforme volume crescer.

## Blockers possiveis
- Decisao de permissao para criacao de tags.

## Retorno esperado
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
