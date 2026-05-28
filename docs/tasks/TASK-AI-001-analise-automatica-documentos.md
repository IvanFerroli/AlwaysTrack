# TASK-AI-001 - Analise automatica de documentos por OCR/IA

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-05-05
- source-of-truth: docs/tasks/TASK-AI-001-analise-automatica-documentos.md

## Modo
- mode: implementation

## Entrega MVP implementada
- Criado modulo `services/api/src/core/document-ai`.
- Criada entidade Prisma `DocumentAiExtraction` e migration `20260505130000_document_ai_extractions`.
- Criados endpoints:
  - `POST /v1/documents/:documentId/analyze`
  - `GET /v1/documents/:documentId/analysis`
  - `POST /v1/documents/:documentId/analysis/apply`
- Criado provider encapsulado com fallback `fake` e provider `openai` configuravel por env.
- UI de Documentos recebeu botoes `Analisar`, `Ver analise` e painel de revisao com campos/confianca/avisos.
- Aplicacao de sugestoes atualiza profissional/licenca somente apos clique humano e registra auditoria `document_ai.apply`.
- Escopo de acesso segue o documento: Admin/RT autorizados; Supervisor nao executa IA.
- O fluxo manual de upload/validacao permanece intacto.

## Configuracao operacional
- Para extracao real, configurar sem commitar:
  - `DOCUMENT_AI_PROVIDER=openai`
  - `OPENAI_API_KEY=...`
  - opcional: `DOCUMENT_AI_MODEL=gpt-4.1-mini`
- Sem essas envs, o provider `fake` responde com aviso e nao envia documento a terceiros.
- A imagem/PDF nao e logada em console nem gravada no resultado da extracao; o sistema armazena apenas JSON estruturado e `rawText` retornado pelo provider.

## Objetivo unico
Extrair automaticamente dados estruturados de imagens/PDFs de documentos profissionais enviados ao SyLembra, para pre-preencher cadastro de profissional/licenca e reduzir digitacao manual, mantendo revisao humana obrigatoria antes de salvar ou validar.

## Contexto minimo
O usuario enviou exemplo de carteira profissional do Conselho Federal de Enfermagem. O documento contem dados como:

- nome civil;
- tipo/titulo profissional;
- numero de inscricao;
- conselho/emissor;
- UF;
- nacionalidade/naturalidade;
- assinatura/foto;
- possiveis datas ou elementos visuais.

Hoje o gestor precisa cadastrar manualmente profissional, licenca, numero, emissor/UF e datas. A feature desejada e analisar a imagem automaticamente e sugerir campos.

## Inputs
- Exemplo visual: carteira de tecnica de enfermagem COFEN/COREN PB.
- Fluxos existentes:
  - upload publico por token;
  - upload administrativo de documento;
  - validacao de documento;
  - CRUD de profissionais;
  - CRUD de licencas.
- Codigo atual:
  - `services/api/src/core/documents/*`
  - `services/api/src/core/professionals/*`
  - `services/api/src/core/licenses/*`
  - `apps/web/src/main.tsx`

## Dependencias
- satisfeitas: `TASK-FIL-001`, `TASK-FIL-002`, `TASK-FIL-003`, `TASK-FIL-004`, `TASK-PRO-001`, `TASK-LIC-001`
- em aberto:
  - decisao de provedor de IA/OCR;
  - politica de retencao de imagens e resultados;
  - revisao LGPD para dados pessoais e biometria/foto.

## Alvos explicitos
1. Novo modulo backend `services/api/src/core/document-ai` ou equivalente.
2. Prisma/schema para armazenar resultado de extracao, se necessario.
3. Endpoints administrativos de analise e revisao.
4. Tela Documentos para ver sugestoes extraidas.
5. Tela Profissionais/Licencas para aplicar sugestoes.
6. Testes unitarios com fixtures anonimizadas.
7. Documentacao operacional em `docs/tasks` e Como usar.

## Fora de escopo
- Salvar dados extraidos automaticamente sem confirmacao humana.
- Validar autenticidade juridica do documento.
- Reconhecimento facial/biometria.
- Consultar conselho externo em tempo real.
- Treinar modelo proprio na V1.
- Expor documentos ou dados sensiveis a logs.

## Decisao recomendada de MVP
Fase 1 deve ser "assistida":

1. Usuario envia imagem/PDF.
2. Admin/RT clica `Analisar documento`.
3. Backend envia arquivo para provedor OCR/visao configurado.
4. Backend recebe JSON estruturado com confiancas por campo.
5. UI mostra sugestoes lado a lado com cadastro atual.
6. Usuario escolhe `Aplicar ao profissional/licenca` ou descarta.
7. Auditoria registra quem aplicou e quais campos foram alterados, sem logar imagem nem prompt completo.

## Campos alvo do MVP
Campos que a IA deve tentar extrair:

- `professionalName`
- `licenseTypeName`
- `licenseNumber`
- `issuer`
- `uf`
- `documentKind`
- `rawText`
- `confidenceByField`
- `warnings`

Campos opcionais se presentes no documento:

- `cpf`
- `issuedAt`
- `expiresAt`
- `birthDate`
- `nationality`
- `naturalPlace`

Observacao: no exemplo enviado, vencimento pode nao estar visivel. O sistema deve aceitar campo ausente e mostrar "nao encontrado", sem inventar data.

