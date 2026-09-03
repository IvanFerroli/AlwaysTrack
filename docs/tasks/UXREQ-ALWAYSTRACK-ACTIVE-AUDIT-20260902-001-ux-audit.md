# UX AUDIT — Superfícies web ativas do AlwaysTrack

## 1. Modo aplicado

- `advisory audit mode`
- capability: `audit`
- operação read-only sobre o produto; nenhuma implementação, alteração de baseline ou aprovação foi realizada.

## 2. Artefato primário

- artifact_type: `ux-audit`
- request_id: `UXREQ-ALWAYSTRACK-ACTIVE-AUDIT-20260902-001`
- specialist: `olympus_product_ux`
- date: `2026-09-02`
- status: `audit-ready-with-partial-reproduction`
- evidence_origin: `product-ux-acquired`
- environment_classification: `fake`
- task_id/execution_id/evidence_id: ausentes por contrato do advisory.

## 3. Leitura do pedido e fontes

### Problema e resultado esperado

- usuário/job: papéis ativos do AlwaysTrack precisam localizar e executar seus principais jobs web sem ambiguidade, perda de contexto, conteúdo inacessível no viewport ou semântica incompleta.
- problema declarado: descobrir problemas reproduzíveis nas superfícies web ativas e gerar findings priorizados para taskificação independente.
- resultado esperado: diagnóstico reproduzível de jornada, IA, interação, apresentação, responsividade, acessibilidade e estados, sem implementar nem aprovar.
- autoridade da intenção: handoff do Orchestrator para este request; padrões e tokens ativos permanecem o default seguro.

### Escopo

- superfícies: login, Dashboard, Escalas, Pausas, Performance, Campanhas, Avisos, Fluxos, Scriptoteca, Wiki, FAQ, Usuários/Times, Configurações, Auditoria, Status CaseFlow, CaseFlow Admin, Perfil e Como usar.
- roles: `ANONYMOUS`, `ADMIN`, `GESTOR`, `SAC`, `FINANCEIRO`, `VENDEDOR` e `SUPERVISOR` conforme aplicabilidade descoberta.
- estados tentados: default, success, read-only, management, contributor, moderator, monitoring e cenário sem time selecionado.
- viewports: desktop `1024x768`, `1280x800`, `1440x900`; mobile `320x700` e `390x844`.
- fora de escopo: live, production-like, providers externos, PII, legado arquivado, redesign, branding, implementação, aprovação, criação de tasks e promoção de evidência.

### Fontes e classificação

| Fonte | Classificação | Autoridade | Observação |
|---|---|---|---|
| Handoff `UXREQ-ALWAYSTRACK-ACTIVE-AUDIT-20260902-001` | alvo | máxima neste request | Define escopo, ambiente e separação de responsabilidades. |
| `docs/specs/SPEC-AT-001-product-baseline.md` | alvo aceito | canônica | Define o produto comercial ativo e jobs de VENDEDOR, SUPERVISOR, FINANCEIRO, GESTOR e ADMIN. |
| `docs/tasks/TASK-AT-351-grouped-role-aware-navigation.md` | alvo aceito | task concluída com validação local | Aprova seis entradas principais, incluindo `Vendas`, e requer mobile navegável sem overflow incoerente. |
| `docs/tasks/TASK-AT-381-retire-sales-ui-navigation-nomenclature.md` | conflito / alvo proposto | não promovida | Propõe retirar Vendas e ainda declara dependência aberta; parte desse alvo já aparece no runtime. |
| `apps/web/src/main.tsx` e `apps/web/src/styles.css` | atual estrutural | implementação ativa | Navegação ativa contém SAC/Admin/Perfil/Como usar, sem grupo Vendas; submenu ativo expande automaticamente no mobile. |
| `packages/shared/src/index.ts` | atual estrutural | contrato ativo | Ainda contém permissões comerciais para os papéis auditados. |
| `apps/web/test/bootstrap-session-roles.test.tsx` | atual complementar | teste unitário vigente | Espera Vendas oculto para FINANCEIRO, VENDEDOR e SUPERVISOR. |
| `tests/e2e/critical-role.desktop.spec.ts` e `critical-role.mobile.spec.ts` | conflito | teste E2E vigente | Ainda esperam jobs em Vendas para papéis comerciais. |
| Runtime local fake + SQLite temporário + seed sintético | atual observado | evidência direta deste request | Sustenta apenas os terminais efetivamente atingidos e PNGs inspecionados. |
| `docs/operations/product-ux-state.md` | atual operacional | processo | Product UX está em uso supervisionado, sem autorização de promoção/aceite autônomo. |

