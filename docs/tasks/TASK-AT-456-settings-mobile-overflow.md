# TASK-AT-456 - Corrigir overflow mobile de Configurações

## Metadata
- status: proposed
- owner: Runtime Builder Web
- last-updated: 2026-09-02
- source-of-truth: docs/tasks/TASK-AT-456-settings-mobile-overflow.md
- mode: implementation
- priority: P0
- severity: high
- confidence: high
- estimated-effort: 4-6h
- execution-order: 1, primeira task tecnicamente roteável deste pacote

## Objetivo único
Garantir que Configurações faça reflow em mobile sem deslocar o shell ou ocultar header, abas e controles; tabelas largas permanecem em scroller próprio.

## Contexto e evidência referenciada
O finding `UX-003` do audit `UXREQ-ALWAYSTRACK-ACTIVE-AUDIT-20260902-001` falhou nos checks `overflow` e `controls-inside-viewport` em 390x844. A tela é composta por `apps/web/src/views/settings.tsx`; `apps/web/src/styles.css` já contém breakpoint, `table-scroll` e uma matriz com `min-width: 980px`, portanto o patch deve localizar o elemento que transfere largura mínima ao documento e conter o overflow na região correta.

A referência advisory é `INS-016`; seu PNG transitório não deve ser copiado ou promovido. É obrigatória evidência nova, task-backed.

## Escopo
1. Reproduzir e identificar por geometria o elemento causador em Configurações.
2. Ajustar `apps/web/src/views/settings.tsx` apenas se a contenção precisar de markup semântico/local.
3. Ajustar `apps/web/src/styles.css` para reflow de headings, forms, observabilidade e matriz, mantendo tabela larga dentro de `.table-scroll`.
4. Adicionar cenário browser específico de ADMIN → Administração → Configurações.

## Fora de escopo
- Redesenhar Configurações, reduzir campos ou alterar permissões/dados.
- Remover colunas da matriz para esconder o problema.
- Mudar o comportamento geral do menu mobile (`TASK-AT-455`), salvo contenção mínima indispensável comprovada pela reprodução.

## Dependências
- satisfeitas: `TASK-AT-314` fornece helpers geométricos; rota e seed ADMIN já existem.
- em aberto: nenhuma. Se a causa for comprovadamente o shell compartilhado, registrar e coordenar o menor delta com `TASK-AT-455` sem fundir os aceites.

## Critérios de aceite
1. Em 390x844 e 320x700, `documentElement.scrollWidth <= documentElement.clientWidth` na tela Configurações.
2. Header, topbar, headings, inputs, selects e botões ficam integralmente dentro do viewport.
3. A matriz de permissões pode rolar horizontalmente somente dentro de `.table-scroll`, sem aumentar a largura do documento.
4. Não há sobreposição entre sidebar/workspace e todos os controles continuam alcançáveis por teclado.
5. Desktop mantém layout e leitura da matriz sem regressão visual relevante.

## Plano de testes
- Novo caso em `tests/e2e/visual-responsive-web.mobile.spec.ts` para Configurações com `expectMobileShellGeometry` e assert específico de `.table-scroll`.
- Rodar 390x844 e 320x700; smoke desktop da mesma tela.
- Inspecionar screenshot task-backed em resolução original.
- Rodar testes Web relacionados, Playwright focal, build/typecheck Web e `git diff --check`.

## Riscos
- Aplicar `overflow-x: hidden` no shell pode mascarar controles ainda inacessíveis.
- Regra global para `table` ou `section-heading` pode regredir outras telas.
- Matriz responsiva sem scroller perceptível pode esconder colunas e contexto.

## Limitações e lacunas
- O audit não isolou o nó causador e não cobriu zoom 200%, orientação landscape ou browsers móveis reais.
- A validação final visual não pode reutilizar a captura advisory.

## Definição de pronto
- Geometria passa nos dois viewports, scroller fica contido, screenshot task-backed é inspecionado e desktop permanece estável.

## Sugestão de commit semântico
- `fix(web): contem overflow mobile de configuracoes`
