# External Exposure Release Gate

## Metadata
- status: active
- owner: ops/security
- last-updated: 2026-06-17
- source-of-truth: docs/security/external-exposure-release-gate.md

## Objetivo
Impedir que o AlwaysTrack seja exposto na internet sem evidencia objetiva dos controles minimos de seguranca, operacao e aceitacao de risco.

Este gate nao substitui pentest profissional nem aprovacao juridica. Ele decide se uma release pode ir para acesso externo com base no estado verificavel do produto.

## Decisoes possiveis
| Decisao | Significado | Quando usar |
| --- | --- | --- |
| `go` | Pode expor externamente. | Todos os itens P0/P1 passaram, riscos residuais tem dono e prazo, ambiente alvo existe. |
| `go-with-risk` | Pode expor com excecao consciente. | Falha nao critica tem mitigacao, dono, prazo curto e aceite de gestao. |
| `no-go` | Nao expor externamente. | Falta P0, evidencia objetiva, prod infra, segredo seguro, rollback/backup ou aceite formal. |

Regra: qualquer P0 falho ou nao verificavel resulta em `no-go`.

## Evidencia objetiva obrigatoria
Cada item deve apontar para comando, arquivo, tela, log, configuracao do provedor ou registro de teste. "Acho que esta ok" nao conta.

| Area | Prioridade | Evidencia minima | Status dry-run local/demo 2026-06-17 |
| --- | --- | --- | --- |
| HTTPS e dominio final | P0 | URL final HTTPS, certificado valido, redirect HTTP->HTTPS, dono do dominio | `blocked`: dominio/proxy de producao nao definidos. |
| CORS/origin/CSRF | P0 | `docs/security/http-perimeter.md`, env `CORS_ORIGIN` exato, teste de origem negada | `partial`: controle documentado/implementado; falta validar no dominio final. |
| Headers web/API | P0 | CSP, HSTS no edge quando HTTPS, `X-Frame-Options`, `nosniff`, referrer policy | `partial`: baseline documentado; HSTS depende do edge HTTPS final. |
| Cookies e sessao | P0 | cookie `HttpOnly`, `Secure` em HTTPS, `SameSite`, TTL/expiracao, logout | `partial`: task de hardening marcada implementada; falta smoke no dominio final. |
| Rate limit/abuso | P0 | limites em login/upload/webhook/search/admin, resposta 429, log de excesso | `partial`: politica documentada em `http-perimeter`; falta shared store/edge para multi-instancia. |
| Roles/tenancy/IDOR | P0 | suite anti-IDOR e matriz de permissoes atualizada | `partial`: matriz existe; evidencias de suite devem ser anexadas antes de go. |
| Upload seguro | P0 | allowlist, limite, sniffing/magic bytes, serving com headers, storage isolado | `partial`: baseline reconhece controle inicial; confirmar TASK-AT-108 antes de go. |
| Segredos/env producao | P0 | `npm run env:check -- --production`, secrets fora do Git, `repo:hygiene` | `blocked`: sem env real de producao para passar o gate. |
| Banco/storage persistente | P0 | backup/restore testado, retencao definida, storage privado | `blocked`: prod infra e rotina de backup/restore nao evidenciadas neste dry-run. |
| Logs/auditoria/redaction | P1 | taxonomia `security.*`, logs sem segredo, consulta por janela/usuario/org | `partial`: docs existem; painel/alertas dedicados ainda pendentes. |
| Dependencias/SCA | P1 | `npm run security:deps`, excecoes com dono/prazo | `partial`: gate alto/critico documentado; residual baixo/moderado conhecido. |
| CI qualidade | P1 | `npm run check`, `npm run test:e2e:api`, migrations quando aplicavel | `not-run`: slice documental; rodar antes de decisao real. |
| Webhooks/OAuth/integracoes | P1 | assinatura Meta, state OAuth, redirects HTTPS, scopes minimos | `blocked`: depende de URLs, secrets e provedores finais. |
| Runbook de incidente | P1 | `docs/operations/security-incident-runbook.md` aprovado e donos nomeados | `partial`: runbook criado; donos empresariais ainda pendentes. |
| Rollback/release | P1 | plano de rollback, versao deployada, responsavel de plantao | `blocked`: sem plataforma de deploy final. |

