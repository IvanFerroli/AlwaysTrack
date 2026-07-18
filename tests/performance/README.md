# Performance tests

Os planos SAC deste diretório são sondas locais e controladas. Não use credenciais reais, não aponte os arquivos para produção e não use `--target` para contornar o target declarado.

## Proteções obrigatórias

- O processor aceita somente loopback ou `*.localhost`, inclusive quando o target é sobrescrito pela CLI.
- `SEED_ADMIN_PASSWORD` é obrigatório antes de qualquer cenário; sem a credencial local, nenhuma carga deve ser executada.
- Todo plano com escrita exige `PERF_ALLOW_TEST_WRITES=true` e falha quando `NODE_ENV=production`.
- Escritas devem usar banco local descartável, isolado e preparado pelo seed do projeto.
- Os thresholds são guardas de regressão grosseira em desenvolvimento. Não representam SLO nem capacidade de produção.

Pré-requisitos comuns:

- API local em `http://127.0.0.1:3333`.
- Conta local `ADMIN` ou `GESTOR`; o padrão é `admin@example.com`.
- `SEED_ADMIN_PASSWORD` com a senha do seed local. O valor não é versionado nem impresso pelo processor.
- Pelo menos uma equipe SAC ativa e um operador SAC ativo no banco local.

## Smoke somente leitura

```bash
SEED_ADMIN_PASSWORD='<senha-do-seed-local>' \
  npm run perf:support:read
```

O plano cria 1 usuário virtual por segundo durante 10 segundos. Cada usuário autentica, descobre a equipe e executa duas vezes as leituras críticas de escala semanal, pausas vinculadas, avisos ativos e séries recorrentes.

Limites locais: taxa de erro máxima de `0,1%`, `p95 <= 1000 ms`, `p99 <= 2000 ms` e timeout HTTP de 10 segundos. Na carga declarada, qualquer erro ou resposta fora de `2xx` reprova o plano.

Parâmetros opcionais:

- `PERF_ADMIN_EMAIL`: conta gerencial do seed; padrão `admin@example.com`.
- `PERF_SUPPORT_DATE`: data consultada em `YYYY-MM-DD`; padrão é hoje em `America/Sao_Paulo`.
- `PERF_SUPPORT_FROM` e `PERF_SUPPORT_TO`: intervalo da escala e das recorrências; padrão é a semana da data consultada, com máximo de 62 dias.

## Leituras de cobertura

```bash
SEED_ADMIN_PASSWORD='<senha-do-seed-local>' \
  npm run perf:support:coverage
```

O plano cria 2 usuários virtuais por segundo durante 10 segundos. Cada usuário faz duas leituras da timeline de cobertura de uma equipe. Além do status HTTP `200`, o processor valida:

- fonte de cobertura e modo de membership compatíveis;
- timeline contígua, intervalos válidos e duração limitada por `slotMinutes`;
- `availableCount = activeCount - pausedCount` e `pausedCount <= activeCount`;
- flag `critical` coerente com `minimumCoverage`;
- resumos de agentes, pausas reservadas e intervalos críticos iguais aos itens retornados;
- capacidade remanescente de cada slot coerente com suas reservas.

Limites locais: taxa de erro máxima de `0,1%`, `p95 <= 1000 ms`, `p99 <= 2000 ms` e timeout HTTP de 10 segundos. As variáveis `PERF_ADMIN_EMAIL` e `PERF_SUPPORT_DATE` também se aplicam.

## Burst concorrente de candidatura

Este plano faz escrita. Execute somente em banco local descartável e isolado:

```bash
NODE_ENV=test \
PERF_ALLOW_TEST_WRITES=true \
SEED_ADMIN_PASSWORD='<senha-do-seed-local>' \
  npm run perf:support:claim-burst
```

