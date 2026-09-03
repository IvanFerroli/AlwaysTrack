# UX AUDIT — AlwaysTrack, cobertura complementar e uploads

## 1. Modo aplicado

- request_id: `UXREQ-ALWAYSTRACK-COMPLEMENTARY-AUDIT-20260903-001`
- pipeline_mode: `advisory-audit`
- specialist: `olympus_product_ux`
- capability_mode: `audit`
- date: `2026-09-03`
- status: `audit-ready-with-partial-reproduction`
- evidence_origin: `product-ux-acquired`
- environment_classification: `fake`
- fonte de dados: seed sintético isolado; nenhum ambiente live, PII, credencial ou provider externo foi usado.
- independência: este parecer não implementa, não taskifica e não aprova as próprias recomendações. Aceite permanece com autoridade humana e/ou Task Verifier independente.

## 2. Artefato primário

- artifact_type: `ux-audit`
- objetivo único: auditar o delta da auditoria anterior, readquirir os terminais antes bloqueados e inventariar uploads/anexos ativos, incluindo a hipótese de oferecer drag-and-drop de arquivos além do picker.
- destino explícito autorizado: `docs/tasks/UXREQ-ALWAYSTRACK-COMPLEMENTARY-AUDIT-20260903-001-ux-audit.md`
- fora de escopo: implementação, redesign, alteração de código/baseline, atualização de estado do pipeline, taskificação, aceite, uso de ambiente live e reabertura de `TASK-AT-455`, `TASK-AT-456` ou `TASK-AT-457` sem regressão nova.

## 3. Leitura do pedido e fontes

### Problema e resultado esperado

- usuário/job: autores e moderadores precisam inserir imagens em conteúdo operacional; gestores e administradores precisam alcançar superfícies críticas em desktop/mobile; usuários de teclado e tecnologia assistiva precisam receber nomes, relações e recuperação observáveis.
- problema declarado: completar lacunas de reprodução da auditoria anterior, cobrir superfícies antes parciais e avaliar upload/anexos em todas as superfícies aplicáveis.
- resultado esperado: findings reproduzíveis e deduplicados, com limitações explícitas, test hooks e separação entre fato observado e intenção ainda não decidida.
- autoridade da intenção: o handoff autoriza a auditoria; o pedido de drag-and-drop é hipótese de intenção, não contrato de produto aceito.

| Fonte | Classificação | Autoridade | Observação |
|---|---|---|---|
| Handoff do Orchestrator para este request | alvo | autoridade de escopo | Define audit advisory, segurança, prioridades, destino e proibições. |
| `docs/tasks/UXREQ-ALWAYSTRACK-ACTIVE-AUDIT-20260902-001-ux-audit.md` | atual/complementar | audit anterior | Baseline de 17/30 capturados, 13 bloqueados e findings UX-001..004. |
| `docs/tasks/TASK-AT-454-commercial-roles-product-decision-gate.md` | atual | gate humano aberto | Destino de papéis comerciais continua sem decisão; não foi reavaliado. |
| `docs/tasks/TASK-AT-455-mobile-navigation-first-viewport.md` | atual | task concluída com risco | Finding principal foi implementado; registra dois resíduos preexistentes de topbar em 320/360. |
| `docs/tasks/TASK-AT-456-settings-mobile-overflow.md` e `TASK-AT-457-markdown-checklist-accessible-semantics.md` | atual | tasks concluídas | Não reabrir sem regressão nova. Geometria de Configurações passou e os testes focais de Markdown passaram. |
| `docs/tasks/TASK-AT-101-rich-image-attachments-across-content.md` | alvo vigente | contrato de upload concluído em MVP | Exige mecanismo compartilhado, tipos/limites e comportamento de erro; não exige drag-and-drop. |
| `docs/tasks/TASK-AT-131-service-flow-rich-wiki-editor.md` e `TASK-AT-151-generic-operational-attachments.md` | alvo vigente | contratos concluídos | Estendem imagens a Fluxos e consolidam backend/lifecycle; não especificam affordance de drop. |
| `docs/tasks/TASK-AT-153-script-library-pack-drag-drop-versioning.md` | não relacionado | task de outra interação | Trata reordenação de scripts, não upload de arquivo; não é duplicata do pedido atual. |
| `apps/web/src/components/markdown-editor.tsx`, views consumidoras e `styles.css` | atual | fonte estrutural | Define o picker compartilhado, loading e semântica atual. |
| Runtime local isolado + record advisory validado | atual | evidência observada | Chromium, loopback, SQLite temporário e seed sintético. |
| Pedido de avaliar drag-and-drop de arquivo | intenção | hipótese humana | Sustenta investigação e uma decisão; não sustenta obrigatoriedade de implementação. |

Classificação do inventário de upload:

- ativo/compartilhado: `MarkdownEditor` em Wiki, FAQ, Fluxos, Scriptoteca e Avisos;
- ativo, mas independente e condicionado por decisões existentes: upload de DANFE em Notas/Vendas; não foi elevado porque o destino comercial depende de `TASK-AT-454`;
- estrutural/inativo na IA atual: importação CSV de profissionais/licenças;
- legado/condicional: upload público de licença por token;
- excluído do conceito de upload: drag-and-drop de reordenação de scripts de `TASK-AT-153`.

## 4. Gates de Product UX

