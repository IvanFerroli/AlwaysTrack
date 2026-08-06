# Product UX Pilot Report — 2026-08-05

## Metadata

- status: in-progress
- owner: olympus_orchestrator
- task: TASK-AT-449
- last-updated: 2026-08-05
- scope: aquisição visual local/fake, integridade, repetibilidade e boundaries de ownership
- final-authority: olympus_task_verifier

## Decisão provisória

O harness task-backed está `GO-WITH-RISK` para pilotos locais/fake. Ele adquiriu quatro jornadas com dados sintéticos, falhou de forma fechada diante de dois alvos obsoletos, sanitizou os artefatos e repetiu a matriz sem autoaceitar baseline.

Esta decisão não ativa o agente completo. Captura advisory sem task, execuções fresh dos três modos, forward eval selado e roteamento independente ainda precisam de evidência antes do gate de `TASK-AT-450`.

## Escopo e fonte

O piloto exercita o runtime local já existente do AlwaysTrack. Nenhum arquivo de produto, baseline visual, regra de negócio ou task foi alterado para obter resultado verde. Os pacotes são transitórios em `test-results/product-ux/`, estão fora do Git e pertencem somente às execuções registradas.

Revisão de origem: commit `8d9992f7ce36ea55da761d2308be9e1e1ababb7e`, worktree sujo explicitamente autorizado. Por isso, toda evidência tem freshness `same-execution-only`; o SHA do commit não reproduz sozinho o estado renderizado.

## Matriz executada

| Target | Superfície | Role | Estado | Viewport | Terminal observável | Resultado 002/003 |
| --- | --- | --- | --- | --- | --- | --- |
| `login-mobile` | Login Web | ANONYMOUS | default | 320 × 700 | botão `Entrar com senha` visível | captured / captured |
| `sac-script-library-mobile` | Scriptoteca SAC | SAC | default | 390 × 844 | heading `Scriptoteca` visível | captured / captured |
| `finance-profile-desktop` | Perfil Financeiro | FINANCEIRO | default | 1280 × 800 | heading `Perfil` visível | captured / captured |
| `admin-dashboard-desktop` | Dashboard Admin | ADMIN | default | 1440 × 900 | heading `Dashboard` visível | captured / captured |

As jornadas usam Chromium `149.0.7827.55`, tema claro, reduced motion, SQLite temporário e seed sintético. Tráfego externo é bloqueado; autenticação usa somente contas do fixture isolado.

## Execuções

### `PRODUCT-UX-PILOT-MATRIX-001` — blocker controlado

- duração: 72,634 s;
- resultado: `VISUAL_ACQUISITION_BLOCKED`;
- quatro cenários tentados; dois bloqueados;
- causa observada: os alvos documentados `Notas Financeiro` e `CaseFlow Admin / Conectores` não correspondiam às superfícies alcançáveis do seed atual;
- comportamento correto: o harness não declarou sucesso por ter produzido PNG, não substituiu a condição terminal e não converteu leitura de código em prova visual.

O run registrou as telas efetivamente alcançadas para diagnóstico seguro. A fixture do piloto foi então corrigida para alvos atuais observáveis; o harness e o produto não foram relaxados.

### `PRODUCT-UX-PILOT-MATRIX-002` — matriz atual

- duração: 13,075 s;
- resultado: `CAPTURED`;
- quatro cenários capturados, zero falhas de aquisição;
- manifesto e checksums validados;
- cinco artefatos: quatro PNGs sanitizados e um report JSON.

### `PRODUCT-UX-PILOT-MATRIX-003` — repetição

- duração: 12,085 s;
- resultado: `CAPTURED`;
- quatro cenários capturados, zero falhas de aquisição;
- manifesto e checksums validados;
- nenhuma atualização ou autoaceite de baseline.

## Inspeção humana dos PNGs

Os registros abaixo foram produzidos após abertura dos PNGs reais com inspeção em resolução original. Eles são observações do estado atual, não aprovação de UX nem definição do alvo desejado.

