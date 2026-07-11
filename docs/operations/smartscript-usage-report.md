# Relatorio de uso - SmartScript

## Metadata
- status: draft-operational
- owner: product-builder
- last-updated: 2026-07-07
- source-of-truth: docs/operations/smartscript-usage-report.md
- related-runbook: docs/runbooks/RUNBOOK-004-smartscript-local-companion.md
- related-spec: docs/specs/SPEC-AT-004-smartscript.md

## Resumo executivo
O SmartScript e uma camada dentro da Scriptoteca para transformar textos repetidos do atendimento em snippets pessoais revisados, exportaveis para Espanso e, quando fizer sentido, sugeridos para a Scriptoteca canonica.

O fluxo esperado e:

1. O companion local guarda eventos permitidos em storage local.
2. O processamento gera ate 10 candidatos sanitizados.
3. O AlwaysTrack recebe apenas candidatos processados, nunca raw logs.
4. O operador revisa em `Scriptoteca > SmartScript`.
5. Candidatos aprovados viram `Em uso`.
6. Itens `Em uso` podem ser exportados para Espanso.
7. Uso, export e decisoes ficam observaveis por metricas e DecisionLog.
8. Bons snippets pessoais podem ser enviados para a fila canonica da Scriptoteca.

## O que a funcionalidade faz
O SmartScript resolve o vazamento de conhecimento operacional que acontece quando o atendente escreve, cola ou adapta a mesma resposta muitas vezes, mas esse texto nunca vira biblioteca.

Ele faz:

- gera candidatos de snippets pessoais;
- sanitiza dados sensiveis antes de virar candidato/snippet;
- limita cada processamento a no maximo 10 sugestoes;
- separa os estados visiveis em `Gerados hoje`, `Em revisão` e `Em uso`;
- impede que um snippet `Em uso` seja alterado silenciosamente;
- exporta apenas snippets `Em uso` para Espanso;
- registra decisoes em `SmartScriptDecisionLog`;
- registra uso e metricas de melhoria;
- permite sugerir um snippet pessoal aprovado para a Scriptoteca canonica.

Ele nao deve fazer:

- virar produto separado da Scriptoteca;
- usar Espanso como banco principal;
- salvar raw logs no banco do AlwaysTrack;
- aceitar trigger pessoal com `/`;
- publicar script canonico automaticamente;
- capturar tudo do computador sem allowlist.

## Como subir tudo
Use:

```bash
npm run up
```

Esse comando agora:

- instala/atualiza dependencias;
- prepara banco local e seed;
- gera TypeDoc;
- inicia API;
- inicia Web;
- inicia Prisma Studio;
- inicia o SmartScript companion;
- prepara o arquivo de match do Espanso;
- tenta iniciar/recarregar o Espanso no Windows quando detectado;
- cria a trigger de teste `:at-test`;
- espera a API ficar saudavel;
- autentica o companion com o usuario demo local `sac@example.com`;
- se ainda nao houver itens SmartScript, carrega a fixture anonima e importa candidatos para `Gerados hoje`;
- se ja houver snippets `Em uso`, exporta para o match file real do Espanso.

Para subir sem SmartScript:

```bash
npm run up -- --no-smartscript
```

Para subir com SmartScript, mas sem fixture demo/import automatico:

```bash
npm run up -- --no-smartscript-demo
```

## Como testar se o Espanso esta pronto
Depois do `npm run up`, abra qualquer campo de texto no Windows e digite:

```text
:at-test
```

Resultado esperado:

```text
AlwaysTrack SmartScript ok
```

Arquivo preparado:

```text
C:\Users\ACER\AppData\Roaming\espanso\match\alwaystrack-smartscript.yml
```

Comando manual de preparo/reload:

```bash
npm run smartscript:espanso
```

## Como observar o companion
Status:

```bash
npm run smartscript:status
```

Saida esperada:

```json
{
  "storage": "/home/ivan/.alwaystrack/smartscript",
  "rawLogsRemote": false,
  "todayEvents": 0,
  "todayCandidates": 0,
  "auth": {
    "envCookie": false,
    "envToken": false,
    "storedCookie": false
  }
}
```

O que observar:

- `storage`: pasta local do companion.
- `rawLogsRemote: false`: confirma que raw logs nao foram enviados ao AlwaysTrack.
- `todayEvents`: quantidade de eventos locais capturados/recebidos hoje.
- `todayCandidates`: quantidade de candidatos processados hoje.
- `auth.storedCookie`: indica se o companion tem sessao local salva para import/export.

Pastas importantes:

```text
~/.alwaystrack/smartscript/
~/.alwaystrack/smartscript/raw/
~/.alwaystrack/smartscript/processed/
~/.alwaystrack/smartscript/running.json
```

