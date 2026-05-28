# TASK-IMP-002 - Modelo Google Sheets nativo com dropdowns baseados no banco

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-05-28
- source-of-truth: docs/tasks/TASK-IMP-002-modelo-google-sheets-nativo.md

## Modo
- mode: verification

## Objetivo unico
Adicionar um fluxo opcional de geracao de modelo nativo no Google Sheets, com dropdowns alimentados por dados reais do banco, para reduzir erro humano no preenchimento de profissionais/licencas antes da exportacao final para CSV.

## Contexto minimo
O projeto ja possui:
- importador CSV autenticado para profissionais/licencas;
- template CSV simples;
- modelo XLSX guiado com listas para Excel;
- validacao backend baseada no contrato CSV atual.

Porem, ao abrir o XLSX no Google Sheets, as validacoes/dropdowns nao aparecem de forma confiavel. Como parte do publico operacional trabalha no ecossistema Google, precisamos planejar um fluxo novo que gere uma Google Sheet nativa via Google Sheets API, usando dropdowns nativos do Google e dados atuais do banco.

Decisao importante desta task:
- Google Sheet sera apenas um **modelo assistido de preenchimento**;
- o importador CSV atual continua sendo a fonte final de importacao nesta etapa;
- CSV/XLSX atuais nao devem ser removidos.

## Problema
O fluxo atual exige que o operador conheca e digite manualmente:
- nomes exatos de unidade;
- nomes exatos de setor;
- email exato de RT;
- tipo de licenca valido;
- status valido.

Isso aumenta erro de digitacao, falha de validacao e atrito de onboarding. O XLSX atual ajuda no Excel, mas nao atende com confiabilidade no Google Sheets.

## Inputs
- Contrato atual do importador CSV:
  - `professional_name,cpf,email,phone,position,unit_name,sector_name,rt_email,license_type,license_number,issuer,uf,issued_at,expires_at,status,notes`
- Dropdowns desejados:
  - `unit_name`: unidades ativas da organizacao
  - `sector_name`: setores ativos da organizacao
  - `rt_email`: usuarios ativos com role `RT`
  - `license_type`: tipos de licenca ativos
  - `status`: statuses permitidos pelo dominio atual
- Envs previstos:
  - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
  - `GOOGLE_PRIVATE_KEY`
  - `GOOGLE_SHEETS_TEMPLATE_SHARE_EMAIL`
  - `GOOGLE_SHEETS_TEMPLATE_SHARE_ROLE=writer`
- Alternativa local prevista:
  - `GOOGLE_APPLICATION_CREDENTIALS=/caminho/absoluto/para/service-account.json`

## Dependencias
- satisfeitas:
  - `TASK-IMP-001` importacao CSV de profissionais e licencas
  - `TASK-ORG-001` organizacoes, unidades e setores
  - `TASK-USR-001` usuarios administrativos e perfil RT
  - `TASK-LIC-001` tipos de licenca
  - `TASK-AUT-001` autenticacao e sessao
  - `TASK-AUT-002` roles e escopo
- em aberto:
  - definicao operacional das credenciais Google no ambiente
  - projeto Google Cloud com Sheets API e Drive API habilitadas
  - estrategia de compartilhamento da planilha gerada

## Dependencias tecnicas
- Google Sheets API
- Google Drive API
- credencial de service account com permissao de criacao/edicao
- mapeamento do status permitido a partir do dominio/schema atual

## APIs necessarias
- Google Sheets API
- Google Drive API

## Dados usados do banco
O backend deve buscar no banco da organizacao autenticada:
- unidades ativas
- setores ativos
- usuarios ativos com role `RT`
- tipos de licenca ativos
- statuses validos do dominio compartilhado

## Fluxo esperado
1. Usuario autenticado solicita geracao de modelo Google Sheets.
2. Backend busca no banco:
   - unidades
   - setores
   - RTs ativos
   - tipos de licenca
   - statuses permitidos