## Checklist tecnico repetivel
Preencher em toda release externa:

```md
## Release gate <versao/data>

### Ambiente
- URL app:
- URL API:
- commit/tag:
- incident lead de plantao:
- owner de negocio:

### Comandos
| Comando | Resultado | Evidencia |
| --- | --- | --- |
| npm run check | pending | |
| npm run test:e2e:api | pending | |
| npm run env:check -- --production | pending | |
| npm run repo:hygiene | pending | |
| npm run security:deps | pending | |
| git diff --check | pending | |

### Controles P0
| Controle | Status | Evidencia | Dono | Prazo se pendente |
| --- | --- | --- | --- | --- |
| HTTPS/dominio final | pending | | | |
| CORS/origin/CSRF | pending | | | |
| Headers/HSTS | pending | | | |
| Cookie/sessao | pending | | | |
| Rate limit | pending | | | |
| Roles/tenancy/IDOR | pending | | | |
| Upload seguro | pending | | | |
| Segredos/env | pending | | | |
| Backup/restore | pending | | | |

### Controles P1
| Controle | Status | Evidencia | Dono | Prazo se pendente |
| --- | --- | --- | --- | --- |
| Logs/auditoria/redaction | pending | | | |
| Dependencias/SCA | pending | | | |
| CI completo | pending | | | |
| Webhooks/OAuth | pending | | | |
| Runbook incidente | pending | | | |
| Rollback/release | pending | | | |

### Riscos aceitos
| Risco | Severidade | Mitigacao | Dono | Expira em | Aceite |
| --- | --- | --- | --- | --- | --- |

### Decisao
- decisao: go / go-with-risk / no-go
- aprovador:
- data/hora:
- motivo:
```

## Comandos de validacao
Rodar no commit candidato e anexar saida resumida:

```bash
npm run check
npm run test:e2e:api
npm run env:check -- --production
npm run repo:hygiene
npm run security:deps
git diff --check
```

Se `npm run env:check -- --production` falhar por ausencia de env real, a decisao e `no-go` para exposicao externa, mesmo que local/demo funcione.

## Dry-run local/demo - 2026-06-17
| Item | Resultado |
| --- | --- |
| Escopo | Revisao documental em ambiente local/demo, sem prod infra real. |
| Comandos executados nesta fatia | `git diff --check` passou. |
| Comandos nao executados nesta fatia | `npm run check`, `npm run test:e2e:api`, `npm run env:check -- --production`, `npm run repo:hygiene`, `npm run security:deps`. |
| Evidencia reaproveitada | EXEC-AT-110, EXEC-AT-111, EXEC-AT-112 e docs de perimeter/secrets/monitoring/dependency gates. |
| Decisao | `no-go` para exposicao externa. |
| Motivo | Falta ambiente de producao com HTTPS/dominio, secrets reais, backup/restore, deploy/rollback e validacao completa dos comandos no alvo. |

## Blockers para exposicao externa
1. Definir URL final, HTTPS, proxy/edge, HSTS e politica de redirect.
2. Provisionar ambiente de producao com secrets reais fora do Git e passar `npm run env:check -- --production`.
3. Definir banco/storage persistentes, backup, restore testado e retencao.
4. Validar CI/comandos completos no commit candidato.
5. Confirmar shared rate limit ou controle equivalente se houver mais de uma instancia.
6. Validar OAuth/webhooks com redirects HTTPS e assinatura/configuracao final.
7. Nomear incident lead, business owner, TI/seguranca e juridico/LGPD.
8. Registrar aceite formal para qualquer `go-with-risk`, com prazo de expiracao.

## Resumo executivo
Estado atual: `no-go` para internet publica. O produto tem varios controles documentados e parte do hardening ja implementada, mas a exposicao externa ainda depende de infraestrutura final e evidencias objetivas de producao. O caminho seguro e repetir este gate no ambiente alvo e so mudar para `go` ou `go-with-risk` quando todos os P0 tiverem evidencia.
