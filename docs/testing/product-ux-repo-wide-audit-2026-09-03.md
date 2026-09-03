# PRODUCT UX AUDIT — Checkpoint consolidado repo-wide do AlwaysTrack (2026-09-03)

## Metadata

- status: checkpoint-consolidated-partial (escopo corrigido no meio da execução — consolidar trabalho já realizado, não completar cobertura)
- owner: olympus_product_ux (audit) + coordenador ZCode (consolidação)
- date: 2026-09-03
- repo HEAD: `3088088a` (branch main, worktree dirty com arquivos não relacionados)
- consumer pretendido: Taskyfier (fase de reconciliação/derivação de tasks em task SEPARADA)
- requests advisory criados por este ciclo: `UXREQ-ALWAYSTRACK-REPO-WIDE-AUDIT-20260903-001` (registro válido) e `UXREQ-ALWAYSTRACK-REPO-WIDE-AUDIT-20260903-002` (interrompido, sem registro — inválido)
- boundaries respeitados: nenhum código de produto alterado; nenhuma task criada/fechada; `docs/operations/product-ux-state.md` intocado (lifecycle permanece `pilot-ready`); TASK-AT-452/453 (certificação) não retomadas; nada commitado.

## 0. Estado de execução do ciclo (transparência antes de tudo)

Este checkpoint NÃO é o audit repo-wide completo que foi planejado. O plano de 4 fases foi interrompido por correção de escopo do usuário ("preservar e consolidar o trabalho já concluído"). Estado real:

| Fase | Escopo planejado | Estado real |
|---|---|---|
| A — Reconstrução histórica | Inventariar e reconciliar TODO o trabalho UX anterior contra o estado atual | **COMPLETA.** Artefato: `.tmp/ux-audit-2026-09-03/phase-A-historical-reconciliation.md` (463 linhas, git-ignorado). 33 itens HIST reconciliados; mapa de cobertura com 23 linhas de superfície; 7 decisões humanas. |
| B — Evidência runtime/visual (lane advisory) | 2 ondas de captura (≤30 cenários cada) + inspeção de PNG + findings | **PARCIAL.** Onda 1: cenários criados e captura executada — 10/17 capturados, 7 falhados (registro advisory válido, `ADVISORY_ACQUISITION_BLOCKED` global). O spawn foi cancelado ANTES de inspecionar os PNGs; a inspeção foi realizada pelo coordenador (12 PNGs abertos, registros na seção N). Onda 2: interrompida no meio da captura — 2 PNGs órfãos SEM registro (evidência inválida, não consumida). |
| C — Audit estrutural code-level | Audit profundo de todas as views + componentes + consistência sistêmica | **CANCELADA antes de produzir output.** Nenhum artefato gerado. A verificação code-level existente veio exclusivamente da Fase A (reconciliação) e de leituras pontuais do coordenador. |
| D — Consolidação | Consolidação final por spawn fresco do especialista | **CANCELADA.** Este checkpoint foi materializado pelo coordenador, usando apenas: trabalho do coordenador + outputs das fases A e B. |

Consequência honesta: este documento consolida 100% do trabalho realizado, marca explicitamente tudo que ficou PARTIALLY_ASSESSED / UNASSESSED / EVIDENCE_INSUFFICIENT / BLOCKED, e não simula completude.

---

## A. Executive summary

O AlwaysTrack entrou neste ciclo com DOIS audits advisory recentes (2026-09-02 e 2026-09-03) que produziram 9 findings taskificados (TASK-AT-454..462). A reconciliação da Fase A confirmou contra o código atual que: **1 finding foi corrigido e verificado de forma independente** (UX-004/checklists Markdown, com validação real em Orca); **2 foram corrigidos mas carecem revalidação visual independente** (UX-002/nav mobile, UX-003/overflow Configurações — ambas agora com revalidação advisory positiva adquirida neste ciclo, inspeção do coordenador, geometry passed); **5 permanecem válidos e não corrigidos** (UX-C01, UX-C02, UX-C04, UX-C05 + UX-001 como decisão humana); e **1 finding órfão sem task** foi confirmado (topbar 320x700 empurra conteúdo abaixo do fold — HIST-015).

A evidência runtime adquirida neste ciclo (onda 1, 10 cenários capturados, fake/loopback) trouxe três ganhos novos: (1) **primeira captura terminal de Performance SAC mobile da história do produto** (superfície zero-cobertura em dois audits); (2) **replicação machine-verified dos sinais** de UX-C04 (`active-aria-controls-missing`), UX-C05 (geometry failed a 360px) e dos controles sem nome em Usuários/Configurações; (3) **diagnóstico novo do bloqueio GESTOR**: o PNG do cenário "falhado" mostra um dashboard GESTOR plenamente renderizado — ou seja, login GESTOR funciona e o blocker recorrente de três audits está no passo de navegação/terminal, não na autenticação/setup.

Temas sistêmicos vigentes: (i) o conflito de autoridade sobre papéis comerciais (TASK-AT-454, P0, sem decisão) que órfã superfícies inteiras e bloqueia DANFE/CSV; (ii) débito de evidência browser de TASK-AT-405/411 (busca global, central de notificações, overlays de agendamento nunca capturados); (iii) conflito não resolvido entre a matriz E2E "12/12" (2026-07-15) e as 10 falhas browser pré-existentes reportadas em 2026-09-03; (iv) estados vazios/erro/confirmação-destrutiva praticamente sem cobertura visual histórica (apenas 1 estado vazio já foi capturado até hoje); (v) produtos companheiros (companion-extension, smartscript-companion) nunca auditados por Product UX.

Total atual: **19 findings acionáveis** no registro (seção L), sendo 1 critical, 1 high, 8 medium, 8 low; 7 decisões humanas pendentes.

## B. Audit scope

