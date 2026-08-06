# ADR-007 - Especialista Product UX local-first

## Metadata
- status: accepted
- owner: olympus_orchestrator
- last-updated: 2026-08-05
- source-of-truth: docs/adr/ADR-007-product-ux-specialist-local-first.md

## Contexto
O AlwaysTrack possui trabalho recorrente de jornada, arquitetura de informação da tela, hierarquia, densidade, estados, microcopy, responsividade, teclado, foco e acessibilidade. A malha Olympus cobre crítica arquitetural, taskificação, documentação, contratos, scaffolding, runtime, qualidade, roteamento e aceite, mas não atribui ownership explícito à definição e à revisão da experiência observável do produto.

Distribuir essa responsabilidade entre os kits existentes manteria três ambiguidades:

1. o Runtime Builder poderia implementar uma interpretação sem uma especificação de interação independente;
2. o Quality Builder poderia criar checks sem um comportamento UX alvo suficientemente explícito;
3. uma revisão de código poderia ser apresentada como validação visual mesmo quando nenhum browser reproduziu a superfície.

O repositório já oferece rotas, roles, seeds sintéticos, Playwright e baselines visuais que permitem adquirir o estado atual sem exigir que o usuário forneça prints em toda análise. Ao mesmo tempo, esse estado atual não define sozinho uma direção estética futura, e capturas podem expor dados, credenciais ou contexto indevido se não houver uma política explícita.

A decisão humana vigente é construir a versão completa do especialista no mesmo esquema local dos agentes Olympus, preservando uma fronteira portável para possível extração futura.

## Decisão
Adotar um especialista local-first com nome canônico `olympus_product_ux` e skill package `olympus-product-ux`, subordinado ao pipeline Olympus e ao contrato de [SPEC-AT-005](../specs/SPEC-AT-005-product-ux-specialist.md).

### 1. Modos de capacidade
Um único especialista multimodo cobre:

1. `audit`: diagnosticar o estado atual com findings priorizados, reproduzíveis e sustentados por evidência;
2. `interaction-spec`: transformar decisão aceita em contrato observável de jornada, estados, interação, apresentação, conteúdo e acessibilidade;
3. `advisory-review`: comparar uma implementação produzida por outro executor com task, spec e evidência, sem emitir aceite final.

Esses modos de capacidade não substituem os modos operacionais do pipeline. Fora de uma task roteada, o especialista opera de forma consultiva e read-only. Com Task Package e Execution ID válidos, opera em `execution artifact mode` e materializa somente artefatos UX e evidências autorizadas.

### 2. Autonomia visual local com falha fechada
O especialista pode descobrir e capturar autonomamente o estado atual quando app, seed, role, superfície, estado, viewport e browser forem reproduzíveis com dados seguros. O usuário não precisa fornecer print do AlwaysTrack por padrão.

Uma afirmação sobre aparência renderizada, reflow, overflow, colisão, foco visível, target size ou regressão visual exige evidência adquirida em browser e inspeção da captura correspondente. JSX, CSS, DOM, build ou documentação isolados não constituem validação visual.

Falha de browser, autenticação, seed, navegação, estado ou sanitização produz `VISUAL_ACQUISITION_BLOCKED`. O especialista pode registrar análise estrutural não visual separadamente, mas não pode concluir o gate visual, inventar o estado renderizado nem usar fallback silencioso.

### 3. Referência e decisão humanas
Uma referência humana não é necessária para defeitos objetivos e reproduzíveis nem para aderência a padrões já aceitos do produto. Ela é obrigatória quando o resultado depende de direção de marca, preferência estética, referência externa, estado live não reproduzível, conflito entre referências, prioridade de negócio não documentada ou escolha entre alternativas legitimamente equivalentes.

Nesses casos, o especialista deve parar no gate de intenção e pedir somente o menor insumo necessário. Uma captura do estado atual só passa a representar o alvo quando essa intenção estiver explícita.

### 4. Separação de ownership e independência
O Product UX é dono do diagnóstico e da especificação da experiência observável. Ele não:

- decide arquitetura, dados, segurança, tenancy ou regra de negócio;
- cria ou sequencia tasks;
- torna sua saída canônica por conta própria;
- formaliza schemas ou contratos públicos fora do handoff devido;
- implementa React, CSS, markup, wiring ou assets do produto;
- cria ou aprova seus próprios gates de qualidade;
- atualiza baseline para fazer um check passar;
- emite a classificação final de uma task.

Quem especifica ou recomenda não aprova a própria solução. `advisory-review` produz insumo para o Task Verifier ou para uma autoridade humana independente.

### 5. Privacidade e classificação da evidência
Toda evidência deve declarar duas dimensões independentes: `evidence_origin` (`user-provided` ou `product-ux-acquired`) e `environment.classification` (`fake`, `local`, `production-like` ou `live`). Também deve registrar propósito, superfície, role, estado, viewport, revisão do repositório e resultado da sanitização. `user-provided` não é classe ambiental e `local/fake` é apenas abreviação de prosa, nunca um enum concorrente.

O padrão é ambiente local/fake, dados sintéticos e artefato transitório ignorado pelo Git. Cookies, tokens, credenciais, PII, HTML bruto sensível e storage state não podem ser persistidos no pacote. Uso de ambiente ou dado live exige autorização explícita, escopo mínimo, redaction e política de retenção definida. Baselines versionados nunca são atualizados automaticamente.

### 6. Estratégia local-first e extração futura
A proximidade com rotas, roles, seeds, tokens, componentes e harness do AlwaysTrack é intencional na primeira versão. O núcleo deve, porém, manter input/output, taxonomia de findings, origem/classificação de evidência e gates independentes de provider.

