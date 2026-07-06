# RUNBOOK-004 - SmartScript Local Companion

## Metadata
- status: active
- owner: olympus_taskyfier
- last-updated: 2026-07-06
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

## Pre-requisitos
1. AlwaysTrack rodando localmente.
2. Usuario autenticado com acesso a Scriptoteca.
3. Variaveis do companion quando for importar/exportar:
   - `ALWAYSTRACK_API_URL`, padrao `http://localhost:3333`.
   - `ALWAYSTRACK_API_TOKEN`, quando o ambiente exigir bearer token local.
   - `SMARTSCRIPT_DATA_DIR`, opcional; padrao `~/.alwaystrack/smartscript`.
4. Espanso instalado se o export for validado no runtime real.

## Comandos
```bash
npm run up
npm run up -- --no-smartscript
npm run smartscript:status
npm run smartscript:stop
```

```bash
npm run smoke --workspace @alwaystrack/smartscript-companion
npm run test --workspace @alwaystrack/smartscript-companion
```

```bash
npx tsx apps/smartscript-companion/src/cli.ts start
npx tsx apps/smartscript-companion/src/cli.ts status
npx tsx apps/smartscript-companion/src/cli.ts capture-fixture --fixture ./path/to/events.json
npx tsx apps/smartscript-companion/src/cli.ts process --today
npx tsx apps/smartscript-companion/src/cli.ts import --today
npx tsx apps/smartscript-companion/src/cli.ts export-espanso --out ~/.config/espanso/match/alwaystrack-smartscript.yml
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

## Fluxo operacional
1. Iniciar companion.
   - No fluxo local padrao, `npm run up` ja executa `npm run smartscript:start`.
   - Para subir o app sem companion, use `npm run up -- --no-smartscript`.
2. Capturar eventos permitidos por allowlist.
3. Rodar `process --today`.
4. Conferir que o pacote processado tem no maximo 10 candidatos.
5. Rodar `import --today`.
6. Abrir `Scriptoteca > SmartScript`.
7. Revisar `Gerados hoje`.
8. Aprovar, rejeitar, editar ou enviar para `Em revisão`.
9. Exportar apenas itens `Em uso`.
10. Validar trigger `:` no Espanso.
11. Registrar uso quando o snippet for acionado fora da copia normal.
12. Sugerir para canon apenas snippets `Em uso` que tenham utilidade para mais pessoas.

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
- `Invalid script library payload`: confira trigger `:` e dados sensiveis no texto.
- Export sem itens: aprove pelo menos um candidato como `Em uso`.
- Espanso nao expande: confira caminho do arquivo, reload do Espanso e trigger com `:`.
- Eventos nao capturados: confira allowlist e se o companion foi iniciado explicitamente.

## Evidencia esperada
- Saida dos comandos de validacao.
- YAML Espanso sem dados reais.
- Print ou nota da aba SmartScript com os tres estados.
- Confirmacao de que raw logs ficaram no storage local.