## Formato JSON sugerido
```json
{
  "documentKind": "professional_license",
  "professionalName": { "value": "ISABELE PEREIRA SOUSA", "confidence": 0.92 },
  "licenseTypeName": { "value": "TECNICA DE ENFERMAGEM", "confidence": 0.91 },
  "licenseNumber": { "value": "001.289.925", "confidence": 0.88 },
  "issuer": { "value": "COREN", "confidence": 0.72 },
  "uf": { "value": "PB", "confidence": 0.89 },
  "issuedAt": { "value": null, "confidence": 0 },
  "expiresAt": { "value": null, "confidence": 0 },
  "rawText": "texto OCR normalizado",
  "warnings": [
    "Documento fotografado rotacionado.",
    "Data de vencimento nao encontrada."
  ]
}
```

## Checklist
1. Pesquisa/decisao tecnica
   - Escolher provedor inicial: OpenAI vision, Google Vision, AWS Textract, Tesseract local ou outro.
   - Definir se imagens saem do ambiente e quais termos LGPD se aplicam.
   - Definir limites de tamanho, tipos e custo.

2. Modelo de dados
   - Criar entidade para resultado de analise, por exemplo `DocumentAiExtraction`.
   - Relacionar com `Document`.
   - Armazenar status: `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`, `DISCARDED`, `APPLIED`.
   - Armazenar JSON estruturado e versao do provedor/modelo.

3. Backend
   - Endpoint `POST /v1/documents/:documentId/analyze`.
   - Endpoint `GET /v1/documents/:documentId/analysis`.
   - Endpoint `POST /v1/documents/:documentId/analysis/apply`.
   - Sanitizar logs e erros.
   - Registrar auditoria: `document_ai.analyze`, `document_ai.apply`, `document_ai.discard`.

4. UI
   - Botao `Analisar documento` na fila de documentos.
   - Estado de processamento.
   - Tela/painel com campos extraidos, confianca e alertas.
   - Botao para aplicar sugestoes em profissional/licenca.
   - Mostrar diffs antes de aplicar.

5. Validacao humana obrigatoria
   - Campo com baixa confianca deve ficar destacado.
   - Nenhuma alteracao deve ser aplicada sem clique do usuario.
   - Se houver conflito com dados existentes, exigir confirmacao clara.

6. Qualidade e fallback
   - Aceitar imagem rotacionada/desfocada e retornar aviso.
   - Permitir reprocessar documento.
   - Permitir descartar resultado.
   - Manter fluxo manual intacto.

7. Segurança/LGPD
   - Nao logar imagem, OCR completo em console ou tokens.
   - Evitar armazenar dados biometricos/foto extraidos.
   - Documentar que IA auxilia, mas nao valida autenticidade.
   - Garantir escopo por organizacao/RT igual ao documento.

## Acceptance Criteria
1. Admin/RT autorizado consegue solicitar analise de um documento enviado.
2. Sistema retorna sugestoes estruturadas para nome, tipo, numero, emissor e UF quando visiveis.
3. Sistema mostra campos ausentes como "nao encontrado", sem inventar valores.
4. Resultado tem confianca/alertas suficientes para revisao humana.
5. Usuario pode aplicar sugestoes ao profissional/licenca somente apos confirmacao.
6. Aplicacao das sugestoes registra auditoria com campos alterados.
7. Fluxo manual continua funcionando mesmo se IA falhar.
8. Logs nao contem imagem, token, prompt completo ou dados sensiveis desnecessarios.
9. Testes cobrem parsing, autorizacao, falha de provedor e aplicacao de sugestoes.

## Definition of Done
1. Provider OCR/IA encapsulado atras de interface.
2. Endpoints administrativos protegidos por escopo.
3. UI de revisao implementada.
4. Auditoria implementada.
5. Documentacao Como usar atualizada.
6. Validacao manual com pelo menos 3 documentos:
   - foto rotacionada;
   - imagem legivel;
   - imagem ruim ou incompleta.

## Validacao
- comandos/checks:
  - `npm run typecheck --workspace @alwaystrack/api`
  - `npm run typecheck --workspace @alwaystrack/web`
  - testes focados do modulo `document-ai`
  - `npm run build --workspace @alwaystrack/web`
- revisao manual:
  - upload de documento por token;
  - analisar documento;
  - conferir sugestoes;
  - aplicar sugestoes;
  - verificar profissional/licenca atualizados;
  - conferir auditoria.

## Evidencia esperada
- Print do painel de analise com campos extraidos.
- JSON sanitizado de exemplo, sem imagem e sem token.
- Auditoria `document_ai.apply`.
- Testes passando.

## Riscos
- OCR errar nome/numero e induzir cadastro incorreto.
- Documento conter foto/assinatura e envolver dado sensivel.
- Custo de provedor de IA crescer com volume.
- Latencia de analise prejudicar UX.
- Dependencia externa ficar indisponivel.
- Variacao grande de carteiras por conselho/UF.

## Blockers possiveis
- Escolha de provedor e custos.
- Politica LGPD para envio de imagem a terceiros.
- Necessidade de fila assíncrona se processamento for lento.
- Ausencia de documentos reais variados para teste.

## Retorno esperado
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado

## Evidencia de validacao
- `npx prisma validate --schema services/api/prisma/schema.prisma`
- `npm run prisma:generate`
- `npm run typecheck --workspace @alwaystrack/api`
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run test --workspace @alwaystrack/api -- notifications.service.test.ts documents.service.test.ts document-ai.service.test.ts`

## Ressalvas do MVP
- Nao foi feita validacao real com documento via OpenAI nesta rodada porque nenhuma `OPENAI_API_KEY` foi configurada no ambiente pelo agente.
- `prisma migrate deploy` encontrou banco local nao baselineado (`P3005`); a migration SQL foi mantida no repo e o schema foi validado.
- Ainda falta revisao LGPD formal antes de ativar envio de imagens a provedor externo em producao.
