# Performance tests

Os cenários deste diretório são testes locais e controlados. Não use credenciais reais, não aponte os arquivos para produção e não use `--target` para contornar o target declarado. Os cenários novos recusam qualquer hostname que não seja loopback ou `*.localhost`.

## Escalas, pausas e avisos recorrentes

Pré-requisitos:

- API local em `http://127.0.0.1:3333`, com banco descartável preparado pelo seed do projeto.
- Conta local `ADMIN` ou `GESTOR`; o padrão é `admin@example.com`.
- `SEED_ADMIN_PASSWORD` com a senha do seed local. O valor não é versionado nem impresso pelo processador.
- Pelo menos uma equipe SAC ativa no banco local. O primeiro `GET /v1/support/pauses` captura seu identificador.

### Smoke somente-leitura

```bash
SEED_ADMIN_PASSWORD='<senha-do-seed-local>' \
  npm run perf:support:read
```

O plano cria 1 usuário virtual por segundo durante 10 segundos. Cada usuário autentica, descobre a equipe e executa duas vezes as leituras críticas de escala semanal, pausas vinculadas, avisos ativos e séries recorrentes.

Limites locais:

- taxa de erro menor ou igual a `0,1%`; na carga declarada, qualquer erro ou resposta fora de `2xx` reprova o plano;
- `p95 <= 1000 ms`;
- `p99 <= 2000 ms`;
- timeout HTTP de 10 segundos.

Parâmetros opcionais:

- `PERF_ADMIN_EMAIL`: conta gerencial do seed; padrão `admin@example.com`.
- `PERF_SUPPORT_DATE`: data consultada em `YYYY-MM-DD`; padrão é hoje em `America/Sao_Paulo`.
- `PERF_SUPPORT_FROM` e `PERF_SUPPORT_TO`: intervalo da escala e das recorrências; padrão é a semana da data consultada, com máximo de 62 dias.

### Materialização idempotente

Este cenário faz escrita. Execute somente em banco local descartável e isolado:

```bash
NODE_ENV=test \
PERF_ALLOW_TEST_WRITES=true \
SEED_ADMIN_PASSWORD='<senha-do-seed-local>' \
  npm run perf:support:idempotency
```

Há um único usuário virtual. Ele materializa escala, slots de pausa e ocorrências de avisos duas vezes com os mesmos parâmetros. A segunda resposta deve informar zero criações; para escalas, também deve informar zero atualizações. O processador falha o cenário caso essa invariável seja quebrada.

Por padrão, o intervalo é a semana que contém a data de hoje mais 21 dias, reduzindo interferência com os dados operacionais gerados pelo seed. Cada execução pode criar ocorrências futuras, slots e logs de auditoria no banco de teste.

Limites locais:

- opt-in obrigatório com `PERF_ALLOW_TEST_WRITES=true`;
- bloqueio explícito quando `NODE_ENV=production`;
- um intervalo de 1 a 62 dias;
- taxa de erro menor ou igual a `0,1%`; com um único usuário virtual, qualquer erro ou resposta fora de `2xx` reprova o plano;
- `p95 <= 3000 ms` e `p99 <= 5000 ms`;
- timeout HTTP de 15 segundos.

Parâmetros opcionais:

- `PERF_MATERIALIZE_DATE`: data dos slots de pausa; padrão é o início do intervalo futuro.
- `PERF_MATERIALIZE_FROM` e `PERF_MATERIALIZE_TO`: intervalo de escala e avisos; padrão é uma semana futura, com máximo de 62 dias.

Os thresholds são guardas de regressão grosseira em desenvolvimento, não SLOs nem evidência de capacidade de produção. Ajustes de volume devem continuar restritos a infraestrutura de teste autorizada e exigir um plano separado.
