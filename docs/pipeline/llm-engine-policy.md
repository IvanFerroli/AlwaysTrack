# LLM Engine Policy

## Objetivo
Manter o pipeline independente de modelo, fornecedor e interface de agente.

## Contrato
O pipeline pode pedir capacidades, nao marcas:
- leitura e sintese de contexto;
- edicao com diff;
- execucao de comandos;
- validacao/testes;
- revisao de risco;
- geracao estruturada de artefatos.

## Registro permitido
Pode registrar provider/modelo quando isso for evidencia de execucao, por exemplo:
- limite de contexto afetou a decisao;
- custo/latencia influenciou o desenho;
- um teste depende de fixture gerada por LLM;
- houve comparacao entre engines.

## Registro proibido como contrato
Nao fazer do provider uma dependencia do processo:
- nomes de agentes com prefixo de projeto;
- prompts que exigem uma ferramenta proprietaria sem fallback;
- task que so e executavel por uma engine especifica;
- criterio de aceite baseado em "o modelo X aprovou".

## Adaptadores
Quando um projeto usar LLM em runtime, documentar:
- interface esperada;
- schema de entrada;
- schema de saida;
- fallback sem LLM ou com provider alternativo;
- limites de custo, latencia e privacidade;
- dados sensiveis que nao devem sair do ambiente.
