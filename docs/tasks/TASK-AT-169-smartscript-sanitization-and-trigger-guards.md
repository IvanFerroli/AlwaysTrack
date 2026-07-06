# TASK-AT-169 - SmartScript: sanitizacao e regras de trigger

## Metadata
- status: completed-mvp
- owner: olympus_taskyfier
- last-updated: 2026-07-06
- source-of-truth: docs/tasks/TASK-AT-169-smartscript-sanitization-and-trigger-guards.md

## Modo
- mode: implementation

## Objetivo unico
Implementar guardas deterministicas para impedir dados especificos de cliente em snippets finais e rejeitar triggers pessoais fora do contrato `:`.

## Contexto minimo
O intake exige duas fases de sanitizacao e define que triggers pessoais/exportaveis sempre usam `:`, enquanto `/` fica reservado a comandos internos.

## Inputs
- `docs/specs/SPEC-AT-004-smartscript.md`
- `TASK-AT-168-smartscript-data-model-and-permissions.md`
- validadores existentes da Scriptoteca

## Dependencias
- satisfeitas: `TASK-AT-168`.
- em aberto: n/a.

## Alvos explicitos
1. `services/api/src/core/script-library/`
2. `packages/shared/src/`
3. testes unitarios da API

## Fora de escopo
- Detector enterprise completo de PII.
- Provider externo de IA para redacao.
- Captura local.

## Checklist
1. Criar sanitizador para CPF, telefone, email, endereco, pedido, rastreio, nome de cliente, links sensiveis e valores individualizados.
2. Aplicar sanitizacao antes de persistir candidato importado.
3. Aplicar verificacao final antes de aprovar/exportar snippet.
4. Validar trigger iniciando com `:` e rejeitar `/`.
5. Retornar erro 400 generico sem ecoar payload sensivel.

## Acceptance Criteria
1. Snippet final com dado sensivel conhecido e bloqueado ou redigido.
2. Trigger `:nac-cheiro` e aceita.
3. Trigger `/nac` e rejeitada.
4. Sanitizacao roda de forma deterministica em testes.
5. Mensagens de erro nao vazam o texto sensivel original.

## Definition of Done
1. Helper testado.
2. Integração com parsers SmartScript.
3. Casos de regressao documentados.

## Validacao
- comandos/checks: testes API focados em sanitizacao, `npm run typecheck --workspace @alwaystrack/api`.
- revisao manual: fixture anonima com dados sensiveis simulados.

## Evidencia esperada
- Testes com exemplos anonimizados.
- Lista de padroes cobertos e lacunas conhecidas.

## Riscos
- Falso positivo remover texto util.
- Falso negativo permitir dado especifico em snippet ruim.

## Blockers possiveis
- Necessidade de definir placeholders canonicos para redacoes.

## Retorno esperado
- resumo dos guardas
- evidencias de validacao
- riscos residuais
- proximo passo recomendado

## Resultado
- Entregue sanitizador compartilhado para dados sensiveis comuns e validacao de trigger SmartScript.
- API e companion usam sanitizacao antes de candidato/aprovacao/export.
- Triggers com `:` sao aceitos; `/` segue bloqueado como reservado para comandos internos.