No Windows/Espanso:

```text
C:\Users\ACER\AppData\Roaming\espanso\match\
C:\Users\ACER\AppData\Local\Programs\Espanso\
```

## Como gerar candidatos
No MVP atual, a entrada operacional testavel do companion e por fixture/eventos locais. O listener real de clipboard/janela ativa ainda precisa de uma camada adicional de captura do sistema operacional.

Formato de fixture:

```json
[
  {
    "id": "evt-1",
    "timestamp": "2026-07-06T12:00:00.000Z",
    "type": "alwayschat-sent",
    "source": "AlwaysChat",
    "destination": "AlwaysChat",
    "text": "Oi, vamos seguir com o reenvio do pedido. Mensagem anonima de exemplo."
  }
]
```

Comandos:

```bash
npm run smartscript:demo
```

Esse comando usa a fixture anonima versionada em:

```text
apps/smartscript-companion/fixtures/alwayschat-sample.json
```

Ele reescreve os timestamps da fixture para o dia atual antes de processar.

Para usar uma fixture propria:

```bash
npx tsx apps/smartscript-companion/src/cli.ts capture-fixture --fixture ./path/to/events.json --today
npm run smartscript:process
```

O processamento:

- le eventos allowlisted;
- descarta origem fora de allowlist;
- sanitiza dados sensiveis;
- agrupa textos parecidos por heuristica local;
- gera triggers com `:`;
- limita a no maximo 10 candidatos;
- salva pacote processado localmente.

## Como autenticar e importar candidatos para o AlwaysTrack
Autenticar o companion com usuario local:

```bash
npm run smartscript:login -- --email operador@example.com --password senha
```

Alternativas por variavel de ambiente:

```bash
ALWAYSTRACK_API_COOKIE='alwaystrack_session=...' npm run smartscript:import
ALWAYSTRACK_SESSION_COOKIE='alwaystrack_session=...' npm run smartscript:import
```

Depois de autenticar:

```bash
npm run smartscript:import
```

O companion:

- guarda somente o cookie de sessao em `~/.alwaystrack/smartscript/session-cookie.json`;
- envia apenas candidatos processados, nunca raw logs;
- ainda aceita `ALWAYSTRACK_API_TOKEN` se um backend local passar a suportar bearer token.

## Abas e botoes na UI
Abra:

```text
Scriptoteca > SmartScript
```

Estados visiveis:

- `Gerados hoje`: candidatos do processamento mais recente.
- `Em revisão`: candidatos pendentes ou enviados para revisar depois.
- `Em uso`: snippets aprovados e exportaveis.

### Lista lateral
Mostra os itens do estado selecionado.

Cada item exibe:

- titulo;
- estado;
- trigger;
- canal;
- quantidade de ocorrencias;
- data de atualizacao.

### Painel de detalhe
Campos editaveis:

- `Trigger`
- `Canal`
- `Titulo`
- `Texto`
- `Tags`

Regra:

- trigger deve comecar com `:`;
- trigger com `/` e invalida;
- editar item `Em uso` cria proposta `Em revisão`, nao altera silenciosamente o snippet ativo.

### Botoes principais
`Aprovar`

- move candidato/snippet para `Em uso`;
- exige trigger valida com `:`;
- registra DecisionLog.

`Rejeitar`

- remove o candidato dos estados visiveis;
- registra rejeicao.

`Editar`

- salva ajustes no texto;
- se o item ja estava `Em uso`, cria proposta em `Em revisão`.

`Enviar para revisão`

- move o item para `Em revisão`.

`Aplicar revisão numerada`

- campo aceita:
  - `1 sim`: aprovar;
  - `2 nao`: rejeitar;
  - `3 editar`: editar;
  - `4 revisao`: enviar para revisao.

`Exportar agora`

- chama o export SmartScript;
- exporta somente itens `Em uso`;
- mostra YAML Espanso gerado na tela.

Para gravar no arquivo real do Espanso detectado pelo companion, use:

```bash
npm run smartscript:export
```

`Registrar uso`

- aparece em itens `Em uso`;
- incrementa metrica de uso do snippet.

`Sugerir para cânon`

- aparece em itens `Em uso`;
- envia o snippet pessoal para a fila existente de sugestoes canonicas da Scriptoteca;
- Admin/Gestor ainda precisa revisar.

## Como observar dentro do AlwaysTrack
Na aba SmartScript:

- contadores por estado;
- cards de metricas;
- snippets mais usados;
- snippets prontos para sugerir ao canon;
- YAML Espanso gerado apos export.

No Prisma Studio:

```text
http://localhost:5555
```

Tabelas/modelos importantes:

- `PersonalScript`: snippets pessoais e candidatos SmartScript.
- `SmartScriptBatch`: lotes importados.
- `SmartScriptDecisionLog`: decisoes de import, approve, reject, edit, review, export, use e suggest canonical.
- `SmartScriptExport`: exports para Espanso.
- `OperationalScriptSuggestion`: sugestoes canonicas geradas a partir de snippets pessoais.

O que nao deve existir:

- tabela de raw logs;
- raw text de captura dentro do banco;
- trigger pessoal com `/`.

## Como observar no terminal
Com `npm run up`, observe os blocos:

- `[AlwaysTrack Setup] Ativando SmartScript Local Companion`
- `[AlwaysTrack Setup] Preparando Espanso para SmartScript`
- `SmartScript companion iniciado`
- `espansoDetected`
- `espansoReloaded`

Comandos uteis:

```bash
npm run smartscript:status
npm run smartscript:login
npm run smartscript:espanso
npm run smartscript:demo
npm run smartscript:process
npm run smartscript:import
npm run smartscript:export
npm run smartscript:logout
npm run smartscript:stop
```

## Como observar no Espanso
Validar match file:

```bash
cat /mnt/c/Users/ACER/AppData/Roaming/espanso/match/alwaystrack-smartscript.yml
```

Validar daemon no Windows:

```bash
powershell.exe -NoProfile -Command 'Get-Process espansod -ErrorAction SilentlyContinue'
```

Listar matches:

```bash
powershell.exe -NoProfile -Command '& "C:\Users\ACER\AppData\Local\Programs\Espanso\espansod.exe" match list'
```

## Fluxo recomendado de uso diario
1. Rodar:

```bash
npm run up
```

2. Confirmar Espanso:

```text
:at-test
```

3. Conferir companion:

```bash
npm run smartscript:status
```

4. Com o `npm run up`, candidatos de demo ja ficam importados automaticamente quando o SmartScript ainda esta vazio.

Para processar eventos reais depois:

```bash
npm run smartscript:process
```

Para repetir uma demo anonima manualmente:

```bash
npm run smartscript:demo
```

5. Se estiver fora do `npm run up`, autentique o companion para import/export:

```bash
npm run smartscript:login -- --email operador@example.com --password senha
```

6. Se estiver fora do `npm run up`, importe candidatos:

```bash
npm run smartscript:import
```

7. Abrir:

```text
Scriptoteca > SmartScript
```

8. Revisar `Gerados hoje`.

9. Ajustar trigger/texto/tags.

10. Apertar `Aprovar` para o que deve virar snippet.

11. Ir para `Em uso`.

12. Apertar `Exportar agora` para conferir o YAML na UI.

13. Gravar no Espanso real:

```bash
npm run smartscript:export
```

14. Validar trigger no Windows.

15. Apertar `Registrar uso` quando usar um snippet.

16. Apertar `Sugerir para cânon` quando o texto servir para mais pessoas.

## Limites atuais
1. O `npm run up` deixa companion e Espanso preparados, mas nao cria um listener real de clipboard/janela ativa.
2. A captura real do sistema operacional ainda precisa ser implementada ou conectada a eventos do AlwaysChat.
3. O import/export CLI ja suporta cookie de sessao salvo ou por variavel, mas o usuario precisa autenticar o companion.
4. O botao `Exportar agora` mostra o YAML na UI; a escrita no arquivo real do Espanso fica no comando `npm run smartscript:export`.
5. O smoke real final deve ser feito digitando triggers em apps Windows reais.

## Checklist de pronto para usar
1. `npm run up` termina setup e abre Web/API.
2. `npm run smartscript:status` mostra `rawLogsRemote: false`.
3. `:at-test` expande no Windows.
4. `Scriptoteca > SmartScript` abre sem erro.
5. Existem candidatos em `Gerados hoje`.
6. `Aprovar` move item para `Em uso`.
7. `Exportar agora` gera YAML.
8. `npm run smartscript:export` grava o match file detectado do Espanso.
9. Trigger exportada expande no Espanso.
10. `Registrar uso` incrementa metricas.
11. `Sugerir para cânon` cria entrada em sugestoes da Scriptoteca.

## Proximas melhorias recomendadas
1. Executar a Fase H `TASK-AT-183` a `TASK-AT-193` para tornar o nucleo real de logging/captura ativo.
2. Comecar por `TASK-AT-183-smartscript-real-capture-contract.md` e `TASK-AT-184-smartscript-local-logger-control-plane.md`.
3. Implementar listener real de clipboard/paste/envio em `TASK-AT-186`.
4. Conectar captura real a eventos emitidos pelo AlwaysChat em `TASK-AT-187`, quando esse canal existir.
5. Validar com a regressao `TASK-AT-192` e o gate `TASK-AT-193`.