- **Planejado**: audit repo-wide profundo do produto inteiro (web + companion apps + consistência sistêmica), com reconstrução histórica obrigatória, mapa de cobertura, reconciliação de todos os findings anteriores e evidência runtime nova.
- **Executado até o checkpoint**: reconstrução histórica completa (Fase A); aquisição parcial de evidência runtime (onda 1 da Fase B, 17 cenários planejados, 10 capturados, 12 PNGs inspecionados pelo coordenador); verificação code-level da vigência dos findings anteriores (feita dentro da Fase A).
- **Não executado**: audit estrutural profundo por superfície (Fase C), onda 2 de evidência (busca global, central de notificações, tabs Histórico/Regras do CaseFlow, isolamento de unnamed-interactive), consolidação por especialista fresco (Fase D).
- **Fora de escopo por boundary**: TASK-AT-452/453 (certificação do especialista, pausadas por decisão de produto — não misturadas com findings de produto); modificação de produto; taskificação.

## C. Method and evidence boundaries

- Fase A: leitura do repositório em HEAD `3088088a`, arqueologia git, os 2 ux-audits canônicos, os 4 registros advisory (lidos por cenário), task docs 449–462 + varredura delimitada de 633 arquivos em docs/tasks, docs de testing/operations, referências do skill kit. Sem browser, sem captura.
- Fase B (parcial): lane advisory do runbook (`preflight.mjs` → `capture.mjs --request-id` → `validate-advisory-capture.mjs`), `--classification fake`, `--allow-dirty-worktree` autorizado pelo coordenador, runtime isolado loopback 3334/5174 + SQLite temporário + seed sintético, redaction aplicada. Registro onda 1: `same-request-only`, `reusable: false`, `promotable: false`, commit `3088088a` dirty, capturado 2026-09-03T20:46Z.
- Inspeção de PNG: obrigatória para claim visual. Os 12 PNGs foram abertos com a ferramenta de imagem da engine (Read) pelo **coordenador** — registros na seção N com provenance explícita de inspector. Claim visual algum fecha gate; ambiente é `fake`.
- Classes de evidência usadas e separadas: repository/code evidence; historical evidence (artefatos anteriores); runtime visual evidence (fake, advisory, coordinator-inspected); runtime machine signals (geometry/ARIA); inferred behavior; human decision. **Nenhum claim WCAG integral por automação.** Nenhum claim visual a partir de código. Evidência advisory não é reutilizável por tasks futuras — toda task lerá nova aquisição task-backed.
- Falha fechada mantida: cenários falhados permanecem sem parecer visual; onda 2 sem registro é inválida e não consumida.

## D. Product coverage map (estado atual)

Mapa completo por superfície (roles, journeys, estados, ações destrutivas) está na Fase A (seção 3). Resumo de cobertura CORRENTE consolidada:

| # | Superfície | Roles principais | Cobertura atual | Status |
|---|---|---|---|---|
| 1 | Login | ANONYMOUS | A1 desktop+mobile; A2 foco de senha 320; erro nunca renderizado em captura | ASSESSED (com gaps de erro/teclado) |
| 2 | Shell + navegação + topbar | todos autenticados | A1/A2 ampla; onda 1 455/456/320; código; busca global e notificações NUNCA capturados | ASSESSED (com gaps nomeados) |
| 3 | Dashboard | ADMIN, GESTOR, SAC | desktop 1440 visto em 2 PNGs desta onda (ADMIN e GESTOR); terminal mobile falhou nos 3 audits; empty/error nunca | PARTIALLY_ASSESSED |
| 4 | Escalas | ADMIN, GESTOR, SAC | SAC mobile (A1), GESTOR desktop (A2), baseline vazio GESTOR mobile (onda 1), UX-C04 confirmado | ASSESSED (interações/teclado gap) |
| 5 | Pausas | ADMIN, GESTOR, SAC | SAC mobile (A1), GESTOR desktop (A2); aprovações de troca não auditadas | ASSESSED (com gaps de interação) |
| 6 | Performance | ADMIN, GESTOR, SAC | **primeira captura terminal SAC mobile (onda 1)**; GESTOR/ADMIN desktop bloqueados nos 3 audits | PARTIALLY_ASSESSED |
| 7 | Campanhas (SAC) | ADMIN, GESTOR, SAC | SAC mobile (A1), GESTOR desktop (A2); submit/validação não auditado | ASSESSED (com gaps de formulário) |
| 8 | Avisos | ADMIN, GESTOR, SAC | SAC mobile (A1), GESTOR desktop + editor desktop (A2); mobile do editor falhou (A2); acknowledge/delete não auditados | ASSESSED (com gaps) |
| 9 | Fluxos | ADMIN, GESTOR, SAC | SAC mobile (A1), GESTOR+SAC desktop + editor (A2); publish/versionamento não auditado | ASSESSED (com gaps) |
| 10 | Scriptoteca | ADMIN, GESTOR, SAC | SAC mobile (A1), GESTOR desktop + editor (A2); drag-drop reorder nunca auditado | ASSESSED (com gaps) |
| 11 | Wiki | ADMIN, GESTOR, SAC | SAC mobile (A1), GESTOR desktop + editor (A2); moderação/mobile editor gap | ASSESSED (com gaps) |
| 12 | FAQ (público + interno) | ADMIN, GESTOR, SAC, ANONYMOUS | SAC mobile (A1), GESTOR desktop + editor (A2); dual-mode público/interno não auditado | ASSESSED (com gaps) |
| 13 | Usuários/Times | ADMIN | A1/A2 mobile+320; onda 1 (455 + 320 + sinais a11y); criação não auditada | ASSESSED (com gaps) |
| 14 | Configurações | ADMIN | A1/A2 390+320; fix 456 verificado (geometry passed onda 1); causa unnamed-interactive não isolada | ASSESSED (com gaps) |
| 15 | Auditoria | ADMIN | retry GESTOR... desktop only (A2); mobile/filtros nunca | PARTIALLY_ASSESSED |
| 16 | Status CaseFlow (health) | ADMIN, GESTOR | GESTOR desktop (A2) only; mobile/erro nunca | PARTIALLY_ASSESSED |
| 17 | CaseFlow Admin (Histórico/Regras/Conectores/Backup) | ADMIN | Conectores desktop (A2); Backup 360 baseline (A2 + onda 1, geometry failed); Histórico/Regras e restore NUNCA | PARTIALLY_ASSESSED |
| 18 | Perfil | todos (entrada default comercial) | A1 FINANCEIRO/VENDEDOR/SUPERVISOR + código; prefs de notificação não auditadas | PARTIALLY_ASSESSED |
| 19 | Como usar | todos (+RT) | A1 ADMIN mobile only; diferenças por papel não auditadas | PARTIALLY_ASSESSED |
| 20 | Superfícies comerciais legadas (Notas/Ranking/Extratos, professionals/licenses/documents/reports) | órfãs da navegação | órfãs confirmadas em código; DANFE condicionado à decisão TASK-AT-454 | BLOCKED (decisão humana TASK-AT-454) |
| 21 | Companion extension (side panel) | operadores de campo | NUNCA auditado por Product UX (só evidência engenharia AT-312/314) | UNASSESSED |
| 22 | SmartScript companion | usuários de scripts | NUNCA auditado | UNASSESSED |
| 23 | Companion host | serviço | fora do escopo de UI; nota apenas | UNASSESSED (baixa prioridade) |

