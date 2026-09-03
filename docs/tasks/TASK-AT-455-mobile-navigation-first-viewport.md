# TASK-AT-455 - Preservar o primeiro viewport após navegação mobile

## Metadata
- status: completed-with-risk
- owner: Runtime Builder Web
- last-updated: 2026-09-03
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

## Fechamento — 2026-09-03
- implementação: commit `77804d76` (`fix(web): compacta navegacao ativa no mobile`), publicado em `origin/main`. Único ponto de mudança: `apps/web/src/main.tsx` (estado `expandedNavGroup`/`isMobileNav`). Nenhuma linha de `apps/web/src/styles.css` foi tocada — a causa raiz era o estado JS reabrindo a árvore no viewport mobile, não layout; o objetivo "ajustar somente CSS necessário" do escopo foi cumprido com zero CSS.
- comportamento: em `<=860px` (breakpoint do shell em `styles.css`), selecionar ou entrar direto em um filho de SAC/Administração não reabre mais o grupo automaticamente; grupo/filho ativos continuam identificáveis (classe `active` no toggle, `aria-current="page"` no filho ao reabrir); toggle por touch/Enter/Space com `aria-expanded` coerente preservado; um listener de `matchMedia` resincroniza o estado de forma determinística ao cruzar o breakpoint (resize/orientação), sem depender de leitura de viewport durante o render. Desktop mantém o grupo ativo auto-expandido como antes.
- achado real durante a implementação (não é risco cosmético, é regressão que foi encontrada e corrigida antes de fechar): uma primeira versão com dois `useEffect` — um deles resincronizando `expandedNavGroup` já no mount — introduziu um flake real e mensurável na suíte Vitest completa (~29%, 2 de 7 rodadas completas falhando em `navigation-roles.test.tsx`/`bootstrap-session-roles.test.tsx`), causado por um `setState` redundante durante o double-invoke de efeitos do `StrictMode`. Diagnosticado por bisecção com múltiplas rodadas completas da suíte (baseline sem a mudança: 13/13 limpo; primeira versão: 2/7 falhas; versão corrigida com um único efeito que só reage a evento real de `matchMedia` `change`: 13/13 limpo). A versão publicada é a corrigida.
- validação do builder:
  - Vitest completo (Web): 173/173 em múltiplas rodadas consecutivas, incluindo 3 casos novos em `apps/web/test/navigation-roles.test.tsx` (colapso após seleção de filho mobile + classe `active` preservada; reabertura por touch revela `aria-current="page"`; toggle por teclado Enter/Space; entrada direta em `/fluxos` não expande no mobile mas expande no desktop).
  - Web typecheck (`tsc --noEmit`) e `npm run build` aprovados.
  - `git diff --check` limpo no diff commitado.
  - Playwright focal `tests/e2e/visual-responsive-web.mobile.spec.ts` (projeto `mobile`, geometry helpers `expectNoUnexpectedOverflow`/`expectControlsInsideViewport`/`expectRegionsNotOverlapping` mais um novo helper `expectMobileFirstViewportContent`): 8/10, com os 4 casos novos desta task passando — SAC/Fluxos em 390x844 (primeiro bloco útil `.operational-filters` visível sem scroll, colapso, reabertura com `aria-current`, toggle por touch e por teclado Enter/Space), Administração/Usuários-Times em 390x844 (mesmas checagens), smoke geométrico SAC/Fluxos em 320x700 (sem overflow/sobreposição, árvore lateral seguindo compacta), e baseline desktop 1440x900 (grupo continua auto-expandido com `aria-current`, sem regressão). O baseline visual `web-sac-flows-390x844.png` foi reacquirido (screenshot antigo já estava obsoleto por mudanças de produto anteriores não relacionadas a esta task, ex.: marca antiga sem o toggle de grupo).
  - Os 2 casos restantes do mesmo arquivo (`login remains usable at a 320px narrow viewport`, `CaseFlow backup controls stack at the narrow management viewport`) falham identicamente em `main` sem nenhuma mudança desta task (confirmado revertendo via `git stash` e reexecutando) — diff de screenshot de fonte/renderização na tela de login e 3px de overflow de `.topbar` em CaseFlow Admin/Backup a 360x800, ambos pré-existentes e fora do escopo desta task (login não toca nada alterado; CaseFlow Admin não é uma das superfícies do finding UX-002).
  - Mesma verificação de pré-existência feita para `tests/e2e/critical-role.mobile.spec.ts`/`support-operations.mobile.spec.ts` (3 falhas) e `tests/e2e/critical-role.desktop.spec.ts`/`support-operations.desktop.spec.ts`/`support-scheduling.desktop.spec.ts`/`commercial-browser.spec.ts` (7 falhas): todas reproduzidas de forma idêntica em `main` sem esta mudança; nenhuma foi causada ou corrigida por esta task.
- critérios fechados: em 390x844, os dois filhos auditados (um de SAC, um de Administração) deixam título/contexto e o primeiro bloco útil (`.operational-filters`, o painel de busca/filtro) visíveis sem atravessar a árvore; grupo/filho ativos identificáveis e reabertura funcional com `aria-current`; toggle por touch/Enter/Space com `aria-expanded` coerente; desktop sem regressão (grupo ativo continua auto-expandido); `body`/`.app-frame`/`.sidebar`/`.workspace`/`.topbar` sem overflow ou sobreposição em 390x844 e 320x700; overflow de Configurações (`TASK-AT-456`) não foi reaberto.
- risco residual aceito / `manual-needed` (não coberto, não declarado como concluído):
  1. teclado completo (ordem de tabulação por toda a árvore, não só o toggle) e zoom 200% não exercitados.
  2. orientação landscape e tecnologia assistiva real (NVDA/VoiceOver/TalkBack/Orca) não disponíveis neste host — mesma lacuna já registrada por `TASK-AT-456`/`457`.
  3. achado genuíno fora do escopo do `expandedNavGroup`: em 320x700, o próprio `.top-nav`/`.topbar-account` do topbar (elemento pré-existente, duplica a navegação lateral como atalhos, não faz parte da árvore que esta task compacta) ainda empurra o primeiro bloco útil para baixo da dobra em pelo menos uma das superfícies testadas (Administração/Usuários-Times: `.operational-filters` começa em ~811px de um viewport de 700px de altura). A árvore de navegação lateral (escopo real desta task) permanece compacta e sem overflow/sobreposição nos dois viewports — o critério de aceite 1 (bloco útil no primeiro viewport) está fechado e validado apenas para 390x844, não para 320x700. Não tentei "consertar" isso alterando `.top-nav`/`.topbar-account`: é um componente fora do escopo explícito desta task (`main.tsx`/`styles.css` do `expandedNavGroup`), e mexer nele sem critério de aceite próprio seria inventar subescopo. Registrado como achado real para decisão de produto futura, não como decisão arbitrária minha.
- decisão: não foi encontrada regressão bloqueante nas superfícies e testes tocados por esta task; os riscos residuais acima permanecem manuais/pendentes de decisão de produto e impedem declarar cobertura irrestrita de 320x700, teclado completo, zoom e tecnologia assistiva.

## Sugestão de commit semântico
- `fix(web): compacta navegacao ativa no mobile`
