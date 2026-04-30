# TASK-UX-007 - Como usar robusto e ajuda contextual linkada

## Metadata
- status: done
- owner: taskyfier
- last-updated: 2026-04-30
- source-of-truth: docs/tasks/TASK-UX-007-como-usar-robusto-ajuda-linkada.md

## Modo
- mode: implementation

## Agentes sugeridos
- frontend implementer
- UX writer
- UX reviewer
- `olympus_task_verifier`

## Objetivo unico
Transformar a pagina `Como usar` e os icones de informacao em uma ajuda operacional robusta, acionavel e linkada, para que uma pessoa sem conhecimento tecnico consiga usar a V1 sem treinamento formal.

## Contexto minimo
O `Como usar` atual cobre apenas orientacao basica. Ele ainda deixa brechas para usuarios nao tecnicos, especialmente em filtros por ID, validacao de documentos, criacao de links de upload, notificacoes Meta/fake, relatorios, auditoria e configuracoes. Os icones `i` devem deixar de ser apenas tooltip solto e passar a apontar para secoes especificas da ajuda.

## Inputs
- `TASK-UX-003`
- `TASK-UX-004`
- `TASK-UX-005`
- `TASK-UX-006`
- `docs/operations/v1-demo-acceptance-2026-04-30.md`
- telas existentes em `apps/web/src/main.tsx`
- estilos existentes em `apps/web/src/styles.css`
- componentes compartilhados em `apps/web/src/components/operational.tsx`

## Dependencias
- satisfeitas: `TASK-UX-003`, `TASK-UX-004`, `TASK-UX-005`, `TASK-UX-006`
- em aberto: n/a

## Alvos explicitos
1. `apps/web/src/main.tsx`
2. `apps/web/src/components/operational.tsx`
3. `apps/web/src/styles.css`
4. conteudo da pagina autenticada `Como usar`

## Fora de escopo
- alterar API/backend
- criar video, tour guiado ou LMS
- mexer em `.env`, secrets Meta ou job de notificacoes
- internacionalizacao completa
- criar nova biblioteca visual pesada

## Requisitos de conteudo
1. `Como usar` deve ter secoes com anchors estaveis, no minimo:
   - `#visao-geral`
   - `#primeiro-acesso`
   - `#dashboard`
   - `#profissionais`
   - `#licencas`
   - `#documentos`
   - `#upload-publico`
   - `#notificacoes`
   - `#relatorios`
   - `#auditoria`
   - `#configuracoes`
   - `#perfis-e-permissoes`
   - `#problemas-comuns`
2. Cada secao deve explicar:
   - para que serve;
   - quem usa: Admin, RT, Supervisor;
   - passo a passo curto;
   - o que conferir antes de salvar/processar;
   - erros comuns e como resolver;
   - quando procurar suporte.
3. Linguagem deve assumir usuario leigo:
   - evitar jargao sem explicar;
   - explicar "ID" como "identificador interno";
   - explicar "provider fake" como "modo de teste sem envio real";
   - explicar Meta real sem expor segredo.
4. Conteudo deve ser operacional, nao marketing.

## Requisitos de interacao
1. Todo icone `i` contextual deve ter:
   - hover/focus com resumo curto;
   - clique ou Enter abrindo/navegando para a secao especifica do `Como usar`;
   - `aria-label` claro;
   - comportamento mobile sem depender apenas de hover.
2. Campos tecnicos devem linkar para anchors especificas:
   - filtros por ID -> `#filtros-e-ids` ou secao do modulo;
   - Template Meta -> `#notificacoes`;
   - link de upload -> `#upload-publico`;
   - validacao/recusa -> `#documentos`;
   - auditoria/metadados -> `#auditoria`;
   - roles/escopos -> `#perfis-e-permissoes`.
3. A pagina `Como usar` deve aceitar navegacao por hash e realcar brevemente a secao alvo quando acessada via clique no `i`.
4. A partir de qualquer tela autenticada, o usuario deve conseguir voltar ao `Como usar` em um clique.

## Checklist
1. Mapear todos os `InfoTip` existentes e decidir anchor de destino para cada um.
2. Evoluir o componente de ajuda contextual para aceitar `summary` e `href`.
3. Implementar clique acessivel no `i` sem quebrar formularios.
4. Reescrever `HelpView` com secoes detalhadas e anchors estaveis.
5. Adicionar sumario interno no topo do `Como usar`.
6. Adicionar exemplos concretos baseados no seed demo, sem tokens reais.
7. Revisar textos em desktop e mobile para nao virar parede ilegivel.
8. Validar teclado: Tab chega no `i`, Enter ativa o link.

## Acceptance Criteria
1. Uma pessoa nao tecnica consegue entender, pela pagina `Como usar`, como:
   - entrar;
   - ler o dashboard;
   - cadastrar/consultar profissionais;
   - acompanhar licencas;
   - gerar link de upload;
   - validar ou recusar documento;
   - consultar/exportar relatorios;
   - interpretar auditoria;
   - diferenciar notificacao fake de Meta real.
2. Todo `i` visivel mostra resumo no hover/focus e leva ao trecho correto do `Como usar` ao clicar.
3. Nenhum texto de ajuda expõe token, secret, Phone Number ID real, WABA ID real ou credencial.
4. A ajuda funciona para Admin, RT e Supervisor, escondendo ou contextualizando funcoes indisponiveis por perfil.
5. Layout continua legivel em mobile e desktop.
6. Build e check continuam verdes.

## Definition of Done
1. `Como usar` cobre todos os fluxos essenciais com passos concretos.
2. Ajuda contextual linkada existe nos campos/telas que mais geram duvida.
3. Anchors sao estaveis e documentados no proprio componente/conteudo.
4. Revisao manual feita nas telas: dashboard, profissionais, licencas, documentos, relatorios, auditoria, configuracoes e Como usar.

## Validacao
- `npm run build --workspace @sylembra/web`
- `npm run check`
- revisao manual desktop e mobile
- teste manual de teclado nos icones `i`
- clique em cada `i` leva ao anchor esperado

## Evidencia esperada
- lista de anchors criadas
- lista de icones `i` linkados e respectivos destinos
- prints ou descricao objetiva de desktop/mobile
- resultado dos comandos de validacao

## Riscos
- ajuda ficar longa demais e virar manual dificil de escanear
- excesso de links internos poluir formularios
- anchors quebrarem se secoes forem renomeadas
- instrucoes ficarem desatualizadas quando o fluxo mudar

## Blockers possiveis
- falta de glossario final aprovado
- duvida de negocio sobre termos de licenca, RT, supervisor e notificacao oficial

## Retorno esperado
- resumo curto do que mudou
- arquivos alterados
- anchors implementadas
- validacao executada
- riscos residuais
- sugestao de commit sem mencionar secrets

## Execucao 2026-04-30
- `Como usar` reescrito com sumario interno e anchors estaveis para todos os fluxos essenciais.
- Icones `i` em filtros e formularios passam a abrir a secao correspondente por clique ou teclado, mantendo resumo em hover/focus.
- Nenhum `.env`, segredo Meta, token, Phone Number ID real, WABA ID real ou job de notificacoes foi alterado.

## Evidencias 2026-04-30
- Anchors implementadas: `#visao-geral`, `#primeiro-acesso`, `#dashboard`, `#profissionais`, `#licencas`, `#documentos`, `#upload-publico`, `#notificacoes`, `#relatorios`, `#auditoria`, `#configuracoes`, `#perfis-e-permissoes`, `#filtros-e-ids`, `#problemas-comuns`.
- Validacao executada: `npm run build --workspace @sylembra/web` e `npm run check`.