## 4. Gates de Product UX

| Gate | Resultado | Fundamentação |
|---|---|---|
| intenção | fechado | Problema, usuários, job e objetivo do audit estão claros; a divergência sobre Vendas é registrada como decisão humana do finding UX-001. |
| reprodução | parcial | 17/30 cenários atingiram o terminal; 13/30 falharam antes do estado solicitado. |
| evidência | parcial e fail-closed | O record foi validado e 22 PNGs usados foram abertos; não há claims visuais sobre terminais não atingidos. |
| escopo | fechado | O artefato único é este `ux-audit`; não há implementação ou taskificação embutida. |
| independência | fechado | Este parecer não aprova mudança; implementação e verificação permanecem independentes. |

### Envelope fail-closed da parcela não reproduzida

status: BLOCKED
code: UX_REPRODUCTION_BLOCKED
failed_gate: reproduction
cause.status: VISUAL_ACQUISITION_BLOCKED
known_facts: 17 de 30 cenários atingiram o terminal; 13 produziram screenshot de fallback após falha de setup/navegação/terminal.
missing_input: cenário determinístico corrigido para os destinos GESTOR e para Performance SAC, Avisos ADMIN, Auditoria ADMIN, Status CaseFlow GESTOR e CaseFlow Admin ADMIN.
safe_progress: os quatro findings abaixo usam somente terminais reproduzidos, evidência estrutural classificada e PNGs realmente inspecionados.
unsafe_claims: aparência, estado, responsividade ou acessibilidade das 13 superfícies solicitadas que não atingiram o terminal.
resume_from: corrigir setup/terminal desses 13 cenários e readquirir no mesmo request enquanto ativo; se houver task futura, adquirir novamente no lane task-backed.

## 5. Matriz de alvo e reprodução

| Surface | Role | State | Setup e navegação | Viewport | Resultado |
|---|---|---|---|---|---|
| Login Web | ANONYMOUS | default | abrir raiz sem sessão | 1024x768 | reproduced |
| Login Web | ANONYMOUS | default | abrir raiz sem sessão | 320x700 | reproduced |
| Dashboard | SAC | success declarado; loading observado | login sintético SAC → raiz | 390x844 | partial; captura ocorreu em `Carregando operação SAC` |
| Escalas | GESTOR | default-no-team-selected | login GESTOR → SAC → Escalas | 1440x900 | blocked; terminal não atingido |
| Escalas | SAC | success-personal-week | login SAC → SAC → Escalas | 390x844 | reproduced |
| Pausas | GESTOR | default-management | login GESTOR → SAC → Pausas | 1440x900 | blocked; terminal não atingido |
| Pausas | SAC | success-personal-agenda | login SAC → SAC → Pausas | 390x844 | reproduced |
| Performance | GESTOR | success-management | login GESTOR → SAC → Performance | 1440x900 | blocked; terminal não atingido |
| Performance | SAC | success-read-only | login SAC → SAC → Performance | 390x844 | blocked; terminal não atingido |
| Campanhas | GESTOR | success-management | login GESTOR → SAC → Campanhas | 1440x900 | blocked; terminal não atingido |
| Campanhas | SAC | success-read-only | login SAC → SAC → Campanhas | 390x844 | reproduced |
| Avisos | ADMIN | success-management | login ADMIN → SAC → Avisos | 1440x900 | blocked; terminal não atingido |
| Avisos | SAC | success-reader | login SAC → SAC → Avisos | 390x844 | reproduced |
| Fluxos | GESTOR | success-management | login GESTOR → SAC → Fluxos | 1440x900 | blocked; terminal não atingido |
| Fluxos SAC | SAC | default | login SAC → SAC → Fluxos | 390x844 | reproduced |
| Scriptoteca | GESTOR | success-management | login GESTOR → SAC → Scriptoteca | 1440x900 | blocked; terminal não atingido |
| Scriptoteca | SAC | success-reader | login SAC → SAC → Scriptoteca | 390x844 | reproduced |
| Wiki | GESTOR | success-contributor | login GESTOR → SAC → Wiki | 1440x900 | blocked; terminal não atingido |
| Wiki | SAC | success-reader | login SAC → SAC → Wiki → artigo | 390x844 | reproduced |
| FAQ | GESTOR | success-moderator | login GESTOR → SAC → FAQ | 1440x900 | blocked; terminal não atingido |
| FAQ | SAC | success-reader | login SAC → SAC → FAQ | 390x844 | reproduced |
| Usuários e Times | ADMIN | success | login ADMIN → Administração → Usuários/Times | 390x844 | reproduced |
| Configurações | ADMIN | success | login ADMIN → Administração → Configurações | 390x844 | reproduced with findings |
| Auditoria | ADMIN | success | login ADMIN → Administração → Auditoria | 1440x900 | blocked; terminal não atingido |
| Status CaseFlow | GESTOR | success-monitoring | login GESTOR → destino técnico | 1440x900 | blocked; terminal não atingido |
| CaseFlow Admin — Conectores | ADMIN | default | login ADMIN → Administração → CaseFlow Admin | 1440x900 | blocked; terminal não atingido |
| Perfil | FINANCEIRO | success-default-entry | login FINANCEIRO → entrada padrão | 1280x800 | reproduced |
| Perfil | VENDEDOR | success-default-entry | login VENDEDOR → entrada padrão | 390x844 | reproduced |
| Perfil | SUPERVISOR | success-default-entry | login SUPERVISOR → entrada padrão | 1280x800 | reproduced |
| Como usar | ADMIN | success | login ADMIN → Como usar | 390x844 | reproduced |

