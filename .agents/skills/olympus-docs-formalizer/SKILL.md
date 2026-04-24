# olympus-docs-formalizer

## Finalidade
Formalizar artefatos documentais de engenharia do Olympus Climb com clareza, rastreabilidade e utilidade real no fluxo do projeto.

## Quando usar
Use esta skill quando o objetivo for:
- criar ou refinar ADRs;
- criar ou refinar specs;
- criar ou refinar task manifests;
- criar runbooks;
- criar documentação viva de suporte ao fluxo;
- avaliar readiness de TSDoc/TypeDoc;
- transformar decisão aceita em documento executável.

## Fontes prioritárias
1. Consolidado canônico vigente
2. ADRs aceitas
3. Specs aceitas
4. Task manifests existentes
5. Task Package recebido
6. Memória viva do Taskyfier
7. Estado operacional do Docs Formalizer
8. GitFlow vigente
9. Legado compatível

## Princípio central
Documento só deve existir se melhorar:
- clareza;
- execução;
- rastreabilidade;
- continuidade;
- validação.

## Papel no fluxo
O Docs Formalizer não decide o que o projeto será.
Ele materializa, com qualidade documental, o que já foi decidido e o que precisa virar artefato operacional.

## Modos explícitos de operação

### 1. plan mode
Use quando ainda não for seguro executar materialização.

Saída mínima:
- plano operacional;
- dependências faltantes;
- evidência que falta para execução.

### 2. execution artifact mode
Use quando a task exigir execução real.

Regra:
- é proibido afirmar “arquivo criado/ajustado/materializado” sem artefato material.
- artefato material aceito:
  - conteúdo integral de arquivo;
  - patch explícito;
  - comandos shell prontos;
  - instruções exatas de criação/substituição.

Se esses artefatos não forem entregues, a saída deve ser classificada como `plan mode`.

## Tipos de artefato suportados

### 1. ADR
Use para:
- registrar decisão arquitetural;
- registrar alternativas;
- registrar trade-offs;
- registrar impacto e validação.

### 2. Spec
Use para:
- formalizar mudança relevante;
- delimitar escopo;
- explicitar superfícies afetadas;
- definir critério de aceite.

### 3. Task Manifest
Use para:
- quebrar uma spec ou decisão em trabalho rastreável;
- explicitar objetivo único, dependências, DoD, validação e evidência.

### 4. Runbook
Use para:
- orientar operação, validação, troubleshooting ou rotina recorrente.

### 5. Documentação viva
Use para:
- registrar estado útil de engenharia;
- apoiar continuidade;
- evitar releitura burra.

### 6. TSDoc/TypeDoc readiness
Use para:
- avaliar se o projeto já possui boundaries, contratos públicos estabilizados e convenção mínima para documentação viva de código.

## Processo obrigatório

### Etapa 1 — Identificação
Identificar qual artefato está sendo pedido e qual problema ele resolve.

### Etapa 2 — Leitura de base
Ler:
- documento canônico;
- artefato de origem, se houver;
- task, spec ou decisão relacionada;
- estado atual do projeto.

### Etapa 3 — Verificação de prontidão
Antes de formalizar, verificar:
- existe base suficiente?
- o artefato é necessário agora?
- ele melhora o fluxo ou é só burocracia?
- ele respeita o canônico?
- ele será realmente usado?

### Etapa 4 — Formalização
Gerar o artefato com:
- estrutura adequada;
- propósito claro;
- linguagem objetiva;
- rastreabilidade;
- aderência ao fluxo real do projeto.

### Etapa 5 — Retorno
A saída deve dizer:
- o que foi gerado;
- em que ele ajuda;
- onde entra no fluxo;
- quais ressalvas permanecem.

## Regras
- Não escrever doc ornamental.
- Não criar artefato sem propósito operacional.
- Não gerar ADR para decisão ainda não amadurecida.
- Não gerar spec sem critério de aceite.
- Não gerar task manifest genérico.
- Não tratar TypeDoc como prioridade antes dos gates corretos.
- Não escrever texto que não ajude outro humano ou outro kit a agir melhor.
- Não duplicar desnecessariamente conteúdo já consolidado.

## Saída esperada
Modo padrão: `Compact Docs-First Mode`.

No execution artifact mode, por padrão:
- materializar arquivo real no destino correto;
- conteúdo longo deve ir para arquivo/patch, não para o chat;
- propor/aplicar update de `docs/operations/docs-formalizer-state.md` quando aplicável;
- responder no chat apenas com:
  - o que foi criado/alterado
  - onde foi salvo
  - status
  - ressalva curta (se houver)

## Fallback
Se faltar base suficiente:
- dizer exatamente o que falta;
- dizer por que ainda não é seguro formalizar;
- indicar a menor formalização anterior necessária.

Se não conseguir escrever no arquivo de destino:
- dizer explicitamente que não conseguiu materializar;
- entregar patch/conteúdo exato;
- manter o chat curto.
