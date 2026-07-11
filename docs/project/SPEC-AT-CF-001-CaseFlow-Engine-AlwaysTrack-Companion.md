# SPEC-AT-CF-001 — CaseFlow Engine e AlwaysTrack Companion

**Status:** proposta consolidada para taskificação  
**Versão:** 1.0  
**Data de referência:** 2026-07-11  
**Público principal:** `@olympus_taskyfier`, `@olympus_orchestrator`, `@olympus_runtime_builder`  
**Nome técnico da frente:** **CaseFlow Engine + AlwaysTrack Companion**  
**Nome da experiência para o usuário:** **Copiloto SAC**  
**Escopo:** uso pessoal, local-first, integrado à estrutura do AlwaysTrack, sem dependência obrigatória de IA ou APIs externas

---

## 1. Objetivo deste documento

Este documento é a fonte central de produto, arquitetura, segurança, experiência e execução para uma nova frente do AlwaysTrack voltada a atendimento SAC assistido.

A intenção não é entregar uma ideia genérica para ser “interpretada” durante a taskificação. A intenção é reduzir ao máximo as decisões abertas e permitir que o `taskyfier` divida a frente em tarefas pequenas, ordenadas e verificáveis.

A solução deve:

1. começar obrigatoriamente a partir de um atendimento aberto no **AlwaysChat**;
2. consultar rapidamente todas as ferramentas aplicáveis para montar o caso;
3. operar sem depender de API oficial dos sistemas externos;
4. usar as sessões já abertas no navegador;
5. extrair e normalizar evidências de cada sistema;
6. decidir, sem intervenção inicial do usuário, em qual fluxo ou conjunto de fluxos o caso se encaixa;
7. gerar um resumo curto e confiável;
8. compilar um mapa de possibilidades para aquele caso;
9. montar mensagens determinísticas para cada possibilidade;
10. apresentar a execução em formato guiado, semelhante ao modelo de atendimento por etapas já usado pelo usuário em outra empresa;
11. permitir futura execução agentic sem precisar redesenhar o núcleo;
12. reduzir de forma mensurável digitação, troca de abas, cliques repetitivos e carga mental;
13. nunca executar silenciosamente ações financeiras, destrutivas ou de comunicação externa.

---

# 2. Problema real que esta frente resolve

O usuário trabalha diariamente em SAC e precisa consultar vários sistemas para entender um único caso. O trabalho não consiste apenas em “responder mensagens”; consiste em:

- ler e reconciliar uma conversa;
- localizar pedido e cliente;
- descobrir origem da compra;
- comparar sistemas;
- interpretar pagamento;
- conferir faturamento;
- conferir rastreio;
- entender transportadora;
- verificar histórico;
- identificar divergências;
- decidir o procedimento;
- montar uma resposta;
- gerar sussurro;
- montar solicitação interna;
- garantir que nenhuma promessa errada seja enviada.

Esse processo exige centenas de interações diárias e está agravando dores nas mãos. A motivação principal da frente é de ergonomia e continuidade profissional.

A ferramenta deve ser avaliada principalmente por quanto trabalho físico e mental ela elimina.

Ela não precisa parecer autônoma. Ela precisa ser rápida, previsível e útil.

---

# 3. Tese do produto

## 3.1 Frase central

> O sistema monta o caso, consulta as evidências, resolve o fluxo e prepara as mensagens; o atendente revisa e confirma as ações críticas.

## 3.2 O que o sistema não é

Não é:

- um chatbot solto;
- um agente com liberdade para navegar e clicar em qualquer lugar;
- uma IA generativa dependente de tokens;
- um robô que responde clientes sozinho;
- uma integração oficial com os sistemas da empresa;
- um substituto para o julgamento humano em dinheiro, risco ou saúde;
- uma automação de Slack;
- um bypass de login, captcha ou segundo fator;
- um keylogger;
- uma ferramenta multiusuário corporativa nesta fase.

## 3.3 O que o sistema é

É:

- um motor determinístico de montagem de casos;
- um orquestrador de consultas locais;
- uma camada de scraping consultivo;
- um normalizador de evidências;
- um classificador heurístico;
- um compilador de fluxos versionados;
- uma interface guiada por etapas;
- um gerador de mensagens baseado em scripts e placeholders;
- uma base segura para futura execução agentic limitada.

---

# 4. Decisões já fechadas

As decisões abaixo são obrigatórias para taskificação. Não devem voltar como dúvidas genéricas.

## 4.1 Origem do caso

Todo caso nasce no **AlwaysChat**.

O gatilho inicial deve ser executado com uma conversa do AlwaysChat aberta no navegador.

O sistema deve tentar extrair da conversa e do painel:

- link ou identificador da conversa;
- canal;
- nome;
- CPF, quando visível;
- e-mail;
- telefone;
- pedido exibido;
- histórico carregado;
- mensagens recentes;
- anexos visíveis;
- tags;
- atendente anterior;
- cupons visíveis;
- pedidos listados;
- texto do cliente;
- intenção aparente;
- informações citadas durante a conversa.

Se o histórico completo exigir carregamento adicional, o conector pode rolar e carregar conteúdo em modo somente leitura.

Nenhuma ação de resposta, transferência, resolução ou tabulação pode ocorrer automaticamente.

## 4.2 Consulta ampla e progressiva

O sistema deve conseguir acessar todas as ferramentas consultivas relevantes.

Todos os conectores consultivos devem ser registrados no plano de montagem do caso.

Cada conector deve terminar com um estado explícito:

- concluído;
- parcial;
- não aplicável;
- não encontrado;
- aguardando identificador;
- bloqueado por login;
- bloqueado por captcha;
- falha de seletor;
- timeout;
- cancelado.

Nenhum conector pode ser omitido silenciosamente.

Nenhum conector pode bloquear a tela inteira.

Resultado parcial é sempre preferível a uma tela global de loading.

## 4.3 Performance

A resposta deve ser igual ou mais rápida que a montagem manual feita pelo usuário.

Casos simples, como “quero saber do meu pedido”, precisam produzir um primeiro resultado acionável em poucos segundos quando as sessões estiverem aquecidas.

Casos longos podem continuar sendo enriquecidos progressivamente.

A experiência deve mostrar resultados conforme chegam.

## 4.4 Heurística antes de IA

O core inicial deve funcionar sem IA.

Devem ser usados:

- expressões regulares;
- normalização textual;
- dicionários;
- sinônimos;
- pesos;
- regras;
- prioridades;
- condições;
- classificação de risco;
- scripts estruturados;
- placeholders;
- composição determinística.

IA só poderá ser considerada depois, em tarefa separada, se casos reais demonstrarem uma lacuna que não seja razoável resolver com melhoria de regra.

A ausência de chave de IA não pode degradar o funcionamento principal.

## 4.5 Interface de execução

A execução para o atendente deve imitar o modelo guiado já validado pelo usuário em experiência anterior.

A unidade principal da interface é:

- passo atual;
- contexto curto;
- evidências;
- orientação;
- mensagem pronta;
- opções grandes;
- próximo passo.

O operador não deve precisar olhar um canvas complexo para trabalhar.

O fluxo pode ser um grafo internamente, mas deve aparecer como uma sequência rápida e clicável.

## 4.6 Fluxos do AlwaysTrack

A estrutura existente de Fluxos de Atendimento deve ser reutilizada e evoluída.

Não criar um segundo produto de fluxos competindo com:

- `ServiceFlow`;
- `ServiceFlowStep`;
- `ServiceFlowSession`;
- Scriptoteca;
- scripts canônicos;
- scripts pessoais;
- pacotes de scripts.