## 6. Evidência adquirida e classe

- procedimento: preflight do harness, captura advisory por request, validação dedicada, abertura dos PNGs relevantes em resolução original, inspeção estrutural de fontes/testes e teste unitário focal.
- browser: Chromium `149.0.7827.55`, Linux x64, light mode, `prefers-reduced-motion: reduce`.
- runtime: loopback, SQLite temporário e seed sintético; classificação `fake`.
- source: commit `c429449e8d6f3f0e79dd9e2cffcd6b671b66ce0f`, worktree dirty explicitamente autorizado; alterações alheias não foram modificadas.
- advisory_capture_record: `test-results/product-ux/advisory/UXREQ-ALWAYSTRACK-ACTIVE-AUDIT-20260902-001/advisory-capture-record.json`
- comandos executados: `preflight.mjs --scenario <cenário-transitório> --request-id UXREQ-ALWAYSTRACK-ACTIVE-AUDIT-20260902-001 --classification fake`; `capture.mjs --scenario <cenário-transitório> --request-id UXREQ-ALWAYSTRACK-ACTIVE-AUDIT-20260902-001 --expected-commit c429449e8d6f3f0e79dd9e2cffcd6b671b66ce0f --classification fake --allow-dirty-worktree`; `validate-advisory-capture.mjs --record <advisory_capture_record> --request-id UXREQ-ALWAYSTRACK-ACTIVE-AUDIT-20260902-001`.
- validação: `validate-advisory-capture.mjs` retornou `valid-advisory-record`; o resultado de aquisição permanece `blocked` pelos 13 terminais não atingidos.
- artefatos: `image/png`, sensibilidade `internal`, `redacted: true`; credenciais seed, logs brutos, storage state e texto ARIA/DOM bruto não foram persistidos, e valores renderizados com aparência sensível foram mascarados.
- política de uso: `same-request-only`, transitória, `reusable: false`, `promotable: false`, `canonicalManifestAllowed: false`, `gateClosureAllowed: false`.
- teste focal: `navigation-roles.test.tsx` + `bootstrap-session-roles.test.tsx`, 11/11 testes aprovados; esse resultado demonstra apenas o contrato unitário atual, não aprovação de UX.
- manifesto canônico: não criado.

### InspectionRecords

O harness preserva `inspections: []`. Os registros abaixo documentam somente os PNGs efetivamente abertos por `olympus_product_ux` neste request.