**Métricas de cobertura**: 23 superfícies mapeadas → 12 adequately assessed · 7 partially assessed · 4 unassessed/blocked. Estados: sucesso amplamente coberto (fake); vazio: 1 estado capturado na história toda (Escalas GESTOR mobile, onda 1); erro renderizado: 0 capturas; loading: 1 acidental (A1); confirmação de ação destrutiva: 0 capturas (cenário de desativação falhou na onda 1).

## E. Historical UX reconciliation

Registry completo (33 itens, com provenance item por item) na Fase A. Resumo por classificação:

| Classificação | Qtd | Itens |
|---|---|---|
| STILL_VALID | 10 | HIST-001 (UX-001 papéis comerciais), 007 (unnamed-interactive sem causa isolada), 008 (UX-C01), 009 (UX-C02), 010 (UX-C03), 011 (UX-C04), 012 (UX-C05), 013 (harness sem file step), 015 (topbar 320), 033 (propostas 381/362/365/385) |
| FIXED_AND_VERIFIED | 7 | HIST-004 (UX-004/AT-457 — única com validação real em AT), 014 (inventário upload), 022 (matriz permissões), 027 (nav agrupada 351), 028 (overlay primitive 404), 031 (search deep links 451), 032 (notification targets 397) |
| FIXED_NEEDS_REVALIDATION | 2 | HIST-002 (UX-002/AT-455), HIST-003 (UX-003/AT-456) — **atualizado neste ciclo: revalidação advisory positiva adquirida (geometry passed, inspeção do coordenador); revalidação task-backed independente segue pendente** |
| PARTIALLY_FIXED | 5 | HIST-005 (13 terminais bloqueados: 11/13 recuperados, Performance persiste), 024 (AT-312: gate automático ativo, parcelas manuais expiradas), 026 (AT-314: gate ativo, 2 casos vermelhos), 029 (AT-405: implementado, evidência browser pendente), 030 (AT-411: parcial) |
| SUPERSEDED | 4 | HIST-017, 018, 020, 021 (polish pré-rework do shell) |
| EVIDENCE_INSUFFICIENT | 2 | HIST-006 (table-header-without-scope — requer avaliação manual AT), 019 (empty states do demo-readiness nunca capturados) |
| CURRENT_STATE_UNKNOWN | 3 | HIST-016 (10 falhas E2E browser em main vs matriz "12/12"), 023 (paginação server-side nunca re-verificada), 025 (matriz de papéis E2E possivelmente vermelha) |
| OBSOLETE / DUPLICATE / INVALID_PREMISE | 0 | — (nada descartado silenciosamente) |

Drift documental menor detectado: TASK-AT-449/450 ainda com `status: proposed` nos docs embora fechadas por `8c61155b` (higiene de task docs; o state doc registra a verdade).

## F. New current findings (deste ciclo)

1. **ATUX-R1 (novo, low, confiança média)** — Linha de atalhos da topbar corta chips nas bordas sem affordance de scroll visível: "Perfil" cortado à esquerda com SAC ativo e "Como usar" cortado à direita com Administração ativo, observado em 390px (ADMIN) e 320px (ADMIN e SAC), em 3 PNGs da onda 1. Geometry checks passaram (sem overflow inesperado) → provavelmente linha scrollável por design; o problema é affordance/descobribilidade e risco de controle focável fora da viewport. Requer confirmação (comportamento de scroll/foco) antes de elevar severidade. Relacionada a HIST-015 (sintoma distinto, mesma região).
2. **ATUX-R2 (novo, diagnóstico)** — Blocker recorrente de Performance GESTOR/ADMIN estreitado: o PNG do cenário `gestor-performance-desktop` (falhado) mostra sessão GESTOR autenticada com Dashboard plenamente renderizado em 1440x900. Ou seja: login/setup GESTOR funciona; a falha está no passo `open-navigation`/terminal condition. Três audits consecutivos classificaram como `setup-incomplete`; o diagnóstico correto agora é de navegação/fixture, owner Runtime Builder.
3. **Revalidações positivas (não são findings)** — AT-455 (nav mobile compacta, grupo ativo como chip colapsado, conteúdo do primeiro viewport visível em 390 e 320) e AT-456 (Configurações contida em 390 e 320) passaram geometry e inspeção visual advisory neste ciclo. Detalhe: na onda 1 o cenário de controle desktop do 455 falhou por terminal condition (PNG mostra Dashboard saudável — falha de autoria de cenário, não de produto).

## G. Cross-product/systemic UX findings