A nova frente deve acrescentar:

- seleção automática de fluxo;
- composição de múltiplos fluxos;
- regras de aplicabilidade;
- evidências obrigatórias;
- transições condicionais;
- mensagens por ramo;
- execução determinística;
- preparação para agente futuro.

## 4.7 Fronteira do AlwaysTrack

A solução é uma única frente de produto, mas não deve ser um único processo acoplado.

### Dentro do núcleo AlwaysTrack

Ficam:

- casos;
- evidências normalizadas;
- regras;
- fluxos;
- versões;
- scripts;
- resolução heurística;
- resumo;
- plano compilado;
- sessões;
- histórico;
- auditoria;
- administração;
- métricas;
- interface completa de gestão.

### Fora do runtime principal do AlwaysTrack

Ficam:

- extensão do navegador;
- scraping;
- controle de abas;
- leitura do DOM;
- detecção de login;
- detecção de captcha;
- comunicação com páginas externas;
- adaptadores por sistema;
- cache efêmero local de navegação.

A parte externa deve usar contratos e governança do AlwaysTrack, mas precisa ser isolada para que mudanças em sites de terceiros não quebrem o backend central.

## 4.8 Ações críticas

### Nunca automáticas no escopo inicial

- enviar mensagem no AlwaysChat;
- resolver atendimento;
- transferir atendimento;
- tabular;
- postar no Slack;
- gerar estorno;
- confirmar reembolso;
- cancelar pedido;
- alterar pagamento;
- confirmar pedido;
- gerar pedido;
- gerar reenvio;
- alterar endereço;
- abrir boleto;
- disparar recuperação;
- arrastar status no OMIE;
- gerar reversa;
- abrir acareação sem confirmação;
- abrir ticket sem confirmação.

### Permitidas

- consultar;
- abrir tela;
- buscar;
- ler;
- extrair;
- normalizar;
- resumir;
- classificar;
- montar fluxo;
- montar mensagem;
- copiar;
- focar a aba certa;
- preencher um rascunho explicitamente autorizado;
- preparar pedido sem clicar no botão final;
- detectar que uma ação manual ocorreu;
- avisar sobre possível erro.

## 4.9 Slack

Slack permanece totalmente manual.

O sistema pode:

- montar texto;
- resumir evidências;
- gerar checklist;
- copiar mensagem;
- registrar que uma mensagem foi preparada.

O sistema não pode:

- abrir canal automaticamente como parte de um fluxo;
- pesquisar;
- ler histórico;
- preencher;
- postar;
- reagir;
- editar;
- excluir.

## 4.10 Browser

O navegador de referência deve ser **Google Chrome Stable**, com perfil exclusivo de trabalho.

A extensão deve ser Chromium Manifest V3.

Microsoft Edge deve ser tratado como navegador compatível secundário.

Opera não é navegador de referência.

## 4.11 Playwright

Playwright não deve ser o mecanismo principal de interação com o navegador diário.

Motivos:

- o caso começa na aba real já aberta;
- as sessões existentes precisam ser usadas;
- a interface guiada precisa permanecer disponível ao lado da página;
- o usuário não quer manter um segundo navegador automatizado;
- stock Chrome/Edge e perfis reais são mais delicados para controle externo.

Playwright pode ser usado para:

- testes;
- páginas simuladas;
- smoke;
- fixtures;
- protótipos de conectores;
- automações secundárias fora do perfil principal.

---

# 5. Arquitetura macro

A solução terá quatro camadas.

## 5.1 Camada A — AlwaysTrack Core

Responsável por:

- persistência;
- regras;
- classificação;
- resolução;
- fluxos;
- scripts;
- auditoria;
- APIs;
- painel administrativo;
- histórico de casos.

## 5.2 Camada B — Companion Host

Processo local separado do backend principal.

Responsável por:

- orquestrar consultas;
- receber comandos do AlwaysTrack;
- comunicar-se com a extensão;
- controlar concorrência;
- aplicar timeout;
- manter cache curto;
- normalizar eventos;
- detectar ausência de extensão;
- registrar saúde dos conectores;
- devolver resultados progressivos.

Implementação recomendada:

- Node.js + TypeScript;
- processo local;
- bind apenas em `127.0.0.1`;
- WebSocket autenticado;
- iniciado pela bancada local do projeto;
- sem Tauri na primeira versão;
- possibilidade de empacotamento futuro.

## 5.3 Camada C — Extensão Chromium

Responsável por:

- side panel;
- content scripts;
- service worker;
- leitura de páginas;
- reutilização de abas;
- abertura de sistemas;
- navegação consultiva;
- coleta de DOM;
- detecção de autenticação/captcha;
- preenchimento de rascunho permitido;
- comunicação com o Companion Host.

## 5.4 Camada D — Conectores por sistema

Cada sistema terá um adaptador independente.

Um conector quebrado não deve afetar os outros.

Cada conector deve declarar:

- domínios;
- capacidades;
- chaves de busca;
- nível de risco;
- seletores;
- estados de autenticação;
- estados de captcha;
- campos extraídos;
- transformações;
- ações permitidas;
- ações proibidas;
- versão;
- testes;
- fixtures;
- data da última validação.

---

# 6. Estrutura recomendada no repositório

```text
AlwaysTrack/
  apps/
    web/
      src/
        views/
          case-flow.tsx
        components/
          case-flow/
    companion-extension/
      src/
        background/
        content-scripts/
        connectors/
        side-panel/
        shared/
      manifest.json

  services/
    api/
      src/
        core/
          case-flow/
          service-flows/
          script-library/
          audit/
    companion-host/
      src/
        server/
        orchestrator/
        protocol/
        cache/
        diagnostics/
        security/

  packages/
    shared/
      src/
        case-flow/
        companion/
        connectors/

  docs/
    specs/
      SPEC-AT-CF-001-caseflow-engine-companion.md
    architecture/
      caseflow-architecture.md
      companion-connector-contract.md
    operations/
      companion-local-runbook.md
      connector-drift-runbook.md
    security/
      companion-threat-model.md
    demo/
      caseflow-guided-demo.md
    tasks/
      TASK-AT-...
```

A nomenclatura final pode seguir padrões existentes, mas a separação de responsabilidades não deve mudar.

---

# 7. Experiência principal

## 7.1 Local da interface

A experiência diária deve aparecer no **side panel da extensão**, preso ao navegador.

Razões:

- reduz Alt+Tab;
- permanece visível ao trocar de sistema;
- acompanha a aba atual;
- permite iniciar o caso no AlwaysChat;
- permite mostrar resultados enquanto conectores trabalham;
- serve como painel de intervenção para login/captcha;
- reduz navegação até o app completo.

O AlwaysTrack web completo continua responsável por:

- editar fluxos;
- editar regras;
- editar scripts;
- analisar métricas;
- revisar histórico;
- diagnosticar conectores;
- configurar sistemas;
- administrar o módulo.

## 7.2 Abertura de um caso

Fluxo obrigatório:

1. usuário abre uma conversa no AlwaysChat;
2. usuário abre o side panel ou usa atalho;
3. extensão verifica se a aba ativa é um atendimento suportado;
4. botão principal: **Montar caso**;
5. intake é coletado;
6. caso é criado;
7. conectores são disparados;
8. resumo parcial aparece;
9. fluxo inicial é resolvido;
10. mensagens são compiladas;
11. o atendimento guiado fica disponível;
12. novos dados refinam o plano sem zerar a interface.

