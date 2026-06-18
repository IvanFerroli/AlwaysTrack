# Security Incident Runbook

## Metadata
- status: active
- owner: ops/security
- last-updated: 2026-06-17
- source-of-truth: docs/operations/security-incident-runbook.md

## Objetivo
Dar um roteiro simples para detectar, conter, preservar evidencia, recuperar e registrar incidentes de seguranca no AlwaysTrack.

Incidente e qualquer suspeita de comprometimento de confidencialidade, integridade ou disponibilidade. Exemplos: conta admin tomada, `SESSION_SECRET` vazado, DANFE exportada indevidamente, upload malicioso, abuso de login, webhook falso, indisponibilidade por abuso ou alteracao indevida de ranking/notas/Wiki.

## Papeis
| Papel | Responsabilidade |
| --- | --- |
| Incident lead | Coordena a resposta, decide severidade e registra linha do tempo. |
| App operator | Coleta evidencias, aplica contencao e valida recuperacao. |
| Security/IT | Apoia rotacao de segredo, logs, infraestrutura e analise. |
| Business owner | Decide impacto comercial, comunicacao interna e aceite de risco. |
| Juridico/LGPD | Acionado quando houver dado pessoal/comercial exposto ou exigencia regulatoria. |

Se ninguem foi designado, o primeiro admin que confirmar o incidente vira incident lead ate transferir formalmente.

## Primeiros 15 minutos
1. Nomeie incident lead e abra um registro unico do incidente.
2. Escreva hora inicial, quem reportou, ambiente afetado, sintoma e primeira hipotese.
3. Classifique severidade inicial pela matriz abaixo; reclassifique quando surgirem fatos.
4. Pare a sangria sem apagar evidencia: desative usuario, bloqueie token, pause integracao ou tire rota do ar se necessario.
5. Preserve logs e artefatos antes de limpar, reiniciar ou editar banco.
6. Identifique janela provavel: primeiro evento suspeito, ultimo evento confirmado, usuarios/organizacoes afetadas.
7. Liste segredos possivelmente expostos e escolha ordem de rotacao.
8. Defina canal privado de coordenacao; nao cole segredos, cookies, dumps ou arquivos brutos no chat.
9. Avise admins/gestao com mensagem curta: impacto conhecido, acao em curso, proxima atualizacao.
10. Marque decisao inicial: monitorar, conter parcialmente, derrubar acesso externo ou acionar TI/seguranca/juridico.

## Matriz de severidade
| Severidade | Criterio | Exemplos | Prazo de acao | Escalar para |
| --- | --- | --- | --- | --- |
| SEV1 critica | Dado sensivel exposto, admin comprometido, segredo de producao vazado ou alteracao indevida ampla | `SESSION_SECRET` publico, conta ADMIN usada, cross-org com dado retornado | Contencao imediata; atualizacao a cada 30 min | Gestao, TI/seguranca, juridico/LGPD |
| SEV2 alta | Tentativa forte ou impacto limitado confirmado sem exposicao ampla | brute force persistente, upload malicioso bloqueado repetido, webhook falso com processamento | Contencao em ate 1 h; atualizacao a cada 2 h | TI/seguranca e business owner |
| SEV3 media | Anomalia investigavel sem dado exposto conhecido | pico de 403/401, export admin fora de rotina, reprocessamento IA incomum | Investigar no mesmo dia util | App operator e owner |
| SEV4 baixa | Evento unico, bloqueado e sem impacto | login falho isolado, arquivo recusado por tipo | Registrar e monitorar | App operator |

Qualquer duvida entre duas severidades usa a maior ate haver evidencia contraria.