| Gate | Estado | Justificativa |
|---|---|---|
| intenção | `passed-with-human-decision-pending` | Problema e jobs estão claros; somente a adoção de drag-and-drop exige decisão humana. |
| reprodução | `partial` | 18/30 cenários capturados; 12 falharam. Dos 13 bloqueados anteriores, 11 agora chegaram ao terminal e os dois de Performance continuam bloqueados. |
| evidência | `passed-for-safe-claims` | O record foi validado e todos os 18 PNGs capturados foram abertos; claims não reproduzidos ficaram explicitamente inseguros. |
| escopo | `passed` | Um único artefato primário, sem implementação, taskificação, baseline ou aceite. |
| independência | `passed` | Audit consultivo; validação/aceite posteriores pertencem a outro papel. |

Envelope fail-closed da parcela não reproduzida:

```text
status: BLOCKED
code: UX_REPRODUCTION_BLOCKED
failed_gate: reproduction
cause.status: VISUAL_ACQUISITION_BLOCKED
known_facts: o validator aceitou o record; 18/30 cenários foram capturados; 12 falharam; 11/13 terminais antes bloqueados foram recuperados; Performance GESTOR e SAC continuam sem terminal; mobile/touch e estados de arquivo não foram adquiridos
missing_input: setup de sessão/seed determinístico para os 12 alvos falhos e suporte allowlisted do harness a seleção/drop de arquivo sintético, mantendo o mesmo contrato local/fake
safe_progress: análise dos 18 PNGs abertos, DOM/fonte atual, documentação vigente e testes focais existentes
unsafe_claims: aparência/comportamento de Performance; upload mobile/touch; drag-over/drop; inválido por tipo/tamanho; múltiplos arquivos; progresso real; erro/recuperação renderizados
resume_from: readquirir somente os 12 cenários falhos em request ativo, com sessão isolada e steps de arquivo suportados; não reutilizar nem promover este record
```

## 5. Matriz de alvo e reprodução

### Delta dos 13 terminais bloqueados no audit anterior

| Surface | Role | State | Setup steps | Navigation steps | Viewport | Resultado |
|---|---|---|---|---|---|---|
| Escalas | GESTOR | sem equipe selecionada | login GESTOR | `/escalas`; aguardar `Escalas` | 1440x900 | `captured`; terminal recuperado |
| Pausas | GESTOR | gestão | login GESTOR | `/pausas`; aguardar `Pausas e cobertura` | 1440x900 | `captured`; terminal recuperado |
| Performance | GESTOR | gestão/sucesso | login GESTOR | SAC > Performance; aguardar `Desempenho` | 1440x900 | `blocked`; permaneceu `/` |
| Performance | SAC | leitura/sucesso | login SAC | SAC > Performance; aguardar tabela histórica | 390x844 | `blocked`; permaneceu `/` |
| Campanhas | GESTOR | gestão/sucesso | login GESTOR | `/campanhas`; aguardar `Criar campanha` | 1440x900 | `captured`; terminal recuperado |
| Avisos | ADMIN | gestão/sucesso | login ADMIN | `/avisos`; aguardar `Avisos recorrentes` | 1440x900 | `captured`; terminal recuperado |
| Fluxos | GESTOR | gestão/sucesso | login GESTOR | `/fluxos`; aguardar `Novo fluxo de atendimento` | 1440x900 | `captured`; terminal recuperado |
| Scriptoteca | GESTOR | gestão/sucesso | login GESTOR | `/scriptoteca` > Gestão; aguardar `Melhorias de script` | 1440x900 | `captured`; terminal recuperado |
| Wiki | GESTOR | contribuição/sucesso | login GESTOR | `/wiki`; aguardar `Sugerir alteracao` | 1440x900 | `captured`; terminal recuperado em `/wiki/conferencia-de-danfe` |
| FAQ | GESTOR | moderação/sucesso | login GESTOR | `/faq`; aguardar `Responder` | 1440x900 | `captured`; terminal recuperado |
| Auditoria | ADMIN | sucesso | login ADMIN | Administração > Auditoria; aguardar `Auditoria` | 1440x900 | `captured`; terminal recuperado |
| Status CaseFlow | GESTOR | monitoramento/sucesso | login GESTOR | Administração > Status CaseFlow; aguardar `Saúde operacional` | 1440x900 | `captured`; terminal recuperado |
| CaseFlow Admin/Conectores | ADMIN | default | login ADMIN | Administração > CaseFlow Admin > Conectores | 1440x900 | `captured`; terminal recuperado |

### Upload/anexos e superfícies de risco

| Surface | Role | State | Setup steps | Navigation steps | Viewport | Resultado |
|---|---|---|---|---|---|---|
| Wiki/editor de imagem | ADMIN | criação/default | login ADMIN | `/wiki`; localizar `Imagem` | 1440x900/full page | `captured` |
| Wiki/editor de imagem | ADMIN | criação/default | login ADMIN | `/wiki`; localizar `Imagem` | 390x844 | `blocked` |
| FAQ/editor de imagem | SAC | criação/default | login SAC | `/faq`; localizar `Imagem` | 1440x900 e 390x844 | `blocked` nos dois |
| FAQ/editor de resposta | GESTOR | moderação/default | login GESTOR | `/faq`; localizar `Imagem` | 1440x900/full page | `captured` |
| Fluxos/editor de imagem | ADMIN | criação/default | login ADMIN | `/fluxos`; localizar `Imagem` | 1440x900 e 390x844 | `blocked` nos dois |
| Fluxos/script pessoal | SAC | contribuição/default | login SAC | `/fluxos`; localizar `Imagem` | 1440x900/full page | `captured` |
| Scriptoteca/editor de imagem | ADMIN | sugestão/default | login ADMIN | `/scriptoteca` > Gestão; localizar `Imagem` | 1440x900 e 390x844 | `blocked` nos dois |
| Scriptoteca/gestão | GESTOR | gestão/sucesso | login GESTOR | `/scriptoteca` > Gestão | 1440x900 | `captured`; affordance `Imagem` inspecionado |
| Avisos/editor de imagem | ADMIN | criação/default | login ADMIN | `/avisos`; localizar `Imagem` | 1440x900 e 390x844 | `blocked` nos cenários dedicados; captura geral desktop inspecionada |
| Dashboard | SAC | sucesso | login SAC | aguardar `Overlap das pausas` | 390x844 | `blocked` |
| Usuários/Times | ADMIN | sucesso/primeiro viewport | login ADMIN | abrir navegação; aguardar `Usuários/Times` | 320x700 | `captured`; residual conhecido de topbar |
| Configurações | ADMIN | regressão | login ADMIN | abrir navegação; aguardar `Configurações` | 320x700 | `captured`; geometria passou, sem reabrir AT-456 |
| CaseFlow Admin/Backup | ADMIN | default | login ADMIN | abrir navegação > Backup; aguardar `Restore aditivo` | 360x800 | `captured`; geometria falhou |
| Login | ANONYMOUS | foco de teclado em senha | sem login | `/`; Tab até `Senha` | 320x700 | `captured`; foco visível observado |