1. **Conflito de autoridade sobre papéis comerciais** (HIST-001/033): SPEC-AT-001/TASK-AT-351 (aceitos) vs TASK-AT-362/365/381 (propostos) — mantém 3 papéis autenticando para um destino vazio (Perfil), órfã 4+ superfícies com código ativo (DANFE incluído) e contradiz testes unit vs E2E. Decisão TASK-AT-454 bloqueia tudo neste domínio.
2. **Débito de evidência browser de tarefas aceitas** (HIST-029/030): TASK-AT-405 (busca global, central de notificações, popovers) e TASK-AT-411 (overlays de agendamento) foram fechadas/parcialmente fechadas sem a parcela de evidência browser que seus próprios status exigem — nenhum audit as capturou desde então.
3. **Veracidade da suíte E2E** (HIST-016/025): `e2e-critical-role-matrix.md` afirma 12/12 (2026-07-15); fechamento do AT-455 reporta 10 falhas browser pré-existentes em main (2026-09-03), incluindo os mesmos spec families. A doc de matriz pode superestimar cobertura atual — impacta confiabilidade de qualquer claim "coberto por E2E".
4. **Assimetria de cobertura de estados**: sucesso é bem coberto; empty (1 captura histórica), error (0), loading (1) e confirmações destrutivas (0) são quase ausentes — padrão estrutural, não local.
5. **Produtos companheiros fora do perímetro de UX**: companion-extension tem gate a11y de engenharia (AT-312) mas nunca passou por audit UX; smartscript-companion zero. Sem lane advisory verificado para seus runtimes (feasibility desconhecida).

## H. Accessibility findings and evidence limits

- Confirmados e vigentes (código re-checado em HEAD + sinais machine da onda 1): UX-C01/AT-458 (input de arquivo sem nome, `markdown-editor.tsx:383-392`), UX-C04/AT-461 (`active-aria-controls-missing` reproduzido), UX-004/AT-457 corrigido e verificado com AT real (Orca), sinais `unnamed-interactive` (1) + `table-header-without-scope` (6/8) em Usuários/Configurações persistindo em todas as capturas (causa não isolada — HIST-007/006).
- Limites: nenhuma alegação de conformidade WCAG é feita; automação (ARIA snapshot/geometry) não prova leitor de tela real, navegação por teclado completa, zoom 200/400% ou target size. AT real só foi exercitado uma vez (Orca/Linux no AT-457). Parcelas manuais do AT-312 (NVDA, zoom) expiraram sem execução (HIST-024). Avaliação de `table-header-without-scope` requer avaliação manual antes de virar finding ou ser descartado.

## I. Responsive/viewport findings and evidence limits

- Cobertura de viewports existente: 320x700, 360x800, 390x844 (mobile) e 1440x900 (desktop) via harness; 455 (nav) e 456 (overflow) com revalidação positiva neste ciclo em 390+320; UX-C05 geometry failed persistente em 360px.
- Limites: landscapes, viewports intermediários, zoom, deviceScaleFactor real e navegadores reais nunca exercitados; a observação de chips cortados da topbar (ATUX-R1) é visual e carece confirmação comportamental (scroll/foco); evidência 320 do AT-455 fechou critério apenas para 390x844 (HIST-015 continua válido para 320).

## J. Uncovered / blocked areas

| Área | Motivo da lacuna | Classificação |
|---|---|---|
| Performance GESTOR/ADMIN desktop | blocker de navegação/terminal recorrente (3 audits); diagnóstico estreitado (ATUX-R2); owner Runtime Builder | BLOCKED (evidence acquisition) |
| Busca global + central de notificações (popovers, teclado, deep links) | onda 2 da Fase B não executou | UNASSESSED |
| CaseFlow Admin: tabs Histórico/Regras; UX do restore aditivo | onda 2 não executou; restore requer steps não planejados | UNASSESSED |
| Isolamento da causa de unnamed-interactive (Usuários/Configurações/Auditoria) | requer sessão DOM ao vivo (onda 2 não executou) | EVIDENCE_INSUFFICIENT |
| Estados de erro renderizados; confirmações destrutivas (ex.: desativação de usuário); estados vazios em geral | 0 capturas históricas; cenário de confirmação falhou na onda 1; harness sem file step bloqueia estados de upload (HIST-013) | UNASSESSED / BLOCKED (harness) |
| Auditoria/Health/Perfil/Como usar: mobile, filtros, conteúdo por papel | capturas únicas existentes; onda 2 não executou | PARTIALLY_ASSESSED |
| Superfícies comerciais legadas + DANFE | bloqueadas pela decisão TASK-AT-454 | BLOCKED (decisão humana) |
| Companion extension / SmartScript companion / host | nunca auditados; feasibility do lane advisory para seus runtimes desconhecida | UNASSESSED |
| Ground truth das suítes E2E browser em main | nenhum run fresh neste ciclo (fora do escopo das fases executadas) | CURRENT_STATE_UNKNOWN |
| Validação AT além de Orca (NVDA/VoiceOver/TalkBack/zoom) | requer avaliação humana/AT real | BLOCKED (manual-needed) |

## K. Human product decisions required

1. **TASK-AT-454 (P0)** — destino de FINANCEIRO/VENDEDOR/SUPERVISOR: manter jobs comerciais (autoridade SPEC-AT-001/351) ou promover sunset formal (cadeia 362/365/381) e governar contas/permissões/help/testes/docs. Bloqueia o domínio inteiro (DANFE, CSV, licenças, nomenclatura Vendas).
2. **TASK-AT-460** — `picker-only` vs `picker + drag-and-drop` no MarkdownEditor (UX-C03). Não bloqueia 458/459/461/462.
3. **Topbar 320x700 (HIST-015) + chips cortados (ATUX-R1)** — sem owner; decidir taskificação (não coberto pelo critério fechado do AT-455 nem pelo escopo 360px do AT-462).
4. **Checklists informativos vs acionáveis** — regra de negócio + persistência para tornar checklists interativos (deferido no AT-457).
5. **Triage das 10 falhas E2E browser em main** (HIST-016) e correção/reaferição da matriz `e2e-critical-role-matrix.md` — owner Runtime/Quality.
6. **TASK-AT-453 pausada por decisão de produto** — promoção do especialista a `active` permanece pausada; lifecycle `pilot-ready` (decisão operacional, fora deste audit).
7. **Parcelas manuais do AT-312** (NVDA/side panel/zoom) — agendar execução ou aposentar formalmente como risco aceito (prazo expirou silenciosamente em 2026-07-31).

