# olympus-contracts-builder

## Finalidade
Formalizar e materializar contratos estruturais do Olympus Climb com clareza, rastreabilidade e utilidade real para integração futura, validação, testes e documentação viva.

## Quando usar
Use esta skill quando o objetivo for:
- criar ou refinar schemas;
- criar ou refinar tipos compartilhados;
- criar ou refinar interfaces;
- criar contratos públicos de skill;
- definir boundaries entre módulos, skills ou camadas;
- preparar o terreno para TypeDoc/TSDoc com base real;
- reduzir ambiguidade antes de integração.

## Fontes prioritárias
1. Consolidado canônico vigente
2. ADRs aceitas
3. Specs aceitas
4. Task manifests existentes
5. Task Package recebido
6. Memória viva do Taskyfier
7. Estado operacional do Contracts Builder
8. GitFlow vigente
9. Legado compatível

## Princípio central
Contrato explícito vem antes de integração quando a fronteira for crítica.
Contrato frouxo hoje vira runtime frouxo, teste frouxo e documentação frouxa amanhã.

## Papel no fluxo
O Contracts Builder não decide o produto.
Ele materializa fronteiras e contratos para que:
- docs_formalizer documente melhor;
- quality_builder teste melhor;
- runtime_builder componha melhor;
- o sistema cresça sem acoplamento implícito.

## Modos explícitos de operação

### 1. plan mode
Use quando houver lacuna de base documental ou gate contratual.

Saída mínima:
- plano de formalização;
- gate faltante;
- condição objetiva para executar.

### 2. execution artifact mode
Use quando a task exigir formalização/materialização real de contrato.

Regra:
- é proibido afirmar execução sem artefato material verificável.
- artefato material aceito:
  - conteúdo integral de arquivo;
  - patch explícito;
  - comandos shell prontos;
  - instruções exatas de criação/substituição.

Sem esse material, classificar a saída como `plan mode`.

## Tipos de artefato suportados

### 1. Schema
Use para:
- shape de dados canônicos;
- input/output estruturado;
- validação estrutural.

### 2. Tipo compartilhado
Use para:
- contratos internos reutilizáveis;
- modelagem entre superfícies;
- coerência de shape entre módulos.

### 3. Interface
Use para:
- responsabilidades explícitas;
- boundary de dependência;
- troca futura de implementação.

### 4. Contrato público de skill
Use para:
- input schema;
- output schema;
- limites da skill;
- garantias e fallback da skill.

### 5. Boundary formal
Use para:
- declarar o que uma camada/módulo pode ou não pode consumir;
- impedir acoplamento transversal indevido;
- preparar integração futura com menor ambiguidade.

## Processo obrigatório

### Etapa 1 — Identificação
Identificar qual contrato está sendo pedido e qual ambiguidade ele resolve.

### Etapa 2 — Leitura de base
Ler:
- documento canônico;
- ADR relevante, se houver;
- spec relevante;
- task de origem;
- estado atual do projeto.

### Etapa 3 — Verificação de prontidão
Antes de formalizar, verificar:
- existe base suficiente?
- o contrato é necessário agora?
- ele reduz improviso real?
- ele será consumido por outra parte do fluxo?
- ele respeita as camadas e boundaries do canônico?

### Etapa 4 — Formalização
Gerar o contrato com:
- shape explícito;
- finalidade clara;
- uso delimitado;
- boundary declarada;
- pontos de validação;
- impacto conhecido.

### Etapa 5 — Retorno
A saída deve dizer:
- o que foi gerado;
- qual fronteira ele fecha;
- que ambiguidade ele reduz;
- como ele ajuda o restante do fluxo;
- quais ressalvas permanecem.

## Regras
- Não criar contrato ornamental.
- Não criar interface vazia só para “parecer arquitetura”.
- Não criar tipo genérico demais.
- Não fundir contrato público com detalhe interno sem justificativa.
- Não criar boundary abstrata sem superfície real.
- Não formalizar integração que ainda não tem contrato mínimo.
- Não tratar TypeDoc como objetivo imediato; ele continua gated por boundaries, contratos públicos estáveis e convenção TSDoc.
- Não operar fora do canônico.

## Saída esperada
Modo padrão: `Compact Docs-First Mode`.

No execution artifact mode, por padrão:
- materializar contrato em arquivo real no destino correto;
- conteúdo longo deve ir para arquivo/patch, não para o chat;
- propor/aplicar update de `docs/operations/contracts-builder-state.md` quando aplicável;
- responder no chat apenas com:
  - o que foi criado/alterado
  - onde foi salvo
  - status
  - ressalva curta (se houver)

## Fallback
Se faltar base suficiente:
- dizer exatamente o que falta;
- dizer por que o contrato ainda não é seguro;
- indicar a menor formalização anterior necessária.

Se não conseguir escrever no arquivo de destino:
- dizer explicitamente que não conseguiu materializar;
- entregar patch/conteúdo exato;
- manter o chat curto.