Cobertura nova versus anterior:

- 11 dos 13 terminais antes bloqueados foram recuperados;
- todos os cinco consumidores ativos do editor compartilhado tiveram ao menos uma captura desktop aberta, diretamente ou na captura geral da superfície;
- nenhum cenário mobile de upload chegou ao terminal;
- nenhum arquivo foi realmente selecionado ou solto, porque o harness advisory atual não possui step allowlisted para file picker/drop;
- Performance permanece totalmente fora do gate visual desta auditoria.

## 6. Evidência adquirida e classe

- advisory_capture_record: `test-results/product-ux/advisory/UXREQ-ALWAYSTRACK-COMPLEMENTARY-AUDIT-20260903-001/advisory-capture-record.json`
- captured_at: `2026-09-03T17:24:23.475Z`
- source_revision: `39ed15f4e25ce600ca86e47c226afd2fb4ecaaee`, worktree dirty autorizado.
- ambiente: `fake`, `product-ux-isolated-e2e`, loopback, seed sintético e banco temporário.
- navegador: Chromium do Playwright.
- resultado de aquisição: `ADVISORY_ACQUISITION_BLOCKED`, 18 capturados e 12 falhos.
- validação obrigatória: `validate-advisory-capture.mjs` retornou `valid-advisory-record`, com `same-request-only`, `reusable=false`, `promotable=false` e `gateClosureAllowed=false`.
- política de retenção: transitória; owner `UXREQ-ALWAYSTRACK-COMPLEMENTARY-AUDIT-20260903-001`; descarte quando o request for fechado. Não copiar, promover ou adaptar para manifesto/evidência canônica.
- redaction: aplicada pelo harness; credenciais, logs brutos, storage state e snapshots ARIA/DOM brutos não foram persistidos; 56 regiões com aparência sensível foram mascaradas nas capturas aplicáveis.
- nenhum Task ID, Execution ID, Evidence ID ou manifesto canônico foi criado.

### InspectionRecords

Todos os PNGs marcados `captured` foram abertos no arquivo real com `detail=original`. Os PNGs de cenários falhos não sustentam claims visuais.

