# ADR-001 - Governanca Documental Operacional

## Metadata
- status: accepted
- owner: pipeline
- last-updated: 2026-04-29
- source-of-truth: docs/adr/ADR-001-governanca-documental-operacional.md

## Contexto
O pipeline precisa ser reutilizavel entre projetos diferentes. Para isso, a documentacao deve preservar decisoes e evidencias sem transformar todo historico em contexto obrigatorio.

## Decisao
Separar a documentacao em tres camadas:
- `docs/pipeline/`: regras reutilizaveis do processo;
- `docs/project/`: estado curto da instancia atual;
- `doc/`: documento central e referencias brutas do projeto.

Specs, tasks, ADRs e runbooks devem ser criados apenas quando sustentarem decisao, execucao ou validacao material.

## Alternativas consideradas
1. Manter todo historico herdado como docs ativos.
2. Recriar documentacao do zero a cada projeto.
3. Separar core reutilizavel, instancia atual e fontes brutas.

## Consequencias
- positivas: menor token usage, menor confusao entre projetos, melhor reuso do pipeline.
- negativas: historico removido do contexto ativo deixa de ser navegavel por arquivos locais atuais.
- trade-offs: o pipeline perde detalhes antigos, mas ganha clareza operacional.

## Impacto em artefatos
- specs relacionadas: n/a
- tasks relacionadas: n/a
- runbooks relacionados: n/a

## Validacao e evidencia esperada
- validacao: leitura de `docs/` nao deve exigir conhecimento de projeto anterior.
- evidencia: busca por nomes/dominos antigos em `docs/` deve retornar vazio ou apenas referencias deliberadas de auditoria.

## Fora de escopo
Definir stack, dominio, arquitetura de produto ou backlog de qualquer projeto especifico.
