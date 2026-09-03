# TASK-AT-459 - Exibir erro e recuperação no upload Markdown

## Metadata
- status: proposed
- owner: Runtime Builder Web
- last-updated: 2026-09-03
- source-of-truth: docs/tasks/TASK-AT-459-markdown-upload-error-recovery.md
- mode: implementation
- priority: P0
- severity: high
- confidence: medium
- estimated-effort: 4-6h
- execution-order: 1, primeira task técnica do pacote complementar

## Objetivo único
Quando o upload de imagem do `MarkdownEditor` falhar, apresentar erro local e anunciado, preservar o conteúdo e permitir selecionar novamente o mesmo arquivo para um retry seguro.

## Contexto e evidência referenciada
O finding `UX-C02` do audit `UXREQ-ALWAYSTRACK-COMPLEMENTARY-AUDIT-20260903-001` identificou na fonte que `uploadImage` usa `try/finally`, limpa o input e encerra loading, mas não captura a rejeição nem renderiza erro. `TASK-AT-101` já exigia comportamento de erro; `TASK-AT-108/146/151` fecharam segurança, lifecycle e backend, não o feedback local compartilhado. `TASK-AT-340` cobre caminho negativo nas views Wiki/Notas, mas não a rejeição e o retry do `MarkdownEditor` em seus cinco consumidores.

As imagens `INS-C004-C008`, `INS-C012`, `INS-C017` e `INS-C018` apenas contextualizam o editor; não provam o estado de erro. Não copiar/promover PNG advisory. A falha deve ser reproduzida sinteticamente na execução desta task.

## Escopo
1. Adicionar estado de erro local em `apps/web/src/components/markdown-editor.tsx` para rejeição de `onUploadImage`.
2. Anunciar loading/erro/recuperação com semântica apropriada e microcopy acionável já compatível com o produto.
3. Preservar valor, seleção e Markdown até o sucesso.
4. Limpar o input de modo que o mesmo arquivo possa ser selecionado novamente.
5. Cobrir erro e retry no componente compartilhado; adaptar CSS apenas para mensagem local.

## Fora de escopo
- Alterar validação de magic bytes, limites, API, storage ou permissão.
- Inventar códigos de erro que o callback/API não fornece; quando não houver distinção, usar fallback honesto.
- Adicionar barra percentual, múltiplos arquivos ou drag-and-drop.
- Fundir DANFE, CSV de profissionais, licença pública ou reordenação `TASK-AT-153`.

## Dependências
- satisfeitas: contratos `TASK-AT-101`, `108`, `146`, `150`, `151`; callbacks Web atuais.
- em aberto: mapear mensagens/shape reais das rejeições dos dois callbacks (`uploadWikiImage` e `uploadOperationalImage`) antes de diferenciar tipo, tamanho e falha transitória.

## Matriz de estados

| Estado | Resultado esperado |
|---|---|
| idle | botão disponível, sem mensagem obsoleta |
| loading | botão ocupado/desabilitado e estado anunciado |
| invalid-type/size | mensagem contextual quando a rejeição real permitir distinguir a causa |
| 4xx/5xx/network | fallback visível e anunciado, sem alegar causa inexistente |
| error | conteúdo/seleção preservados; nada inserido |
| retry | mesmo arquivo pode ser escolhido outra vez |
| success-after-retry | Markdown inserido exatamente uma vez e erro anterior removido |
| cancel | nenhuma mensagem de erro e nenhuma mudança no conteúdo |

## Critérios de aceite
1. Rejeição do callback não produz promise não tratada e encerra o estado `Enviando...`.
2. Erro aparece junto ao editor e é anunciado sem exigir mudança de foco.
3. Texto e seleção do editor permanecem inalterados após falha.
4. O mesmo arquivo pode ser selecionado novamente; sucesso posterior insere Markdown uma única vez.
5. Mensagem distingue tipo/tamanho somente quando o contrato real fornece essa causa; demais falhas usam fallback seguro.
6. Wiki, FAQ, Fluxos, Scriptoteca e Avisos mantêm upload bem-sucedido e permissões vigentes.

## Validação
- Vitest focal do `MarkdownEditor`: loading, rejeição genérica, causa conhecida, retry com mesmo arquivo, sucesso único e cancelamento.
- Testes existentes de Wiki/API e ao menos um consumidor de `uploadOperationalImage`.
- Playwright task-backed com falha sintética controlada e retry; confirmar anúncio via live region/alert e ausência de conteúdo duplicado.
- Web typecheck/build, suíte focal/completa proporcional e `git diff --check`.

## Riscos
- Exibir `Error.message` bruto pode vazar detalhe técnico; normalizar para mensagens permitidas.
- Estado assíncrono concorrente pode inserir upload antigo após retry; manter uma tentativa ativa por editor.
- Limpar erro cedo demais remove orientação; tarde demais anuncia falha após sucesso.

## Limitações
- A severidade é alta pelo impacto potencial, mas a confiança é média porque o audit não reproduziu rejeição no browser.
- Tipo/tamanho podem ser rejeitados no backend com mensagem indistinta; esta task não altera o contrato HTTP sem nova evidência.
- Mobile/touch e providers externos não foram auditados.

## Definição de pronto
- Todos os estados da matriz têm teste determinístico, erro/retry são observáveis e nenhum consumidor do editor regride.

## Sugestão de commit semântico
- `fix(web): adiciona erro e retry ao upload markdown`
