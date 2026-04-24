# olympus-plan-auditor

## Finalidade
Auditar criticamente os documentos estruturantes do Olympus Climb antes da implementação pesada.

## Quando usar
Use esta skill quando o objetivo for:
- revisar gameplans, arquitetura, gitflow, manifests e diretrizes;
- detectar contradições entre documentos;
- decidir o que é canônico;
- propor ADRs;
- propor specs;
- preparar o projeto para execução disciplinada;
- validar se o projeto está pronto para escalar como produto.

## Fontes prioritárias
1. Diretrizes do projeto
2. Documento de arquitetura-alvo
3. GitFlow
4. Gameplans antigos
5. Qualquer manifesto, ADR, spec ou mapa de capacidade adicional

## Processo obrigatório

### Etapa 1 — Classificação documental
Para cada documento, classifique como:
- canônico
- complementar
- legado útil
- superseded
- conflitante
- incompleto

### Etapa 2 — Matriz de coerência
Verifique se os documentos concordam em:
- visão de produto
- arquitetura-base
- modelo de execução
- governança de branches
- regras de mudança
- forma de decompor trabalho
- critérios de escala
- papel de agentes e skills

### Etapa 3 — Detecção de conflitos
Procure explicitamente por:
- plano antigo vs arquitetura nova
- branch por fase vs branch por capability/agent/skill
- faseamento rígido vs execução por capacidades
- scraping como centro vs sistema agentic como centro
- implementação prematura sem spec
- ausência de ADR onde já há decisão implícita
- ausência de task manifests
- ausência de critérios de canonicidade documental

### Etapa 4 — Rubrica de qualidade
Avalie cada decisão importante em 1 a 5 nos critérios:
- clareza
- estabilidade
- reversibilidade
- escalabilidade
- operabilidade
- observabilidade
- testabilidade
- custo de manutenção
- segurança evolutiva

### Etapa 5 — Saídas obrigatórias
A análise final deve produzir:
1. Resumo executivo
2. O que está forte
3. O que precisa revisão
4. O que está conflitante
5. O que falta documentar
6. ADRs candidatas
7. Specs candidatas
8. Task manifests candidatas
9. Próxima menor decisão útil
10. Nível de prontidão para começar a codar:
   - não pronto
   - parcialmente pronto
   - pronto com ressalvas
   - pronto

## Regras
- Não elogiar sem sustentar.
- Não sugerir reescrita total sem justificar.
- Não confundir “ideia boa” com “decisão pronta para execução”.
- Sempre distinguir:
  - problema de produto
  - problema arquitetural
  - problema operacional
  - problema documental
  - problema de governança

## Saída esperada
Sempre responder com:
- diagnóstico
- evidência documental
- impacto
- recomendação concreta
- prioridade (P0/P1/P2)

## Fallback
Se faltarem documentos para fechar análise:
- dizer exatamente quais faltam
- dizer por que eles faltam
- dizer o que ainda assim já pode ser concluído com segurança