| Inspection ID | Capture ID | Artifact | SHA-256 | Inspected at | Inspector | Method | Scope | Finding refs | Limitações |
|---|---|---|---|---|---|---|---|---|---|
| INS-C001 | gestor-schedules-desktop-retry | `screenshots/gestor-schedules-desktop-retry.png` | `15474f7d893b30ea20fb560381f55bf8feab1b807eecd3d90c7cc251cd475836` | 2026-09-03T14:29:35-03:00 | olympus_product_ux | actual-png-visual-inspection | aba ativa e estado sem equipe | UX-C04 | um viewport desktop |
| INS-C002 | gestor-pauses-desktop-retry | `screenshots/gestor-pauses-desktop-retry.png` | `c32a3dbc3693879c02db4e0ed9cf2811844369d4d689a302f335b53368ad0432` | 2026-09-03T14:29:35-03:00 | olympus_product_ux | actual-png-visual-inspection | terminal de Pausas | — | não cobre interação |
| INS-C003 | gestor-campaigns-desktop-retry | `screenshots/gestor-campaigns-desktop-retry.png` | `d4a5f9b40ef6fa9a3ad204e78771eb4d731f6a22fa00ef3c3bd0bcbe1ede4ec5` | 2026-09-03T14:29:35-03:00 | olympus_product_ux | actual-png-visual-inspection | terminal de Campanhas | — | não cobre submit |
| INS-C004 | admin-announcements-desktop-retry | `screenshots/admin-announcements-desktop-retry.png` | `1ac5004166e13af09cc99aebe52aed3ce35e8d56adc4de489b4484b62119b049` | 2026-09-03T14:29:35-03:00 | olympus_product_ux | actual-png-visual-inspection | Avisos e editor | UX-C01/02/03 | não seleciona arquivo |
| INS-C005 | gestor-flows-desktop-retry | `screenshots/gestor-flows-desktop-retry.png` | `bea4ba25c0fd6da9ce0b104834bf7d368f41909c8ce55de0c8b6c54b76c65c30` | 2026-09-03T14:29:35-03:00 | olympus_product_ux | actual-png-visual-inspection | Fluxos e editores | UX-C01/02/03 | não seleciona arquivo |
| INS-C006 | gestor-script-library-desktop-retry | `screenshots/gestor-script-library-desktop-retry.png` | `3870580bcc2e59c0f86a98f57adc4967b0d028304a1852d9642ddaf40545e4d2` | 2026-09-03T14:29:35-03:00 | olympus_product_ux | actual-png-visual-inspection | Scriptoteca gestão/editor | UX-C01/02/03 | não seleciona arquivo |
| INS-C007 | gestor-wiki-desktop-retry | `screenshots/gestor-wiki-desktop-retry.png` | `04d3546c3f1f123d93dc11bb663e70d38757ef1b627afd0b8cc9e6cec9d20809` | 2026-09-03T14:29:35-03:00 | olympus_product_ux | actual-png-visual-inspection | Wiki contribuição/editor | UX-C01/02/03 | não seleciona arquivo |
| INS-C008 | gestor-faq-desktop-retry | `screenshots/gestor-faq-desktop-retry.png` | `2cf94e2064badbe1d54b3c2e989b5b8e9fb47b50a6e3f44964aaf8a53edb70f0` | 2026-09-03T14:29:35-03:00 | olympus_product_ux | actual-png-visual-inspection | FAQ moderação/editor | UX-C01/02/03 | não seleciona arquivo |
| INS-C009 | admin-audit-desktop-retry | `screenshots/admin-audit-desktop-retry.png` | `fc8e5e8ab5b1bc3f964aa689097d3e34398274e0d352f19e458fd387c02a516d` | 2026-09-03T14:29:35-03:00 | olympus_product_ux | actual-png-visual-inspection | terminal de Auditoria | — | conteúdo sensível-looking mascarado |
| INS-C010 | gestor-caseflow-health-desktop-retry | `screenshots/gestor-caseflow-health-desktop-retry.png` | `47b7d5f9e1653d7509c56cd34a57fe041256b7cd5549f02c6072d9848eab3575` | 2026-09-03T14:29:35-03:00 | olympus_product_ux | actual-png-visual-inspection | terminal Status CaseFlow | — | estado sintético vazio |
| INS-C011 | admin-caseflow-connectors-desktop-retry | `screenshots/admin-caseflow-connectors-desktop-retry.png` | `c209bf58314d2e532844e18cd4690939a0dc7a7c5d9d24255416039f5337256b` | 2026-09-03T14:29:35-03:00 | olympus_product_ux | actual-png-visual-inspection | terminal Conectores | — | estado sintético vazio |
| INS-C012 | wiki-image-picker-admin-desktop | `screenshots/wiki-image-picker-admin-desktop.png` | `b2c6857c1b978fdbf7677c094256a15efb4fb5aab7ddd47d3214b4b6172eb585` | 2026-09-03T14:29:35-03:00 | olympus_product_ux | actual-png-visual-inspection | full page de editores Wiki | UX-C01/02/03 | captura alta; claims limitados ao affordance |
| INS-C013 | admin-users-first-viewport-320 | `screenshots/admin-users-first-viewport-320.png` | `b9257b422ba4344eeb72bc115c81252709e58e8abbdb40dca2810f274b601c0a` | 2026-09-03T14:29:35-03:00 | olympus_product_ux | actual-png-visual-inspection | primeiro viewport 320 | dedupe AT-455 | 15 regiões mascaradas |
| INS-C014 | admin-settings-regression-320 | `screenshots/admin-settings-regression-320.png` | `97085d1b92b2a89348586d989be09ea54e5bf37eb60e7c14128a6c440f50e50b` | 2026-09-03T14:29:35-03:00 | olympus_product_ux | actual-png-visual-inspection | regressão geométrica 320 | dedupe AT-456 | primeiro viewport apenas |
| INS-C015 | caseflow-backup-mobile-360 | `screenshots/caseflow-backup-mobile-360.png` | `c2ef4267aeb539185dcc886b32c2e35dc7baa66943551e0e8b5faaa187efb476` | 2026-09-03T14:29:35-03:00 | olympus_product_ux | actual-png-visual-inspection | topbar e início de Backup | UX-C05 | um viewport, sem zoom |
| INS-C016 | login-password-focus-mobile | `screenshots/login-password-focus-mobile.png` | `98b7ece83711e364148d01924be05468c7c4484175533db2a3e40859f4054aae` | 2026-09-03T14:29:35-03:00 | olympus_product_ux | actual-png-visual-inspection | foco visível no campo Senha | — | foco parcial, não jornada completa |
| INS-C017 | faq-image-picker-gestor-desktop | `screenshots/faq-image-picker-gestor-desktop.png` | `f211140222705f1ac501a4a9335026c78362ab60f77cf58721928650eafc6e15` | 2026-09-03T14:29:35-03:00 | olympus_product_ux | actual-png-visual-inspection | full page de editores FAQ | UX-C01/02/03 | captura alta; não seleciona arquivo |
| INS-C018 | flows-image-picker-sac-desktop | `screenshots/flows-image-picker-sac-desktop.png` | `59030ccbf425e28218adad8224f12c4f489e1a010bb1ebd82d23dec874aca658` | 2026-09-03T14:29:35-03:00 | olympus_product_ux | actual-png-visual-inspection | full page do script pessoal | UX-C01/02/03 | captura alta; não seleciona arquivo |

## 7. Findings

### Resumo priorizado