O setup cria um slot extra futuro, de capacidade 1, identificado pelo `testId`. Em seguida, 12 usuários virtuais disputam no mesmo segundo a candidatura do mesmo operador ao mesmo slot. A regra do seed deve exigir aprovação gerencial, mantendo o claim em `PENDING`. Ao final, o calendário é relido e deve conter exatamente um claim para o par slot/operador, sem ocorrência antecipada nem IDs duplicados.

Por padrão, o slot fica 35 dias no futuro. `PERF_CLAIM_DATE=YYYY-MM-DD` permite fixar uma data entre 1 e 180 dias no futuro. Cada execução persiste um slot, um claim, notificações deduplicadas e auditoria no banco de teste.

Limites locais: taxa de erro máxima de `0,1%`, `p95 <= 1500 ms`, `p99 <= 3000 ms` e timeout HTTP de 15 segundos.

## Materialização idempotente

Este plano faz escrita. Execute somente em banco local descartável e isolado:

```bash
NODE_ENV=test \
PERF_ALLOW_TEST_WRITES=true \
SEED_ADMIN_PASSWORD='<senha-do-seed-local>' \
  npm run perf:support:idempotency
```

Há um único usuário virtual. Ele materializa escala, slots de pausa e ocorrências de avisos duas vezes com os mesmos parâmetros. A segunda resposta deve informar zero criações; para escalas, também deve informar zero atualizações. O processor falha caso essa invariável seja quebrada.

Por padrão, o intervalo é a semana que contém a data de hoje mais 21 dias. Cada execução pode criar ocorrências futuras, slots e logs de auditoria no banco de teste.

Parâmetros opcionais:

- `PERF_MATERIALIZE_DATE`: data dos slots de pausa; padrão é o início do intervalo futuro.
- `PERF_MATERIALIZE_FROM` e `PERF_MATERIALIZE_TO`: intervalo de escala e avisos; padrão é uma semana futura, com máximo de 62 dias.

Limites locais: taxa de erro máxima de `0,1%`, `p95 <= 3000 ms`, `p99 <= 5000 ms` e timeout HTTP de 15 segundos.

## Scheduler e recorrência idempotente

Este plano faz escrita. Execute somente em banco local descartável e isolado:

```bash
NODE_ENV=test \
PERF_ALLOW_TEST_WRITES=true \
SEED_ADMIN_PASSWORD='<senha-do-seed-local>' \
PERF_RECURRENCE_MONTH='2026-09' \
  npm run perf:support:recurrence
```

O setup cria uma série exclusiva do run, válida em um mês futuro e recorrente nos dias 14 e 29. Quatro usuários virtuais materializam o mesmo intervalo no mesmo segundo com `publishDue=false`. A releitura final exige exatamente duas ocorrências, com IDs de ocorrência, anúncio e chave idempotente únicos e status `SCHEDULED`; depois a série é arquivada e as duas ocorrências são canceladas.

`PERF_RECURRENCE_MONTH=YYYY-MM` é opcional e deve apontar para um mês futuro; sem ele, o plano usa o próximo mês em `America/Sao_Paulo`. Mesmo com o cleanup, auditorias, anúncios arquivados e ocorrências canceladas permanecem no banco de teste. O endpoint também executa sua reconciliação normal de expiração para outras ocorrências locais vencidas.

Limites locais: taxa de erro máxima de `0,1%`, `p95 <= 3000 ms`, `p99 <= 5000 ms` e timeout HTTP de 20 segundos.

## Validação sem carga

Estes comandos validam sintaxe e estrutura sem iniciar usuários virtuais nem fazer requests:

```bash
node --check tests/performance/support-operations.processor.cjs
npm run perf:support:validate
git diff --check
```

## Evidência externa pendente

Os planos provam contratos e invariantes somente no ambiente local autorizado. Concorrência PostgreSQL production-like, stress/spike/soak sustentado, comportamento do pool, recovery após falha parcial, execução simultânea de instâncias reais do scheduler e confirmação de uma única notificação por destinatário continuam exigindo ambiente externo, massa aprovada e relatório com commit, horário UTC e configuração do banco.