| Inspection ID | Capture | SHA-256 | Escopo inspecionado | Observação limitada |
| --- | --- | --- | --- | --- |
| `INS-PILOT-002-LOGIN` | `login-mobile` | `1281676844aac3d4210052ce43b9598bfe082cbfe69a0b6c3e2cf05ae02cea1d` | enquadramento, legibilidade, máscara | formulário aparece contido no viewport; os dois campos estão mascarados |
| `INS-PILOT-002-SAC` | `sac-script-library-mobile` | `417d76b7eed12d02cc38c543a71a889608650b6d1b39bf21050f2cd2139a3a4f` | target, navegação, início do conteúdo | navegação SAC expandida e início da Scriptoteca aparecem na mesma captura; não há autoridade neste piloto para classificar a densidade como defeito |
| `INS-PILOT-002-FIN` | `finance-profile-desktop` | `b10ceb30c7f918cf53d74d83d777b4ee8121154640dced01225759b3c63180ce` | role, target, redaction, geometria geral | Perfil Financeiro está identificável e o e-mail sintético renderizado foi mascarado |
| `INS-PILOT-002-ADMIN` | `admin-dashboard-desktop` | `4723e497b25fa01d510874af78ef56ca1c912122db64c9915fb7d383d4094a8a` | role, target, dashboard e viewport | Dashboard Admin está identificável e visível no viewport declarado |

Limitações comuns: sem leitor de tela real, zoom manual, usuário real, ambiente live ou referência-alvo. Os sinais ARIA, DOM e geometria são complementares e não provam conformidade integral com acessibilidade.

## Repetibilidade

Três de quatro PNGs foram byte a byte idênticos entre 002 e 003:

- Login: `128167…1d` em ambos;
- Scriptoteca SAC: `417d76…a4f` em ambos;
- Dashboard Admin: `4723e4…a8a` em ambos.

O Perfil Financeiro variou de 168.371 para 168.360 bytes e teve hashes distintos (`b10ceb…0ce` e `906a16…7d7`). A inspeção em resolução original mostrou apresentação equivalente, mas o piloto não reivindica determinismo pixel-exato para essa superfície. O risco é classificado como sensibilidade residual de renderização e deve permanecer visível em qualquer futura política de baseline.

## Privacidade e integridade

- scan textual dos JSON/Markdown/TXT do diretório de evidência não encontrou authorization headers, bearer tokens, cookies, passwords, API keys ou session IDs;
- senha do seed, storage state, HTML bruto, payloads de rede, console bruto e ARIA/DOM bruto não foram persistidos;
- valores renderizados com aparência sensível foram mascarados antes do screenshot;
- cada PNG passou por integridade PNG, confinamento de path, ausência de symlink e checksum;
- evidência fake/local não fecha gate production-like/live.

## Falsos positivos, falsos negativos e utilidade

- falsos positivos materiais neste piloto de aquisição: 0. Nenhuma preferência visual foi promovida a defeito;
- falsos negativos: não mensurados por este run, porque seu objetivo foi aquisição e integridade, não uma auditoria diagnóstica com oracle de defeitos;
- blocker correto: 2/2 alvos obsoletos foram impedidos de concluir visualmente no run 001;
- utilidade observada: o pacote torna role, estado, viewport, terminal, origem, ambiente, redaction e checksums auditáveis sem pedir prints ao usuário;
- custo operacional depois do bootstrap: aproximadamente 12–13 segundos para quatro jornadas na máquina local; falhas de terminal condition respeitam timeout e podem custar mais.

## Ownership e handoffs

- Product UX adquire, inspeciona e produz audit/spec/review consultivo;
- Runtime Builder mantém browser, seed, cenários e sanitização;
- Quality Builder mantém scorer, evals e thresholds;
- Task Verifier decide readiness e aceite;
- este relatório não implementa correção, cria baseline ou aprova a UI observada.

## Pendências para fechar TASK-AT-449

1. Executar smoke visual advisory taskless ancorado em `request_id`, com PNG inspecionado e sem `manifest.json`.
2. Executar e observar os três modos do agente em contextos fresh.
3. Exercitar `REFERENCE_REQUIRED` e ownership aggregation na versão final do prompt.
4. Executar forward eval selado e obter adjudicação independente.
5. Registrar a decisão final `GO`, `GO-WITH-RISK` ou `NO-GO` deste piloto sem confundi-la com aceite de `TASK-AT-450`.

## Checklist de validação

- [x] quatro jornadas, quatro roles e quatro viewports reproduzidos;
- [x] blocker de target/terminal falha fechado;
- [x] captura repetida sem autoaceite de baseline;
- [x] PNGs abertos e inspecionados em resolução original;
- [x] artefatos sanitizados e checksums verificados;
- [ ] advisory taskless exercitado;
- [ ] três modos e handoffs exercitados em contextos fresh;
- [ ] forward eval e avaliação independente concluídos;
- [ ] recomendação final emitida pelo owner adequado.

Commit sugerido após o gate: `test(product-ux): document end-to-end pilot evidence`