| Finding | Impacto | Severidade | Confiança | Evidência | Decisão humana |
|---|---|---|---|---|---|
| UX-C01 — input de arquivo compartilhado cria controle sem nome | navegação por teclado/AT recebe parada invisível sem propósito | medium | high | INS-C004–008/012/017/018 + browser DOM + fonte | não |
| UX-C02 — falha de upload não tem feedback nem recuperação local | upload pode falhar e o autor fica sem causa, estado ou retry | high | medium | fonte + contrato AT-101 + lacuna de teste; visual de erro bloqueado | não |
| UX-C03 — editor oferece somente picker; drop é alvo não decidido | eficiência/descoberta do upload depende de escolha de produto | low | high para ausência; alvo pendente | INS-C004–008/012/017/018 + fonte | sim |
| UX-C04 — aba ativa de Escalas controla painel inexistente no vazio | relação de tab/panel fica inválida para AT no estado inicial do gestor | medium | high | INS-C001 + browser accessibility signal + fonte | não |
| UX-C05 — topbar de CaseFlow Backup ainda corta controles em 360px | controle do cabeçalho fica parcialmente fora do viewport | medium | high | INS-C015 + geometry check + risco registrado em AT-455 | não; dedupe obrigatório |

### UX-C01 — input de arquivo compartilhado cria controle sem nome

- usuário/job afetado: autor ou moderador que usa teclado/leitor de tela para inserir uma imagem no conteúdo.
- esperado e claim_kind: `documented-fact`. Um único affordance identificável deve abrir o picker; controles interativos adicionais precisam de nome e foco coerente.
- observado e claim_kind: `observed-fact`. O `MarkdownEditor` renderiza o botão nomeado `Imagem` e, ao lado, um `input[type=file]` sem `label`, `aria-label` ou retirada explícita da ordem de tabulação. A classe o reduz a 1px e usa `opacity:0`, mas não remove o foco de teclado. O browser reportou `unnamed-interactive` em todas as capturas com editores renderizados: Avisos 1, Fluxos 3, Scriptoteca 2, Wiki 2/6, FAQ 3 e Fluxos SAC 1.
- surface: Wiki, FAQ, Avisos, Fluxos e Scriptoteca via `MarkdownEditor` compartilhado.
- role: ADMIN, GESTOR e SAC conforme a permissão da superfície.
- state: criação, sugestão, edição ou resposta com toolbar visível.
- setup steps: login sintético na role permitida.
- navigation steps: abrir a superfície e localizar o botão `Imagem`.
- viewport: desktop 1440x900; comportamento mobile não reproduzido.
- evidência e tipo: INS-C004–008, INS-C012, INS-C017, INS-C018; sinal DOM/browser `unnamed-interactive`; `apps/web/src/components/markdown-editor.tsx:381-392`; `apps/web/src/styles.css:4845-4852`.
- impacto: adiciona uma parada invisível/sem propósito e duplica a operação já exposta pelo botão, degradando previsibilidade de foco e nome acessível.
- severidade: `medium`.
- confiança: `high` para a semântica atual; tecnologia assistiva real não foi executada.
- recomendação: manter um único gatilho acessível e nomeado para o picker. Se o input nativo continuar programaticamente acionado pelo botão, retirá-lo do percurso de foco/árvore conforme o padrão seguro do produto; alternativamente, usar associação explícita de label sem criar controles duplicados.
- acceptance/test hook: com `onUploadImage` habilitado, percorrer a toolbar por Tab não alcança controle invisível/sem nome; o gatilho `Adicionar imagem`/`Imagem` é acionável por teclado; o check automatizado retorna zero `unnamed-interactive` atribuível ao editor; cancelamento do diálogo devolve foco coerente.
- decisão humana pendente: não.
- limitações da evidência: o diálogo nativo e leitor de tela não foram exercitados; a recomendação não prescreve markup específico.

### UX-C02 — falha de upload não tem feedback nem recuperação local

- usuário/job afetado: autor que seleciona arquivo inválido, excede tamanho ou encontra erro de backend/rede ao inserir imagem.
- esperado e claim_kind: `documented-fact`. `TASK-AT-101` exige definir tipos, limites e comportamento de erro; o usuário deve entender a falha e conseguir tentar novamente sem perder o conteúdo.
- observado e claim_kind: `documented-fact` estrutural. `uploadImage` usa `try/finally`, encerra `Enviando...` e limpa o input, mas não captura a rejeição nem renderiza mensagem contextual/status/alert. O teste de Wiki cobre apenas upload resolvido; não há teste focal de rejeição/recuperação no editor compartilhado.
- surface: Wiki, FAQ, Avisos, Fluxos e Scriptoteca.
- role: ADMIN, GESTOR e SAC conforme permissão.
- state: loading/error/retry de upload.
- setup steps: editor com `onUploadImage`; arquivo sintético válido ou inválido.
- navigation steps: selecionar arquivo e simular rejeição 4xx/5xx ou da promise de upload.
- viewport: estrutural, não visual; aparência desktop/mobile de erro permaneceu bloqueada.
- evidência e tipo: `apps/web/src/components/markdown-editor.tsx:293-314`; `TASK-AT-101:22-27`; `apps/web/test/wiki.test.tsx:50-70`; ausência de estado de erro no componente. INS-C004–008/012/017/018 apenas contextualizam a superfície, não provam o erro renderizado.
- impacto: a operação pode falhar sem causa, confirmação de que nada foi inserido ou retry explícito; isso bloqueia o job de enriquecer conteúdo quando a infraestrutura ou validação recusa o arquivo.
- severidade: `high`.
- confiança: `medium`, porque a ramificação de erro foi inferida da fonte e não reproduzida no browser.
- recomendação: adicionar estado de erro contextual e anunciado, preservar texto/seleção do editor, encerrar loading e permitir retry seguro. Diferenciar pelo menos tipo/tamanho inválido de falha transitória quando o contrato da API expuser essa distinção.
- acceptance/test hook: testes sintéticos para tipo inválido, tamanho excedido, 4xx/5xx e retry; em cada caso o botão deixa de ficar ocupado, mensagem visível e anunciada explica a ação possível, conteúdo não muda, input pode selecionar novamente o mesmo arquivo e uma tentativa posterior bem-sucedida insere o Markdown uma vez.
- decisão humana pendente: não para recuperação; microcopy final pode usar o padrão ativo do produto.
- limitações da evidência: não foi determinado aqui onde a validação de tamanho/tipo ocorre no backend; não alegar ausência de segurança de upload.

