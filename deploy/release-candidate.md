# Release Candidate Build And Provenance

## Metadata
- status: active-ci-validation-pending
- owner: platform-maintainers
- last-updated: 2026-07-15
- source-of-truth: deploy/release-candidate.md

## Artefatos
O candidato deve ser produzido de um commit limpo e conter:
- imagem OCI da API, executada como `node` e iniciada de `dist`;
- imagem OCI Web/Nginx sem privilegio, servindo em `8080`;
- pacote MV3 com o resultado do validador de build;
- pacote do Companion Host compilado;
- SBOM SPDX/CycloneDX e resultado de scan por imagem/pacote;
- `release-manifest.json` com commit, versao de protocolo, compatibilidade, tamanho e SHA-256.

## Gate
1. Rodar o gate de fonte, testes, builds e seguranca no mesmo commit.
2. Construir as duas imagens sem segredo em build arg, layer ou log.
3. Subir API e Web isoladamente, esperar health e exercitar `/health` e a SPA.
4. Escanear imagens e bloquear vulnerabilidade alta/critica sem excecao vigente.
5. Empacotar Extension e Host, gerar checksums e validar o manifesto.
6. Guardar artefatos em storage controlado e imutavel; nao versionar binarios no Git.

## Rollback
Rollback seleciona o manifesto anteriormente aprovado por SHA-256. Extension, Host e protocolo precisam estar na matriz de compatibilidade do mesmo manifesto. Credenciais, pairing e cookies nunca fazem parte de pacote ou backup.

## Estado local desta task
Fonte, builds TypeScript/Vite e inicio de API por `dist` podem ser validados localmente. O host atual nao possui Docker; build, smoke, SBOM e scan das imagens permanecem gate de CI e nao sao declarados aprovados.
