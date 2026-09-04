# TASK-AT-466 - Adicionar drop de imagem ao MarkdownEditor compartilhado

## Metadata
- status: completed-with-risk
- pipeline: COMPLETED_WITH_RISK
- owner: Runtime Builder Web
- verifier: Task Verifier fresh
- last-updated: 2026-09-04
- source-of-truth: docs/tasks/TASK-AT-466-markdown-hybrid-image-drop.md
- mode: implementation
- priority: P1
- severity: low
- confidence: high (decisão humana aprovada na TASK-AT-460)
- estimated-effort: 6-10h
- execution-order: próxima implementação deste fluxo; depende dos contratos concluídos em TASK-AT-458/459

## Objetivo único
Adicionar ao `MarkdownEditor` uma área explícita de drag-and-drop para uma única imagem em desktop, reutilizando o mesmo pipeline de upload, loading, erro e retry do picker e mantendo o botão como fallback universal.

## Contexto e deduplicação
A `TASK-AT-460` foi encerrada em 2026-09-04 com decisão humana pelo modelo híbrido. A busca em `TASK-AT-001..465` não encontrou implementação equivalente:

1. `TASK-AT-101/108/146/150/151` governam upload, segurança, anexos e storage.
2. `TASK-AT-458` entrega um único gatilho acessível do picker.
3. `TASK-AT-459` entrega loading, erro, anúncio e retry compartilhados.
4. `TASK-AT-464` permite fixture de arquivo no harness, mas não implementa drag/drop de produto.
5. `TASK-AT-153` trata reordenação de scripts, não upload de arquivo.

O delta deve permanecer no componente compartilhado usado por Wiki, FAQ, Fluxos, Scriptoteca e Avisos. Não duplicar handlers nas views consumidoras.

## Dependências
- satisfeitas: `TASK-AT-101`, `108`, `146`, `150`, `151`, `458`, `459`, `460` e `464`.
- em aberto: nenhuma para implementação. Evidência visual task-backed de drop pode exigir step específico no harness; isso não autoriza afrouxar allowlist nem bloquear testes browser focais.

## Alvos explícitos
1. `apps/web/src/components/markdown-editor.tsx` — affordance, estados drag e entrada única no pipeline `uploadImage`.
2. `apps/web/src/styles.css` — estados default/drag-over/disabled/error, limitados ao editor.
3. `apps/web/test/markdown-editor.test.tsx` — matriz determinística de drop e não regressão do picker.
4. Teste Playwright focal novo ou existente para interação real com `DataTransfer`, sem depender de suíte browser global verde.
5. Views Wiki, FAQ, Fluxos, Scriptoteca e Avisos somente para smoke/teste; não adicionar implementação duplicada nelas.

## Escopo
1. Exibir affordance de “soltar imagem” em desktop quando `onUploadImage` estiver disponível.
2. Implementar `dragenter`/`dragover`/`dragleave`/`drop` com feedback visual estável e sem flicker por filhos internos.
3. Aceitar exatamente um arquivo PNG, JPEG ou WebP e encaminhá-lo uma única vez ao mesmo `uploadImage` usado pelo picker.
4. Rejeitar drop vazio, múltiplo ou de tipo não aceito com mensagem visível/anunciada integrada ao contrato da `TASK-AT-459`, sem chamar o callback.
5. Para tamanho excedido, preservar a validação canônica do backend e apresentar a causa retornada pelo contrato da `TASK-AT-459`; não inventar limite Web divergente sem fonte compartilhada.
6. Durante upload, impedir tentativa concorrente por picker ou drop, mantendo o estado ocupado único.
7. Em falha, preservar conteúdo e seleção e permitir retry pelo mesmo drop ou pelo picker; em sucesso, inserir o Markdown exatamente uma vez sem sobrescrever edição concorrente.
8. Manter o botão/picker disponível como fallback em desktop e como caminho universal em mobile/touch/teclado.

## Fora de escopo
- Upload de DANFE, CSV de profissionais ou licença pública.
- Reordenação de scripts/pacotes da `TASK-AT-153`.
- Paste/clipboard, pasta, múltiplos arquivos ou upload em lote.
- Alterar API, storage, magic bytes, limites do backend, permissões ou lifecycle de anexos.
- Remover/ocultar o botão de imagem em favor do gesto de arrastar.

## Matriz de estados

| Estado | Comportamento esperado |
|---|---|
| default desktop | área de drop explícita e botão `Imagem` presentes |
| mobile/touch | picker continua disponível; drop não é caminho obrigatório |
| drag-enter/over válido | affordance destaca destino e anuncia instrução sem disparar upload |
| drag-leave/cancel | destaque é removido sem erro ou alteração de conteúdo |
| drop válido único | callback é chamado uma vez com o arquivo |
| drop vazio | nenhuma chamada, nenhum falso sucesso |
| drop múltiplo | lote inteiro rejeitado; não escolher silenciosamente o primeiro |
| tipo inválido | rejeição local anunciada; callback não chamado |
| tamanho excedido | rejeição canônica do upload é exibida pela TASK-AT-459 |
| loading | picker/drop ficam indisponíveis para tentativa concorrente e estado é anunciado |
| error | conteúdo/seleção permanecem; mensagem oferece nova tentativa |
| retry | mesmo arquivo pode ser solto ou escolhido novamente |
| success | Markdown inserido exatamente uma vez na posição preservada |