## L. Consolidated current finding registry (acionáveis)

Somente itens acionáveis atuais. `evidence_status`: code-verified | advisory-captured-inspected (fake, same-request-only) | machine-signal | historical | blocked.

```yaml
- finding_id: ATUX-001
  source: historical
  historical_reference: UX-001 / HIST-001 / TASK-AT-454
  surface: navegação/perfil/superfícies comerciais legadas
  roles: [FINANCEIRO, VENDEDOR, SUPERVISOR, ADMIN]
  journey_or_state: pós-login de papéis comerciais
  category: information-architecture/permissions
  severity: critical
  confidence: high
  evidence_status: code-verified (main.tsx:515-532; packages/shared; bootstrap-session-roles.test.tsx:135-141) + historical
  current_status: STILL_VALID
  human_decision_required: true (TASK-AT-454)
  runtime_revalidation_required: false
  dependencies: [TASK-AT-454]
  duplicate_of: null
  supersedes: null
  notes: raiz do conflito 351-vs-381; bloqueia DANFE/CSV/licenças e testes comerciais

- finding_id: ATUX-002
  source: historical
  historical_reference: UX-002 / HIST-002 / TASK-AT-455
  surface: shell/navegação mobile
  roles: [ADMIN, GESTOR, SAC]
  journey_or_state: primeiro viewport após navegar grupo ativo (mobile)
  category: navigation/responsive
  severity: medium
  confidence: high
  evidence_status: code-verified (fix presente main.tsx:576-579,4290-4325,4363) + advisory-captured-inspected 2026-09-03 (geometry passed 390/320, coordinator-inspected)
  current_status: FIXED_ADVISORY_REVALIDATED; revalidação task-backed independente pendente
  human_decision_required: false
  runtime_revalidation_required: true (task-backed)
  dependencies: []
  duplicate_of: null
  supersedes: null
  notes: fechamento do AT-455 foi builder-inspected; faltou revisão visual independente task-backed

- finding_id: ATUX-003
  source: historical
  historical_reference: UX-003 / HIST-003 / TASK-AT-456
  surface: Configurações (mobile)
  roles: [ADMIN]
  journey_or_state: overflow/contenção em 390 e 320
  category: responsive/layout
  severity: medium
  confidence: high
  evidence_status: code-verified (styles.css:2609-2612) + advisory-captured-inspected 2026-09-03 (geometry passed)
  current_status: FIXED_ADVISORY_REVALIDATED; revalidação task-backed independente pendente
  human_decision_required: false
  runtime_revalidation_required: true (task-backed)
  dependencies: []
  duplicate_of: null
  supersedes: null
  notes: teclado/zoom/landscape nunca exercitados

- finding_id: ATUX-004
  source: historical
  historical_reference: UX-C01 / HIST-008 / TASK-AT-458
  surface: MarkdownEditor (Wiki, FAQ, Fluxos, Scriptoteca, Avisos)
  roles: [ADMIN, GESTOR, SAC]
  journey_or_state: tabulação sobre input de arquivo invisível
  category: accessibility
  severity: medium
  confidence: high
  evidence_status: code-verified (markdown-editor.tsx:383-392; styles.css:4845-4852)
  current_status: STILL_VALID
  human_decision_required: false
  runtime_revalidation_required: true (pós-fix)
  dependencies: []
  duplicate_of: null
  supersedes: null
  notes: 5 superfícies afetadas

- finding_id: ATUX-005
  source: historical
  historical_reference: UX-C02 / HIST-009 / TASK-AT-459
  surface: MarkdownEditor upload
  roles: [ADMIN, GESTOR, SAC]
  journey_or_state: falha de upload sem feedback/recuperação
  category: error-recovery/feedback
  severity: high
  confidence: medium (branch de erro nunca renderizado em browser)
  evidence_status: code-verified (markdown-editor.tsx:296-310 try/finally sem catch)
  current_status: STILL_VALID
  human_decision_required: false
  runtime_revalidation_required: true (requer file step no harness — ver ATUX-012)
  dependencies: [ATUX-012]
  duplicate_of: null
  supersedes: null
  notes: P0 do pacote complementar

- finding_id: ATUX-006
  source: historical
  historical_reference: UX-C03 / HIST-010 / TASK-AT-460
  surface: MarkdownEditor
  roles: [ADMIN, GESTOR, SAC]
  journey_or_state: ausência de drag-and-drop (alvo de produto não decidido)
  category: product-decision/interaction
  severity: medium
  confidence: high (ausência confirmada em código)
  evidence_status: code-verified
  current_status: STILL_VALID (decisão aberta)
  human_decision_required: true (TASK-AT-460)
  runtime_revalidation_required: false
  dependencies: []
  duplicate_of: null
  supersedes: null
  notes: não bloqueia 458/459/461/462

- finding_id: ATUX-007
  source: historical
  historical_reference: UX-C04 / HIST-011 / TASK-AT-461
  surface: Escalas (GESTOR sem equipe)
  roles: [GESTOR, ADMIN]
  journey_or_state: aba ativa controla painel inexistente no estado vazio
  category: accessibility/state-coverage
  severity: medium
  confidence: high
  evidence_status: code-verified (support-schedules.tsx ~863 aria-controls vs branch OperationalState) + machine-signal reproduzido 2026-09-03 (active-aria-controls-missing:1) + baseline visual mobile capturado (onda 1)
  current_status: STILL_VALID
  human_decision_required: false
  runtime_revalidation_required: true (pós-fix)
  dependencies: []
  duplicate_of: null
  supersedes: null
  notes: estados loading/error da mesma tela provavelmente compartilham o defeito

- finding_id: ATUX-008
  source: historical
  historical_reference: UX-C05 / HIST-012 / TASK-AT-462
  surface: CaseFlow Admin > Backup (topbar)
  roles: [ADMIN]
  journey_or_state: 360x800
  category: responsive/layout
  severity: low
  confidence: high
  evidence_status: machine-signal geometry failed (A2) + reproduzido onda 1 (caseflow-backup-360-revalidate: geometry failed) + baseline visual capturado
  current_status: STILL_VALID
  human_decision_required: false
  runtime_revalidation_required: true (pós-fix)
  dependencies: []
  duplicate_of: null
  supersedes: null
  notes: e2e visual-responsive-web.mobile.spec.ts:141 vermelho em main (HIST-016); não "consertar" com overflow-x:hidden

- finding_id: ATUX-009
  source: historical
  historical_reference: HIST-015 (residual 3 do fechamento AT-455)
  surface: topbar (todas as superfícies)
  roles: [ADMIN, SAC, GESTOR]
  journey_or_state: 320x700 — primeiro bloco útil abaixo do fold
  category: responsive/layout
  severity: medium
  confidence: medium
  evidence_status: historical (builder Playwright) + advisory-captured-inspected onda 1 (topbar-320-users, topbar-320-sac-escalas)
  current_status: STILL_VALID — SEM TASK OWNER
  human_decision_required: true (decidir taskificação — ver K.3)
  runtime_revalidation_required: true (task-backed, se taskified)
  dependencies: []
  duplicate_of: null
  supersedes: null
  notes: distinto do escopo 360px do AT-462; ver também ATUX-019 (chips cortados)

- finding_id: ATUX-010
  source: historical
  historical_reference: HIST-007
  surface: Usuários/Times, Configurações (Auditoria a confirmar)
  roles: [ADMIN]
  journey_or_state: sinal unnamed-interactive (1 por superfície) sem causa isolada
  category: accessibility/investigation
  severity: low
  confidence: high (sinal persistente) / causa desconhecida
  evidence_status: machine-signal (A1, A2 e onda 1 — users:1+scope:6; settings:1+scope:8)
  current_status: STILL_VALID (sinal); causa EVIDENCE_INSUFFICIENT
  human_decision_required: false
  runtime_revalidation_required: true (isolamento DOM ao vivo)
  dependencies: []
  duplicate_of: null
  supersedes: null
  notes: isolamento barato deve preceder qualquer task de fix

- finding_id: ATUX-011
  source: historical
  historical_reference: HIST-006
  surface: Usuários/Times, Configurações, Auditoria (tabelas)
  roles: [ADMIN]
  journey_or_state: table-header-without-scope (6/8/5 ocorrências)
  category: accessibility/manual-evaluation
  severity: low
  confidence: low (associação inferível possível)
  evidence_status: machine-signal apenas
  current_status: EVIDENCE_INSUFFICIENT
  human_decision_required: true (avaliar manualmente/AT e decidir finding vs descarte)
  runtime_revalidation_required: true (avaliação manual)
  dependencies: []
  duplicate_of: null
  supersedes: null
  notes: nunca elevado a finding deliberadamente

- finding_id: ATUX-012
  source: historical
  historical_reference: HIST-013
  surface: harness Product UX (ferramenta, não produto)
  roles: []
  journey_or_state: sem step contratual para file selection/drop → estados de upload inacessíveis
  category: evidence-infrastructure
  severity: low (para o produto) / blocker (para evidência)
  confidence: high (runbook:88-96)
  evidence_status: code-verified (contrato do harness)
  current_status: STILL_VALID
  human_decision_required: false (owner é Runtime Builder)
  runtime_revalidation_required: n/a
  dependencies: []
  duplicate_of: null
  supersedes: null
  notes: pré-requisito para fechar visualmente ATUX-005 e estados de drop/erro de upload

- finding_id: ATUX-013
  source: historical
  historical_reference: HIST-016 / HIST-025
  surface: suítes E2E browser + doc e2e-critical-role-matrix.md
  roles: []
  journey_or_state: 10 falhas pré-existentes em main vs claim 12/12 (2026-07-15)
  category: test-truth/coverage-reliability
  severity: medium
  confidence: medium (sem run fresh neste ciclo)
  evidence_status: historical (fechamento AT-455, bissetado) vs historical doc
  current_status: CURRENT_STATE_UNKNOWN
  human_decision_required: true (triage e correção da doc)
  runtime_revalidation_required: true (run fresh/CI)
  dependencies: []
  duplicate_of: null
  supersedes: null
  notes: inclui login-320 baseline divergente (mudança de produto não reconciliada conscientemente)

- finding_id: ATUX-014
  source: historical
  historical_reference: HIST-029 / TASK-AT-405 (status implemented-local-browser-evidence-pending)
  surface: busca global, central de notificações, popovers/dropdowns
  roles: [ADMIN, GESTOR, SAC]
  journey_or_state: teclado/foco dos consumidores do dismissible-layer
  category: accessibility/evidence-debt
  severity: low
  confidence: high (parcela aberta documentada pela própria task)
  evidence_status: historical
  current_status: PARTIALLY_FIXED
  human_decision_required: false
  runtime_revalidation_required: true (aquisição browser)
  dependencies: []
  duplicate_of: null
  supersedes: null
  notes: onda 2 planejada não executou

- finding_id: ATUX-015
  source: historical
  historical_reference: HIST-030 / TASK-AT-411
  surface: Escalas/Pausas/Avisos (overlays de agendamento)
  roles: [ADMIN, GESTOR, SAC]
  journey_or_state: parcelas de evidência browser de agendamento
  category: evidence-debt
  severity: low
  confidence: medium
  evidence_status: historical
  current_status: PARTIALLY_FIXED
  human_decision_required: false
  runtime_revalidation_required: true
  dependencies: [ATUX-007 relacionado]
  duplicate_of: null
  supersedes: null
  notes: UX-C04 prova que a parcela não cobria o branch vazio

- finding_id: ATUX-016
  source: historical
  historical_reference: HIST-024 / TASK-AT-312
  surface: a11y manual (web P0 + side panel)
  roles: []
  journey_or_state: parcelas NVDA/side-panel/zoom nunca executadas (prazo 2026-07-31 expirado)
  category: accessibility/manual-debt
  severity: low
  confidence: high (ausência de registro)
  evidence_status: historical
  current_status: PARTIALLY_FIXED
  human_decision_required: true (agendar ou aposentar como risco aceito)
  runtime_revalidation_required: n/a (manual)
  dependencies: []
  duplicate_of: null
  supersedes: null
  notes: exceção parcial: AT-457 executou Orca real no seu recorte

- finding_id: ATUX-017
  source: new
  historical_reference: HIST-005 (terminal bloqueado) + ATUX-R2
  surface: Performance (GESTOR/ADMIN desktop)
  roles: [GESTOR, ADMIN]
  journey_or_state: blocker de aquisição recorrente (3 audits)
  category: evidence-infrastructure/navigation-fixture
  severity: medium
  confidence: medium
  evidence_status: machine-signal (setup-incomplete x3) + advisory-captured-inspected (PNG mostra Dashboard GESTOR renderizado → login OK, falha no passo de navegação/terminal)
  current_status: BLOCKED (evidence acquisition)
  human_decision_required: false (owner Runtime Builder)
  runtime_revalidation_required: true
  dependencies: []
  duplicate_of: null
  supersedes: null
  notes: diagnóstico novo: falha está no open-navigation/terminal condition, não no setup de sessão

- finding_id: ATUX-018
  source: historical
  historical_reference: HIST-019 + matriz de estados A1/A2
  surface: todas (empty/error/destructive-confirm states)
  roles: []
  journey_or_state: 0 capturas de erro, 0 de confirmação destrutiva, 1 de vazio na história toda
  category: state-coverage
  severity: medium
  confidence: high (ausência sistemática documentada)
  evidence_status: historical
  current_status: UNASSESSED
  human_decision_required: false
  runtime_revalidation_required: true (aquisição dedicada; requer estados seedáveis)
  dependencies: []
  duplicate_of: null
  supersedes: null
  notes: exceção: Escalas GESTOR mobile vazio tem baseline (onda 1); cenário de desativação (confirmação) falhou na onda 1

- finding_id: ATUX-019
  source: new
  historical_reference: relacionado a HIST-015/ATUX-009
  surface: topbar (linha de atalhos)
  roles: [ADMIN, SAC, GESTOR]
  journey_or_state: chips cortados nas bordas sem affordance de scroll (390px ADMIN; 320px ambos)
  category: responsive/discoverability
  severity: low
  confidence: medium (visual claro; comportamento de scroll/foco não confirmado)
  evidence_status: advisory-captured-inspected (3 PNGs da onda 1; geometry passed → provável scroll por design)
  current_status: STILL_VALID (observação a confirmar)
  human_decision_required: false
  runtime_revalidation_required: true (confirmar scrollabilidade e acessibilidade por teclado dos chips fora da viewport)
  dependencies: []
  duplicate_of: null
  supersedes: null
  notes: consolidar com ATUX-009 na taskificação, se confirmado
```

