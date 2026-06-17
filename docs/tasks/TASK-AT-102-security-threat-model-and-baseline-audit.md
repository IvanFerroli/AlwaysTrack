# TASK-AT-102 - Seguranca: modelo de ameacas e auditoria base

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-06-17
- source-of-truth: docs/tasks/TASK-AT-102-security-threat-model-and-baseline-audit.md

## Modo
- mode: audit

## Objetivo unico
Criar um mapa claro dos riscos de seguranca do AlwaysTrack antes de aplicar hardening tecnico.

## Contexto minimo
O AlwaysTrack esta deixando de ser prototipo local e caminhando para produto interno apresentavel. Antes de "blindar", precisamos saber o que deve ser protegido, contra quem, por quais caminhos e qual seria o impacto de uma falha.

Em seguranca isso se chama "modelo de ameacas": e uma lista organizada de ativos, entradas, usuarios, permissoes, dados sensiveis e cenarios de ataque. Sem isso, o time pode instalar bibliotecas aleatorias e ainda assim deixar aberto o ponto errado.

## Inputs
- `services/api/src/app.ts`
- `services/api/src/core/auth/*`
- `services/api/src/core/sales-documents/*`
- `services/api/src/core/wiki/*`
- `services/api/src/core/faq/*`
- `services/api/src/core/announcements/*`
- `services/api/src/core/script-library/*`
- `services/api/prisma/schema.prisma`
- `deploy/*`
- `docs/architecture/*`

## Dependencias
- satisfeitas: produto ja possui auth, roles, auditoria, upload, notificacoes e documentacao de arquitetura.
- em aberto: nenhuma; esta deve ser a primeira task da fase de seguranca.

## Alvos explicitos
1. `docs/security/threat-model.md`
2. `docs/security/security-baseline-audit.md`
3. `docs/tasks/ROADMAP.md`

## Explicacao simples
Pense no sistema como uma loja:
- ativos sao o cofre, estoque e caixa;
- entradas sao portas, janelas e telefone;
- atores sao funcionarios, gerente, visitante e invasor;
- ameacas sao roubo, fraude, falsificacao e vandalismo.

No AlwaysTrack, os ativos incluem DANFEs, ranking, usuarios, senha, sessoes, anexos, auditoria, integracoes Google/IA/WhatsApp e dados comerciais. As entradas incluem login, upload de arquivos, comentarios, busca, endpoints administrativos, webhooks e callbacks OAuth.

## Fora de escopo
- Implementar correcoes.
- Contratar pentest externo.
- Trocar banco, auth ou infraestrutura.

## Checklist
1. Inventariar dados sensiveis por dominio: vendas/notas, usuarios, conhecimento, anexos, logs, integracoes.
2. Listar entradas externas: rotas publicas, rotas autenticadas, callbacks, webhooks, uploads, CSV/export.
3. Classificar usuarios e privilegios: SAC, VENDAS, SUPERVISOR, ADMIN, GESTOR, FINANCEIRO e legado.
4. Mapear riscos por categoria: autenticacao, autorizacao, upload, injection, XSS, CSRF, abuso de recursos, vazamento de logs, segredo exposto.
5. Apontar controles existentes e gaps.
6. Priorizar as tasks de hardening por impacto e facilidade.

## Acceptance Criteria
1. Existe documento explicando o que o AlwaysTrack precisa proteger.
2. Cada risco tem impacto, probabilidade, evidencia no codigo e task relacionada.
3. As rotas publicas e autenticadas estao separadas no documento.
4. O documento explica em linguagem simples os termos usados.
5. O roadmap aponta esta auditoria como porta de entrada da fase de seguranca.

## Definition of Done
1. `docs/security/threat-model.md` criado.
2. `docs/security/security-baseline-audit.md` criado.
3. Gaps vinculados a `TASK-AT-103` em diante.
4. Nenhuma mudanca funcional feita no produto.

## Validacao
- comandos/checks: `npm run typecheck --workspaces --if-present`
- revisao manual: ler docs e confirmar se os fluxos centrais DANFE/ranking e FAQ/Wiki aparecem.

## Evidencia esperada
- Matriz de riscos com severidade.
- Lista de assets e trust boundaries.
- Lista priorizada de hardening.

## Execucao
- EXEC: docs/tasks/EXEC-AT-102-security-threat-model-and-baseline-audit.md
- Artefatos:
  - docs/security/threat-model.md
  - docs/security/security-baseline-audit.md

## Riscos
- Virar documento generico demais e nao guiar execucao.
- Superestimar ameacas exoticas e ignorar riscos simples como IDOR, CSRF e upload malicioso.

## Blockers possiveis
- Falta de decisao sobre onde o sistema sera hospedado.
- Falta de decisao se acesso externo sera publico na internet ou restrito por VPN/rede corporativa.

## Retorno esperado
- Resumo dos maiores riscos.
- Ordem recomendada para as proximas tasks.
- Linguagem acessivel para quem nao domina cyber seguranca.
