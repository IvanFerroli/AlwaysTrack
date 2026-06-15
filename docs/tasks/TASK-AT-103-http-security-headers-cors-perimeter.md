# TASK-AT-103 - Seguranca: headers HTTP, CORS e perimetro web

## Metadata
- status: proposed
- owner: olympus_taskyfier
- last-updated: 2026-06-15
- source-of-truth: docs/tasks/TASK-AT-103-http-security-headers-cors-perimeter.md

## Modo
- mode: implementation

## Objetivo unico
Endurecer a borda HTTP do AlwaysTrack com headers de seguranca, CORS estrito e configuracao segura de proxy/deploy.

## Contexto minimo
Hoje o `services/api/src/app.ts` configura CORS manualmente quando `CORS_ORIGIN` existe, mas nao ha camada dedicada para headers como `Content-Security-Policy`, `X-Frame-Options`, `Referrer-Policy`, `X-Content-Type-Options` e `Permissions-Policy`. O `deploy/nginx.conf` tambem e minimo.

Esses headers reduzem danos de ataques comuns:
- Clickjacking: site malicioso coloca o AlwaysTrack dentro de iframe invisivel.
- MIME sniffing: navegador tenta interpretar arquivo como outro tipo.
- XSS: script injetado consegue executar porque nao ha politica restritiva.
- Vazamento por referrer: URL interna vai parar em outro dominio.

## Inputs
- `services/api/src/app.ts`
- `services/api/src/config/env.ts`
- `deploy/nginx.conf`
- `Dockerfile.web`
- `apps/web/index.html`

## Dependencias
- satisfeitas: `TASK-AT-102` recomendada para confirmar risco e politica.
- em aberto: definir dominio final do app/API para CSP/CORS de producao.

## Alvos explicitos
1. Middleware de headers de seguranca na API.
2. Configuracao Nginx para SPA com headers seguros.
3. Guard de CORS para recusar origem inesperada em producao.
4. Testes unitarios ou smoke de headers.
5. Documentacao de envs de seguranca.

## Explicacao simples
CORS diz "qual site pode chamar minha API pelo navegador". Headers de seguranca dizem "como o navegador deve tratar minhas paginas e respostas". Eles nao substituem login e permissao, mas criam uma cerca ao redor do produto.

## Fora de escopo
- Implementar autenticacao nova.
- Criar WAF.
- Resolver CSRF; isso fica em `TASK-AT-105`.

## Checklist
1. Avaliar adicao de `helmet` ou middleware proprio enxuto.
2. Definir headers minimos para API JSON.
3. Definir headers minimos para web/Nginx.
4. Tornar CORS fail-closed em producao: sem `CORS_ORIGIN` valido, API nao deve aceitar navegador externo.
5. Garantir `Access-Control-Allow-Credentials` somente para origem confiavel.
6. Adicionar teste que chama `/health` e uma rota autenticada verificando headers.
7. Atualizar `scripts/check-env.js` para validar `CORS_ORIGIN` HTTPS em producao.

## Acceptance Criteria
1. Respostas HTTP incluem headers de seguranca basicos.
2. CORS aceita somente a origem configurada.
3. Preflight `OPTIONS` continua funcionando para a origem correta.
4. Origem nao permitida nao recebe CORS permissivo.
5. Nginx da SPA tambem envia headers seguros.
6. Docs explicam o que cada header protege em linguagem simples.

## Definition of Done
1. Middleware aplicado sem quebrar frontend local.
2. Testes cobrem headers e CORS.
3. `env:check --production` valida URLs publicas seguras.
4. Roadmap aponta tarefa como concluida quando validada.

## Validacao
- comandos/checks: `npm run test --workspace @alwaystrack/api -- security`, `npm run typecheck --workspace @alwaystrack/api`, `npm run build --workspace @alwaystrack/web`
- revisao manual: abrir app local e confirmar login/API sem erro de CORS.

## Evidencia esperada
- Saida de teste mostrando headers esperados.
- Trecho de docs com politica de CORS/CSP.

## Riscos
- CSP restritiva demais pode quebrar app, favicon, imagens ou popup Google.
- CORS mal configurado pode bloquear login em ambiente real.

## Blockers possiveis
- Dominio final ainda indefinido.
- App e API em dominios diferentes sem HTTPS configurado.

## Retorno esperado
- Lista dos headers adicionados.
- Observacoes de compatibilidade com Google login e assets locais.
