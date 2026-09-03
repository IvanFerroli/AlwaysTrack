# TASK-AT-455 - Preservar o primeiro viewport após navegação mobile

## Metadata
- status: proposed
- owner: Runtime Builder Web
- last-updated: 2026-09-02
- source-of-truth: docs/tasks/TASK-AT-455-mobile-navigation-first-viewport.md
- mode: implementation
- priority: P1
- severity: medium
- confidence: high
- estimated-effort: 4-8h
- execution-order: 3, após TASK-AT-456 e TASK-AT-457; independente do gate TASK-AT-454

## Objetivo único
Em mobile, após selecionar um filho de SAC ou Administração, manter grupo e item ativos identificáveis sem deixar a árvore expandida consumir o primeiro viewport do job escolhido.

## Contexto e evidência referenciada
O finding `UX-002` do audit `UXREQ-ALWAYSTRACK-ACTIVE-AUDIT-20260902-001` reproduziu o problema em 390x844 nas superfícies Escalas, Pausas, Campanhas, Avisos, Fluxos, Scriptoteca, Wiki, FAQ, Usuários/Times e Configurações. `apps/web/src/main.tsx` inicializa/atualiza `expandedNavGroup` para o grupo da view ativa; no breakpoint mobile de `apps/web/src/styles.css`, cada grupo ocupa largura fixa e o submenu permanece no fluxo.

As referências advisory são `INS-003/005/006/008/009/011-016/022`; seus PNGs não devem ser copiados ou promovidos. A implementação deve adquirir evidência nova, task-backed.

## Escopo
1. Ajustar o estado/comportamento da navegação lateral em `apps/web/src/main.tsx` para que seleção e entrada direta em filho não mantenham automaticamente toda a árvore aberta no viewport mobile.
2. Preservar indicação programática e visual do grupo/filho ativo e permitir reabrir o grupo por touch e teclado.
3. Limitar o comportamento compacto ao breakpoint mobile vigente, preservando expansão e colapso do desktop.
4. Ajustar somente CSS necessário em `apps/web/src/styles.css`.
5. Cobrir navegação unitária e geometria/viewport em Playwright.

## Fora de escopo
- Redesign da IA, troca dos grupos SAC/Administração ou retirada de destinos.
- Mudança na top navigation desktop, deep links ou permissões.
- Resolver overflow interno específico de Configurações (`TASK-AT-456`).

## Dependências
- satisfeitas: baseline de navegação `TASK-AT-351` e helpers existentes de navegação/E2E.
- em aberto: nenhuma decisão de produto; coordenar CSS com `TASK-AT-456` para não regredir seu gate de overflow.

## Critérios de aceite
1. Em 390x844, selecionar qualquer filho auditado deixa título/contexto e ao menos o primeiro estado, ação ou bloco útil visível no primeiro viewport sem atravessar a árvore completa.
2. Grupo e filho ativos continuam identificáveis; reabrir o grupo revela o filho com `aria-current="page"`.
3. Toggle de grupo funciona por touch, Enter e Space, com `aria-expanded` coerente.
4. Em desktop, grupo ativo continua com comportamento vigente e sidebar recolhida/expandida não regride.
5. `body`, `.app-frame`, `.sidebar`, `.workspace` e `.topbar` não apresentam overflow ou sobreposição inesperados em 390x844 e 320x700.

## Plano de testes
- Vitest em `apps/web/test/navigation-roles.test.tsx` e/ou `bootstrap-session-roles.test.tsx`: seleção de filho, estado recolhido mobile, reabertura e `aria-current`.
- Playwright em `tests/e2e/visual-responsive-web.mobile.spec.ts`: ao menos um filho SAC e um Administração, 390x844; smoke adicional 320x700.
- Executar geometry helpers (`expectNoUnexpectedOverflow`, `expectControlsInsideViewport`, `expectRegionsNotOverlapping`).
- Reaquisição e inspeção visual task-backed; não reutilizar PNG advisory.

## Riscos
- Detectar viewport diretamente em render pode gerar estado divergente em resize; tratar mudança de breakpoint de forma determinística.
- Recolher sem manter pista do item ativo prejudica orientação e acessibilidade.
- Alteração ampla no shell pode afetar desktop, top-nav ou deep links.

## Limitações e lacunas
- O audit cobriu visualmente apenas 390x844 e primeiro viewport; 320x700, zoom 200% e tecnologia assistiva precisam de validação nova.
- O audit não prescreve animação nem padrão visual novo; reutilizar os estados ativos existentes.

## Definição de pronto
- Testes unitários e browser passam, evidência task-backed é inspecionada e o primeiro viewport atende os critérios em SAC/Administração sem regressão desktop.

## Sugestão de commit semântico
- `fix(web): compacta navegacao ativa no mobile`