A extração para plugin ou repositório externo só pode ser proposta quando todos os critérios abaixo forem comprovados:

1. o contrato público permaneceu materialmente estável em pelo menos três ciclos úteis concluídos, cobrindo no mínimo dois modos de capacidade e três jornadas distintas;
2. existe um segundo consumidor real, fora do AlwaysTrack, usando o contrato sem depender da documentação interna do produto;
3. nomes de rota, role, seed e domínio do AlwaysTrack estão restritos a adapters ou configuração, sem vazamento para o núcleo público;
4. evals, política de evidência, redaction e comportamento fail-closed passam para os dois consumidores;
5. há owner, versionamento, compatibilidade, distribuição, suporte e plano de migração explícitos;
6. uma ADR própria demonstra que o ganho de compartilhamento supera o custo operacional da extração.

Cumprir os critérios permite abrir a decisão de extração; não a torna automática.

### 7. Schema do novo agente Codex
A configuração do novo agente usa o schema moderno suportado no momento de sua criação, incluindo os campos contemporâneos de instrução, esforço de raciocínio e sandbox. Esta decisão vale somente para o novo agente.

Os agentes legados permanecem válidos em seus schemas atuais. Esta ADR não autoriza migração em massa, normalização cosmética ou troca de modelo/provider nos demais TOMLs. A portabilidade comportamental continua apoiada no skill package, nos contratos documentais e no bundle Antigravity, não em um modelo específico.

## Matriz de ownership

| Papel | Ownership preservado | Relação com Product UX |
| --- | --- | --- |
| Autoridade humana/produto | marca, gosto, prioridade, política e escolha entre alternativas válidas | resolve gates de intenção que não podem ser inferidos |
| Architecture Critic | coerência arquitetural, trade-offs sistêmicos e decisões de engenharia | recebe impactos percebidos; Product UX não decide architecture boundary |
| Taskyfier | derivação, quebra, prioridade e sequência de tasks | transforma decisão UX aceita em trabalho rastreável |
| Orchestrator | roteabilidade, modo, handoff e consolidação do ciclo | seleciona Product UX e protege escopo e independência |
| Docs Formalizer | ADR, spec, manifest, runbook e documento canônico | materializa decisões a partir do input estruturado de UX |
| Contracts Builder | schemas, tipos, interfaces e contratos públicos | formaliza boundaries quando uma especificação aceita exigir contrato |
| Scaffolding Builder | estrutura e arquivos-base | cria scaffold autorizado; não define experiência |
| Runtime Builder | implementação, handlers, componentes e wiring | implementa a interaction spec aceita; não recebe aceite do autor da spec |
| Quality Builder | testes, E2E, evals, checks e quality gates | transforma critérios UX em prova repetível e independente |
| Product UX | jornada, hierarquia, densidade, estados, microcopy, responsividade, acessibilidade e evidência UX | audita, especifica e revisa; não implementa nem aprova |
| Task Verifier | aceite final contra task, DoD e evidência integral | usa o advisory review como uma fonte, sem delegar a classificação |

## Alternativas consideradas
1. **Distribuir UX entre Critic, Runtime e Quality:** rejeitada por deixar diagnóstico, especificação e independência sem owner único.
2. **Criar uma skill por tipo de trabalho UX:** adiada; três skills aumentariam roteamento e divergência antes de o contrato estabilizar.
3. **Criar plugin ou repositório externo desde o primeiro ciclo:** rejeitada por abstrair antes de provar uso e por afastar o especialista do contexto local necessário.
4. **Permitir implementação e revisão no mesmo agente:** rejeitada por conflito de interesse e perda de evidência independente.
5. **Exigir prints do usuário em toda análise:** rejeitada porque o runtime local reproduzível deve ser adquirido autonomamente; a exigência fica restrita aos gates humanos descritos.

## Consequências
- positivas: ownership explícito; especificações mais executáveis; evidência visual reproduzível; menos dependência de prints manuais; separação entre recomendar, implementar, testar e aprovar.
- negativas: novo handoff no pipeline; custo de manter harness, taxonomias e evals; bloqueio explícito quando browser ou intenção não estiverem disponíveis.
- trade-offs: a solução nasce acoplada operacionalmente ao repositório para ganhar contexto e velocidade, mas preserva contratos portáveis e gates objetivos de extração.
- operacionais: execuções visuais precisam de ambiente determinístico, sanitização, manifesto de captura e retenção controlada; validação assistiva ou com usuário real continua manual quando aplicável.

## Impacto em artefatos
- specs relacionadas: `docs/specs/SPEC-AT-005-product-ux-specialist.md`
- tasks relacionadas: [backlog Product UX](../tasks/PRODUCT-UX-SPECIALIST-BACKLOG-2026-08-05.md) e `TASK-AT-440` a `TASK-AT-450`
- runbooks relacionados: a definir em `TASK-AT-448`

## Validação e evidência esperada
- validação: cruzar modos, matriz de ownership, gates de evidência e critérios de extração com os contratos dos kits Olympus e executar `npm run check:docs` e `git diff --check`.
- evidência: ADR e spec ligadas, nenhum ownership concorrente, falha visual e ausência de referência com comportamento explícito, e compatibilidade do novo schema delimitada sem migração legada.

## Fora de escopo
Esta ADR não cria identidade visual, design system, código de produto, harness, testes, agente, skill, routing, baseline ou plugin externo. Cada artefato runtime ou operacional depende das tasks posteriores do backlog Product UX.
