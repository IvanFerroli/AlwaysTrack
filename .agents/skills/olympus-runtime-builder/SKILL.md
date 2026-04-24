# olympus-runtime-builder

## Finalidade
Materializar partes do runtime do Olympus Climb de forma pequena, rastreável e segura, sempre em cima de contratos, specs, tasks e validação mínima já definidos.

## Quando usar
Use esta skill quando o objetivo for:
- criar ou refinar um agente;
- criar ou refinar um skill handler;
- criar wiring mínimo entre módulos internos;
- montar composição runtime pequena e explícita;
- ligar superfícies já contratadas;
- avançar uma vertical mínima sem abrir integração ampla demais.

## Fontes prioritárias
1. Consolidado canônico vigente
2. ADRs aceitas
3. Specs aceitas
4. Task manifests existentes
5. Task Package recebido
6. Contratos existentes
7. Artefatos de qualidade relevantes
8. Memória viva do Taskyfier
9. Estado operacional do Runtime Builder
10. GitFlow vigente
11. Legado compatível

## Princípio central
Runtime só nasce em cima de contrato, spec, task e validação mínima.
Sem isso, ele vira acoplamento prematuro.

## Papel no fluxo
O Runtime Builder não decide o produto.
Ele materializa execução interna para que:
- contracts_builder defina fronteiras antes do wiring;
- quality_builder proteja comportamento antes da expansão;
- scaffolding_builder prepare a base estrutural;
- o sistema avance por vertical mínima, não por integração explosiva.

## Modos explícitos de operação

### 1. plan mode
Use quando qualquer gate obrigatório de runtime falhar.

Saída mínima:
- plano de materialização;
- gates faltantes;
- condição objetiva para execução segura.

### 2. execution artifact mode
Use quando os gates estiverem satisfeitos e a task exigir materialização real.

Regra:
- é proibido afirmar execução runtime sem artefato material.
- artefato material aceito:
  - conteúdo integral de arquivo;
  - patch explícito;
  - comandos shell prontos;
  - instruções exatas de criação/substituição.

Sem esse material, classificar como `plan mode`.

## Tipos de artefato suportados

### 1. Agente
Use para:
- criar estrutura base de um agente específico;
- materializar uma responsabilidade estreita do runtime.

### 2. Skill handler
Use para:
- conectar contrato de input/output;
- preparar execução formal de uma skill;
- materializar handler com limite claro.

### 3. Composição runtime
Use para:
- ligar artefatos runtime já contratados;
- montar fluxo interno pequeno e explícito.

### 4. Wiring entre módulos internos
Use para:
- conectar módulos já delimitados;
- preparar passagem mínima entre superfícies compatíveis.

### 5. Setup mínimo de fluxo interno
Use para:
- viabilizar uma vertical pequena;
- preparar fluxo controlado e validável.

## Gates obrigatórios

### Gate 1 — Contrato
Antes de construir, verificar:
- schema definido;
- interface definida;
- boundary declarada;
- contrato público da superfície já formalizado, quando aplicável.

### Gate 2 — Spec
Antes de construir, verificar:
- spec aceita;
- escopo claro;
- fora de escopo claro;
- superfícies afetadas definidas;
- critério de aceite definido.

### Gate 3 — Task
Antes de construir, verificar:
- objetivo único;
- alvos explícitos;
- dependências conhecidas;
- validação definida;
- evidência esperada.

### Gate 4 — Qualidade mínima
Antes de construir, verificar:
- existe estratégia mínima de teste/check;
- existe evidência mínima;
- existe caminho de verificação observável.

### Gate 5 — Vertical mínima
Antes de construir, verificar:
- a task cabe numa vertical pequena e rastreável;
- não é uma tentativa de “ligar tudo”;
- não é um atalho para integração ampla.

## Processo obrigatório

### Etapa 1 — Identificação
Identificar que artefato runtime está sendo pedido e que parte da vertical ele viabiliza.

### Etapa 2 — Leitura de base
Ler:
- documento canônico;
- ADR relevante;
- spec relevante;
- task de origem;
- contratos existentes;
- artefatos de qualidade;
- estado atual do projeto.

### Etapa 3 — Verificação dos gates
Validar:
- contrato;
- spec;
- task;
- qualidade mínima;
- vertical mínima.

### Etapa 4 — Materialização
Gerar o artefato runtime com:
- wiring mínimo;
- responsabilidade estreita;
- boundary respeitada;
- impacto conhecido;
- validação observável.

### Etapa 5 — Retorno
A saída deve dizer:
- o que foi materializado;
- quais gates permitiram a materialização;
- qual boundary foi respeitada;
- que validação mínima continua obrigatória;
- quais ressalvas permanecem.

## Regras
- Não construir runtime “base” sem task concreta.
- Não atravessar layers sem contrato.
- Não gerar composição ampla demais.
- Não antecipar integração por ansiedade de progresso.
- Não operar fora do canônico.
- Não ignorar gate faltante.
- Não tratar wiring como valor em si; valor é wiring útil, pequeno e validável.

## Saída esperada
Modo padrão: `Compact Docs-First Mode`.

No execution artifact mode, por padrão:
- materializar runtime em arquivo real no destino correto;
- conteúdo longo deve ir para arquivo/patch, não para o chat;
- propor/aplicar update de `docs/operations/runtime-builder-state.md` quando aplicável;
- responder no chat apenas com:
  - o que foi criado/alterado
  - onde foi salvo
  - status
  - ressalva curta (se houver)

## Fallback
Se faltar base suficiente:
- dizer exatamente o que falta;
- dizer qual gate falhou;
- indicar a menor formalização anterior necessária.

Se não conseguir escrever no arquivo de destino:
- dizer explicitamente que não conseguiu materializar;
- entregar patch/conteúdo exato;
- manter o chat curto.
