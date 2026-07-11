# SPEC-AT-004 - SmartScript

## Metadata
- status: accepted
- owner: product-builder
- last-updated: 2026-07-07
- source-of-truth: docs/specs/SPEC-AT-004-smartscript.md

## Objetivo unico
Definir o SmartScript como camada inteligente da Scriptoteca que captura material real do atendimento, gera candidatos de snippets pessoais, permite revisao humana e exporta snippets aprovados para uso operacional via Espanso.

## Contexto minimo
A Scriptoteca ja possui scripts canonicos, scripts pessoais, sugestoes, metricas de copia/uso e relacao com Fluxos de Atendimento. Ainda falta transformar mensagens repetidas do expediente em biblioteca viva com baixo atrito, mantendo AlwaysTrack como fonte da verdade e Espanso apenas como runtime/exportador.

## Escopo
- inclui: aba `Scriptoteca > SmartScript`, modelo persistido no AlwaysTrack para candidatos/snippets/decisoes/exports/metricas, companion local, captura por allowlist, processamento local, revisao humana, export manual para Espanso, uso medido e envio opcional ao fluxo canonico existente.
- nao inclui: produto separado da Scriptoteca, publicacao canonica automatica, provider externo obrigatorio de IA, keylogger generico, persistencia de logs brutos no banco do AlwaysTrack, alteracao silenciosa de snippet `Em uso`, triggers pessoais com `/`.

## Vocabulario
- SmartScript: camada da Scriptoteca responsavel por capturar, processar, sugerir, revisar, exportar e medir snippets pessoais.
- SmartScript Local Companion: processo local iniciado pelo usuario para capturar eventos permitidos, manter raw logs temporarios e gerar/importar candidatos.
- Raw log: material bruto local de clipboard/janela/textos/timestamps/origem/destino; nunca entra no banco do AlwaysTrack.
- Candidato: texto processado e sanitizado que pode virar snippet pessoal.
- Snippet pessoal SmartScript: script pessoal privado do atendente gerado, revisado ou usado pelo SmartScript.
- DecisionLog: registro interno das decisoes de aprovar, rejeitar, editar, mandar para revisao, exportar e sugerir canonizacao.
- Espanso: runtime/exportador dos snippets `Em uso`; nao e fonte da verdade.

## Regras de produto
1. O SmartScript nasce dentro da Scriptoteca.
2. AlwaysTrack e a fonte da verdade para candidatos, snippets aprovados, decisoes, exports, metricas e governanca.
3. Espanso e somente runtime/exportador.
4. Logs brutos ficam locais e nao entram no banco do AlwaysTrack.
5. Estados visiveis permitidos: `Em uso`, `Gerados hoje`, `Em revisão`.
6. Itens pendentes de `Gerados hoje` migram para `Em revisão` quando uma nova sessao/processamento substitui o ciclo anterior.
7. Snippet `Em uso` nunca e alterado diretamente por agente; qualquer mudanca vira proposta/revisao.
8. DecisionLog e aceito como mecanismo interno, sem criar estados visuais extras como `Manual` ou `Protegido`.
9. O SmartScript sugere no maximo 10 candidatos por processamento.
10. Triggers pessoais/exportaveis devem iniciar com `:`.
11. `/` fica reservado para comandos internos da Always/AlwaysTrack.
12. Snippet final nao pode conter CPF, telefone, email, endereco, numero real de pedido, codigo de rastreio, nome real de cliente, link sensivel especifico ou valor individualizado.
13. Aprovacao humana deve funcionar por botoes e por revisao numerada: `1 sim`, `2 nao`, `3 editar`, `4 revisao`.
14. Snippets aprovados podem seguir para o fluxo existente de sugestao canonica da Scriptoteca; nunca viram canonicos automaticamente.

## Fluxo alvo MVP
1. Usuario inicia o companion local.
2. Companion captura apenas eventos permitidos por allowlist.
3. Raw logs ficam locais com retencao curta.
4. Companion processa a sessao e gera ate 10 candidatos limpos.
5. Usuario importa candidatos para o AlwaysTrack.
6. Aba SmartScript mostra candidatos em `Gerados hoje`.
7. Usuario aprova, rejeita, edita ou envia para `Em revisão`.
8. Snippets aprovados entram em `Em uso`.
9. Usuario exporta snippets `Em uso` para Espanso.
10. Uso/export/copia alimentam metricas.
11. Usuario pode sugerir snippet `Em uso` para a Scriptoteca canonica.