**Contagem do registro: 19 findings acionáveis** — severity: critical 1 (ATUX-001) · high 1 (ATUX-005) · medium 8 (ATUX-002, 003, 004, 006, 007, 009, 013, 017, 018)* · low 8 (ATUX-008, 010, 011, 012, 014, 015, 016, 019). (*contagem medium inclui 018; ver linhas.)

## M. Recommended sequencing / dependency groups (sem criar tasks)

1. **Grupo A — decisões humanas primeiro (bloqueiam escopo)**: ATUX-001 (TASK-AT-454), ATUX-006 (TASK-AT-460), K.3/K.5/K.7. Nada no domínio comercial deve ser derivado antes de 454.
2. **Grupo B — fixes independentes já especificados (prontos para taskificação imediata)**: ATUX-004 (TASK-AT-458), ATUX-005 (TASK-AT-459), ATUX-007 (TASK-AT-461), ATUX-008 (TASK-AT-462) — tasks propostas já existem em docs/tasks; este audit apenas reconfirma vigência com evidência atual.
3. **Grupo C — revalidações pós-fix**: ATUX-002/003 (revalidação task-backed independente do 455/456).
4. **Grupo D — investigações de evidência**: ATUX-010 (isolamento unnamed-interactive), ATUX-011 (avaliação manual de tabelas), ATUX-017 (blocker de navegação Performance — Runtime Builder), ATUX-013 (triage E2E).
5. **Grupo E — débito de cobertura**: ATUX-014/015 (parcelas browser 405/411), ATUX-018 (estados vazio/erro/confirmação), ATUX-019 (confirmação topbar), companion apps (feasibility primeiro).
6. **Pré-requisito de ferramenta**: ATUX-012 (file step no harness) antes de qualquer fechamento visual de upload.

