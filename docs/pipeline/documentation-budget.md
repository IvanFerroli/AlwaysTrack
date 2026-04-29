# Documentation Budget

## Objetivo
Reduzir uso de tokens sem perder memoria operacional. A regra e documentar o suficiente para continuidade, auditoria e decisao futura, nao narrar tudo.

## Camadas de detalhe
- `Index`: onde procurar. Deve ser curto e atualizado.
- `State`: decisao atual, proximo passo e riscos vivos.
- `Artifact`: spec, task, ADR, runbook ou relatorio de execucao.
- `Evidence`: comandos, outputs resumidos, screenshots, logs ou links locais.
- `Archive`: historico que nao entra no contexto padrao.

## O que vai no chat
- objetivo do ciclo;
- arquivos principais alterados;
- validacao feita;
- bloqueios e riscos;
- proximo passo.

## O que vai em arquivo
- decisao duravel;
- criterio de aceite;
- evidencia que alguem precisara auditar;
- justificativa de trade-off;
- estado que orienta proximos ciclos.

## O que deve ser evitado
- copiar longos trechos de codigo em relatorios quando o diff ja existe;
- repetir contexto do projeto em todo artefato;
- manter listas historicas gigantes como contexto ativo;
- escrever logs narrativos sem decisao, evidencia ou consequencia;
- prender o pipeline a nomes de agentes, modelos ou vendors.

## Limites recomendados
- README de superficie: ate 120 linhas.
- Task manifest: ate 90 linhas.
- Execution report: ate 70 linhas.
- Verification report: ate 60 linhas.
- State ativo: ate 120 linhas; mover historico antigo para audit/archive.

## Regra de promocao para memoria
Promover para estado ativo apenas informacao que responda uma destas perguntas:
- Qual e a proxima acao correta?
- Que decisao nao pode ser perdida?
- Que risco precisa continuar visivel?
- Que contrato mudou?
- Que validacao prova o estado atual?
