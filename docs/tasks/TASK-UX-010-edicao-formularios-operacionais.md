# TASK-UX-010 - Edicao por formularios operacionais

## Metadata
- status: completed
- owner: codex
- last-updated: 2026-05-06
- source-of-truth: docs/tasks/TASK-UX-010-edicao-formularios-operacionais.md

## Objetivo unico
Remover edicao de cadastros via `window.prompt` nas telas operacionais principais e substituir por formularios reais, visiveis e consistentes com o restante da interface.

## Entrega
- Profissionais: painel real de edicao com nome, email, telefone, cargo, unidade, setor, RT e usuario vinculado.
- Licencas: painel real de edicao para licenca e para tipo de licenca.
- Configuracoes: paineis reais para editar usuario, unidade e setor.
- Tabela de profissionais: metadados configuraveis com toggles para exibir `CPF`, `Telefone`, `Email` e `Cargo`.

## Fora de escopo nesta rodada
- Reset de senha continua simples.
- Motivo de recusa de documento continua simples.
- Exibicao de link de upload continua simples.

## Validacao esperada
- `npm run typecheck --workspace @alwaystrack/web`
- testar abrir e cancelar edicao em Profissionais, Licencas e Configuracoes
- confirmar persistencia das alteracoes sem popup nativo

## Risco residual
- Como `apps/web/src/main.tsx` concentra muita responsabilidade, futuras evolucoes dessa UX ainda pedem fatiamento por componentes.
