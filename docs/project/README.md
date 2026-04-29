# Project Instance

## Finalidade
Esta pasta descreve a instancia atual do pipeline. O conteudo do produto nao e fixo: cada novo projeto deve trazer um documento central em `doc/`, e o pipeline deriva a estrutura viva a partir dele.

## Documento central
Padrao esperado:
- um arquivo principal em `doc/` com briefing, consolidado, PRD ou especificacao inicial;
- arquivos auxiliares em `doc/` somente quando forem fonte primaria ou referencia historica;
- `docs/` nunca deve copiar o documento central inteiro sem necessidade.

## Como iniciar um projeto
1. Identificar o documento central em `doc/`.
2. Criar um resumo curto de intake em `docs/project/intake.md` a partir de `docs/project/_intake-template.md`.
3. Registrar decisoes estruturais em `docs/adr/`.
4. Criar specs minimas em `docs/specs/`.
5. Quebrar a primeira spec aceita em uma task pequena em `docs/tasks/`.

## O que o intake deve conter
- nome operacional do projeto;
- fonte canonica;
- objetivo em uma frase;
- restricoes explicitas;
- decisoes ja tomadas no documento central;
- incertezas que precisam de confirmacao;
- primeira fatia recomendada.

## Regra de agnosticismo
Esta superficie nao presume dominio, stack, arquitetura, modelo de negocio, provider de LLM ou framework. Qualquer decisao desse tipo precisa vir do documento central, de uma ADR aceita ou de uma confirmacao do usuario.