| Inspection ID | Capture ID | Artifact | SHA-256 | Inspected at | Inspector | Method | Scope | Finding refs | Limitações |
|---|---|---|---|---|---|---|---|---|---|
| INS-001 | login-desktop | `screenshots/login-desktop.png` | `c716c04f78d3e032fdf01db936a2f9d14cb376ee9549aaab8abe473db74dc9e0` | 2026-09-02T21:06:43-03:00 | olympus_product_ux | actual-png-visual-inspection | composição do login desktop | — | sem teclado/AT/zoom |
| INS-002 | login-mobile | `screenshots/login-mobile.png` | `1281676844aac3d4210052ce43b9598bfe082cbfe69a0b6c3e2cf05ae02cea1d` | 2026-09-02T21:06:43-03:00 | olympus_product_ux | actual-png-visual-inspection | composição do login 320px | — | sem teclado/AT/zoom |
| INS-003 | sac-dashboard-mobile | `screenshots/sac-dashboard-mobile.png` | `97e10a5ae2864746057d048e0d49cbeedaa27856f384ccfb077d69a9015d10db` | 2026-09-02T21:06:43-03:00 | olympus_product_ux | actual-png-visual-inspection | shell mobile com grupo recolhido | UX-002 | captura ainda em loading |
| INS-004 | gestor-schedules-desktop | `screenshots/gestor-schedules-desktop.png` | `d36eb4fe630dc57bb061d99bd2e6ecec1e353dfbe5a96ebaf742257d8a5b2458` | 2026-09-02T21:06:43-03:00 | olympus_product_ux | actual-png-visual-inspection | confirmação de fallback após falha | BLOCKED | não prova Escalas |
| INS-005 | sac-schedules-mobile | `screenshots/sac-schedules-mobile.png` | `8023437d176d9ed742947be2112f4d102adaa947417accf212d5c26afe0b30ab` | 2026-09-02T21:06:43-03:00 | olympus_product_ux | actual-png-visual-inspection | shell e início do conteúdo mobile | UX-002 | primeiro viewport apenas |
| INS-006 | sac-pauses-mobile | `screenshots/sac-pauses-mobile.png` | `a03f4231f5dacf0863964dcc4b7bf89b25469a7cc9cd93d5ca8642eb74f96583` | 2026-09-02T21:06:43-03:00 | olympus_product_ux | actual-png-visual-inspection | shell e início do conteúdo mobile | UX-002 | primeiro viewport apenas |
| INS-007 | sac-performance-mobile | `screenshots/sac-performance-mobile.png` | `ed5b333c9defa0bff5c622768d424b3ee6b9238149401bcacea60d7ac1f7b886` | 2026-09-02T21:06:43-03:00 | olympus_product_ux | actual-png-visual-inspection | confirmação de terminal incompleto | BLOCKED | não prova Performance final |
| INS-008 | sac-campaigns-mobile | `screenshots/sac-campaigns-mobile.png` | `148fa8f1d2e4a2c9f08219b1e2698ae48047196d07f6b6d2b735358265a650f0` | 2026-09-02T21:06:43-03:00 | olympus_product_ux | actual-png-visual-inspection | shell e início do conteúdo mobile | UX-002 | primeiro viewport apenas |
| INS-009 | sac-announcements-mobile | `screenshots/sac-announcements-mobile.png` | `a90dac93a01616e122b70db69db05a02105cb86ccaf98b204ea97448860ed05d` | 2026-09-02T21:06:43-03:00 | olympus_product_ux | actual-png-visual-inspection | shell e início do conteúdo mobile | UX-002 | primeiro viewport apenas |
| INS-010 | admin-announcements-desktop | `screenshots/admin-announcements-desktop.png` | `73d89e810d3d51f8948343ba89c707f0b6dff17703856cd1ce4f99ec055ef1e0` | 2026-09-02T21:06:43-03:00 | olympus_product_ux | actual-png-visual-inspection | confirmação de fallback após falha | BLOCKED | não prova Avisos |
| INS-011 | sac-flows-mobile | `screenshots/sac-flows-mobile.png` | `7daa3c9f280709bd6f9974b9cf5a26d75900e6f3302de076877d621cca02ecde` | 2026-09-02T21:06:43-03:00 | olympus_product_ux | actual-png-visual-inspection | shell, início do conteúdo e checklist | UX-002, UX-004 | sem AT real |
| INS-012 | sac-script-library-mobile | `screenshots/sac-script-library-mobile.png` | `417d76b7eed12d02cc38c543a71a889608650b6d1b39bf21050f2cd2139a3a4f` | 2026-09-02T21:06:43-03:00 | olympus_product_ux | actual-png-visual-inspection | shell e início do conteúdo mobile | UX-002 | primeiro viewport apenas |
| INS-013 | sac-wiki-mobile | `screenshots/sac-wiki-mobile.png` | `a03a173b5da959b911ec4feed88d3c6fde5d692e85a94b0672f4f1e0897fc014` | 2026-09-02T21:06:43-03:00 | olympus_product_ux | actual-png-visual-inspection | shell, artigo e checklist | UX-002, UX-004 | sem AT real |
| INS-014 | sac-faq-mobile | `screenshots/sac-faq-mobile.png` | `2bcdb1f994eef519ec70b84a271b1e166b5b3ef6baed1224503ad7fe955728f9` | 2026-09-02T21:06:43-03:00 | olympus_product_ux | actual-png-visual-inspection | shell, conteúdo e checklist | UX-002, UX-004 | sem AT real |
| INS-015 | admin-users-mobile | `screenshots/admin-users-mobile.png` | `0c0fd333fae2b10074961c93993cca1c60de9721f55c0814123e5e6a91385467` | 2026-09-02T21:06:43-03:00 | olympus_product_ux | actual-png-visual-inspection | grupo Administração e início do workspace | UX-002 | tabela abaixo da dobra |
| INS-016 | admin-settings-mobile | `screenshots/admin-settings-mobile.png` | `b04b38d9fe7b45c96c9a56801be48735e8bf539ac77742917f20661b3b2458b9` | 2026-09-02T21:06:43-03:00 | olympus_product_ux | actual-png-visual-inspection | grupo Administração, workspace e clipping | UX-002, UX-003 | estado success sintético |
| INS-017 | admin-audit-desktop | `screenshots/admin-audit-desktop.png` | `73d89e810d3d51f8948343ba89c707f0b6dff17703856cd1ce4f99ec055ef1e0` | 2026-09-02T21:06:43-03:00 | olympus_product_ux | actual-png-visual-inspection | confirmação de fallback após falha | BLOCKED | não prova Auditoria |
| INS-018 | admin-caseflow-connectors-desktop | `screenshots/admin-caseflow-connectors-desktop.png` | `6fc6383a113c6eba60b3b7fed2dc4c5d70c985f8d3be1d252e2ce42535360472` | 2026-09-02T21:06:43-03:00 | olympus_product_ux | actual-png-visual-inspection | confirmação de fallback após falha | BLOCKED | não prova Conectores |
| INS-019 | finance-profile-desktop | `screenshots/finance-profile-desktop.png` | `906a16cd11a6a86f60a3d2582dd06b8d315a2619ced24fc7341ff2a8158a07d7` | 2026-09-02T21:06:43-03:00 | olympus_product_ux | actual-png-visual-inspection | entradas disponíveis e destino padrão | UX-001 | alvo de papel em conflito |
| INS-020 | seller-profile-mobile | `screenshots/seller-profile-mobile.png` | `8d95bd89ec7b2187a99edec4ea07ffe5b93c2b2599c9e385dc41f9d609ea0b03` | 2026-09-02T21:06:43-03:00 | olympus_product_ux | actual-png-visual-inspection | entradas disponíveis e destino padrão | UX-001 | alvo de papel em conflito |
| INS-021 | supervisor-profile-desktop | `screenshots/supervisor-profile-desktop.png` | `1e64ff63e96c2f684a1ae7f22f1283d355f4547f29862ac884b9790692dc9f6f` | 2026-09-02T21:06:43-03:00 | olympus_product_ux | actual-png-visual-inspection | entradas disponíveis e destino padrão | UX-001 | alvo de papel em conflito |
| INS-022 | admin-help-mobile | `screenshots/admin-help-mobile.png` | `37998c878b222be14785d4c15973cc375293ba3bbe664026ffee821c7468e80b` | 2026-09-02T21:06:43-03:00 | olympus_product_ux | actual-png-visual-inspection | shell mobile com destino direto | UX-002 | contraste estrutural, não baseline alvo |

