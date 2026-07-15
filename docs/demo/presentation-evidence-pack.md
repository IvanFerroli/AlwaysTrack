# Presentation Evidence Pack

## Metadata
- status: active
- owner: product-demo + olympus_orchestrator
- last-updated: 2026-07-15
- source-of-truth: docs/demo/presentation-evidence-pack.md
- schema: docs/operations/evidence-manifest.schema.json

## Regra de uso
Este pacote organiza uma apresentacao reproduzivel sem transformar demo em rollout. Cada execucao deve gerar um manifesto conforme o schema, referenciar o commit apresentado e classificar o ambiente como `fake`, `local`, `production-like` ou `live`.

Screenshot, video ou relato demonstram estado visual. So fecham gate tecnico quando acompanhados por comando/procedimento reproduzivel, resultado, contexto de ambiente, checksum, redaction e aprovacao exigida pelo gate.

## 1. Demo controlada

**Snapshot:** `GO-WITH-RISK` somente para execucao local/offline com dados ficticios. Nao usar credenciais, cookies, sistemas ou dados de cliente.

### Preparacao e roteiro
1. Registrar `git rev-parse HEAD`, `git status --short`, UTC, operador, Node e npm.
2. Para produto comercial local, executar `npm run demo:reset:local`, subir API/Web e seguir `docs/demo/always-track-demo-checklist.md`.
3. Para CaseFlow offline, executar `node tests/fake-pages/caseflow/audit-offline.mjs` e `npm test --workspace @alwaystrack/companion-extension`, depois seguir `docs/demo/caseflow-guided-demo.md`.
4. Executar um smoke focado no commit apresentado. Se o gate raiz falhar, registrar `failed`/`partial`; nao ocultar a falha.
5. Gerar checksums com `sha256sum <artefato>` e preencher o manifesto.

### Evidencia e aceite
- Classe: `fake` para fixtures/CaseFlow offline; `local` para app e comandos no checkout.
- Aceite: responsavel pela apresentacao confirma escopo ficticio e riscos conhecidos.
- Riscos aceitos: seed artificial, ausencia de integracoes live e validacoes production-like/manuais ainda pendentes.
- Proibido alegar: readiness operacional, capacidade production-like, conectores live ou seguranca de exposicao externa.

### Fallback offline
- Preservar `tests/fake-pages/caseflow/` e `tests/fixtures/caseflow/demo/` auditados.
- Se API/Web falhar, apresentar somente CaseFlow offline e declarar a reducao de escopo.
- Se qualquer fixture falhar na auditoria, interromper esse roteiro; nao usar dados reais como substituto.

## 2. Rollout interno / CaseFlow

**Snapshot:** `NO-GO`.

- AT-302 a AT-306 concluiram auditorias com resultado `NO-GO`; AT-307 concluiu apenas readiness documental limitada.
- O pacote de demo nao satisfaz pairing real, perfil Chrome, Windows/WSL, firewall, captcha/2FA, drift, reconexao, rollback ou smoke por conector.
- Reabrir decisao somente na ordem das fases, usando os checklists live existentes e evidencia `live` separada por host, conector e release.
- Aprovação obrigatoria: owner operacional e owner do gate; falha ou ausencia de evidencia resulta em `NO-GO`.

## 3. Exposicao externa

**Snapshot:** `NO-GO` para internet publica.

- O gate `docs/security/external-exposure-release-gate.md` registra bloqueios P0 em dominio/HTTPS, env/secrets finais, banco/storage, backup/restore e deploy/rollback.
- Postgres/storage production-like e o preflight no host beta ainda dependem de infraestrutura e credenciais autorizadas.
- Antes de nova decisao, executar o gate no commit candidato e anexar evidencias `production-like`/`live` para cada P0.
- `go-with-risk` exige risco nao critico, mitigacao, owner, prazo e aceite formal. P0 ausente ou nao verificavel permanece `NO-GO`.

## Estrutura do pacote

```text
evidence/<evidence-id>/
  manifest.json
  logs/
  reports/
  screenshots/
```

Os diretorios de evidencias sao externos ao Git quando contiverem dados internos. O manifesto pode apontar para armazenamento controlado; nunca versionar segredo, cookie, HTML bruto autenticado, DANFE ou dado pessoal.

## Exemplo minimo local

```json
{
  "manifestVersion": "1.0.0",
  "evidenceId": "AT333-LOCAL-20260715-01",
  "taskId": "TASK-AT-333",
  "commit": {
    "sha": "f03f2c949907b7a9f3f92f8fde30f70cb906c0ba",
    "dirty": true
  },
  "capturedAt": "2026-07-15T11:18:45Z",
  "environment": {
    "classification": "local",
    "name": "developer-checkout",
    "target": "documentation validation",
    "notes": "Exemplo sintetico; nao e evidencia de gate live."
  },
  "operator": {
    "id": "olympus_taskyfier",
    "role": "task executor"
  },
  "evidenceType": "automated",
  "toolVersions": {
    "node": "record-at-capture",
    "npm": "record-at-capture"
  },
  "commands": [
    {
      "command": "git diff --check",
      "startedAt": "2026-07-15T11:18:45Z",
      "finishedAt": "2026-07-15T11:18:46Z",
      "exitCode": 0,
      "status": "passed",
      "summary": "No whitespace errors."
    }
  ],
  "artifacts": [
    {
      "path": "reports/documentation-validation.txt",
      "mediaType": "text/plain",
      "sha256": "0000000000000000000000000000000000000000000000000000000000000000",
      "sensitivity": "internal",
      "role": "report",
      "redacted": true
    }
  ],
  "result": {
    "status": "passed",
    "summary": "Exemplo de evidencia local; nao fecha rollout ou exposicao.",
    "risks": ["AT-330 ainda nao automatiza a integridade documental completa."]
  },
  "redaction": {
    "status": "applied",
    "summary": "Somente paths e resultados sinteticos."
  },
  "approval": {
    "required": false,
    "status": "not-required",
    "approver": null,
    "decidedAt": null
  }
}
```

Substituir SHA, horarios, versoes, paths e checksums pelos valores reais. `dirty: true` torna a evidencia rastreavel, mas nao e adequada para aprovar release candidato.

## Checklist de fechamento
- [ ] Manifesto validado contra o schema.
- [ ] Commit, UTC, ambiente, operador, versoes, comandos e resultados registrados.
- [ ] Todo artefato tem SHA-256, sensibilidade e redaction revisada.
- [ ] Falhas, skips, riscos e fallback constam sem promocao por inferencia.
- [ ] Decisao registrada na fronteira correta: demo, rollout ou exposicao externa.
- [ ] Aprovação veio do owner exigido pelo gate.