## N. Evidence index / provenance

**Artefatos canônicos (git-tracked)**
- `docs/tasks/UXREQ-ALWAYSTRACK-ACTIVE-AUDIT-20260902-001-ux-audit.md` (audit 1: UX-001..004, 13 bloqueados)
- `docs/tasks/UXREQ-ALWAYSTRACK-COMPLEMENTARY-AUDIT-20260903-001-ux-audit.md` (audit 2: UX-C01..C05, delta 13 terminais)
- `docs/tasks/TASK-AT-454..462` (taskificação; statuses verificados em 2026-09-03)
- `docs/testing/product-ux-final-readiness-gate-2026-08-06.md`, `product-ux-pilot-report-2026-08-05.md` (apenas boundaries operacionais)
- `docs/testing/e2e-critical-role-matrix.md` (claim 12/12 — conflito HIST-016), `visual-regression.md`, `TASK-AT-312-accessibility-evidence.md`

**Artefatos de reconstrução (git-ignored, transitórios)**
- `.tmp/ux-audit-2026-09-03/phase-A-historical-reconciliation.md` — registry HIST-001..033 completo com verificação file:line/commit por item
- `.tmp/ux-audit-2026-09-03/scenarios/wave-1-p0-scenarios.json`, `wave-2-p1-scenarios.json`