### UX-C03 — editor oferece somente picker; drop é alvo não decidido

- usuário/job afetado: autor em desktop que já possui um arquivo e procura uma forma direta de inseri-lo no editor; usuário mobile/touch que depende de fallback por botão.
- esperado e claim_kind: `human-decision-pending`. O pedido sugere um modelo híbrido picker + drag-and-drop, mas os contratos aceitos não tornam drop obrigatório.
- observado e claim_kind: `observed-fact`. Nos cinco consumidores ativos há botão `Imagem`; não há affordance visível de área de drop, estado drag-over ou handlers de drag/drop no `MarkdownEditor`. O input aceita um arquivo por vez e não declara `multiple`.
- surface: Wiki, FAQ, Avisos, Fluxos e Scriptoteca.
- role: ADMIN, GESTOR e SAC conforme permissão.
- state: default; drag-over/drop/invalid/multiple não existem ou não foram exercitados.
- setup steps: editor ativo com permissão de upload.
- navigation steps: abrir criação/edição/resposta e observar toolbar; inspeção estrutural do componente compartilhado.
- viewport: desktop 1440x900; mobile/touch bloqueado.
- evidência e tipo: INS-C004–008, INS-C012, INS-C017, INS-C018; `apps/web/src/components/markdown-editor.tsx:381-392`; busca estrutural sem handlers de drop no componente.
- impacto: o job continua possível via picker, portanto não é bloqueio; a oportunidade é de eficiência/descoberta para desktop. Drag-and-drop não substitui a operação por teclado/touch.
- severidade: `low`.
- confiança: `high` para a ausência atual; nenhuma conclusão sobre preferência/valor de usuário foi medida.
- recomendação: Product Owner escolher e documentar `picker-only` ou `hybrid picker + drop`. Somente se `hybrid` for aceito, especificar uma área/estado de drop reutilizável no componente compartilhado, mantendo o botão como fallback universal.
- acceptance/test hook: se `hybrid`: affordance explícito, feedback drag-over, um arquivo válido inserido uma vez, inválido/tamanho/múltiplos tratados, progresso/erro/retry anunciados, botão e teclado preservados, toque/mobile sem dependência de gesto de arrastar. Se `picker-only`: decisão documentada e o botão/erro/foco dos UX-C01/C02 resolvidos.
- decisão humana pendente: sim; autoridade necessária: Product Owner/Design owner.
- limitações da evidência: não houve teste de usabilidade nem drag real; não converter esta hipótese diretamente em task de implementação.

### UX-C04 — aba ativa de Escalas controla painel inexistente no estado sem equipe

- usuário/job afetado: gestor que abre Escalas antes de selecionar equipe, especialmente com tecnologia assistiva.
- esperado e claim_kind: `documented-fact`. A aba selecionada deve controlar um elemento existente com `role=tabpanel`, inclusive quando o painel mostra loading/empty/error.
- observado e claim_kind: `observed-fact`. `Cobertura` aparece selecionada enquanto o browser reporta `active-aria-controls-missing:1`. A fonte atribui `aria-controls="support-schedules-${key}-panel"` a todas as tabs, mas no ramo `canManage && !teamId` renderiza `OperationalState` fora de qualquer painel; os painéis só aparecem no ramo com `calendar`.
- surface: Escalas.
- role: GESTOR.
- state: default, sem equipe selecionada.
- setup steps: login GESTOR com seed sintético, nenhuma equipe pré-selecionada.
- navigation steps: `/escalas`; aguardar heading `Escalas`.
- viewport: 1440x900.
- evidência e tipo: INS-C001; sinal browser `active-aria-controls-missing:1`; `apps/web/src/views/support-schedules.tsx:857-905`.
- impacto: a relação semântica anuncia um alvo inexistente exatamente no estado inicial em que a pessoa precisa entender por que não há cobertura.
- severidade: `medium`.
- confiança: `high`.
- recomendação: manter o estado vazio/loading/error dentro do tabpanel ativo ou adiar a exposição do tablist até haver painéis coerentes, preservando o padrão de tabs existente.
- acceptance/test hook: para GESTOR sem equipe, existe exatamente uma aba selecionada e `document.getElementById(activeTab.ariaControls)` resolve para um `role=tabpanel` nomeado pela aba; após selecionar equipe e alternar tabs, relação, foco por setas e conteúdo continuam coerentes; check `active-aria-controls-missing` fica zero.
- decisão humana pendente: não.
- limitações da evidência: não houve NVDA/VoiceOver/Orca; outros estados de erro/loading de Escalas precisam de teste de regressão.

### UX-C05 — topbar de CaseFlow Backup ainda corta controles em 360px

