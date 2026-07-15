# Backlog Transversal de Prontidao - 2026-07-15

## Metadata
- status: active
- owner: olympus_taskyfier
- last-updated: 2026-07-15
- source-of-truth: docs/tasks/PROJECT-WIDE-READINESS-BACKLOG-2026-07-15.md

## Objetivo
Elevar e padronizar testes, carga, seguranca, documentacao, operacao, release e evidencias em todo o AlwaysTrack antes de qualquer alegacao de prontidao.

## Estado observado
- API possui cobertura ampla, mas o gate agregado falha por fixture temporal expirada.
- Shared possui testes que nao participam do gate raiz.
- Web nao possui suite unitaria/de componentes.
- Extension e Host possuem bons testes locais, mas falta E2E MV3 real e validacao Windows/WSL.
- SmartScript possui cobertura rasa de CLI, filesystem e lifecycle.
- CI nao builda todos os artefatos nem aplica os controles de seguranca documentados.
- Carga de 1000 usuarios continua sem evidencia production-like; observabilidade e alertas nao foram exercitados de ponta a ponta.
- Retencao e redaction existem parcialmente, mas governanca LGPD e enforcement operacional estao incompletos.
- Rollout CaseFlow permanece NO-GO por gates live/manuais; estas tasks nao substituem esses gates.

## Regras
1. Evidencia deve ser classificada como fake, local, production-like ou live.
2. Demo, rollout interno e exposicao externa possuem decisoes separadas.
3. Gates CaseFlow existentes sao reutilizados; nao criar task duplicada para validacao live.
4. Nenhum segredo, cookie, HTML bruto ou dado pessoal entra em fixtures e relatorios.
5. Mudancas de qualidade devem falhar fechadas sem tornar o gate de PR impraticavel.

## Sequencia recomendada
- P0 imediato: TASK-AT-308, 309, 310, 311, 313, 317, 325, 330 e 333.
- Cobertura especializada: TASK-AT-312, 314 a 324, 327, 328, 332 e 334.
- Producao/release: TASK-AT-326 e 329, condicionadas ao ambiente autorizado.
- Fechamento: TASK-AT-335.