## 7. Findings

### Resumo priorizado

| Finding | Impacto | Severidade | Confiança | Evidência | Decisão humana |
|---|---|---|---|---|---|
| UX-001 — Papéis comerciais estão ativos sem job operacional inequívoco | papéis podem autenticar, mas só encontram Perfil/Como usar enquanto fontes aceitas ainda atribuem jobs comerciais | critical | high | INS-019/020/021 + docs/código/testes | sim |
| UX-003 — Configurações excede o viewport mobile | conteúdo e controles podem ficar fora da área visível | high | high | INS-016 + geometria do harness | não |
| UX-002 — Navegação expandida consome o primeiro viewport mobile | o usuário precisa atravessar o menu antes de ver contexto e conteúdo da página escolhida | medium | high | INS-003/005/006/008/009/011–016/022 | não |
| UX-004 — Checklists Markdown expõem controles sem nome acessível | tecnologia assistiva recebe controles sem propósito identificável | medium | high | INS-011/013/014 + sinal automatizado + fonte | não |

### UX-001 — Papéis comerciais estão ativos sem job operacional inequívoco

- usuário/job afetado: FINANCEIRO, VENDEDOR e SUPERVISOR; consultar/executar o trabalho principal após autenticar.
- esperado e claim_kind: `human-decision-pending`. A SPEC-AT-001 aceita jobs de notas, ranking, campanhas e extratos, e TASK-AT-351 aceita o grupo Vendas; TASK-AT-381, ainda `proposed`, quer aposentar essas superfícies.
- observado e claim_kind: `observed-fact` nos PNGs e `documented-fact` no código. Os três papéis entram em Perfil e veem somente Perfil/Como usar como destinos principais; testes unitários exigem Vendas oculto, enquanto E2E ainda exige Vendas.
- surface: shell autenticado e Perfil.
- role: FINANCEIRO, VENDEDOR, SUPERVISOR.
- state: success-default-entry.
- setup steps: login sintético por papel.
- navigation steps: observar destino padrão e entradas principais permitidas.
- viewport: 1280x800 desktop; 390x844 mobile.
- evidência e tipo: INS-019, INS-020 e INS-021 (visual inspecionada); `main.tsx`, matriz compartilhada, SPEC-AT-001, TASK-AT-351, TASK-AT-381 e testes (estrutural/documental).
- impacto: se o baseline comercial aceito continuar válido, três papéis centrais não alcançam seus jobs; se o sunset for o alvo, contas/papéis e documentação continuam comunicando um produto híbrido.
- severidade: `critical`.
- confiança: `high` no estado observado e no conflito; o alvo correto depende de decisão humana.
- recomendação: ratificar uma única autoridade de produto para os papéis comerciais e alinhar, no mesmo plano, IA ativa, oferta de papéis/contas, ajuda, permissões, testes unitários/E2E e documentação.
- acceptance/test hook: (a) uma decisão alvo é registrada como aceita; (b) cada papel mantido possui ao menos um job operacional alcançável após login, ou seu acesso é explicitamente aposentado/encaminhado; (c) navegação, permissões, help, unitários e E2E descrevem o mesmo produto; (d) smoke desktop/mobile por papel não termina em um perfil órfão.
- decisão humana pendente: Product Owner deve escolher entre preservar os jobs comerciais aceitos ou promover formalmente o sunset e governar as contas/papéis remanescentes.
- limitações da evidência: fake/seed sintético; não mede volume de usuários nem prioridade comercial live.