3. Backend cria uma planilha Google Sheets.
4. Cria aba `Modelo`.
5. Cria aba `Listas`.
6. Preenche `Modelo` com os headers obrigatorios do importador atual.
7. Preenche `Listas` com os valores vindos do banco.
8. Aplica validacoes nativas do Google Sheets nas colunas:
   - `unit_name`
   - `sector_name`
   - `rt_email`
   - `license_type`
   - `status`
9. Congela a primeira linha.
10. Aplica estilo simples no header.
11. Compartilha a planilha com `GOOGLE_SHEETS_TEMPLATE_SHARE_EMAIL`, se configurado.
12. Retorna `spreadsheetId` e `spreadsheetUrl`.
13. O usuario preenche a planilha no Google Sheets.
14. Depois exporta/baixa como CSV.
15. O CSV continua sendo importado pelo importador atual.

## Endpoints sugeridos
Seguindo o padrao atual do backend:
- `GET /v1/imports/professionals-licenses/template/google-sheet`

Resposta sugerida:
- `spreadsheetId`
- `spreadsheetUrl`
- `sharedWith`
- `expiresAt` apenas se houver politica futura de limpeza

Observacao:
- nao implementar agora;
- nao usar o prefixo `/api` se o backend atual continuar padronizado em `/v1`.

## Services sugeridos
- `services/api/src/core/imports/google-sheets-template.service.ts`
  - gerar planilha
  - preencher abas
  - aplicar validacoes
  - compartilhar arquivo via Drive API
- `services/api/src/core/imports/google-sheets-auth.service.ts`
  - resolver credenciais
  - montar cliente Google autenticado
- `services/api/src/core/imports/imports.handlers.ts`
  - novo handler para disparar geracao

Observacao:
- estes arquivos sao apenas sugestao de encaixe arquitetural;
- nada deve ser implementado nesta rodada.

## Alvos explicitos
1. `docs/tasks/TASK-IMP-002-modelo-google-sheets-nativo.md`
2. `docs/tasks/ROADMAP.md`

## Escopo
- documentar o novo fluxo de Google Sheets nativo
- mapear dependencias com importador atual
- definir envs e APIs necessarias
- definir dados do banco que alimentam dropdowns
- definir endpoint e services sugeridos
- definir riscos, mitigacoes e criterio de aceite

## Fora de escopo
- importar direto do Google Sheets
- OAuth por usuario final
- salvar planilha no Drive do cliente final como fluxo principal
- alterar o fluxo atual de CSV
- remover geracao XLSX atual
- criar automacao de atualizacao continua da planilha
- mexer em billing Google Cloud
- commitar credenciais
- implementar agora
- refatorar o importador CSV atual

## Checklist
1. Confirmar padrao de task/roadmap do projeto
2. Mapear pontos atuais de importacao em backend/frontend
3. Registrar o problema de compatibilidade do XLSX no Google Sheets
4. Descrever o fluxo futuro de geracao nativa via Sheets API
5. Registrar envs, APIs, dados do banco e riscos
6. Atualizar roadmap com a task proposta

## Acceptance Criteria
1. Existe uma task formal documentando o fluxo futuro de Google Sheets nativo.
2. A task lista com clareza:
   - problema
   - objetivo
   - escopo
   - fora de escopo
   - dependencias tecnicas
   - envs necessarias
   - APIs necessarias
   - dados do banco usados
   - fluxo esperado
   - endpoints sugeridos
   - services sugeridos
   - riscos e mitigacoes
3. A task deixa explicito que:
   - CSV atual nao sera removido
   - XLSX atual nao sera removido
   - importador atual nao deve ser refatorado nesta task
   - nenhuma credencial deve ser commitada

## Definition of Done
1. Arquivo da task criado no padrao `TASK-IMP-###`.
2. Roadmap atualizado com a nova task.
3. Nenhum arquivo de producao alterado.
4. Nenhuma dependencia instalada nesta rodada.
5. Nenhuma env real, migration, controller, service ou rota implementada.

