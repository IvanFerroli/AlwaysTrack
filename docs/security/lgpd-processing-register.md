# Registro de Operacoes de Tratamento LGPD

## Metadata
- status: pending-legal-approval
- owner: security-maintainers
- business-owner: product-operations
- legal-approver: pending
- last-updated: 2026-07-15
- review-by: 2026-08-15
- source-of-truth: docs/security/lgpd-processing-register.md

## Escopo e regra de decisao
Este registro descreve o tratamento observado no codigo e na documentacao do AlwaysTrack. As bases legais abaixo sao hipoteses operacionais, nao parecer juridico. Nenhuma integracao real, retencao definitiva ou transferencia internacional pode ser aprovada apenas por este documento.

## Papeis
- Controlador: organizacao que determina finalidade e meios do atendimento e da operacao comercial. Identidade juridica pendente de confirmacao.
- Operador de software: equipe responsavel por hospedar e operar o AlwaysTrack sob instrucao do controlador. Identidade juridica e contrato pendentes.
- Suboperadores candidatos: provedor de infraestrutura, Google, Meta e provedor de IA, apenas quando explicitamente habilitados e contratados.
- Encarregado/canal de titulares: pendente de nomeacao formal antes de producao.

## Inventario por finalidade
| Operacao | Dados | Titulares | Finalidade | Base proposta, pendente juridico | Retencao tecnica atual | Owner | Compartilhamento |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Conta, login e sessao | nome, email, role, organizacao, eventos de login | usuarios internos | autenticacao e controle de acesso | execucao de contrato ou legitimo interesse | usuario enquanto ativo; sessao ate 8h, sujeita a revogacao | identity-maintainers | Google somente se login Google ligado |
| Operacao comercial | vendedor, grupo, ranking, metas, documentos fiscais, itens e valores | colaboradores, clientes e emissores citados | processar documentos e acompanhar operacao | execucao de contrato/obrigacao legal, a validar por campo | conforme politica fiscal e contratual ainda pendente | sales-operations | storage e IA opcional |
| Conhecimento e comunicacao | Wiki, FAQ, avisos, scripts, comentarios, autoria | usuarios internos e pessoas citadas no conteudo | suporte e padronizacao operacional | legitimo interesse, sujeito a balanceamento | ate arquivamento/exclusao governada; prazo final pendente | knowledge-maintainers | Meta somente se notificacao real ligada |
| Auditoria e seguranca | ator, acao, entidade, horario, IP/metadados permitidos | usuarios internos | seguranca, responsabilizacao e incidente | legitimo interesse/obrigacao de seguranca | prazo corporativo pendente; conteudo deve ser minimizado | security-maintainers | infraestrutura de logs aprovada |
| CaseFlow | conversa minima, fatos, referencias mascaradas, conflitos, plano, diagnosticos | clientes e agentes de atendimento | montar e orientar caso de atendimento | execucao de contrato ou legitimo interesse, a validar | conversa 30d, diagnosticos 7d, cache 15min por default | caseflow-maintainers | conectores consultivos autorizados |
| Companion Extension/Host | snapshot minimo, dominio, perfil pareado, progresso, erro redigido | cliente e operador | consulta assistida local | mesma finalidade do CaseFlow | cache 15min; sem cookie, senha ou HTML bruto persistido | companion-maintainers | loopback local e Core |
| SmartScript Companion | eventos allowlisted, texto capturado autorizado, candidatos de script | operadores e interlocutores citados | sugerir melhoria da Scriptoteca | legitimo interesse com avaliacao e transparencia | raw local 24h; candidatos conforme governanca da Scriptoteca | script-library-maintainers | filesystem local; API autorizada |
| Integracoes Google | email/profile, OAuth state e tokens cifrados; planilhas quando habilitadas | usuarios e pessoas em planilhas | login ou importacao/exportacao opcional | execucao de contrato/consentimento, a validar por fluxo | token ate revogacao; state 10min | integrations-maintainers | Google |
| Meta/WhatsApp | telefone, template, status de entrega e conteudo minimo | destinatarios | notificacao opcional | consentimento ou legitimo interesse, pendente de avaliacao | prazo do provider e auditoria interna pendentes | notifications-maintainers | Meta |
| IA documental | arquivo fiscal/profissional, campos solicitados e resultado estruturado | pessoas e empresas no documento | extracao assistida | execucao de contrato/obrigacao legal, com avaliacao de fornecedor | provider fake por default; real bloqueado sem aprovacao | document-ai-maintainers | OpenAI/Gemini somente apos gate |

## Dados proibidos nas superficies locais
- Cookie, senha, token de terceiro, chave de API, storage de autenticacao e HTML bruto.
- Screenshot por default; exige opt-in diagnostico, justificativa e retencao curta.
- Prompt, arquivo base64 ou resposta bruta de provider em logs.
- Conversa integral em auditoria ou telemetria.

## Direitos do titular
1. Receber solicitacao pelo canal formal ainda a nomear e validar identidade sem coletar excesso.
2. Localizar dados por organizacao e identificador autorizado, sem busca cruzada entre tenants.
3. Classificar pedido de acesso, correcao, portabilidade, informacao, oposicao ou exclusao.
4. Submeter restricoes legais/contratuais ao controlador e ao juridico.
5. Executar export/correcao/exclusao com dry-run, dupla revisao quando destrutivo e auditoria redigida.
6. Responder no prazo legal aplicavel e registrar decisao, escopo e evidencias.

## Transferencias e suboperadores
Antes de habilitar Google, Meta, OpenAI, Gemini ou infraestrutura fora do pais, registrar entidade contratada, regioes, dados enviados, finalidade, prazo, treinamento/reuso, controles, mecanismo de transferencia e DPA. Ausencia de qualquer item mantem o toggle real desligado.

## Gaps bloqueantes
- Identidade formal do controlador, operador, encarregado e canal de titulares.
- Parecer juridico sobre bases legais, prazos fiscais/comerciais e balanceamento de legitimo interesse.
- Lista contratual de suboperadores, regioes, DPA e mecanismo de transferencia internacional.
- Job operacional para os prazos tecnicos do CaseFlow e politica completa para auditoria/documentos.
- Processo aprovado de incidente e notificacao a titulares/ANPD.

## Revisao
Revisar em toda nova categoria de dado, provider, finalidade, pais/regiao, prazo ou automacao. Aprovacao tecnica nao substitui aprovacao juridica e do controlador.