## 7.3 Estrutura do side panel

### Cabeçalho fixo

- nome do cliente;
- pedido principal;
- canal;
- tipo de caso;
- nível de risco;
- completude;
- botão cancelar;
- botão atualizar.

### Status de montagem

Lista compacta:

```text
AlwaysChat       Concluído
Rastreio         Concluído
Yampi            Concluído
OMIE Filial      Consultando
OMIE Pharma      Não aplicável
Loggi            Concluído
J&T              Bloqueado por login
Correios         Não aplicável
```

### Resumo

Máximo padrão:

- 3 a 5 linhas;
- linguagem interna;
- sem floreio;
- fatos principais;
- divergências;
- pendência;
- próximo movimento.

### Fluxos detectados

- fluxo principal;
- fluxos secundários;
- confiança;
- razões;
- evidências que dispararam;
- risco.

### Mapa de possibilidades

Árvore compacta ou cartões de ramo.

Cada possibilidade deve mostrar:

- condição;
- ação;
- mensagem;
- dependência;
- risco.

### Passo atual

O coração operacional.

### Ações rápidas

- copiar mensagem;
- inserir rascunho no AlwaysChat;
- copiar sussurro;
- copiar Slack;
- abrir sistema bloqueado;
- retomar consulta;
- informar dado manual;
- voltar passo;
- encerrar sessão.

---

# 8. Modelo de execução guiada

## 8.1 O fluxo interno é um grafo

Cada fluxo deve ser representado como grafo direcionado versionado.

## 8.2 O usuário vê uma sequência

A interface não deve exigir interpretação de grafo.

Exemplo:

```text
PASSO ATUAL
Confirmar situação logística

EVIDÊNCIAS
Pedido: O761443
Transportadora: Loggi
Status: Entregue
Recebedor: nome divergente

ORIENTAÇÃO
O pedido consta entregue, mas o cliente informa que não recebeu.

MENSAGEM
"Verifiquei que seu pedido consta como entregue..."

OPÇÕES
[Cliente reconheceu o recebimento]
[Cliente não reconhece]
[Endereço está incorreto]
[Preciso consultar novamente]
```

## 8.3 Comportamento das opções

Ao clicar:

- a sessão registra a escolha;
- as evidências são preservadas;
- o próximo nó é calculado;
- mensagens são recompiladas;
- conectores adicionais podem ser disparados;
- o usuário pode voltar;
- nenhuma ação externa crítica ocorre.

## 8.4 Requisitos de ergonomia

- botões grandes;
- zero drag-and-drop para o operador;
- ações primárias sempre no mesmo lugar;
- rolagem mínima;
- sem modais em cascata;
- sem campos desnecessários;
- foco automático;
- suporte a atalhos configuráveis;
- navegação por números;
- copiar em um clique;
- inserir rascunho em um clique explícito;
- último passo recuperável;
- sem perda de caso ao trocar aba.

## 8.5 Atalhos sugeridos

Atalhos devem ser configuráveis.

Sugestão inicial:

- abrir side panel;
- montar caso;
- escolher opção 1;
- escolher opção 2;
- escolher opção 3;
- copiar mensagem;
- copiar sussurro;
- inserir no AlwaysChat;
- voltar passo.

Nenhum atalho deve enviar mensagem ou confirmar ação externa.

---

# 9. Ciclo de vida do caso

Estados do caso:

```text
NEW
INTAKE_RUNNING
EVIDENCE_COLLECTING
PARTIALLY_RESOLVED
RESOLVED
GUIDED_EXECUTION
WAITING_HUMAN
READY_FOR_RESPONSE
COMPLETED
CANCELLED
FAILED
```

## 9.1 NEW

Criado, ainda sem intake.

## 9.2 INTAKE_RUNNING

AlwaysChat sendo lido.

## 9.3 EVIDENCE_COLLECTING

Conectores em execução.

## 9.4 PARTIALLY_RESOLVED

Já existe resumo e fluxo utilizável, mas consultas continuam.

## 9.5 RESOLVED

Plano de fluxo compilado.

## 9.6 GUIDED_EXECUTION

Usuário seguindo etapas.

## 9.7 WAITING_HUMAN

Esperando:

- login;
- captcha;
- confirmação;
- dado manual;
- ação externa.

## 9.8 READY_FOR_RESPONSE

Mensagem pronta.

## 9.9 COMPLETED

Sessão finalizada.

## 9.10 CANCELLED

Cancelado pelo usuário.

## 9.11 FAILED

Falha central, não falha de um conector.

Uma falha isolada de conector não altera o caso para `FAILED`.

---

# 10. Modelo de evidência

Toda informação deve virar um fato normalizado.

Exemplo:

```ts
type EvidenceFact = {
  id: string;
  caseId: string;
  key: string;
  value: unknown;
  normalizedValue: unknown;
  sourceSystem: ConnectorId | "ALWAYSCHAT" | "MANUAL" | "DERIVED";
  sourceReference?: string;
  observedAt: string;
  collectedAt: string;
  confidence: number;
  freshness: "FRESH" | "STALE" | "UNKNOWN";
  sensitivity: "PUBLIC" | "INTERNAL" | "PII" | "FINANCIAL";
  acquisition: "SCRAPED" | "MANUAL" | "DERIVED";
  connectorRunId?: string;
  ruleId?: string;
};
```

## 10.1 Campos normalizados mínimos

### Identidade

- customer.name
- customer.cpf
- customer.email
- customer.phone

### Atendimento

- conversation.id
- conversation.url
- conversation.channel
- conversation.tags
- conversation.previousAgent
- conversation.intentText
- conversation.summarySeed

### Pedido

- order.primaryId
- order.yampiId
- order.omieId
- order.manualId
- order.createdAt
- order.source
- order.status
- order.products
- order.quantities
- order.total
- order.shipping
- order.discount
- order.coupon
- order.cashback
- order.upsell
- order.address
- order.responsible

### Pagamento

- payment.status
- payment.method
- payment.installments
- payment.cardholder
- payment.transactionIds
- payment.boleto
- payment.pix
- payment.recoveryState

### Fiscal

- invoice.number
- invoice.accessKey
- invoice.status
- invoice.danfeAvailable
- invoice.products
- invoice.total

### Logística

- logistics.carrier
- logistics.trackingCode
- logistics.status
- logistics.forecast
- logistics.events
- logistics.deliveredAt
- logistics.receiver
- logistics.proof
- logistics.returnState
- logistics.retries
- logistics.reshipment

### Tratativas

- treatment.openTickets
- treatment.acareacao
- treatment.workOrders
- treatment.reverseCode
- treatment.reverseValidity
- treatment.slackDraftNeeded

### Risco

- risk.money
- risk.health
- risk.legal
- risk.fraud
- risk.dataMismatch
- risk.manualConfirmationRequired

---

# 11. Conflitos de evidência

Nenhum conflito pode ser silenciosamente sobrescrito.

Exemplo:

- Rastreio diz entregue;
- transportadora diz devolução;
- cliente diz não recebeu;
- OMIE diz faturado;
- Yampi diz cancelado.

O sistema deve criar um `EvidenceConflict`.

```ts
type EvidenceConflict = {
  key: string;
  facts: EvidenceFact[];
  status: "OPEN" | "RESOLVED" | "IGNORED";
  resolution?: {
    chosenFactId?: string;
    reason: string;
    resolvedBy: "RULE" | "USER";
  };
};
```

## 11.1 Autoridade por campo

A precedência deve ser configurável por campo.

Matriz inicial:

| Campo | Fonte preferencial |
|---|---|
| intenção do cliente | AlwaysChat |
| pagamento de pedido Yampi | Yampi |
| faturamento/NF | OMIE |
| rastreio agregado | Rastreio |
| detalhe final de entrega | transportadora específica |
| origem de pedido manual | Lançador |
| estado de reversa | Correios/Reversa |
| ação financeira interna | entrada manual/Slack |
| promessa feita ao cliente | AlwaysChat |

Ausência em uma fonte não significa automaticamente inexistência.

Exemplo obrigatório:

- pedido de aplicativo pode não aparecer na Yampi;
- resultado vazio na Yampi deve ser `NOT_FOUND_IN_SOURCE`, não `ORDER_DOES_NOT_EXIST`.

---

# 12. Orquestração dos conectores

## 12.1 Princípio

Todos os conectores aplicáveis devem avançar em paralelo sempre que possível.

## 12.2 Ondas de consulta

### Onda 0 — Intake

AlwaysChat.

### Onda 1 — Busca universal

Disparar imediatamente:

- Rastreio no Lançador;
- Yampi;
- OMIE Filial;
- OMIE Matriz/Pharma.

Cada conector escolhe a melhor chave disponível.

### Onda 2 — Logística específica

Assim que transportadora ou rastreio for conhecido:

- Loggi;
- J&T;
- Correios, quando transportadora;
- Reversa, quando contexto de devolução.

### Onda 3 — Preparação operacional

Somente se o fluxo exigir:

- Lançador de Pedidos em modo consulta/rascunho;
- geração de texto para Slack;
- montagem de checklist.

## 12.3 Dependências

Um conector pode ficar em `WAITING_DEPENDENCY`.

Exemplo:

- J&T aguardando tracking code;
- Correios aguardando autorização;
- OMIE aguardando pedido O/B;
- Yampi aguardando CPF/e-mail.

## 12.4 Reutilização de abas

- máximo de uma aba por sistema;
- preferir aba já aberta;
- atualizar apenas quando necessário;
- nunca abrir dezenas de abas;
- identificar aba por domínio e perfil;
- manter registro de `tabId`;
- reabrir apenas se fechada.

## 12.5 Preaquecimento

Ao iniciar o turno, o Companion deve poder:

- validar extensão;
- validar host;
- abrir grupo de sistemas;
- verificar sessão;
- marcar conectores prontos;
- não executar busca;
- não exigir que o primeiro caso pague todo o custo de inicialização.

---

# 13. Contrato de conector

```ts
interface ConsultativeConnector {
  id: ConnectorId;
  version: string;
  displayName: string;
  domains: string[];
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  capabilities: ConnectorCapability[];

  probe(ctx: ProbeContext): Promise<ProbeResult>;
  resolveApplicability(ctx: ConnectorContext): Promise<ApplicabilityResult>;
  buildSearchPlan(ctx: ConnectorContext): Promise<SearchPlan>;
  execute(plan: SearchPlan, runtime: ConnectorRuntime): Promise<ConnectorResult>;
  normalize(raw: unknown, ctx: ConnectorContext): Promise<EvidenceFact[]>;
  detectIntervention(page: PageSnapshot): Promise<Intervention | null>;
  healthCheck(): Promise<ConnectorHealth>;
}
```

## 13.1 Estados da execução

```text
QUEUED
WAITING_DEPENDENCY
OPENING
NAVIGATING
SEARCHING
READING
NORMALIZING
COMPLETE
PARTIAL
NOT_APPLICABLE
NOT_FOUND
BLOCKED_AUTH
BLOCKED_CAPTCHA
BLOCKED_2FA
FAILED_SELECTOR_DRIFT
FAILED_TIMEOUT
FAILED_UNEXPECTED_PAGE
CANCELLED
```

## 13.2 Resultado

```ts
type ConnectorResult = {
  connectorId: ConnectorId;
  runId: string;
  status: ConnectorRunStatus;
  startedAt: string;
  finishedAt?: string;
  facts: EvidenceFact[];
  warnings: ConnectorWarning[];
  intervention?: Intervention;
  diagnostics?: ConnectorDiagnostics;
};
```

## 13.3 Política de seletores

Preferência:

1. atributos estáveis;
2. `data-*`;
3. `aria-label`;
4. roles acessíveis;
5. texto;
6. hierarquia;
7. CSS frágil, apenas fallback.

Cada conector deve possuir:

- seletores primários;
- seletores de fallback;
- detector de tela inesperada;
- versão;
- fixture sanitizada;
- teste de parser.

---

# 14. Intervenções humanas

## 14.1 Login

Quando detectado:

```text
J&T precisa de login.
[Ir para aba]
[Marcar como indisponível]
```

O sistema não pede senha.

## 14.2 Captcha

Quando detectado:

```text
Recaptcha detectado na J&T.
Resolva manualmente e clique em continuar.
[Ir para aba]
[Continuar]
[Ignorar]
```

Nenhuma tentativa de bypass.

## 14.3 Segundo fator

Mesma regra.

## 14.4 Seletor quebrado

```text
OMIE mudou a tela esperada.
A consulta foi interrompida sem alterar dados.
[Repetir]
[Usar entrada manual]
[Abrir diagnóstico]
```

## 14.5 Timeout

Resultado parcial permanece.

---

# 15. Motor heurístico

## 15.1 Entrada

- texto do AlwaysChat;
- fatos normalizados;
- conflitos;
- risco;
- canal;
- produto;
- pedido;
- status;
- histórico.

## 15.2 Processamento textual

- lowercase;
- remoção controlada de acentos;
- normalização de pontuação;
- tokenização;
- detecção de números;
- regex para CPF;
- regex para e-mail;
- regex para pedido;
- regex para rastreio;
- datas;
- valores;
- negação;
- sinônimos;
- erros de digitação comuns.

## 15.3 Regra

```ts
type HeuristicRule = {
  id: string;
  code: string;
  version: number;
  active: boolean;
  priority: number;
  flowId: string;
  weight: number;
  hardMatch: boolean;
  conditions: RuleCondition[];
  exclusions: RuleCondition[];
  requiredFacts: string[];
  producedTags: string[];
  riskEffects: RiskEffect[];
};
```

## 15.4 Operadores

- equals;
- notEquals;
- contains;
- notContains;
- regex;
- in;
- notIn;
- greaterThan;
- lessThan;
- exists;
- missing;
- anyOf;
- allOf;
- sourceIs;
- conflictExists;
- ageMinutes;
- textSignalScore.

## 15.5 Pontuação

Cada fluxo recebe score.

Exemplo:

```text
ENTREGA_NAO_RECONHECIDA
"não recebi"                  +5
"consta entregue"             +5
logistics.status=DELIVERED    +8
receiver divergente           +4
cliente reconheceu entrega   -20
```

## 15.6 Hard rules

Hard rules sobrepõem score.

Exemplos:

- reação adversa;
- alergia;
- ameaça jurídica;
- fraude;
- dinheiro;
- estorno;
- cobrança indevida;
- dados bancários.

## 15.7 Saída

```ts
type FlowCandidate = {
  flowId: string;
  score: number;
  confidence: number;
  role: "PRIMARY" | "SECONDARY" | "RISK_GATE";
  matchedRules: string[];
  supportingFactIds: string[];
  missingFactKeys: string[];
};
```

## 15.8 Decisão sem interferência

O sistema deve:

- escolher um fluxo principal;
- anexar fluxos secundários;
- inserir gates de risco;
- mostrar alternativas;
- não exigir que o usuário classifique manualmente o caso antes de obter resultado.