**Evidência advisory desta tarefa (git-ignored, same-request-only, fake, não promovível)**
- `test-results/product-ux/advisory/UXREQ-ALWAYSTRACK-REPO-WIDE-AUDIT-20260903-001/` — registro válido (17 cenários: 10 captured, 7 failed), commit `3088088a`, dirty autorizado, redaction applied, 2026-09-03T20:46Z
- `test-results/product-ux/advisory/UXREQ-ALWAYSTRACK-REPO-WIDE-AUDIT-20260903-002/` — **inválido**: interrompido sem registro; 2 PNGs órfãos (`admin-performance-desktop-retry2.png`, `gestor-performance-desktop-retry2.png`) NÃO consumidos; descarte pendente de decisão do owner (política de retenção advisory)

**InspectionRecords (inspeção feita pelo coordenador ZCode — method: actual-png-visual-inspection; PNGs abertos via ferramenta de imagem da engine; SHAs conforme registro advisory)**

| inspection_id | capture_id | acquisitionStatus | sha256 (prefixo) | escopo observado |
|---|---|---|---|---|
| COORD-INSP-001 | revalidate-455-sac-flows-mobile | captured | ce4fd549… | Fluxos SAC 390x844: nav compacta, grupo ativo como chip, conteúdo no 1º viewport |
| COORD-INSP-002 | revalidate-455-sac-nav-reopen-mobile | captured | ce4fd549… | mesmo estado pós-reabertura de nav |
| COORD-INSP-003 | revalidate-455-admin-users-mobile | captured | 6d0752ff… | Usuários ADMIN 390: nav compacta; chip "Como usar" cortado à direita na topbar |
| COORD-INSP-004 | revalidate-455-desktop-control | failed | 694f6244… | Dashboard ADMIN 1440 saudável — falha do cenário é terminal condition, não produto |
| COORD-INSP-005 | revalidate-456-settings-390 | captured | beb439f0… | Configurações 390 contida, sem clipping |
| COORD-INSP-006 | revalidate-456-settings-320 | captured | 97085d1b… | Configurações 320 contida |
| COORD-INSP-007 | topbar-320-users | captured | b9257b42… | 320: heading/filtros visíveis; tabela abaixo do fold; chip "C…" cortado |
| COORD-INSP-008 | topbar-320-sac-escalas | captured | b0359875… | 320: "erfil" cortado à esquerda; Escalas visível |
| COORD-INSP-009 | gestor-escalas-empty-mobile | captured | df9454f7… | Escalas GESTOR mobile: baseline pré-fix UX-C04; "Aguardando atualização" visível |
| COORD-INSP-010 | caseflow-backup-360-revalidate | captured | c2ef4267… | CaseFlow Backup 360: tabs quebradas em 2 linhas; geometry failed (registro) |
| COORD-INSP-011 | sac-performance-mobile | captured | 2f9e7560… | 1ª captura terminal Performance SAC mobile: Desempenho + filtros de data |
| COORD-INSP-012 | gestor-performance-desktop | failed | 21477834… | Dashboard GESTOR 1440 renderizado — login OK; falha em navegação/terminal |

Limitações da inspeção: PNG não prova teclado, leitor de tela, zoom, foco, comportamento de scroll; ambiente fake/loopback; evidência advisory é same-request-only (válida apenas para esta tarefa de audit) e tasks futuras devem readquirir task-backed.

## O. Input contract sugerido para a PRÓXIMA fase de reconciliação do Taskyfier

1. **Consumir**: este arquivo (seção L = registro acionável; seção M = grupos; seção K = decisões humanas) + `docs/tasks/TASK-AT-454..462` (tasks já propostas para ATUX-004/005/006/007/008) + Fase A em `.tmp/ux-audit-2026-09-03/phase-A-historical-reconciliation.md` (provenance detalhada; re-gerável se perdida).
2. **Não re-derivar** tasks para itens FIXED_AND_VERIFIED (HIST-004/014/022/027/028/031/032) nem SUPERSEDED (017/018/020/021).
3. **Regra de evidência**: nenhuma task pode fechar gate com a evidência advisory desta tarefa (same-request-only, fake); toda task de fix/revalidação readquire no lane pipeline task-backed.
4. **Bloqueios a respeitar**: ATUX-005 depende de ATUX-012 (file step no harness); domínio comercial (ATUX-001) depende da decisão TASK-AT-454; ATUX-017 é handoff para Runtime Builder, não task de produto.
5. **Decisões humanas** (K) devem virar gates de input humano nas tasks derivadas, não tarefas silenciosas.
6. **Higiene**: reconciliar `status: proposed` órfão em TASK-AT-449/450 e o descarte do diretório advisory `-002` (sem registro).

---

## Completion gate — métricas finais

- Superfícies/journeys identificados: **23** (mapa da seção D)
- Adequadamente avaliados: **12** · Parcialmente: **7** · Não avaliados/bloqueados: **4**
- Findings históricos reconciliados: **33** (HIST-001..033)
- Históricos ainda acionáveis: 10 STILL_VALID + 2 FIXED_NEEDS_REVALIDATION + 5 PARTIALLY_FIXED + 3 CURRENT_STATE_UNKNOWN + 2 EVIDENCE_INSUFFICIENT
- Históricos corrigidos e verificados: **7** · inválidos/obsoletos: **0** (4 SUPERSEDED)
- Novos findings deste ciclo: **2** (ATUX-R1→ATUX-019, ATUX-R2→ATUX-017) + 2 revalidações positivas (455/456)
- **Total de findings acionáveis atuais: 19** (registry L) — critical 1 · high 1 · medium 8 · low 8 (+1 medium/low borderline 018)
- Decisões humanas pendentes: **7** (seção K)
- Gaps de evidência/revalidação: seções H/I/J + colunas `runtime_revalidation_required` do registry