## Critérios de aceite
1. Em desktop, o usuário identifica onde soltar uma imagem antes de iniciar o gesto; drag-over válido produz feedback visual e textual perceptível.
2. Um único PNG/JPEG/WebP solto chama `onUploadImage` exatamente uma vez e percorre o mesmo loading/success/error do picker.
3. Zero, dois ou mais arquivos e tipo inválido não chamam `onUploadImage`; a rejeição explica como corrigir e é anunciada sem mover foco.
4. Arquivo acima do limite recebe o erro canônico de tamanho pelo fluxo da `TASK-AT-459`; não há constante duplicada divergente no frontend.
5. Drop repetido durante upload não cria concorrência nem inserção duplicada.
6. Falha não altera conteúdo ou seleção; retry posterior insere uma única vez. Edições feitas durante upload não são sobrescritas pelo retorno assíncrono.
7. Botão `Imagem` e picker continuam operáveis por mouse, Enter e Space; mobile/touch não depende de drag.
8. Os dez mount points atuais nas cinco superfícies herdam o comportamento por composição, sem handlers de drop copiados nas views.
9. Arrastar texto/link ou usar drag interno de reordenação fora da área não inicia upload nem sofre `preventDefault` global.

## Plano de testes
- Vitest em `markdown-editor.test.tsx`: drag-over/leaves aninhados, drop válido, vazio, múltiplo, tipo inválido, tamanho rejeitado pelo callback, loading concorrente, erro, retry, sucesso único e edição concorrente preservada.
- Reexecutar integralmente os testes de `TASK-AT-458/459` para provar picker, foco, anúncio e retry sem regressão.
- Playwright focal desktop com `DataTransfer` real/sintético seguro: affordance visível, mudança drag-over, drop válido e rejeições; smoke dos cinco consumidores.
- Smoke mobile/touch em 390x844 ou equivalente: botão/picker presente e layout sem overflow; não simular drag como requisito móvel.
- Web typecheck/build, suíte Web proporcional, `git diff --check` e comparação de falhas browser contra baseline de `main` quando necessário.
- Evidência visual deve ser adquirida task-backed; nunca reutilizar PNG advisory da auditoria complementar.

## Riscos
- Contadores ingênuos de `dragenter`/`dragleave` podem piscar ao cruzar filhos da área.
- `preventDefault` fora do destino pode quebrar drag de texto, links ou reordenação da Scriptoteca.
- Usar apenas `files[0]` mascara múltiplos em vez de rejeitar o lote.
- Capturar `value`/seleção antes de await e aplicar sobre estado obsoleto pode apagar edição concorrente; a inserção deve reconciliar com o valor vigente.
- Validação client-side divergente do backend pode aceitar/rejeitar tamanhos diferentes.
- CSS compartilhado pode gerar overflow em mobile se a affordance não fizer reflow.

## Limitações
- `accept` do input não é segurança; magic bytes e teto permanecem responsabilidade canônica do backend.
- Drag-and-drop não é interação universal em mobile/touch e não substitui picker ou teclado.
- `TASK-AT-464` prova seleção de arquivo, não gesto de drop; eventual extensão do harness deve ser task separada se necessária.
- Sem teste em browser, não declarar comportamento do `DataTransfer` entre Chromium, Firefox e Safari.

## Definição de pronto
1. Matriz de estados coberta por testes determinísticos e browser focal.
2. Cinco consumidores usam somente a implementação compartilhada.
3. Contratos concluídos de `TASK-AT-458/459` permanecem verdes.
4. Evidência task-backed e verificação independente registram limitações sem reutilizar advisory.

## Fechamento — 2026-09-04

- implementação: `390b3da0` adicionou drop compartilhado, CSS local e matriz unitária; `173d355a` adicionou browser desktop/mobile e duas baselines task-backed; `fd0e0942` reconciliou seleção com edições concorrentes sem apagar texto.
- qualidade: 24/24 testes focais, 202/202 testes Web, Playwright 2/2, typecheck, build e `git diff --check` aprovados. A flutuação anterior de `navigation-roles` não se reproduziu em cinco rodadas isoladas.
- evidência: snapshots desktop 906x374 e mobile 323x386 inspecionados em resolução original; desktop apresenta botão e área de drop destacada sem overflow, mobile mantém apenas o picker universal.
- aceite independente: `ACCEPT-WITH-LIMITATIONS`; critérios 1–9 atendidos. Uma rejeição intermediária do critério 6 foi corrigida por `fd0e0942` e reverificada.
- política de conflito: edições antes da seleção deslocam os marcadores; edições posteriores mantêm o range; conflito que cruza a seleção preserva integralmente o texto atual e posiciona a imagem após o delta, sem duplicar upload.
- limitações não bloqueantes: browser focal somente Chromium; Firefox/Safari e dispositivo touch real não exercitados. Em edição concorrente estruturalmente ambígua, preservar texto tem precedência sobre manter a intenção exata da posição original.

## Sugestão de commit semântico
- `feat(web): adiciona drop de imagem ao editor markdown`