Quando confiança for baixa:

- selecionar fluxo genérico de triagem;
- preservar top candidatos;
- gerar perguntas discriminatórias;
- permitir evolução ao clicar numa resposta.

---

# 16. Composição de múltiplos fluxos

Um caso pode conter:

- atraso;
- cobrança;
- pedido duplicado;
- ameaça de cancelamento;
- reação adversa;
- marketplace;
- logística reversa.

O motor deve construir um `CaseFlowPlan`.

## 16.1 Regras de composição

1. um fluxo primário;
2. zero ou mais secundários;
3. gates de risco sempre antes de ações;
4. evidências repetidas são compartilhadas;
5. passos idênticos são deduplicados;
6. mensagens conflitantes são bloqueadas;
7. ações financeiras ficam manuais;
8. fluxo de saúde pode interromper fluxo comercial;
9. caminhos impossíveis são removidos;
10. decisões ainda desconhecidas viram ramos.

## 16.2 Resultado esperado

O sistema não deve gerar apenas “fluxo X”.

Deve gerar:

- fluxo principal;
- fluxo secundário;
- por que;
- resumo;
- etapa atual;
- mapa de possibilidades;
- mensagens;
- dependências;
- ações proibidas.

---

# 17. Evolução do domínio ServiceFlow

A estrutura atual deve ser preservada, mas precisa suportar execução real.

## 17.1 Entidades alvo

### ServiceFlow

Identidade do fluxo.

### ServiceFlowVersion

Versão imutável publicada.

### ServiceFlowNode

Passo do grafo.

### ServiceFlowTransition

Ligação condicional entre passos.

### ServiceFlowSession

Execução de caso.

### ServiceFlowSessionStep

Histórico de passos.

### CaseFlowPlan

Plano compilado para um caso.

### CaseFlowPlanNode

Cópia resolvida de um nó no plano.

## 17.2 Tipos de nó

```text
START
CONTEXT
CONSULT
CHECK
DECISION
MANUAL_INPUT
MESSAGE
DRAFT_ACTION
RISK_GATE
HUMAN_CONFIRM
WAIT_EXTERNAL
END
```

## 17.3 Campos de um nó

```ts
type FlowNodeDefinition = {
  key: string;
  type: FlowNodeType;
  title: string;
  operatorInstruction?: string;
  requiredFacts: string[];
  optionalFacts: string[];
  scripts: ScriptBinding[];
  allowedCapabilities: ActionCapability[];
  forbiddenCapabilities: ActionCapability[];
  autoAdvance: boolean;
  riskLevel: RiskLevel;
  terminal: boolean;
};
```

## 17.4 Transição

```ts
type FlowTransitionDefinition = {
  fromNodeKey: string;
  toNodeKey: string;
  label: string;
  order: number;
  condition?: RuleExpression;
  requiresUserChoice: boolean;
};
```

## 17.5 Versionamento

- fluxo publicado é imutável;
- edição cria nova versão;
- sessão fica presa à versão iniciada;
- nova versão não altera casos em andamento;
- restauração deve ser auditada;
- regras guardam versão;
- scripts guardam revisão usada.

---

# 18. Compilador de mensagens sem IA

## 18.1 Fonte

Mensagens devem vir da Scriptoteca.

## 18.2 Estrutura

Um script pode ser composto por:

- saudação;
- diagnóstico;
- orientação;
- prazo;
- ação;
- fechamento;
- aviso;
- variações por canal;
- condição.

## 18.3 Template

```text
Olá, {customer.firstName}! 😊

Verifiquei que o pedido {order.primaryId} está {logistics.statusLabel}.
A previsão informada é {logistics.forecast}.

{conditional:trackingLink}
Você pode acompanhar por este link: {logistics.trackingUrl}
{/conditional}
```

## 18.4 Placeholders

- obrigatório;
- opcional;
- derivado;
- formatado;
- sensível.

## 18.5 Placeholder faltante

O sistema nunca deve gerar:

> Olá, undefined.

Políticas:

- usar variante genérica;
- bloquear cópia quando essencial;
- mostrar pendência;
- pedir dado;
- remover bloco opcional.

## 18.6 Tipos de saída

- cliente;
- e-mail;
- sussurro;
- Slack;
- checklist;
- anotação interna;
- pedido manual;
- ticket.

## 18.7 Resumo determinístico

O resumo deve seguir ordem fixa:

1. demanda;
2. pedido;
3. pagamento;
4. logística;
5. divergência;
6. tratativa;
7. pendência.

Exemplo:

```text
Cliente solicita posição do pedido O761443. Pagamento aprovado. OMIE faturado.
Loggi informa entrega em 10/07 para recebedor divergente; cliente nega recebimento.
Fluxo indicado: entrega não reconhecida/acareação.
```

---

# 19. Políticas de ação

## 19.1 Capabilities

```text
OPEN_TAB
FOCUS_TAB
NAVIGATE
SEARCH
READ
EXTRACT
COPY
INSERT_DRAFT
FILL_FORM
SUBMIT
SEND_MESSAGE
CHANGE_STATUS
CREATE_ORDER
CREATE_REVERSE
OPEN_TICKET
POST_SLACK
```

## 19.2 Matriz inicial

| Capability | Core inicial |
|---|---|
| OPEN_TAB | permitido |
| FOCUS_TAB | permitido |
| NAVIGATE | permitido em consulta |
| SEARCH | permitido |
| READ | permitido |
| EXTRACT | permitido |
| COPY | permitido |
| INSERT_DRAFT | permitido somente por ação explícita |
| FILL_FORM | permitido em rascunho autorizado |
| SUBMIT | proibido |
| SEND_MESSAGE | proibido |
| CHANGE_STATUS | proibido |
| CREATE_ORDER | proibido |
| CREATE_REVERSE | proibido |
| OPEN_TICKET | proibido |
| POST_SLACK | proibido |

## 19.3 Firewall de ação

O executor futuro só pode executar capabilities declaradas pelo nó.

Não deve existir ferramenta genérica “clicar em qualquer seletor”.

Cada ação deve ter:

- conector;
- capability;
- alvo;
- risco;
- confirmação;
- log;
- resultado.

---

# 20. Especificação por sistema

## 20.1 AlwaysChat

### Papel

Origem obrigatória.

### Leitura

- conversa;
- histórico;
- dados;
- tags;
- pedidos;
- canal;
- link;
- anexos;
- atendentes;
- cupons.

### Escrita permitida

- inserir rascunho, somente após clique explícito;
- focar campo.

### Proibido

- enviar;
- resolver;
- transferir;
- tabular;
- agendar;
- aplicar tag;
- atualizar cadastro.

### Risco

Alto.

### Resultado esperado

`AlwaysChatIntake`.

---

## 20.2 Rastreio no Lançador

### Papel

Fonte consultiva universal de primeira linha.

### Busca

Prioridade:

1. CPF;
2. pedido;
3. e-mail;
4. telefone.

### Extrair

- pedidos recentes;
- status;
- previsão;
- produtos;
- pagamento;
- endereço;
- transportadora;
- movimentações;
- reenvios;
- entrega;
- códigos.

### Escrita

Nenhuma.

### Risco

Baixo em read-only.

### Prioridade

Primeiro conector real após AlwaysChat.

---

## 20.3 Lançador de Pedidos

### Papel

Consulta e montagem de rascunho.

### Consultar

- cliente;
- pedido original;
- produtos;
- quantidades;
- endereço;
- pagamento;
- responsável.

### Rascunho permitido