## Tipos de incidente e contencao
| Tipo | Sinais | Contencao inicial |
| --- | --- | --- |
| Conta comprometida | Login fora de rotina, role alterada, export suspeito, acoes que o usuario nega | Desativar usuario, resetar senha, invalidar sessoes por rotacao de `SESSION_SECRET` se houver risco de cookie, revisar roles. |
| Segredo vazado | Secret em Git/chat/log, uso externo, env compartilhado indevidamente | Revogar no provedor, gerar novo segredo, atualizar env fora do Git, reiniciar consumidores. |
| Dado comercial vazado | Export CSV indevido, DANFE vista por role errada, cross-org | Remover acesso, preservar query/log, identificar organizacoes e arquivos afetados, acionar business owner/juridico. |
| Malware/upload suspeito | Arquivo recusado, parser falhando, anexo servido com tipo estranho | Isolar arquivo/storage key, bloquear downloads, preservar hash/tamanho/metadados, nao abrir em maquina comum. |
| Indisponibilidade/DoS | 429/5xx, CPU/IO alto, fila crescendo, login/upload abusado | Ativar/estreitar rate limit, bloquear origem na borda, pausar features custosas, comunicar degradacao. |
| Alteracao indevida | Ranking/notas/Wiki/FAQ/Avisos modificados sem autorizacao | Congelar edicoes no dominio afetado, exportar auditoria, restaurar versao/backup depois de preservar evidencia. |

## Preservacao de evidencia
Faca antes de reiniciar, limpar fila, editar banco ou apagar arquivos:

1. Copie horario local e timezone, request id, usuario, organizacao, rota, IP quando disponivel e status HTTP.
2. Exporte somente metadados necessarios da auditoria; nao exporte XML/PDF bruto sem necessidade.
3. Preserve logs de aplicacao, proxy/edge, CI/deploy, provedor de secrets e banco para a janela suspeita.
4. Registre hashes, tamanho, MIME declarado e storage key de arquivos suspeitos; nao abra o arquivo.
5. Tire screenshots de telas administrativas relevantes com dados sensiveis minimizados.
6. Guarde comandos executados e resultado resumido no registro do incidente.
7. Restrinja acesso ao pacote de evidencias ao incident lead, TI/seguranca e juridico quando aplicavel.

Nunca faca: apagar logs no susto, editar banco sem snapshot/registro, postar segredo em chat, enviar dump completo por email, testar exploit em producao sem combinacao.

## Rotacao de segredos
Use `docs/operations/security-secrets-runbook.md` como fonte operacional. Checklist rapido:

1. Identifique todos os segredos potencialmente afetados: `SESSION_SECRET`, `DATABASE_URL`, `REDIS_URL`, Google, Meta, OpenAI/Gemini, storage e tokens de webhook.
2. Revogue ou desabilite o segredo antigo no provedor original.
3. Gere segredo novo com escopo minimo e validade adequada.
4. Atualize o provedor de secrets ou `.env.production` fora do Git.
5. Rode `npm run env:check -- --production` com o ambiente alvo.
6. Reinicie API/workers que consomem o segredo.
7. Valide login, integracao ou job afetado.
8. Registre variavel, data, responsavel e sistemas reiniciados.

Notas:
- Rotacionar `SESSION_SECRET` invalida sessoes ativas e e apropriado quando cookie/token pode ter vazado.
- Rotacionar banco/Redis exige janela coordenada para evitar processos com credencial antiga.
- Rotacionar Google/Meta/IA deve incluir revisao de scopes, redirects e limites de uso.

## Investigacao
Fontes internas principais:
- `docs/security/security-events-taxonomy.md`
- `docs/operations/security-monitoring-alerts.md`
- `docs/operations/security-secrets-runbook.md`
- `docs/operations/security-dependency-ci-gates.md`
- `docs/security/threat-model.md`
- `docs/security/security-baseline-audit.md`

Comandos uteis quando o ambiente permite:

```bash
npm run repo:hygiene
npm run env:check -- --production
npm run security:deps
npm run test:e2e:api
```

