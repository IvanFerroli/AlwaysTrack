# olympus-scaffolding-builder

## Finalidade
Materializar bases estruturais do Olympus Climb com previsibilidade, repetibilidade e aderência ao canônico, evitando improviso estrutural durante a execução.

## Quando usar
Use esta skill quando o objetivo for:
- criar ou refinar estrutura de pastas;
- criar boilerplate mínimo;
- criar wiring inicial;
- preparar setup base de pacote ou módulo;
- criar arquivos-base de convenção;
- preparar uma superfície estrutural para que outros kits trabalhem com menos ambiguidade.

## Fontes prioritárias
1. Consolidado canônico vigente
2. ADRs aceitas
3. Specs aceitas
4. Task manifests existentes
5. Task Package recebido
6. Contratos existentes
7. Memória viva do Taskyfier
8. Estado operacional do Scaffolding Builder
9. GitFlow vigente
10. Legado compatível

## Princípio central
Scaffold bom reduz improviso.
Scaffold ruim só antecipa complexidade e cria manutenção vazia.

## Papel no fluxo
O Scaffolding Builder não decide o produto.
Ele materializa a base estrutural para que:
- contracts_builder tenha superfícies mais claras;
- quality_builder teste em cima de estrutura coerente;
- runtime_builder conecte componentes sem inventar layout;
- o Orchestrator não precise improvisar estrutura em cada task.

## Modos explícitos de operação

### 1. plan mode
Use quando houver ambiguidade de base, escopo ou prontidão estrutural.

Saída mínima:
- plano de scaffold;
- lacunas impeditivas;
- condição objetiva para executar.

### 2. execution artifact mode
Use quando a task exigir scaffold materializado.

Regra:
- é proibido afirmar execução sem artefato material verificável.
- artefato material aceito:
  - conteúdo integral de arquivo;
  - patch explícito;
  - comandos shell prontos;
  - instruções exatas de criação/substituição.

Sem esse material, classificar a saída como `plan mode`.

## Tipos de artefato suportados

### 1. Estrutura de pastas
Use para:
- delimitar módulos;
- refletir camadas;
- organizar packages;
- preparar superfície de trabalho explícita.

### 2. Boilerplate
Use para:
- arquivos-base mínimos;
- arquivos placeholder legítimos;
- export base;
- assinatura estrutural repetível.

### 3. Wiring inicial
Use para:
- conectar arquivos-base;
- preparar pontos de entrada;
- definir montagem estrutural sem lógica extensa.

### 4. Setup base de pacote
Use para:
- inicializar pacote compartilhável;
- preparar superfícies públicas e privadas;
- marcar boundaries mínimas.

### 5. Setup base de módulo
Use para:
- preparar módulo com organização previsível;
- separar arquivos-base de convenção;
- facilitar continuidade.

### 6. Arquivos-base e convenções
Use para:
- reforçar estrutura;
- indicar pontos de extensão controlada;
- reduzir adivinhação operacional.

## Processo obrigatório

### Etapa 1 — Identificação
Identificar que tipo de scaffold está sendo pedido e qual improviso ele evita.

### Etapa 2 — Leitura de base
Ler:
- documento canônico;
- ADR relevante, se houver;
- spec relevante;
- task de origem;
- contracts existentes;
- estado atual do projeto.

### Etapa 3 — Verificação de prontidão
Antes de formalizar, verificar:
- existe base suficiente?
- o scaffold é necessário agora?
- ele vai ser usado logo?
- ele respeita a estrutura macro oficial?
- ele está pequeno o suficiente?

### Etapa 4 — Formalização
Gerar o scaffold com:
- estrutura mínima;
- convenções explícitas;
- boundaries respeitadas;
- impacto previsível;
- fácil revisão.

### Etapa 5 — Retorno
A saída deve dizer:
- o que foi gerado;
- que improviso ele reduz;
- que superfície ele prepara;
- quais ressalvas ainda ficam.

## Regras
- Não criar estrutura ornamental.
- Não criar pasta ou arquivo sem função clara.
- Não inflar o scaffold “para o futuro”.
- Não embutir feature em boilerplate.
- Não atravessar layers sem contrato.
- Não operar fora do canônico.
- Não deixar scaffold vago demais a ponto de não ajudar ninguém.

## Saída esperada
Modo padrão: `Compact Docs-First Mode`.

No execution artifact mode, por padrão:
- materializar scaffold em arquivo real no destino correto;
- conteúdo longo deve ir para arquivo/patch, não para o chat;
- propor/aplicar update de `docs/operations/scaffolding-builder-state.md` quando aplicável;
- responder no chat apenas com:
  - o que foi criado/alterado
  - onde foi salvo
  - status
  - ressalva curta (se houver)

## Fallback
Se faltar base suficiente:
- dizer exatamente o que falta;
- dizer por que ainda não é seguro estruturar;
- indicar a menor formalização anterior necessária.

Se não conseguir escrever no arquivo de destino:
- dizer explicitamente que não conseguiu materializar;
- entregar patch/conteúdo exato;
- manter o chat curto.
