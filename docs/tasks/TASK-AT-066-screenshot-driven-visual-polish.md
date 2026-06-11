# TASK-AT-066 - Screenshot-driven visual polish

## Metadata
- status: proposed-blocked-by-user-input
- owner: olympus_taskyfier
- last-updated: 2026-06-11
- source-of-truth: docs/tasks/TASK-AT-066-screenshot-driven-visual-polish.md

## Modo
- mode: visual-polish

## Objetivo unico
Executar ajustes visuais finos apenas a partir de prints fornecidos pelo usuario, corrigindo uma leva objetiva por vez.

## Contexto minimo
Ha melhorias visuais desejadas, mas elas dependem de evidencia visual concreta. Esta task nao deve ser iniciada por descricao vaga para evitar refatoracao cosmetica ampla, regressao acidental ou discussao infinita de gosto.

## Inputs obrigatorios
- Prints da tela inteira ou recorte com o problema.
- Descricao curta do que esta errado em cada print.
- Viewport aproximado: desktop/mobile e resolucao se possivel.
- Prioridade por print, se houver mais de um.

## Dependencias
- satisfeitas: app visual ja esta funcional.
- em aberto: usuario precisa enviar prints antes de qualquer implementacao.

## Regra dura para o agente executor
1. Nao iniciar implementacao sem prints.
2. Se o usuario pedir "ajustes visuais" sem prints, insistir educadamente pelos prints.
3. Nao aceitar escopo generico como "deixa mais bonito".
4. Corrigir uma leva pequena e validavel por vez.
5. Preferir CSS/markup antes de JavaScript.
6. Validar desktop/mobile quando o print indicar risco responsivo.

## Alvos explicitos
1. Registrar cada print como item de checklist.
2. Corrigir overflow, alinhamento, hierarquia visual, espaçamento e estados quebrados mostrados nos prints.
3. Evitar mudar arquitetura ou identidade visual global sem necessidade.
4. Produzir evidencias antes/depois.

## Fora de escopo
- Redesign completo.
- Criar landing page.
- Alterar regra de negocio.
- Corrigir telas nao demonstradas nos prints, salvo regressao claramente relacionada.

## Checklist
1. Receber prints e numerar problemas.
2. Confirmar escopo da leva.
3. Aplicar patch minimo.
4. Rodar build/typecheck.
5. Validar visualmente.
6. Registrar o que ficou fora.

## Acceptance Criteria
1. Cada print enviado tem uma resposta objetiva: corrigido, nao reproduzido ou pendente com motivo.
2. Nenhum texto estoura container nas telas corrigidas.
3. Layout segue responsivo no viewport indicado.
4. Build web passa.

## Definition of Done
1. Prints usados como evidencia de entrada.
2. Antes/depois ou descricao visual objetiva entregue.
3. `npm run typecheck --workspace @alwaystrack/web` e `npm run build --workspace @alwaystrack/web` passam.

## Validacao
- comandos/checks: `npm run typecheck --workspace @alwaystrack/web`, `npm run build --workspace @alwaystrack/web`
- revisao manual: comparar prints de entrada com tela corrigida.

## Evidencia esperada
- Lista dos prints atendidos.
- Screenshots ou descricao clara do antes/depois.

## Riscos
- Ajuste visual sem print pode gerar retrabalho.
- Corrigir um breakpoint pode quebrar outro se nao validar.

## Blockers possiveis
- Usuario nao enviar prints.
- Print nao mostrar viewport/estado suficiente para reproduzir.

## Retorno esperado
- resumo curto do que mudou
- evidencia de validacao
- riscos ou ressalvas
- proximo passo recomendado