Para suspeita de `SESSION_SECRET` vazado:
1. Classifique como SEV1 se for producao ou se houver dado real.
2. Preserve onde o segredo apareceu e quem teve acesso.
3. Revogue o segredo antigo por rotacao do `SESSION_SECRET`.
4. Reinicie API e force novo login de todos.
5. Revise auditoria para `security.auth.*`, alteracoes de role, exports e acoes admin na janela.
6. Rode `npm run env:check -- --production` e registre resultado.
7. Abra postmortem mesmo que nao tenha abuso confirmado.

## Comunicacao interna
Use mensagens curtas, factuais e com proxima atualizacao definida.

Modelo inicial:

```text
Incidente de seguranca em investigacao: <resumo>.
Severidade atual: <SEV>.
Impacto confirmado: <o que sabemos>.
Acao em curso: <contencao>.
Pedido aos times: <nao compartilhar segredos / pausar operacao / aguardar>.
Proxima atualizacao: <hora>.
```

Escalar para TI/seguranca quando houver segredo, infraestrutura, IP/origem maliciosa, logs externos ou necessidade de bloquear acesso na borda.

Escalar para juridico/LGPD quando houver dado pessoal, fiscal, comercial sensivel, fornecedor externo ou duvida sobre notificacao obrigatoria.

## Recuperacao
1. Confirme que a contencao parou novos eventos suspeitos.
2. Aplique correcao ou mitigacao de menor risco.
3. Restaure backup/versao apenas depois de preservar evidencia.
4. Rode os checks relevantes e um smoke do fluxo afetado.
5. Remova bloqueios temporarios somente com aceite do incident lead e owner.
6. Monitore a mesma janela por pelo menos um ciclo operacional.

## Registro de incidente
```md
# INC-YYYY-MM-DD-NN - <titulo>

## Resumo
- severidade:
- status:
- incident lead:
- ambiente:
- inicio detectado:
- inicio estimado:
- fim/contencao:

## Impacto
- usuarios/organizacoes:
- dados/sistemas:
- indisponibilidade:

## Linha do tempo
| Hora | Evento | Evidencia | Responsavel |
| --- | --- | --- | --- |

## Contencao
- acoes:
- segredos rotacionados:
- acessos desativados:

## Evidencias preservadas
- logs:
- auditoria:
- arquivos/metadados:
- screenshots:

## Comunicacao
- internos avisados:
- juridico/LGPD:
- proxima atualizacao:

## Decisao atual
- monitorar / mitigado / restaurado / escalado:
- riscos aceitos:
```

## Postmortem
Abrir em ate 2 dias uteis para SEV1/SEV2 e ate 5 dias uteis para SEV3 recorrente.

```md
# Postmortem INC-YYYY-MM-DD-NN - <titulo>

## O que aconteceu
<descricao curta e factual>

## Impacto
- confidencialidade:
- integridade:
- disponibilidade:
- usuarios/organizacoes afetadas:

## Causa raiz
<causa tecnica/operacional confirmada ou "nao confirmada">

## O que funcionou
- 

## O que falhou
- 

## Acoes corretivas
| Acao | Dono | Prazo | Status |
| --- | --- | --- | --- |

## Riscos aceitos
| Risco | Dono | Expira em | Mitigacao |
| --- | --- | --- | --- |

## Evidencias
- comandos:
- logs/auditoria:
- PRs/docs:
```

## Simulacao registrada
Dry-run documental em 2026-06-17: cenario "`SESSION_SECRET` vazou em chat interno". Resultado esperado pelo runbook:
- classificar como SEV1 se for producao;
- preservar mensagem/canal e janela de exposicao sem repostar o segredo;
- rotacionar `SESSION_SECRET` via `docs/operations/security-secrets-runbook.md`;
- reiniciar API, forcar novo login e revisar auditoria de login/role/export;
- registrar postmortem e bloquear exposicao externa ate `npm run env:check -- --production` passar no ambiente alvo.

## Blockers conhecidos
- Donos finais de incident lead, TI/seguranca, business owner e juridico/LGPD ainda precisam ser nomeados pela empresa.
- Sem infraestrutura de producao definida, evidencia de proxy/edge, provedor de secrets e retencao de logs ainda e checklist manual.
