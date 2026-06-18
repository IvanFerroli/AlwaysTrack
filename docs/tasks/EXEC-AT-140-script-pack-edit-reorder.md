# EXEC-AT-140 - Edicao e reordenacao de pacotes da Scriptoteca

## Metadata
- status: completed
- task: TASK-AT-140
- date: 2026-06-18

## Entrega
1. Lista de roteiros ganhou acao `Editar` para carregar pacote existente no formulario de gestao.
2. Formulario alterna entre criacao e edicao, usando `POST` ou `PATCH` conforme o estado.
3. Builder de pacote exibe a ordem escolhida e permite `Subir`, `Descer` e `Remover` scripts antes de salvar.
4. Botao `Limpar` volta ao modo de criacao.

## Validacao esperada
- `npm run typecheck --workspace @alwaystrack/web`
- `npm run lint`

## Risco residual
- Ainda nao ha drag and drop nem exclusao definitiva de pacote; a solucao por botoes e intencional para manter o MVP previsivel.
