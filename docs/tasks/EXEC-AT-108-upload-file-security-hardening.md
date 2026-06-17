# EXEC-AT-108 - Upload file security hardening

## Resultado
- status: completed
- date: 2026-06-17
- task: docs/tasks/TASK-AT-108-upload-file-security-hardening.md

## Entrega
Criado helper compartilhado de validacao por assinatura/conteudo real para uploads de PDF, XML NF-e, JPEG, PNG e WebP. Os fluxos de documentos, upload publico por token, DANFE comercial e anexos Wiki usam a mesma base antes de qualquer escrita em storage.

## Escopo coberto
1. `detectAllowedFileType` com magic bytes para PDF/JPEG/PNG/WebP e validacao textual de XML NF-e plausivel.
2. Comparacao entre MIME declarado e tipo detectado.
3. Limites por tipo: PDF 10 MB, XML 2 MB, imagens 5 MB, sempre respeitando `DOCUMENT_MAX_BYTES`.
4. Logs de rejeicao para documentos, DANFE e Wiki sem persistir arquivo suspeito.
5. Headers `nosniff` e cache privado em downloads autenticados de documentos e anexos Wiki.
6. Testes unitarios para arquivos validos, MIME mentiroso e SVG/XML nao aceito como imagem.

## Validacao
- `npm run test --workspace @alwaystrack/api -- documents.service.test.ts upload-tokens.service.test.ts sales-documents.service.test.ts wiki.service.test.ts`
- `npm run lint --workspace @alwaystrack/api`
- `git diff --check`

## Risco residual
- XML NF-e muito fora do padrao pode ser rejeitado; se aparecer exemplo real, ajustar o detector com fixture.
