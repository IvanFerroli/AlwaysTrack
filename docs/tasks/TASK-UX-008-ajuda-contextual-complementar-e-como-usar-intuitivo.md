# TASK-UX-008 - Ajuda contextual complementar e Como usar intuitivo

## Metadata
- status: done
- owner: olympus_taskyfier
- last-updated: 2026-04-30
- source-of-truth: docs/tasks/TASK-UX-008-ajuda-contextual-complementar-e-como-usar-intuitivo.md

## Objetivo
Completar a ajuda contextual da V1 para reduzir duvidas de usuarios nao tecnicos, adicionando icones `i` somente onde existe decisao operacional, risco de erro ou termo tecnico, e expandindo o `Como usar` com secoes e exemplos que cubram essas duvidas.

## Contexto
`TASK-UX-007` criou a base: `InfoTip`, `helpHref`, navegacao por hash e uma pagina `Como usar` robusta. A varredura atual mostra que filtros tecnicos e notificacoes principais ja estao cobertos, mas varios formularios e acoes ainda dependem de conhecimento previo.

## Arquivos envolvidos
- `apps/web/src/main.tsx`
- `apps/web/src/components/operational.tsx`
- `apps/web/src/styles.css`
- `docs/tasks/TASK-UX-007-como-usar-robusto-ajuda-linkada.md`

## Onde ja existe ajuda adequada
- Filtros por ID em Relatorios, Profissionais, Licencas e Documentos -> `#filtros-e-ids`.
- Auditoria: acao, entidade, registro e usuario executor -> `#auditoria`.
- Profissionais: situacao, unidade, setor, RT responsavel e usuario vinculado.
- Licencas: status, profissional, tipo de licenca e avisos padrao.
- Documentos: status, profissional e licenca.
- Configuracoes/notificacoes: Template Meta, tipo de licenca, dias antes e repeticao pos-vencimento.

## Lacunas recomendadas para novos `i`
Adicionar apenas quando o texto ajudar uma decisao real:

1. Profissionais
- `CPF`: explicar que deve identificar a pessoa e evitar duplicidade.
- `Email`: explicar quando precisa ser email de acesso versus contato.
- `Telefone`: explicar formato operacional e relacao com WhatsApp/notificacoes.
- `Unidade` e `Setor`: explicar que definem escopo, relatorios e permissao de visualizacao.
- `Observacoes`: explicar que nao deve receber segredo, token ou dado sensivel desnecessario.

2. Licencas
- `Profissional`: lembrar que a licenca ficara vinculada a essa pessoa.
- `Tipo`: explicar impacto nos avisos padrao e relatorios.
- `Numero`, `Emissor`, `UF`: orientar copiar exatamente do documento.
- `Emissao` e `Vencimento`: orientar validar datas antes de salvar.
- `Status`: explicar quando escolher manualmente e quando deixar o motor recalcular.
- Acao `Gerar link`: tooltip ou microcopy apontando para `#upload-publico`.
- Acao `Recalcular status`: explicar que reavalia vencimentos sem alterar documentos.

3. Documentos
- Acao `Baixar`: lembrar de conferir arquivo antes de validar.
- Acao `Aprovar`: linkar para `#documentos`, com resumo do checklist minimo.
- Acao `Recusar`: explicar que o motivo precisa orientar correcao.
- Campo/mensagem de recusa, se existir via prompt/modal, deve orientar texto claro e sem agressividade.

4. Configuracoes
- `Documento` da organizacao: explicar CNPJ/identificador institucional.
- `Desativar/Reativar organizacao`: avisar impacto operacional antes da confirmacao.
- `Nova unidade` e `Novo setor`: explicar que afetam escopo, filtros e relatorios.
- `Senha inicial`: explicar minimo, troca posterior e nao compartilhar em canais inseguros.
- `Perfil`: explicar Admin, RT e Supervisor no proprio formulario.
- `Unidades` e `Setores` de escopo: explicar que limitam o que o usuario enxerga.
- `Preview` do template: explicar que e texto de conferencia, nao necessariamente a mensagem final da Meta.
- `Notificar RT`: explicar quem recebe alerta.
- Acoes `Criar jobs` e `Processar jobs`: explicar diferenca entre gerar pendencias e tentar envio.

5. FAQ e upload publico
- Upload publico: `Arquivo` deve explicar formatos aceitos e cuidado com documento errado.
- FAQ publico: `Categoria` e `Abrir WhatsApp` podem receber microcopy/tooltip explicando quando usar.

## Lacunas recomendadas no `Como usar`
Adicionar ou expandir secoes com anchors estaveis:

- `#cadastro-profissional`: checklist de dados, unidade/setor/RT, usuario vinculado e duplicidade.
- `#cadastro-licenca`: checklist de numero, emissor, UF, datas, status e tipo.
- `#validacao-documentos`: criterios objetivos para aprovar, recusar e escrever motivo.
- `#links-de-upload`: quando gerar, para quem enviar, expiracao e cuidados.
- `#configuracao-usuarios`: perfil, escopo, senha inicial, ativar/desativar.
- `#configuracao-organizacao`: unidade, setor e impacto nos filtros/relatorios.
- `#jobs-notificacao`: diferenca entre criar jobs, processar jobs, provider fake e Meta real.
- `#glossario`: ID, RT, Supervisor, status, provider fake, template Meta, job, escopo.

## Regras de implementacao
- Nao colocar `i` em todo campo: usar somente para duvida provavel ou risco operacional.
- Hover/focus deve continuar curto; conteudo completo fica no `Como usar`.
- Clique/Enter deve navegar para anchor especifica.
- Nao expor token, secret, Phone Number ID real, WABA ID real ou qualquer credencial.
- Nao mexer em `.env`, jobs backend ou provider Meta.
- Manter layout limpo; `i` nao pode aumentar altura de labels nem quebrar filtros.

## Acceptance Criteria
- Todos os novos `i` tem resumo curto, `aria-label` claro e `href` para anchor existente.
- `Como usar` passa a cobrir cadastro, validacao, configuracao e jobs com linguagem leiga.
- Usuario nao tecnico entende o que conferir antes de criar profissional, criar licenca, validar documento, gerar link e configurar usuarios.
- Build/check continuam verdes.

## Validacao
- `npm run build --workspace @sylembra/web`
- `npm run check`
- Revisao manual: Profissionais, Licencas, Documentos, Configuracoes, Upload publico, FAQ e Como usar.

## Riscos
- Excesso de `i` poluir a interface; priorizar campos de risco.
- Conteudo do `Como usar` ficar longo; usar anchors, sumario e blocos escaneaveis.
- Anchors novas precisam ser mantidas quando textos ou fluxos mudarem.

## Execucao 2026-04-30
- Novos `i` adicionados em campos de risco de Profissionais, Licencas, Documentos, Configuracoes, Upload publico e FAQ.
- `Como usar` expandido com anchors: `#cadastro-profissional`, `#cadastro-licenca`, `#validacao-documentos`, `#links-de-upload`, `#configuracao-usuarios`, `#configuracao-organizacao`, `#jobs-notificacao`, `#glossario`.
- Whitelist de hashes atualizada para permitir navegacao direta aos novos anchors.
- Nenhum `.env`, segredo Meta, token, provider ou job backend foi alterado.

## Validacao executada
- `npm run build --workspace @sylembra/web`
- `npm run check`