- usuário/job afetado: administrador que acessa Backup do CaseFlow em viewport estreito.
- esperado e claim_kind: `documented-fact`. Shell, topbar, abas e controles devem permanecer dentro do viewport ou reflowar sem recorte.
- observado e claim_kind: `observed-fact`. Em 360x800, a captura mostra o conjunto do cabeçalho cortado na borda direita; o check de geometria falhou. `TASK-AT-455` já documentou exatamente um overflow preexistente de 3px nessa superfície e o deixou fora de seu escopo.
- surface: CaseFlow Admin > Backup.
- role: ADMIN.
- state: default.
- setup steps: login ADMIN sintético.
- navigation steps: abrir Administração > CaseFlow Admin > Backup; aguardar `Restore aditivo`.
- viewport: 360x800.
- evidência e tipo: INS-C015; geometry status `failed`; `docs/tasks/TASK-AT-455-mobile-navigation-first-viewport.md:72-80`.
- impacto: parte dos controles do topbar fica visualmente truncada e pode induzir scroll horizontal/acionamento impreciso.
- severidade: `medium`.
- confiança: `high`.
- recomendação: tratar como task separada do escopo de navegação lateral de AT-455; ajustar o reflow/containment da topbar para 360px sem alterar o contrato de Backup.
- acceptance/test hook: em 360x800, `documentElement.scrollWidth <= documentElement.clientWidth`; topbar, conta, atalhos, tabs e ações permanecem integralmente dentro do viewport; checks `overflow` e `controls-inside-viewport` passam; screenshot task-backed é aberto por revisor independente.
- decisão humana pendente: não, desde que Taskyfier confirme que não existe task residual equivalente.
- limitações da evidência: um viewport e Chromium; zoom 200%, landscape, target size e toque real não foram exercitados.

### Dedupe preliminar

| Sinal/candidato | Relação existente | Tratamento |
|---|---|---|
| UX-C01 input file sem nome | `TASK-AT-457` cobre somente checklist Markdown | não é duplicata; task nova pode focar o `MarkdownEditor` compartilhado. |
| UX-C02 erro de upload | requisito residual do `TASK-AT-101` concluído em MVP; `TASK-AT-151` cobre backend/lifecycle | não reabrir 101/151; materializar apenas delta de feedback/recuperação após busca final. |
| UX-C03 file drag-and-drop | `TASK-AT-153` é reordenação de scripts; `TASK-AT-130` menciona editor visual de fluxo | não são duplicatas; não taskificar implementação antes da decisão picker-only/hybrid. |
| UX-C04 relação tab/panel de Escalas | nenhum equivalente localizado | candidato novo e localizado. |
| UX-C05 overflow CaseFlow 360 | risco residual explícito de `TASK-AT-455` | não reabrir AT-455 nem chamar de regressão; criar task separada somente se backlog não tiver equivalente. |
| Usuários/Times 320 com conteúdo abaixo da dobra | risco residual explícito de `TASK-AT-455:79` | não é finding novo; carregar como dedupe hint para eventual decisão futura. |
| Configurações 320 | `TASK-AT-456` | geometria passou; nenhuma regressão reproduzida, não reabrir. |
| checklists Markdown | `TASK-AT-457` | testes focais passaram; nenhuma regressão reproduzida, não reabrir. |
| `table-header-without-scope` em Auditoria/Usuários/Configurações | já registrado como `manual-needed` no audit anterior | sinal não basta para afirmar falha em tabelas simples; não elevar sem avaliação manual. |
| papéis comerciais e uploads de DANFE | `TASK-AT-454` | continuam subordinados à decisão humana; não taskificar UX de upload comercial agora. |

## 8. Acessibilidade e estados

### Matriz de estados de upload compartilhado

| Estado | Aplicável | Observado | Lacuna | Recuperação esperada |
|---|---|---|---|---|
| default/picker | sim | botão `Imagem` em todos os cinco consumidores ativos | input nativo sem nome/foco coerente | um único gatilho acessível |
| drag-over/drop | hipótese | não existe no componente | alvo depende de decisão humana | se aceito, feedback claro e fallback por botão |
| invalid-type | sim | `accept` lista PNG/JPEG/WebP | não exercitado; `accept` não prova validação/feedback | erro contextual e retry |
| invalid-size | sim | contrato AT-101 exige limite | não exercitado e limite não aparece no componente | erro contextual antes/depois da API conforme contrato |
| multiple | potencial | input não usa `multiple`; handler lê somente `[0]` | intenção de múltiplos não documentada | não inventar suporte; explicar/rejeitar lote se ocorrer |
| loading/progresso | sim | botão muda para `Enviando...` e fica disabled | sem captura durante upload; sem progresso determinado/aria-live explícito | estado ocupado perceptível e anunciado |
| error | sim | nenhum estado local no editor | visual e runtime bloqueados | mensagem associada, foco/conteúdo preservados |
| retry/recovery | sim | input é limpo no `finally` | comportamento após rejeição não testado | selecionar novamente, sucesso único e sem duplicação |
| success | sim | teste Wiki confirma inserção de Markdown | não foi capturado no browser nesta auditoria | confirmação observável no conteúdo/preview |
| keyboard/focus | sim | botão nativo existe | input invisível adicional; diálogo/cancelamento não exercitados | foco previsível e sem parada sem nome |
| mobile/touch | sim | nenhum cenário de upload mobile capturado | gate visual bloqueado | picker continua disponível; drop nunca é único caminho |

### Outras observações