## Recorte pos-MVP - nucleo real de logging
O MVP validou o ciclo de companion, fixture/eventos locais, processamento, importacao, revisao e export. Isso nao equivale a listener real continuo.

A Fase H (`TASK-AT-183` a `TASK-AT-193`) cobre o nucleo real de logging/captura:

1. contrato de eventos reais;
2. control plane local com start/stop/status/pause/resume;
3. resolucao de contexto ativo e allowlist;
4. adapter de clipboard/paste/envio;
5. bridge local de eventos AlwaysChat quando disponivel;
6. store local com TTL, dedupe e retencao;
7. pipeline de eventos reais para candidatos;
8. bootstrap no `npm run up`;
9. observabilidade redigida;
10. regressao de privacidade;
11. gate de captura real.

As restricoes originais permanecem: raw logs ficam locais, AlwaysTrack nao recebe raw logs, captura so ocorre com controle explicito do usuario e fontes fora da allowlist sao descartadas sem salvar texto.

## Dependencias
- satisfeitas: Scriptoteca operacional, scripts pessoais privados, sugestoes canonicas, metricas de uso, validacao runtime da Scriptoteca, Fluxos de Atendimento e permissao beta por role.
- satisfeitas no MVP: modelo SmartScript, endpoints dedicados, aba SmartScript, companion local, export Espanso e regressao fim a fim.
- em aberto para uso real continuo: nucleo real de logging/captura da Fase H (`TASK-AT-183` a `TASK-AT-193`).

## Alvos explicitos
1. `services/api/prisma/schema.prisma`
2. `services/api/src/core/script-library/`
3. `apps/web/src/views/script-library.tsx`
4. `packages/shared/src/`
5. `apps/smartscript-companion/` ou workspace equivalente definido na implementacao.
6. `docs/tasks/TASK-AT-168-*` a `docs/tasks/TASK-AT-182-*`
7. `docs/tasks/TASK-AT-183-*` a `docs/tasks/TASK-AT-193-*`

## Acceptance Criteria
1. Um atendente consegue capturar uma sessao local permitida, processar candidatos, importar para AlwaysTrack, revisar, aprovar, exportar para Espanso e usar snippets aprovados.
2. Apenas `Em uso`, `Gerados hoje` e `Em revisão` aparecem como estados de produto.
3. Raw logs nao sao persistidos no banco nem enviados ao AlwaysTrack.
4. Triggers com `/` sao rejeitados e triggers exportaveis exigem `:`.
5. Snippets finais passam por sanitizacao antes de aprovacao/export.
6. DecisionLog registra decisoes relevantes sem substituir auditoria operacional existente.
7. Snippets aprovados podem ser sugeridos ao fluxo canonico existente da Scriptoteca.

## Definition of Done
1. Todas as tasks `TASK-AT-168` a `TASK-AT-182` concluidas ou explicitamente substituidas por decisao documentada.
2. Para declarar captura real continua como ativa, todas as tasks `TASK-AT-183` a `TASK-AT-193` concluidas ou bloqueadas com decisao documentada.
3. Testes unitarios, API, frontend e E2E cobrem o ciclo principal.
4. Runbook local permite operar o companion e diagnosticar export Espanso.
5. Roadmap aponta SmartScript como pronto para uso.

## Validacao
- comandos/checks: `npm run typecheck --workspaces --if-present`, `npm run test --workspace @alwaystrack/api -- script-library`, `npm run test:e2e:api`, teste/smoke do companion local definido na task correspondente.
- revisao manual: executar ciclo capturar -> processar -> importar -> revisar -> aprovar -> exportar -> usar -> sugerir canonizacao.

## Evidencia esperada
- EXECs por task com comandos, prints quando houver UI e amostras sanitizadas sem dados reais.
- YAML Espanso gerado apenas com snippets `Em uso`.
- Consulta ou teste comprovando ausencia de raw logs no banco.

## Riscos e mitigacao
- risco: transformar Espanso em fonte paralela de verdade.
- mitigacao: export sempre derivado do AlwaysTrack e registrado por DecisionLog.
- risco: capturar dados sensiveis demais.
- mitigacao: allowlist local, raw logs temporarios e sanitizacao antes de persistir candidato/snippet final.
- risco: inflar estados e confundir atendente.
- mitigacao: manter apenas os tres estados visiveis aceitos.
