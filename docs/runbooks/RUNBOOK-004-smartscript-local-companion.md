# RUNBOOK-004 - SmartScript Local Companion

## Metadata
- status: active
- owner: olympus_taskyfier
- last-updated: 2026-07-07
- source-of-truth: docs/runbooks/RUNBOOK-004-smartscript-local-companion.md

## Objetivo
Operar o SmartScript ponta a ponta: capturar material permitido localmente, processar candidatos, importar para o AlwaysTrack, revisar na Scriptoteca, exportar para Espanso, registrar uso e sugerir snippets aprovados para canonizacao.

## Principios obrigatorios
1. AlwaysTrack e a fonte da verdade.
2. Espanso e somente runtime/exportador.
3. Raw logs ficam no companion local e nao entram no banco.
4. Captura so ocorre quando o companion e iniciado pelo usuario.
5. Captura usa allowlist.
6. Estados visiveis sao apenas `Em uso`, `Gerados hoje` e `Em revisão`.
7. Triggers pessoais usam `:`.
8. `/` fica reservado para comandos internos.
9. Copia explicita (`COPY_ONLY`) e o modo padrao e nao depende de Espanso.
10. Exportacao Espanso (`ESPANSO_EXPORT`) e opcional e nao substitui o compilador de mensagens CaseFlow.

## Pre-requisitos
1. AlwaysTrack rodando localmente.
2. Usuario autenticado com acesso a Scriptoteca.
3. Variaveis do companion quando for importar/exportar:
   - `ALWAYSTRACK_API_URL`, padrao `http://localhost:3333`.
   - `ALWAYSTRACK_API_COOKIE` ou `ALWAYSTRACK_SESSION_COOKIE`, quando quiser reutilizar uma sessao ja autenticada.
   - `ALWAYSTRACK_API_TOKEN`, apenas quando o backend local suportar bearer token.
   - `ALWAYSTRACK_EMAIL` e `ALWAYSTRACK_PASSWORD`, opcionais para `npm run smartscript:login`.
   - `SMARTSCRIPT_DATA_DIR`, opcional; padrao `~/.alwaystrack/smartscript`.
4. Espanso instalado se o export for validado no runtime real.

## Comandos
```bash
npm run up
npm run up -- --no-smartscript
npm run up -- --no-smartscript-demo
npm run smartscript:status
npm run smartscript:login -- --email operador@example.com --password senha
npm run smartscript:espanso
npm run smartscript:bootstrap
npm run smartscript:demo
npm run smartscript:import
npm run smartscript:export
npm run smartscript:stop
```

```bash
npm run smoke --workspace @alwaystrack/smartscript-companion
npm run test --workspace @alwaystrack/smartscript-companion
```

```bash
npx tsx apps/smartscript-companion/src/cli.ts start
npx tsx apps/smartscript-companion/src/cli.ts status
npx tsx apps/smartscript-companion/src/cli.ts login --email operador@example.com --password senha
npx tsx apps/smartscript-companion/src/cli.ts capture-fixture --fixture ./path/to/events.json --today
npx tsx apps/smartscript-companion/src/cli.ts process --today
npx tsx apps/smartscript-companion/src/cli.ts import --today
npx tsx apps/smartscript-companion/src/cli.ts export-espanso
npx tsx apps/smartscript-companion/src/cli.ts logout
npx tsx apps/smartscript-companion/src/cli.ts stop
```

## Fixture de captura
Use apenas fixtures anonimas. Formato:

```json
[
  {
    "id": "evt-1",
    "timestamp": "2026-07-06T12:00:00.000Z",
    "type": "alwayschat-sent",
    "source": "AlwaysChat",
    "destination": "AlwaysChat",
    "text": "Mensagem operacional anonima de exemplo."
  }
]
```

Eventos fora da allowlist sao descartados. O status mostra contagem e tamanho, nao o texto bruto.

Fixture anonima versionada para demo:

```bash
npm run smartscript:demo
```

Esse comando carrega `apps/smartscript-companion/fixtures/alwayschat-sample.json`, reescreve os timestamps para hoje e processa os candidatos do dia.

## Fluxo operacional
1. Iniciar companion.
   - No fluxo local padrao, `npm run up` ja executa start, preparo do Espanso, login local, demo/import idempotente e export dos itens `Em uso` existentes.
   - Para subir o app sem companion, use `npm run up -- --no-smartscript`.
   - Para subir com companion mas sem fixture demo/import automatico, use `npm run up -- --no-smartscript-demo`.
2. Capturar eventos permitidos por allowlist quando houver captura real.
3. Rodar `process --today`, ou `npm run smartscript:demo` para a fixture anonima versionada quando precisar repetir manualmente.
4. Conferir que o pacote processado tem no maximo 10 candidatos.
5. Autenticar o companion com `npm run smartscript:login -- --email ... --password ...`, ou configurar `ALWAYSTRACK_API_COOKIE`, quando nao estiver usando `npm run up`.
6. Rodar `import --today`.
7. Abrir `Scriptoteca > SmartScript`.
8. Revisar `Gerados hoje`.
9. Aprovar, rejeitar, editar ou enviar para `Em revisão`.
10. Exportar apenas itens `Em uso`.
11. Rodar `npm run smartscript:export` para gravar o match file real detectado do Espanso.
12. Validar trigger `:` no Espanso.
    - habilitar expansao somente em campos cujo contexto possa ser confirmado;
    - manter copia por botao em campos ambiguos, sensiveis ou nao reconhecidos;
    - nunca exportar fatos de caso, `caseId`, conversa bruta ou placeholders resolvidos de cliente.
13. Registrar uso quando o snippet for acionado fora da copia normal.
14. Sugerir para canon apenas snippets `Em uso` que tenham utilidade para mais pessoas.

## Checklist GO/NO-GO
1. `npm run prisma:generate` passou.
2. `npm run db:test:migrations` passou.
3. `npm run typecheck --workspaces --if-present` passou.
4. Testes da Scriptoteca passaram.
5. Testes do companion passaram.
6. Smoke do companion passou.
7. Import nao envia raw logs.
8. Banco nao possui tabela de raw logs.
9. Export Espanso contem somente snippets `Em uso`.
10. Trigger `/` segue bloqueado.
11. Sugestao canonica cai na fila existente da Scriptoteca.

## Troubleshooting
- `Nenhum pacote processado hoje`: rode `process --today` antes de importar.
- `AlwaysTrack login failed`: confira API, email/senha e `ALWAYSTRACK_API_URL`.
- `Unauthorized` no import/export: rode `npm run smartscript:login` ou configure `ALWAYSTRACK_API_COOKIE`.
- `Invalid script library payload`: confira trigger `:` e dados sensiveis no texto.
- Export sem itens: aprove pelo menos um candidato como `Em uso`.
- Espanso nao expande: confira caminho do arquivo, reload do Espanso, `npm run smartscript:export` e trigger com `:`.
- Espanso expande no campo errado: desabilite o match/export nesse contexto e retorne a `COPY_ONLY`; nao tente corrigir com captura de DOM CaseFlow dentro do SmartScript.
- Eventos nao capturados: confira allowlist e se o companion foi iniciado explicitamente.

## Evidencia esperada
- Saida dos comandos de validacao.
- YAML Espanso sem dados reais.
- Print ou nota da aba SmartScript com os tres estados.
- Confirmacao de que raw logs ficaram no storage local.