- visual/geometria: 17/18 capturas terminais passaram a geometria; CaseFlow Backup 360 falhou. Configurações 320 passou, sem evidência para reabrir AT-456.
- DOM/semântica: `unnamed-interactive` correlaciona com inputs de arquivo compartilhados; Escalas tem um `aria-controls` ativo sem alvo. Cabeçalhos sem `scope` permanecem sinal manual, não finding concluído.
- ARIA: snapshots são complementares e não foram persistidos em texto bruto. Não se declara conformidade WCAG integral.
- teclado/foco: foco visível no campo Senha foi observado em 320x700; jornada de teclado do uploader e retorno do file dialog continuam manuais.
- reflow/zoom: 320/360 foram amostrados; zoom 200%, landscape e reflow do uploader não foram exercitados.
- target size: não medido manualmente.
- reduced motion: não aplicável aos findings principais; não validado globalmente.
- manual-needed: leitor de tela real, ordem de tabulação completa, diálogo nativo de arquivo, cancelamento, touch, invalid/multiple, progresso, erro/retry, zoom, contraste e target size.

## 9. Decisões humanas pendentes

- decisão: adotar `picker-only` ou `hybrid picker + drag-and-drop` no `MarkdownEditor` compartilhado.
- opções válidas:
  1. `picker-only`: menor mudança, preserva comportamento atual e concentra esforço em nome/foco/erro;
  2. `hybrid`: adiciona eficiência em desktop, mas exige estados drag-over/drop/invalid/multiple/loading/error e manutenção do botão para teclado/mobile.
- impacto do adiamento: UX-C01, UX-C02 e UX-C04 podem avançar sem essa decisão; somente UX-C03 deve permanecer sem task de implementação.
- autoridade necessária: Product Owner/Design owner; Taskyfier apenas registra dependência e não escolhe a direção.
- decisão comercial: o destino de Notas/DANFE, CSV de profissionais e licença pública continua subordinado a `TASK-AT-454` e contratos legados; este audit não substitui esse gate.

## 10. Limitações e riscos

- 12/30 cenários falharam por setup/terminal; os PNGs desses cenários não foram usados para claims visuais.
- Os dois cenários de Performance continuam bloqueados; nenhuma conclusão visual, responsiva ou de acessibilidade foi emitida para a tela.
- Upload mobile/touch e todos os estados que exigem arquivo real permaneceram bloqueados pelo vocabulário allowlisted do harness.
- A inspeção das capturas full-page altas foi suficiente para localizar affordances, mas não sustenta claims finos de tipografia/target size em toda a página.
- Apenas Chromium local/fake foi usado; sem Safari/Firefox, tecnologia assistiva real, aparelho físico ou dados live.
- Os checks automatizados são sinais: `unnamed-interactive`, `aria-controls` e geometria foram correlacionados com fonte/PNG antes de virar finding; `table-header-without-scope` não foi elevado.
- Worktree dirty foi autorizado. Alterações alheias em `docs/operations/taskyfier-memory.md`, `docs/tasks/ROADMAP.md`, `.claude/` e outros arquivos não foram tocadas/revertidas.
- O record e screenshots são transitórios, `same-request-only`, não reutilizáveis, não promovíveis e incapazes de fechar gate.
- A classificação `high` de UX-C02 é impacto potencial do erro no job; a confiança permanece `medium` pela ausência de reprodução browser da rejeição.

## 11. Handoff para implementação ou verificação

- destino imediato: Orchestrator e Taskyfier.
- Taskyfier:
  1. fazer dedupe final e, se não houver equivalentes, materializar UX-C01, UX-C02 e UX-C04 como tasks pequenas e separadas;
  2. tratar UX-C05 como residual conhecido de AT-455, sem reabrir a task concluída;
  3. manter UX-C03 como decision gate; não criar task de drag-and-drop implementável antes da escolha humana;
  4. não misturar uploads comerciais/legados enquanto AT-454 estiver aberto.
- implementação esperada de outro especialista: mudanças localizadas no editor compartilhado, estado de erro e relação tab/panel; nenhuma prescrição arquitetural foi aprovada por este audit.
- Runtime Builder/harness, se houver continuação: corrigir sessão/seed dos 12 cenários falhos e oferecer step seguro para arquivo sintético; qualquer nova evidência deve ser readquirida no request ativo apropriado.
- Task Verifier independente: validar task/spec/aceite com evidência task-backed nova; este record advisory não fecha gate.
- decisão final: não emitida por Product UX.

## 12. Onde o artefato foi materializado

- audit: `docs/tasks/UXREQ-ALWAYSTRACK-COMPLEMENTARY-AUDIT-20260903-001-ux-audit.md`
- record transitório: `test-results/product-ux/advisory/UXREQ-ALWAYSTRACK-COMPLEMENTARY-AUDIT-20260903-001/advisory-capture-record.json`
- screenshots transitórios: `test-results/product-ux/advisory/UXREQ-ALWAYSTRACK-COMPLEMENTARY-AUDIT-20260903-001/screenshots/`
- cenário transitório: `.tmp/product-ux-complementary-scenarios.json`
- retenção: descartar record/screenshots/cenário ao fechamento do request; não versionar.

## Checklist de validação

- [x] `preflight.mjs` classificou o ambiente como `fake`, local/loopback e pronto.
- [x] `capture.mjs` foi executado com o request_id real e `--allow-dirty-worktree` autorizado.
- [x] `validate-advisory-capture.mjs` retornou `valid-advisory-record`.
- [x] Todos os 18 PNGs capturados foram abertos; cenários falhos não sustentaram claims visuais.
- [x] `npm run test --workspace @alwaystrack/web -- accessibility.test.tsx wiki.test.tsx`: 2 arquivos e 9 testes passaram.
- [x] Nenhum arquivo de produto, baseline, task, roadmap ou estado operacional foi alterado por Product UX.
- [x] Nenhum commit ou push foi executado.

## Sugestão de commit semântico

- `docs(product-ux): registra auditoria complementar de uploads e terminais`