- selecionar tipo;
- selecionar produtos;
- preencher quantidades;
- preencher endereço;
- preencher motivo;
- preencher forma de pagamento;
- preparar dados.

### Proibido

- gerar;
- confirmar;
- disparar;
- recuperar pagamento;
- criar reenvio;
- criar venda.

### Proteção

- botão final nunca acionado pelo Companion;
- aviso quando rascunho estiver pronto;
- detectar confirmação manual bem-sucedida;
- capturar número do pedido gerado;
- alertar para registro obrigatório no Slack;
- permitir desfazer preparação local.

### Risco

Crítico.

---

## 20.4 Yampi

### Papel

Investigação de compra e pagamento.

### Busca

- nome;
- CPF;
- e-mail;
- pedido Yampi.

### Extrair

- produtos;
- kits;
- quantidades;
- valor;
- frete;
- cupom;
- cashback;
- order bump;
- upsell;
- origem;
- titular;
- parcelas;
- transações;
- status;
- boleto existente.

### Proibido

- baixar boleto automaticamente;
- abrir link de pagamento;
- abrir WhatsApp;
- disparar recuperação;
- gerar cobrança.

### Regra especial

Ausência de pedido não encerra investigação, pois pedidos do aplicativo podem não aparecer.

### Risco

Médio/alto.

---

## 20.5 OMIE Filial

### Papel

Faturamento e pedido Extrema.

### Extrair

- pedido;
- NF;
- DANFE;
- produtos;
- quantidades;
- valores;
- endereço;
- status;
- observações.

### Proibido

- arrastar;
- alterar status;
- mover para “Verificar Pedido”;
- editar pedido.

### Proteção

- content script não usa eventos de drag;
- detector de mudança de status pode alertar;
- qualquer alteração manual detectada gera aviso local.

### Risco

Alto.

---

## 20.6 OMIE Matriz/Pharma

### Papel

Consulta de pedidos manipulados/Pharma.

### Extrair

- pedido B;
- produção;
- produtos;
- cliente;
- prazo;
- status.

### Proibido

Toda alteração.

### Implementação

Mesmo conector-base do OMIE, com contexto de base e política mais restrita.

### Risco

Crítico.

---

## 20.7 Slack

### Papel

Saída manual e consulta manual fora da automação.

### Automação

Nenhuma.

### Suporte do Copiloto

- gerar texto;
- copiar;
- registrar draft;
- listar evidências;
- lembrar anexos;
- lembrar pedido/valor/motivo.

### Risco

Crítico.

---

## 20.8 Loggi

### Papel

Consulta logística detalhada.

### Busca

- CPF;
- tracking code.

### Extrair

- movimentações;
- endereço;
- recebedor;
- foto;
- assinatura;
- histórico;
- rota;
- devolução;
- situação real.

### Core inicial

Read-only.

### Futuro

Preparar acareação/alteração, com confirmação.

### Risco

Médio.

---

## 20.9 J&T VIP

### Papel

Consulta logística e tickets.

### Busca

- tracking 88/888;
- ordem de trabalho;
- ticket.

### Extrair

- timeline;
- tentativas;
- transferências;
- interceptações;
- danos;
- entrega;
- tickets.

### Core inicial

Read-only.

### Sessão

Esperar logout frequente.

### Captcha

Detectar e pausar.

### Futuro

Preparar ticket/acareação/endereço, sem confirmar.

### Risco

Médio/alto.

---

## 20.10 Correios/Reversa

### Papel

Consulta de reversa.

### Buscar

- autorização;
- objeto;
- destinatário.

### Extrair

- código;
- validade;
- postagem;
- rastreio;
- estado.

### Core inicial

Read-only.

### Futuro

Preencher reversa sem gerar.

### Login

Detectar segundo fator e pausar.

### Risco

Médio.

---

## 20.11 Chrome perfil de trabalho

### Requisitos

- perfil exclusivo;
- extensão instalada;
- sistemas separados do perfil pessoal;
- abas reaproveitadas;
- sessões mantidas;
- grupo de trabalho;
- bloquear uso acidental de perfil incorreto quando possível;
- indicar perfil incompatível.

---

## 20.12 ChatGPT

Não faz parte do runtime inicial.

O módulo deve reduzir a necessidade de gastar tokens em casos rotineiros.

O usuário continua livre para usar ChatGPT em exceções.

---

## 20.13 Espanso / SmartScript

Integração desejável:

- exportar scripts pessoais;
- importar triggers;
- compartilhar fonte canônica com Scriptoteca;
- evitar divergência;
- não expandir automaticamente no campo errado;
- permitir copiar por botão.

Não é blocker para o CaseFlow Engine.

---

# 21. Performance

## 21.1 SLOs de experiência

Em ambiente aquecido:

| Marco | Meta |
|---|---|
| side panel interativo | até 500 ms |
| intake visível do AlwaysChat | até 2 s |
| primeiro resumo parcial | até 3 s |
| primeiro fluxo acionável | até 5 s em caso simples |
| conector lento marcado | até 10 s |
| timeout duro individual | 30 s |
| loading global | proibido |

## 21.2 Estratégias

- consultas paralelas;
- ondas;
- cache curto;
- tabs prewarmed;
- DOM scraping direto;
- parsers pequenos;
- normalização incremental;
- debounce;
- abort controller;
- timeout individual;
- resultados via eventos;
- UI otimista apenas para apresentação, não para fatos;
- nenhuma espera por “todos concluídos”.

## 21.3 Cache

Chave:

- connector;
- CPF;
- pedido;
- tracking;
- base;
- session.

TTL sugerido:

- 2 minutos para tela operacional;
- 5 minutos para dados estáveis;
- atualização manual sempre disponível.

Cache deve indicar idade.

## 21.4 Consumo

- sem criação ilimitada de abas;
- sem polling agressivo;
- service worker leve;
- host com fila limitada;
- no máximo uma execução ativa por conector por caso;
- deduplicação de busca igual.

---

# 22. Protocolo Companion Host ↔ Extensão

## 22.1 Transporte

WebSocket em loopback.

## 22.2 Segurança

- bind `127.0.0.1`;
- pairing token;
- token gerado localmente;
- origem validada;
- nenhuma porta externa;
- CORS não aberto;
- rotação;
- handshake;
- limite de payload;
- rate limit.

## 22.3 Eventos

```text
COMPANION_HELLO
COMPANION_PAIRED
BROWSER_READY
START_CASE
CASE_INTAKE
RUN_CONNECTOR
CONNECTOR_PROGRESS
CONNECTOR_RESULT
INTERVENTION_REQUIRED
INTERVENTION_RESOLVED
INSERT_DRAFT
DRAFT_INSERTED
CANCEL_RUN
HEALTH_REPORT
```

## 22.4 Mensagem de progresso

```json
{
  "type": "CONNECTOR_PROGRESS",
  "caseId": "case_123",
  "connectorId": "JT_VIP",
  "runId": "run_456",
  "status": "BLOCKED_CAPTCHA",
  "message": "Recaptcha detectado",
  "timestamp": "2026-07-11T12:00:00Z"
}
```

---

# 23. API do AlwaysTrack

Rotas sugeridas:

```text
POST   /v1/case-flow/cases
GET    /v1/case-flow/cases/:caseId
PATCH  /v1/case-flow/cases/:caseId
POST   /v1/case-flow/cases/:caseId/intake
POST   /v1/case-flow/cases/:caseId/facts
GET    /v1/case-flow/cases/:caseId/facts
GET    /v1/case-flow/cases/:caseId/conflicts
POST   /v1/case-flow/cases/:caseId/resolve
GET    /v1/case-flow/cases/:caseId/plan
POST   /v1/case-flow/cases/:caseId/steps/:stepKey/select
POST   /v1/case-flow/cases/:caseId/messages/:messageId/copy
POST   /v1/case-flow/cases/:caseId/complete
POST   /v1/case-flow/cases/:caseId/cancel

GET    /v1/case-flow/connectors
GET    /v1/case-flow/connectors/health
POST   /v1/case-flow/connectors/:connectorId/retry

GET    /v1/service-flows
POST   /v1/service-flows
POST   /v1/service-flows/:flowId/versions
POST   /v1/service-flows/:flowId/versions/:versionId/publish
```

Rotas finais devem respeitar padrão existente.

---

# 24. Persistência

## 24.1 Entidades sugeridas

```text
ServiceCase
ServiceCaseSource
ConnectorRun
EvidenceFact
EvidenceConflict
HeuristicRule
HeuristicRuleVersion
CaseFlowCandidate
CaseFlowPlan
CaseFlowPlanNode
CaseFlowPlanTransition
ServiceFlowVersion
ServiceFlowNode
ServiceFlowTransition
ServiceFlowSessionStep
CompiledMessage
CompanionInstallation
ConnectorDefinition
ConnectorHealthEvent
```

## 24.2 Retenção

Como é ferramenta pessoal:

- salvar caso ajuda em histórico;
- raw HTML não deve ser salvo por padrão;
- cookies nunca devem ser extraídos;
- screenshots só em diagnóstico explícito;
- fatos normalizados podem ser mantidos;
- texto completo da conversa deve ser configurável;
- permitir apagar caso;
- permitir retenção automática.

Sugestão inicial:

- fatos e resumo: mantidos;
- conversa integral: 30 dias;
- diagnóstico de conector: 7 dias;
- screenshots: desativadas;
- cache: minutos.

---

# 25. Segurança

## 25.1 Princípios

- local-first;
- single-user;
- zero exposição pública;
- zero segredo de sistema externo armazenado;
- zero bypass;
- zero IA externa;
- least privilege;
- extensão só nos domínios necessários;
- permissões de host explícitas;
- escrita desabilitada por padrão.

## 25.2 Dados sensíveis

- CPF;
- endereço;
- telefone;
- e-mail;
- pedido;
- valores;
- NF;
- pagamento;
- conversa;
- anexos.

## 25.3 Logs

Não registrar por padrão:

- CPF completo;
- cartão;
- token;
- cookies;
- senha;
- conversa completa;
- HTML bruto.

Registrar:

- hash;
- identificador mascarado;
- status;
- duração;
- conector;
- erro;
- versão.

## 25.4 Sessão do navegador

- reutilizar sessão;
- nunca exportar cookie;
- nunca armazenar cookie;
- nunca sincronizar sessão com backend;
- detectar login;
- pedir intervenção.

---

# 26. Observabilidade

## 26.1 Métricas

- tempo para intake;
- tempo para primeiro resumo;
- tempo para primeiro fluxo;
- tempo por conector;
- taxa de sucesso;
- taxa de captcha;
- taxa de login;
- taxa de seletor quebrado;
- uso de cache;
- fluxo escolhido;
- fluxo corrigido manualmente;
- mensagens copiadas;
- passos por caso;
- tempo economizado estimado;
- quantidade de digitação evitada.

## 26.2 Painel de saúde

Por conector:

- estado;
- última execução;
- sucesso 24h;
- mediana;
- p95;
- versão;
- último selector drift;
- último login;
- último captcha.

## 26.3 Evento de drift

Se um conector passa a retornar tela inesperada:

- marcar degradado;
- parar tentativas destrutivas;
- preservar os outros;
- criar diagnóstico;
- informar usuário.

---

# 27. Testes

## 27.1 Heurística

- casos dourados;
- positivos;
- negativos;
- ambíguos;
- erros de digitação;
- negação;
- múltiplos fluxos;
- riscos;
- regressão.

## 27.2 Fluxos

- transições válidas;
- transições impossíveis;
- loops;
- nós órfãos;
- finais;
- gates;
- versionamento;
- sessão presa à versão.

## 27.3 Mensagens

- placeholders;
- campos faltantes;
- variações;
- formatação;
- nenhum `undefined`;
- nenhum dado de outro caso;
- snapshot.

## 27.4 Conectores

- fixtures HTML sanitizadas;
- parser;
- seletores;
- login;
- captcha;
- página vazia;
- múltiplos resultados;
- erro;
- timeout.

## 27.5 Segurança

- proibido enviar;
- proibido submit;
- proibido drag;
- proibido post Slack;
- token inválido;
- origem inválida;
- porta não exposta;
- payload grande;
- dados mascarados.

## 27.6 Performance

- cinco conectores concorrentes;
- sistema lento;
- um conector travado;
- parcial em tela;
- cache;
- cancelamento;
- múltiplos casos sequenciais.

## 27.7 E2E

Ambiente simulado com páginas fake.

Live smoke manual por conector.

---

# 28. Rollout

## Fase 0 — Fundação

- contratos;
- estrutura;
- threat model;
- dados;
- flow versioning;
- protótipo do side panel.

## Fase 1 — Shadow mode

- AlwaysChat intake;
- Rastreio;
- evidências;
- resumo;
- sem mensagens externas;
- comparar com decisão manual.

## Fase 2 — Fluxo guiado

- heurística;
- ServiceFlow evoluído;
- stepper;
- Scriptoteca;
- copiar.

## Fase 3 — Cobertura consultiva

- Yampi;
- OMIE Filial;
- OMIE Pharma;
- Loggi;
- J&T;
- Correios/Reversa.

## Fase 4 — Rascunhos

- inserir no AlwaysChat;
- montar pedido no Lançador;
- alertas;
- nunca confirmar.

## Fase 5 — Hardening

- métricas;
- drift;
- cache;
- retries;
- performance;
- docs;
- backup.

## Fase futura — Executor agentic limitado

Fora do escopo inicial.

---

# 29. Critérios de aceite macro

## 29.1 Intake

- inicia com conversa AlwaysChat aberta;
- extrai dados;
- cria caso;
- não altera atendimento.

## 29.2 Consultas

- registra conectores;
- executa em paralelo;
- mostra progresso;
- falha isolada não bloqueia;
- captcha pede intervenção;
- login pede intervenção.

## 29.3 Caso

- fatos normalizados;
- conflitos visíveis;
- fontes;
- resumo curto;
- atualização progressiva.

## 29.4 Fluxo

- fluxo principal automático;
- secundários;
- razões;
- grafo compilado;
- stepper funcional;
- voltar;
- sessão versionada.

## 29.5 Mensagens

- determinísticas;
- Scriptoteca;
- placeholders;
- mensagens por possibilidade;
- copiar;
- sussurro;
- Slack draft.

## 29.6 Segurança

- nenhum envio automático;
- nenhum submit;
- nenhum Slack;
- nenhum segredo;
- nenhum cookie persistido;
- nenhuma IA externa.

## 29.7 Performance

- sem loading global;
- primeiro resultado rápido;
- parcial sempre;
- timeout independente;
- cache.

---

# 30. Definition of Done

Uma entrega desta frente só está pronta quando:

- typecheck passa;
- testes de service passam;
- testes de regras passam;
- testes de fluxo passam;
- testes de conector passam;
- extensão compila;
- host compila;
- UI não apresenta overflow;
- side panel funciona;
- caso simples é demonstrável;
- caso com captcha é demonstrável;
- conector falho não bloqueia;
- nenhum clique proibido é possível pelo executor;
- logs não vazam dados;
- docs são atualizados;
- demo guiada existe;
- rollback existe.

---

# 31. Mapa para o Taskyfier

O `taskyfier` deve criar tasks pequenas por domínio.

## Bloco A — Especificação e contratos

- arquitetura;
- threat model;
- contratos compartilhados;
- estados;
- capacidades;
- protocolo.

## Bloco B — Extensão

- Manifest V3;
- side panel;
- service worker;
- content script base;
- pairing;
- tab registry;
- intervention UI.

## Bloco C — Companion Host

- WebSocket;
- autenticação;
- orquestrador;
- timeout;
- cache;
- health;
- logs.

## Bloco D — Case core

- schema;
- migrations;
- service;
- handlers;
- facts;
- conflicts;
- lifecycle.

## Bloco E — Heurística

- DSL;
- engine;
- scoring;
- hard gates;
- golden cases.

## Bloco F — ServiceFlow executável

- versões;
- nós;
- transições;
- sessões;
- compilador;
- compatibilidade.

## Bloco G — UI guiada

- resumo;
- status;
- fluxos;
- mapa;
- stepper;
- mensagens;
- atalhos.

## Bloco H — Scriptoteca

- placeholders;
- fragments;
- output por canal;
- Slack draft;
- sussurro.

## Bloco I — Conectores

Uma task por conector:

1. AlwaysChat;
2. Rastreio;
3. Yampi;
4. OMIE Filial;
5. OMIE Pharma;
6. Loggi;
7. J&T;
8. Correios/Reversa;
9. Lançador draft.

## Bloco J — Segurança/performance

- action firewall;
- redaction;
- metrics;
- progressive UI;
- cache;
- drift;
- runbook.

## Bloco K — Demo/rollout

- seeds;
- fixtures;
- casos;
- roteiro;
- shadow mode.

---

# 32. Ordem obrigatória

1. contratos;
2. extensão shell;
3. host shell;
4. intake AlwaysChat;
5. caso/evidência;
6. Rastreio;
7. resumo parcial;
8. heurística;
9. fluxo compilado;
10. stepper;
11. mensagens;
12. demais conectores;
13. rascunhos;
14. hardening.

Não começar por:

- canvas visual;
- bot autônomo;
- IA;
- Slack;
- ações financeiras;
- todos conectores simultaneamente sem fundação;
- automação de pedido final.

---

# 33. Não objetivos

- substituir AlwaysChat;
- responder automaticamente;
- enviar automaticamente;
- automatizar Slack;
- burlar captcha;
- resolver 2FA;
- guardar senha;
- usar marketplace;
- virar SaaS;
- suportar vários usuários;
- produção corporativa;
- integração oficial;
- IA generativa;
- OCR como método principal;
- criar agente livre;
- automatizar ações destrutivas.

---

# 34. Prontidão para agente futuro

O agente futuro deve receber:

- caso;
- evidências;
- plano;
- nó atual;
- capabilities;
- gates;
- mensagens;
- ferramentas permitidas.

Ele não recebe:

- navegador irrestrito;
- clique genérico;
- acesso a Slack;
- submit;
- senha;
- cookies;
- poder de decidir ação financeira.

A arquitetura inicial deve permitir adicionar um executor sem alterar:

- modelo de caso;
- modelo de fluxo;
- scripts;
- gates;
- protocolo de conectores.

---

# 35. Exemplos ponta a ponta

## 35.1 Caso simples — posição de pedido

Entrada:

> Quero saber do meu pedido.

Resultado progressivo:

```text
AlwaysChat: concluído
Rastreio: concluído
Yampi: concluído
OMIE: consultando
```

Resumo:

```text
Cliente solicita posição do pedido O123. Pagamento aprovado.
Pedido faturado e em transporte pela Loggi. Previsão: 15/07.
```

Fluxo:

```text
POSICAO_DE_PEDIDO
```

Passo:

```text
Informar status e previsão
```

Mensagem:

```text
Olá, Maria! 😊

Verifiquei aqui e o seu pedido está em transporte pela Loggi, com previsão de entrega para 15/07.
```

---

## 35.2 Entrega não reconhecida

Resumo:

```text
Cliente nega recebimento. Rastreio e Loggi constam entregue em 10/07.
Recebedor informado não foi reconhecido.
```

Fluxos:

- entrega não reconhecida;
- acareação;
- risco logístico.

Possibilidades:

1. cliente reconhece recebedor;
2. cliente não reconhece;
3. endereço divergente;
4. transportadora confirma extravio.

Cada ramo possui mensagem pronta.

---

## 35.3 J&T com captcha

A montagem não para.

```text
Rastreio: concluído
Yampi: concluído
OMIE: concluído
J&T: bloqueado por recaptcha
```

Resumo parcial utilizável.

Botão:

```text
Resolver recaptcha na J&T
```

Após intervenção, conector retoma.

---

## 35.4 Pedido manual

Fluxo indica reenvio.

O sistema:

- abre Lançador;
- preenche;
- mostra checklist;
- não gera.

Mensagem:

```text
Rascunho pronto.
Revise produto, quantidade, endereço, motivo e pagamento.
A geração permanece manual.
```

Após usuário gerar:

- captura número;
- alerta Slack;
- gera texto;
- não posta.

---

# 36. Riscos principais

## 36.1 Mudança de DOM

Mitigação:

- conectores isolados;
- fixtures;
- versão;
- drift;
- fallback manual.

## 36.2 Sessão expirada

Mitigação:

- detectar;
- pausar;
- retomar.

## 36.3 Performance

Mitigação:

- paralelo;
- ondas;
- cache;
- parcial;
- timeout.

## 36.4 Regra errada

Mitigação:

- regras versionadas;
- golden cases;
- razões visíveis;
- correção;
- feedback.

## 36.5 Dado cruzado

Mitigação:

- caseId em toda mensagem;
- limpeza entre casos;
- checks de identidade;
- impedir reutilização errada;
- testes.

## 36.6 Ação indevida

Mitigação:

- capabilities;
- firewall;
- proibições;
- nenhuma ferramenta genérica;
- confirmação.

---

# 37. Métrica de sucesso

A frente será bem-sucedida se reduzir:

- digitação;
- Ctrl+C/Ctrl+V;
- Alt+Tab;
- buscas repetidas;
- tempo de montagem;
- erros de fluxo;
- mensagens incorretas;
- carga mental;
- esforço manual.

Indicadores:

- tempo até resposta pronta;
- cliques por caso;
- caracteres digitados;
- abas visitadas manualmente;
- fluxos corrigidos;
- mensagens reeditadas;
- casos resolvidos sem ChatGPT;
- taxa de conector;
- uso diário.

---

# 38. Diretriz final

O módulo deve ser construído como infraestrutura operacional durável.

O objetivo imediato não é “automatizar o SAC”.

O objetivo é transformar um atendimento fragmentado em:

```text
AlwaysChat
→ caso
→ consultas
→ evidências
→ heurística
→ fluxo compilado
→ etapa guiada
→ mensagens
→ confirmação humana
```

A primeira versão deve ser útil mesmo sem:

- IA;
- agente;
- API;
- automação de escrita;
- integração oficial.

A arquitetura deve ser boa o bastante para que, no futuro, um executor agentic possa seguir os mesmos passos sem receber liberdade irrestrita.

**Construir primeiro o trilho. Automatizar o trem depois.**