## Execucao
- Normalizada como concluida apos verificacao material em 2026-05-28.
- A implementacao existente cobre a geracao de Google Sheet nativo via `services/api/src/core/imports/google-sheets-template.service.ts`.
- O endpoint `GET /v1/imports/professionals-licenses/template/google-sheet` esta registrado em `services/api/src/app.ts` e delegado por `services/api/src/core/imports/imports.handlers.ts`.
- As listas de unidades, setores, RTs, tipos de licenca e status sao carregadas do contrato atual do importador.
- A planilha gera abas `Modelo` e `Listas`, escreve headers, congela header, esconde `Listas` e aplica validacoes nativas por coluna.
- O fluxo preserva CSV/XLSX como caminhos existentes e nao transforma Google Sheets em fonte canonica de importacao.

## Evidencias
- `services/api/src/core/imports/google-sheets-template.service.ts`
- `services/api/src/core/imports/google-sheets-template.service.test.ts`
- `services/api/src/core/imports/imports.handlers.ts`
- `services/api/src/app.ts`
- `services/api/src/config/env.ts`
- `npm run check`
- `npm run build --workspace @sylembra/web`

## Riscos residuais
- Smoke real com Google Sheets/Drive depende de credenciais e APIs habilitadas fora do repositorio.
- Service Account em Meu Drive pessoal segue fragil para alguns cenarios; OAuth por usuario e tratado em `TASK-IMP-003`.
- Dropdown global de `sector_name` ainda depende da validacao backend final para bloquear combinacoes invalidas.

## Plano de teste manual
- revisar a task com quem vai operar o fluxo
- confirmar que o fluxo futuro faz sentido para usuario de Google Sheets
- confirmar que a exportacao final continua sendo CSV
- confirmar que os dropdowns previstos cobrem os campos relacionais mais sensiveis

## Plano de verificacao tecnica
- conferir consistencia entre a task e o contrato CSV atual
- conferir consistencia entre a task e as rotas/importador ja existentes
- conferir consistencia entre a task e os tracks do roadmap
- revisar seguranca das credenciais e forma de compartilhamento da planilha

## Evidencia esperada
- task criada em `docs/tasks`
- roadmap contendo a nova task em `IMP`
- descricao explicita de nao implementacao nesta rodada

## Riscos
- Google Sheets API e Drive API exigem credenciais e permissao corretas
- `GOOGLE_PRIVATE_KEY` mal formatada em env costuma quebrar autenticacao
- valores grandes ou dinamicos podem exigir cuidados com limites da API
- dropdown global de `sector_name` pode permitir selecao de setor que nao pertence a unidade
- Google Sheets introduz superficie adicional de seguranca e operacao

## Mitigacoes
- manter o importador CSV atual como motor final de validacao
- tratar `sector_name` global apenas como MVP e manter validacao backend
- documentar claramente o formato de private key
- jamais commitar JSON de service account ou credenciais em `.env.example`
- usar compartilhamento opcional por env e nao hardcoded

## Observacoes de seguranca
- `GOOGLE_PRIVATE_KEY` deve ser tratada como secret sensivel
- se usar `GOOGLE_APPLICATION_CREDENTIALS`, o caminho deve apontar para arquivo local/seguro fora do versionamento
- nao commitar JSON de Service Account
- nao expor private key em logs, erros serializados, docs publicas ou commits
- preferir armazenamento em secret manager ou env segura no deploy

## Blockers possiveis
- projeto Google Cloud nao provisionado
- Sheets API/Drive API nao habilitadas
- service account sem permissao de criacao/compartilhamento
- incerteza sobre destino/ownership das planilhas geradas

## Observacoes arquiteturais
- o endpoint novo deve ser adicional ao fluxo atual, nunca substitutivo
- CSV atual nao deve ser removido
- XLSX atual nao deve ser removido
- o importador atual nao deve ser refatorado nesta task
- a Google Sheet deve ser tratada como modelo assistido, nao como fonte canonica

## Proximo passo recomendado
1. Validar a task com o responsavel pelo fluxo operacional
2. Decidir se o suporte oficial da primeira implementacao e Google Sheets puro ou Excel + Google como melhor-esforco
3. Abrir a execucao tecnica em uma rodada separada, com secrets e projeto Google preparados

## Retorno esperado
- resumo curto do plano de Google Sheets nativo
- confirmacao de que o importador CSV continua intocado
- riscos de credencial/compatibilidade explicitados
- proximo passo de implementacao separado desta task