### UX-002 — Navegação expandida consome o primeiro viewport mobile

- usuário/job afetado: SAC e ADMIN; confirmar onde chegou e iniciar o job escolhido em mobile.
- esperado e claim_kind: `documented-fact` em TASK-AT-351 para navegação mobile navegável, touch e sem overflow incoerente; o conteúdo selecionado deve preservar contexto perceptível.
- observado e claim_kind: `observed-fact`. Ao abrir um filho de SAC ou Administração em 390x844, o grupo ativo permanece expandido e a lista ocupa a maior parte do primeiro viewport; título e conteúdo útil começam próximos ou abaixo da dobra. Dashboard/Como usar com grupos recolhidos exibem o workspace significativamente antes.
- surface: Escalas, Pausas, Campanhas, Avisos, Fluxos, Scriptoteca, Wiki, FAQ, Usuários/Times e Configurações.
- role: SAC e ADMIN.
- state: success/default com grupo ativo expandido.
- setup steps: login sintético; abrir grupo permitido.
- navigation steps: selecionar um filho e observar o primeiro viewport sem scroll adicional.
- viewport: 390x844.
- evidência e tipo: INS-003/005/006/008/009/011–016/022 (visual); `main.tsx` e regras mobile de `styles.css` (estrutural complementar).
- impacto: aumenta custo de orientação e interação repetida; o usuário escolhe a página, mas precisa percorrer novamente a navegação antes de acessar seu contexto e ação principal.
- severidade: `medium`.
- confiança: `high`.
- recomendação: preservar descoberta e estado ativo do grupo com uma apresentação mobile que deixe contexto e início do job selecionado disponíveis no primeiro viewport, usando os padrões ativos do produto.
- acceptance/test hook: em 390x844, após selecionar cada filho auditado, o título/contexto da página e ao menos o primeiro estado, ação ou bloco útil ficam visíveis sem atravessar toda a árvore; grupo/filho ativo continuam identificáveis e operáveis por touch/teclado; não há sobreposição ou overflow.
- decisão humana pendente: não.
- limitações da evidência: um aparelho sintético e primeiro viewport; target size, teclado e zoom permanecem manuais.

### UX-003 — Configurações excede o viewport mobile