## Tasks
- `TASK-AT-308` - Prontidao: ledger canonico de cobertura, ownership e gates: Criar uma fonte unica e reconciliavel para componente, risco, owner, task, dependencia, gate e evidencia do projeto inteiro.
- `TASK-AT-309` - Qualidade: baseline deterministico e gate verde real: Eliminar a falha temporal atual e garantir que testes existentes de todos os workspaces participem do gate raiz.
- `TASK-AT-310` - Qualidade: contrato uniforme de lint, typecheck, test e build: Padronizar scripts e um gate raiz que valide fonte e artefatos compilados de todos os workspaces.
- `TASK-AT-311` - Web: fundacao de testes unitarios e de componentes: Cobrir componentes e regras criticas da SPA com testes isolados, deterministas e acessiveis.
- `TASK-AT-312` - Web e Companion: regressao de acessibilidade e teclado: Estabelecer gate de acessibilidade para teclado, foco, semantica, contraste e leitores de tela nas jornadas criticas.
- `TASK-AT-313` - E2E: matriz critica por role, viewport e jornada: Executar no CI as jornadas criticas comerciais, administrativas e CaseFlow em desktop e mobile.
- `TASK-AT-314` - UI: regressao visual e responsiva das superficies criticas: Detectar quebras visuais, overflow e sobreposicoes nas telas usadas diariamente e na apresentacao.
- `TASK-AT-315` - Coverage: thresholds incrementais por workspace e risco: Expandir coverage alem da API e impedir regressao em modulos alterados com metas incrementais realistas.
- `TASK-AT-316` - API: OpenAPI versionado e testes de contrato HTTP: Formalizar rotas criticas e detectar drift entre handlers, consumidores, exemplos e respostas runtime.
- `TASK-AT-317` - Companion: contrato de handshake, rotacao e reconexao: Eliminar drift entre Extension, Host e Shared e provar reconexao com token rotacionado sem replay.
- `TASK-AT-318` - Extensao MV3: E2E em Chromium com Host controlado: Validar a extensao carregada de verdade, incluindo service worker, content scripts, side panel, pairing e reconexao.
- `TASK-AT-319` - SmartScript Companion: E2E de CLI, filesystem e Espanso: Cobrir o ciclo start, status, process, import, export e falhas em diretorio temporario sem tocar dados reais.
- `TASK-AT-320` - Dados: integracao production-like de Postgres, Redis e storage: Provar migracoes, concorrencia, filas e storage contra dependencias equivalentes as de producao.
- `TASK-AT-321` - Integracoes externas: matriz de contratos, sandboxes e degradacao: Cobrir Google, Meta/WhatsApp, OpenAI e demais providers com mocks fiéis, sandbox quando disponivel e degradacao segura.
- `TASK-AT-322` - Robustez: property testing e fuzzing de parsers e protocolos: Encontrar falhas com entradas truncadas, extremas, duplicadas e estruturalmente inesperadas.
- `TASK-AT-323` - Performance: carga mista, stress, spike, soak e backpressure: Medir leitura, escrita, CaseFlow, filas e reconnect sob carga representativa e sustentada.
- `TASK-AT-324` - Observabilidade: SLOs, telemetria correlacionada e alertas exercitados: Transformar metricas locais em sinais operacionais com SLO, correlacao e alertas testaveis.
- `TASK-AT-325` - Seguranca: enforcement de SAST, SCA, secrets e licencas no CI: Materializar gates de seguranca automaticos com politica de excecao auditavel e prazo.
- `TASK-AT-326` - Release: containers, artefatos e proveniencia de supply chain: Produzir artefatos implantaveis, minimizados, escaneados, identificaveis e reversiveis.
- `TASK-AT-327` - Privacidade: inventario LGPD, bases legais e RIPD: Formalizar dados, finalidades, bases legais, papeis, retencao, subprocessadores e direitos do titular.
- `TASK-AT-328` - Privacidade: enforcement de retencao, purge e direitos do titular: Transformar politicas de retencao e exclusao em controles operacionais testados e auditaveis.
- `TASK-AT-329` - Operacao: ensaio de restore, recuperacao e rollback coordenado: Executar recuperacao isolada de banco, storage, configuracao, Host e Extension com RPO/RTO medidos.
- `TASK-AT-330` - Documentacao: integridade executavel de links, comandos e status: Detectar links quebrados, comandos obsoletos, metadata ausente e divergencia de status automaticamente.
- `TASK-AT-331` - Documentacao: catalogo unico e padrao de runbooks operacionais: Unificar descoberta, ownership e formato dos procedimentos de deploy, incidente, backup, migration, drift e rollback.
- `TASK-AT-332` - Runtime: readiness, shutdown gracioso e lifecycle de dependencias: Separar liveness/readiness e garantir encerramento controlado de HTTP, Prisma, Redis, jobs e WebSocket.
- `TASK-AT-333` - Evidencias: manifesto padrao e pacote reproduzivel de apresentacao: Padronizar evidencia com commit, ambiente, versoes, comandos, resultados, hashes, redaction e aprovacao.
- `TASK-AT-334` - Compatibilidade: browsers, Windows/WSL e perifericos de uso: Validar matriz real de OS, navegador, viewport, teclado, clipboard, rede, VPN/firewall e suspend/resume.
- `TASK-AT-335` - Gate final: prontidao transversal para demo, rollout e exposicao: Emitir decisoes separadas GO, GO-WITH-RISK ou NO-GO para demo, rollout interno e exposicao externa.

## Revisao de completude
A segunda passagem cruzou workspaces, banco, filas, storage, providers, containers, navegadores, Windows/WSL, rede, clipboard, acessibilidade, visual, performance, resiliência, privacidade, supply chain, recuperacao, docs, evidencias e rollout. Lacunas live continuam nas tasks existentes e aparecem como dependencias, nao como conclusoes.

