# Decisao de prontidao transversal

## Metadata
- status: active
- owner: olympus_orchestrator
- last-updated: 2026-07-15
- source-of-truth: docs/operations/project-readiness-decision.md
- related-task: docs/tasks/TASK-AT-335-project-wide-demo-readiness-gate.md

## Snapshot auditado
- branch: `feature/caseflow-foundations`
- commit de referencia inicial: `39c419c`
- evidencia desta rodada: `local/fake`
- validade da decisao de demo: ate 2026-07-16 23:59 America/Sao_Paulo
- aprovador da demo: responsavel pela apresentacao, com aceite explicito dos riscos abaixo
- aprovadores de rollout/exposicao: product/operations e security/platform, respectivamente

## Decisoes independentes

| Fronteira | Decisao | Escopo autorizado | Riscos e condicoes | Nova revisao |
| --- | --- | --- | --- | --- |
| Demo controlada | `GO-WITH-RISK` | checkout local/offline, seed e fixtures sinteticos, sem provider live | validar commit limpo, reset/seed, API/Web, roteiro e fallback; declarar que demo nao prova producao | antes da apresentacao ou se o commit mudar |
| Rollout interno CaseFlow | `NO-GO` | nenhum rollout autorizado | wiring MV3 incompleto, host/perfil/firewall/suspend e conectores live sem evidencia; auditorias AT-302 a AT-306 seguem NO-GO | apos gates live por fase e AT-334 |
| Exposicao externa | `NO-GO` | nenhuma exposicao publica autorizada | Postgres/storage production-like, restore real, container gate, dominio/HTTPS, secrets e compatibilidade operacional pendentes | apos AT-320, AT-326, AT-329 e AT-334 production-like/live |

## Evidencia que sustenta a demo
- gate uniforme dos seis workspaces, thresholds de coverage e seguranca CI;
- API lifecycle/readiness, OpenAPI P0 e 12 jornadas criticas por papel/viewport;
- 8 regressoes visuais em Chromium, com overflow desktop/mobile encontrado e corrigido;
- MV3 unpacked real com 11 checks locais e 108 testes da extensao;
- contratos de providers, fuzzing, observabilidade/SLO, privacidade, docs e pacote de release local;
- drill local de recovery com 9 testes, checksums, RPO/RTO e promocao bloqueada em falha;
- carga mista executavel com perfis mixed/stress/spike/soak; somente um VU local foi exercitado.

## Riscos aceitos somente para a demo
1. Dados e conectores sao fake/local; Google, Meta/WhatsApp, OpenAI/Gemini e conectores CaseFlow nao foram promovidos como live.
2. O content script compilado nao esta declarado no manifest MV3; intake de pagina real permanece fora da demonstracao aprovada.
3. Reinicio do service worker perde o token em memoria e exige novo pairing.
4. Postgres, Redis/BullMQ sob carga, storage S3, restore/PITR e perfis pesados nao possuem evidencia production-like.
5. Leitor de tela/zoom, Windows/WSL/Edge, VPN/firewall, suspend/resume e perifericos fisicos continuam pendentes.

## Checklist de apresentacao
1. Confirmar `git status --short` vazio e registrar `git rev-parse HEAD`.
2. Executar `npm run check`, `npm run check:docs` e `npm run repo:hygiene` no commit apresentado.
3. Executar reset/seed local conforme `docs/demo/always-track-demo-checklist.md`; usar somente contas sinteticas.
4. Validar `GET /health/live` e `GET /health/ready` antes de abrir a Web.
5. Seguir `docs/demo/caseflow-guided-demo.md`; nao demonstrar provider, login, captcha, draft ou submit real.
6. Manter o fallback offline auditado pronto e declarar qualquer reducao de escopo.

## Regra de falha
Worktree sujo desconhecido, gate vermelho, dado real, dependencia externa inesperada ou fallback offline invalido revogam o `GO-WITH-RISK` da demo. Nenhum sucesso visual altera os dois `NO-GO` restantes.