- usuário/job afetado: ADMIN; revisar e alterar configurações organizacionais em mobile.
- esperado e claim_kind: `documented-fact` em TASK-AT-351 e padrão responsivo ativo: navegação e workspace mobile sem overflow incoerente e controles alcançáveis.
- observado e claim_kind: `observed-fact`. O PNG apresenta conteúdo/topbar cortado à direita; a geometria automatizada falhou em `overflow` e `controls-inside-viewport`.
- surface: Configurações.
- role: ADMIN.
- state: success.
- setup steps: login sintético ADMIN.
- navigation steps: Administração → Configurações.
- viewport: 390x844.
- evidência e tipo: INS-016 (visual); checks de geometria do record (automação browser).
- impacto: labels, abas ou controles podem ficar parcialmente ocultos e exigir scroll horizontal não comunicado, comprometendo configuração e revisão.
- severidade: `high`.
- confiança: `high`.
- recomendação: garantir reflow do shell e dos controles de Configurações no viewport, reservando scroll horizontal apenas para regiões explicitamente contidas e perceptíveis, como tabelas largas.
- acceptance/test hook: em 390x844, `documentElement.scrollWidth <= documentElement.clientWidth`; header/topbar/abas/controles permanecem dentro do viewport; qualquer tabela larga usa scroller contido sem deslocar shell; screenshot inspecionado e checks `overflow`/`controls-inside-viewport` passam.
- decisão humana pendente: não.
- limitações da evidência: não houve validação em 320px, zoom 200% ou teclado.

### UX-004 — Checklists Markdown expõem controles sem nome acessível

- usuário/job afetado: SAC, incluindo uso com tecnologia assistiva; compreender passos e estados de checklists em Fluxos, Wiki e FAQ.
- esperado e claim_kind: `documented-fact` pela WCAG 2.2 quando controles interativos são expostos: nome, papel e estado precisam ser determináveis; se forem apenas conteúdo, não devem simular interação sem semântica adequada.
- observado e claim_kind: `observed-fact` para o sinal automatizado (`unnamed-interactive=1/2/3`) e `inference` para a causa. O renderer Markdown cria `input[type=checkbox][readOnly]` separado do texto, sem label/nome explícito; a contagem acompanha os checklists das três superfícies.
- surface: Fluxos, Wiki e FAQ.
- role: SAC.
- state: default/success-reader.
- setup steps: login sintético SAC e conteúdo seedado com checklist.
- navigation steps: abrir Fluxos, artigo Wiki e FAQ.
- viewport: 390x844.
- evidência e tipo: INS-011, INS-013 e INS-014 (visual complementar); record de acessibilidade automatizada; `apps/web/src/components/markdown-editor.tsx` (estrutura).
- impacto: leitor de tela pode anunciar um controle sem propósito; usuários podem interpretar o checkbox read-only como uma ação disponível.
- severidade: `medium`.
- confiança: `high` no sinal; validação final com tecnologia assistiva é manual-needed.
- recomendação: definir um contrato semântico único para checklist Markdown: item de estado não interativo com texto associado, ou controle realmente interativo com nome e estado programáticos coerentes.
- acceptance/test hook: os três cenários retornam zero `unnamed-interactive`; cada item exposto como controle tem nome, papel, estado e comportamento de teclado coerentes, ou é renderizado como conteúdo não interativo; validar manualmente leitura e ordem com tecnologia assistiva.
- decisão humana pendente: não para correção semântica; regra de negócio decide apenas se checklist deve ser acionável ou informativo.
- limitações da evidência: automação e inspeção estrutural não substituem NVDA/VoiceOver/TalkBack.

## 8. Acessibilidade e estados

### Matriz de estados

| Estado | Aplicável | Observado | Lacuna | Recuperação esperada |
|---|---|---|---|---|
| default | sim | login, Fluxos, CaseFlow solicitado | parte de GESTOR/CaseFlow bloqueada | ação primária e contexto disponíveis |
| loading | sim | Dashboard SAC capturado em loading | cenário o declarou success; duração/transição não medidas | feedback nomeado e transição determinística |
| empty | sim | não | sem cenário dedicado | estado explica ausência e próximo passo |
| error | sim | não | sem cenário dedicado | erro preserva contexto e oferece recuperação |
| success | sim | 16 terminais, com ressalvas | 13 terminais não atingidos | conteúdo e ações coerentes com papel |
| partial | sim | terminal incompleto em Dashboard/Performance | não parametrizado | distinguir carregamento parcial de sucesso |
| stale | sim | não | sem relógio/dado stale dedicado | sinalizar defasagem e permitir atualização |
| forbidden | sim | estruturalmente em matriz de papel | não reproduzido como deep link negado | negar sem revelar ação/dado e orientar retorno |
| conflict | sim | conflito documental/IA de Vendas | não é estado visual do runtime | decisão de produto versionada |
| disabled | sim | não sistematizado | sem cenário dedicado | razão perceptível e sem falso affordance |
| hover | desktop | não | não capturado | não ser único meio de descoberta |
| focus | sim | não | teclado não executado | foco visível, ordem lógica e retorno previsível |
| expanded/collapsed | sim | grupos mobile observados | teclado não executado | estado e filho ativo perceptíveis |
| destructive-confirmation | conforme superfície | não | fora da amostra reproduzida | confirmação explícita e cancelamento seguro |

