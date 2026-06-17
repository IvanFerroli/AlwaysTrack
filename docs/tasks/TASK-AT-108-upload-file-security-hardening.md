# TASK-AT-108 - Seguranca: hardening de uploads e arquivos

## Metadata
- status: completed
- owner: olympus_taskyfier
- last-updated: 2026-06-17
- source-of-truth: docs/tasks/TASK-AT-108-upload-file-security-hardening.md

## Modo
- mode: implementation

## Objetivo unico
Reduzir risco de arquivos maliciosos em DANFE, Wiki, imagens e futuros anexos.

## Contexto minimo
O AlwaysTrack recebe PDF/XML/imagens em DANFE e imagens na Wiki. O tamanho e limitado e os MIME types sao filtrados pelo parser Express, mas isso nao basta para seguranca forte:
- atacante pode mentir o `Content-Type`;
- arquivo pode ter extensao inocente e conteudo diferente;
- imagem pode carregar metadados sensiveis;
- PDF pode ser pesado, corrompido ou explorar parser;
- arquivo servido inline pode virar vetor se headers estiverem fracos.

## Inputs
- `services/api/src/core/sales-documents/sales-documents.service.ts`
- `services/api/src/core/wiki/wiki.service.ts`
- `services/api/src/core/documents/storage.ts`
- `services/api/src/core/documents/storage.provider.ts`
- `services/api/src/app.ts`
- `TASK-AT-101`

## Dependencias
- satisfeitas: storage local fora do webroot e `ensureSafeKey`.
- em aberto: `TASK-AT-103` para headers e `TASK-AT-106` para rate limit de upload.

## Alvos explicitos
1. Verificacao por magic bytes/conteudo real para PDF, XML, JPEG, PNG e WebP.
2. Teto de tamanho por tipo de arquivo.
3. Download/inline seguro com headers apropriados.
4. Registro de rejeicao por arquivo suspeito.
5. Testes com MIME mentiroso e arquivo invalido.

## Explicacao simples
Nao confie no cracha que o arquivo mostra. Verifique o conteudo. Um arquivo pode dizer "sou imagem", mas por dentro ser outra coisa.

## Fora de escopo
- Antivirus corporativo completo, salvo se houver decisao de produto/infra.
- OCR.
- Converter imagens/PDF no servidor.

## Checklist
1. Criar helper `detectAllowedFileType`.
2. Validar assinatura inicial do arquivo:
   - PDF com `%PDF`;
   - XML textual com raiz NF-e plausivel quando for DANFE XML;
   - PNG/JPEG/WebP por magic bytes.
3. Comparar tipo detectado com MIME recebido.
4. Garantir que SVG nao sera aceito como imagem.
5. Servir anexos com `X-Content-Type-Options: nosniff` e `Content-Disposition` seguro.
6. Considerar `Cache-Control: private` para anexos autenticados.
7. Adicionar testes unitarios para arquivos falsos.
8. Documentar limites e tipos aceitos.

## Acceptance Criteria
1. Upload com MIME falso e rejeitado.
2. PDF/XML/imagem legitimos continuam aceitos.
3. Anexos autenticados nao sao servidos com tipo inseguro.
4. Rejeicoes ficam visiveis em logs sem armazenar arquivo malicioso.
5. Limites por tipo estao documentados.

## Definition of Done
1. Helper compartilhado para validacao de arquivo.
2. DANFE e Wiki usando a mesma base.
3. Testes cobrindo casos validos e invalidos.
4. Docs atualizadas para futura task de imagens transversais.

## Validacao
- comandos/checks: `npm run test --workspace @alwaystrack/api -- upload`, `npm run test:e2e:api`
- revisao manual: subir XML/PDF real e imagem real.

## Evidencia esperada
- Teste "image/png com bytes de HTML" retornando 415.
- Teste "PDF real" seguindo fluxo normal.

## Riscos
- Magic byte simples pode rejeitar algum PDF/XML real gerado por sistema diferente.
- Validador de XML muito estrito pode atrapalhar DANFEs validas.

## Blockers possiveis
- Decisao se anexos futuros devem usar storage local ou provider externo.

## Retorno esperado
- Tabela de tipos aceitos e limites.
- Lista de rotas de upload protegidas.

## Resultado 2026-06-17

Tipos aceitos e limites por arquivo, sempre limitados tambem por `DOCUMENT_MAX_BYTES`:

| Tipo | MIME aceito | Limite |
| --- | --- | --- |
| PDF | `application/pdf` | 10 MB |
| XML NF-e | `application/xml`, `text/xml` | 2 MB |
| JPEG | `image/jpeg` | 5 MB |
| PNG | `image/png` | 5 MB |
| WebP | `image/webp` | 5 MB |

Rotas protegidas neste slice:
- `POST /v1/documents`
- `POST /v1/public-upload/:token`
- `POST /v1/sales/documents`
- `POST /v1/wiki/attachments`

Arquivos autenticados de documentos e anexos Wiki tambem passam a responder com `X-Content-Type-Options: nosniff` e `Cache-Control: private, max-age=0, must-revalidate`.
