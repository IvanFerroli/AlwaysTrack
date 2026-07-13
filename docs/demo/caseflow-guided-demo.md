# Demo guiada do CaseFlow

## Preparacao

Esta demo e totalmente offline e usa somente identificadores `AT-SYN-*`. Sirva ou abra as paginas de `tests/fake-pages/caseflow/` e carregue os seeds de `tests/fixtures/caseflow/demo/`. Nao use login, credencial, cookie, sistema externo ou dado de cliente.

Antes da apresentacao, execute:

```bash
node tests/fake-pages/caseflow/audit-offline.mjs
npm test --workspace @alwaystrack/companion-extension
```

## 1. Posicao do pedido - sucesso

- Seed: `success.json`; pagina: `order-position.html`.
- Inicie com a pergunta sobre `AT-SYN-1001`.
- Mostre Rastreio, Yampi e Loggi concluindo progressivamente, sem loading global.
- Resultado esperado: fluxo `ORDER_POSITION`, alta confianca, previsao em 15/07/2026 e mensagem apenas copiavel.
- Protecao visivel: nenhum envio ao cliente e nenhuma navegacao em sistema real.

## 2. Entrega nao reconhecida - conflito

- Seed: `conflict.json`; pagina: `unrecognized-delivery.html`.
- Mostre o status entregue e a negativa de recebimento como evidencias divergentes.
- Resultado esperado: conflito aberto, fluxo principal `UNRECOGNIZED_DELIVERY` e alternativas de acareacao/revisao de evidencia e risco logistico.
- Protecao visivel: o CaseFlow nao decide pelo operador, nao abre acareacao e nao executa tratamento financeiro.

## 3. J&T - parcial com captcha

- Seed: `partial.json`; pagina: `jt-captcha.html`.
- Mostre Rastreio, Yampi e OMIE concluidos enquanto J&T fica `BLOCKED_CAPTCHA`.
- Resultado esperado: resumo parcial utilizavel e intervencao `Resolver recaptcha na J&T`; os demais conectores permanecem disponiveis.
- Protecao visivel: captcha nunca e resolvido ou contornado pelo Companion. A retomada depende da intervencao humana.

## 4. Pedido manual - baixa confianca

- Seed: `low-confidence.json`; pagina: `manual-order-draft.html`.
- Mostre as alternativas antes de preparar o reenvio e revise produto, quantidade, endereco, motivo e pagamento.
- Resultado esperado: estado `WAITING_MANUAL_CONFIRMATION`, botao final desabilitado e rascunho Slack somente para copia.
- Protecao visivel: pare antes da confirmacao. O operador gera o pedido e publica no Slack manualmente; o Companion nao confirma nem posta.

## 5. Conector degradado

- Seed: `degraded.json`; reutilize a pagina de posicao do pedido.
- Simule drift de seletor no OMIE enquanto Rastreio e Yampi concluem.
- Resultado esperado: OMIE `DEGRADED`, resultado parcial preservado, diagnostico sanitizado e fallback para entrada manual.
- Protecao visivel: nenhuma repeticao destrutiva e nenhuma evidencia dos conectores saudaveis e descartada.

## Encerramento

Confirme na tela: mensagens sao copiadas, nao enviadas; Slack nao e aberto, lido ou preenchido; captcha permanece manual; e o pedido manual para antes da confirmacao. Falhas, conflitos e baixa confianca devem permanecer visiveis, sem serem apresentados como sucesso completo.