### Acessibilidade e responsividade

- visual/geometria: Configurações falhou em overflow/controles fora do viewport; as demais capturas terminais passaram geometria automatizada, sem equivaler a aprovação visual.
- DOM/semântica: checklists Markdown têm forte correlação com controles read-only sem nome. `table-header-without-scope` apareceu em Usuários (6) e Configurações (8), mas tabelas simples podem ainda ter associação inferível; revisar manualmente antes de elevar a finding separado.
- ARIA: snapshots foram usados apenas como sinal; texto bruto não foi persistido. Admin Usuários/Configurações também registraram um `unnamed-interactive` cuja causa não foi isolada neste audit.
- teclado/foco: não validado.
- reflow/zoom: 320px apenas no login; nenhum cenário a 200%/400%.
- target size: não medido manualmente.
- reduced motion: browser capturou com preferência `reduce`; não houve fluxo animado suficiente para concluir conformidade.
- manual-needed: navegação completa por teclado, foco visível/retorno, leitor de tela, associação de cabeçalhos de tabela, target size, contraste, zoom/reflow, mensagens de erro e estados stale/forbidden.

## 9. Decisões humanas pendentes

- decisão: qual é o alvo vigente dos papéis e jobs comerciais.
- opções válidas:
  1. preservar/promover os jobs comerciais aceitos na SPEC-AT-001 e TASK-AT-351; ou
  2. promover formalmente o sunset de TASK-AT-381 e governar contas, papéis, permissões, ajuda, testes e documentação remanescentes.
- impacto do adiamento: o runtime, a documentação e as suítes continuarão descrevendo produtos diferentes; uma correção isolada de navegação pode restaurar ou remover comportamento contra a autoridade errada.
- autoridade necessária: Product Owner/gestão de produto, com registro canônico aceito antes de taskificar UX-001.

## 10. Limitações e riscos

- 13/30 cenários não atingiram o terminal; screenshots de fallback não sustentam claims sobre as superfícies solicitadas.
- apenas ambiente fake, loopback, SQLite temporário e dados sintéticos; nenhuma inferência sobre produção, latência real ou volume de dados.
- worktree dirty autorizado; record ancora o commit e marca dirty, portanto qualquer reprodução futura deve confirmar a mesma origem ou readquirir.
- evidência advisory é transitória e vale somente neste request; não pode ser copiada para pacote canônico nem promover gate.
- estados empty/error/stale/forbidden e a maior parte de partial/loading não tiveram cobertura deliberada.
- sem validação de tecnologia assistiva, teclado completo, zoom, target size, contraste mensurável ou dispositivos físicos.
- severidade e confiança são independentes; `critical/high` não equivalem a prioridade de negócio aprovada.
- o conflito de alvo de Vendas impede prescrever solução de IA sem decisão humana; não bloqueia os findings UX-002 a UX-004.

## 11. Handoff para implementação ou verificação

- destino: Orchestrator e Taskyfier para deduplicação e quebra independente; Task Verifier/autoridade humana para aceite futuro.
- artefatos entregues: este ux-audit e record advisory transitório do mesmo request.
- implementação esperada de outro especialista: nenhuma foi executada por Product UX. Se taskificado, manter UX-001 dependente da decisão humana; UX-002, UX-003 e UX-004 podem ser separados por objetivo e validados com seus hooks.
- validação independente esperada: reacquirir evidência task-backed por task/execução; revisar mobile 390px e 320px, teclado/AT conforme finding; não reutilizar estes PNGs advisory.
- retomada mínima dos bloqueados: corrigir cenários/terminais determinísticos, repetir preflight/capture/validator no lane correto e abrir os novos PNGs antes de emitir claims.
- independência: Product UX não aprova este audit nem eventual implementação derivada.
- auto-check das rubrics, sem valor de aprovação: UX Artifact Rubric `55/60` (`forte para handoff`); Visual Evidence Rubric `56/60` para os claims emitidos (`evidência forte`). Os 13 alvos bloqueados foram excluídos de claims e permanecem no envelope fail-closed.

## 12. Onde o artefato foi materializado

- `docs/tasks/UXREQ-ALWAYSTRACK-ACTIVE-AUDIT-20260902-001-ux-audit.md`
- evidência transitória: `test-results/product-ux/advisory/UXREQ-ALWAYSTRACK-ACTIVE-AUDIT-20260902-001/`
- retenção: somente durante o request ativo; descarte/promoção permanecem fora deste artefato e sob coordenação do Orchestrator.
