import type {
  ActionCapability,
  FlowNodeDefinition,
  FlowNodeType,
  FlowTransitionDefinition,
  RiskLevel
} from "@alwaystrack/shared";

export const ALWAYS_FIT_HEALTH_FLOW_CODE = "SAUDE-DEV-TROCA-ESTORNO";
export const ALWAYS_FIT_HEALTH_FLOW_SLUG = "saude-dev-troca-estorno";
export const ALWAYS_FIT_HEALTH_FLOW_VERSION = "0.1";

export type AlwaysFitHealthMessageCode = `MSG-${
  | "001" | "002" | "003" | "004" | "005" | "006" | "007" | "008" | "009"
  | "010" | "011" | "012" | "013" | "014" | "015" | "016" | "017"}`;

export interface AlwaysFitHealthMessage {
  code: AlwaysFitHealthMessageCode;
  title: string;
  channel: "WHATSAPP" | "INTERNAL";
  body: string;
  status: "DRAFT" | "VALIDATED";
  tags: string[];
  legacyTitles?: string[];
}

export const alwaysFitHealthMessages: readonly AlwaysFitHealthMessage[] = [
  {
    code: "MSG-001",
    title: "Apresentação",
    channel: "WHATSAPP",
    body: "Olá, espero que esteja bem, {nome_cliente}! Aqui é o Ivanilson, SAC da Always Fit Suplementos ✨",
    status: "VALIDATED",
    tags: ["saude", "apresentacao", "cliente"]
  },
  {
    code: "MSG-002",
    title: "Solicitar CPF",
    channel: "WHATSAPP",
    body: "Para localizar seu cadastro e verificar certinho por aqui, você pode me informar o CPF utilizado na compra, por favor? 😊",
    status: "VALIDATED",
    tags: ["saude", "identificacao", "cpf"]
  },
  {
    code: "MSG-003",
    title: "Investigar período do mal-estar",
    channel: "WHATSAPP",
    body: "{nome_cliente}, você se recorda aproximadamente quando começou a apresentar esse mal-estar?",
    status: "DRAFT",
    tags: ["saude", "triagem", "validacao-pendente"]
  },
  {
    code: "MSG-004",
    title: "Confirmar produto do pedido",
    channel: "WHATSAPP",
    body: "{nome_cliente}, localizei o pedido recebido próximo desse período, que contém os seguintes produtos:\n\n— {produto_1}\n— {produto_2}\n— {produto_3}\n\nO mal-estar aconteceu durante o uso de algum desses produtos? Você consegue me informar qual ou quais utilizou?",
    status: "DRAFT",
    tags: ["saude", "pedido", "produto", "validacao-pendente"]
  },
  {
    code: "MSG-005",
    title: "/saúde_inicio — investigar forma de uso",
    channel: "WHATSAPP",
    body: "Diversos fatores podem influenciar nos resultados do uso dos suplementos. Para que possamos entender melhor por que o produto pode não estar apresentando o efeito esperado, poderia, por gentileza, nos confirmar algumas informações?\n\n— Você tem ingerido uma boa quantidade de água diariamente?\n\n— Como está a sua alimentação atualmente?\n\n— Está utilizando algum outro medicamento ou suplemento ao mesmo tempo?\n\n— Há quanto tempo iniciou o uso do suplemento?\n\n— Em quais horários costuma fazer a ingestão?\n\nCom essas informações, conseguiremos orientá-lo(a) da melhor forma possível.",
    status: "VALIDATED",
    tags: ["saude", "barra", "triagem", "modo-de-uso"],
    legacyTitles: ["Investigar forma de uso em relato de saúde"]
  },
  {
    code: "MSG-006",
    title: "Orientar atendimento médico",
    channel: "WHATSAPP",
    body: "Como você ainda está se sentindo mal, orientamos que procure atendimento médico para que possa ser avaliado(a) adequadamente.",
    status: "DRAFT",
    tags: ["saude", "seguranca", "validacao-pendente"]
  },
  {
    code: "MSG-007",
    title: "Acolhimento",
    channel: "WHATSAPP",
    body: "Sinto muito pelo ocorrido. 😔\n\nEssa realmente não é a experiência que queremos proporcionar aos nossos clientes.\n\nPeço desculpas por todo o transtorno e agradeço pela compreensão. 💚",
    status: "VALIDATED",
    tags: ["saude", "acolhimento", "cliente"]
  },
  {
    code: "MSG-008",
    title: "Definir escopo sem usufruto",
    channel: "WHATSAPP",
    body: "{nome_cliente}, depois do ocorrido, quais produtos desse pedido você não pretende mais utilizar?",
    status: "DRAFT",
    tags: ["saude", "escopo", "validacao-pendente"]
  },
  {
    code: "MSG-009",
    title: "Perguntar itens lacrados e abertos",
    channel: "WHATSAPP",
    body: "Você pode me informar quais desses produtos permanecem lacrados, com o lacre interno intacto, e quais já foram abertos ou utilizados?",
    status: "DRAFT",
    tags: ["saude", "reversa", "itens", "validacao-pendente"]
  },
  {
    code: "MSG-010",
    title: "/reversa — orientar postagem",
    channel: "WHATSAPP",
    body: "📦 Devolução de Produtos – Suplementação\n\nPara que sua devolução seja realizada de forma rápida e segura, siga as orientações abaixo:\n\n📦 Passo 1 – Embalagem\n\nEmbale os itens de forma segura, preferencialmente na embalagem original.\n\nCaso não tenha mais a embalagem, utilize uma alternativa adequada que proteja os produtos contra danos durante o transporte.\n\n📮 Passo 2 – Postagem nos Correios\n\nLeve os itens embalados até a agência dos Correios mais próxima e informe o seguinte código de postagem: {codigo_reversa}.\n\nEsse código garante que o envio seja realizado sem custo para você.\n\nAtenção:\n\n⏳ Prazo para postagem\n\nO prazo máximo para realizar a postagem nos Correios é de 7 dias corridos a partir da data da solicitação.\n\n📸 Passo 3 – Confirmação da devolução\n\nApós realizar a postagem, entre em contato conosco informando que a devolução foi feita.\n\nSe possível, envie também uma foto do comprovante de envio, para que possamos acompanhar o processo e agilizar os próximos passos.\n\nSeguindo esse procedimento, conseguiremos dar continuidade ao processo de devolução, seja para o estorno do valor pago ou para a troca dos produtos, conforme sua preferência.\n\nCaso precise de qualquer auxílio durante o processo, estamos à disposição para ajudar. 😊",
    status: "VALIDATED",
    tags: ["saude", "barra", "reversa", "correios"],
    legacyTitles: ["Orientar reversa de produto fechado"]
  },
  {
    code: "MSG-011",
    title: "/devolução_reversa — sussurro interno",
    channel: "INTERNAL",
    body: "Pedido:\n\nMotivo da troca/devolução:\n\nSerá necessário fazer o estorno?\n\nEstorno total ou parcial?\n\nSe for troca, terá de cobrar o frete?",
    status: "VALIDATED",
    tags: ["saude", "barra", "reversa", "sussurro", "interno"]
  },
  {
    code: "MSG-012",
    title: "/estorno_pix — solicitar dados",
    channel: "WHATSAPP",
    body: "Para podermos prosseguir com o estorno, preciso dos dados do mesmo pix que foi utilizado na compra, por gentileza, me confirme:\n\n-Chave PIX\n\n-Banco\n\n-Nome completo do titular da conta",
    status: "VALIDATED",
    tags: ["saude", "barra", "estorno", "pix"]
  },
  {
    code: "MSG-013",
    title: "/estorno_finalpix — confirmar prazo",
    channel: "WHATSAPP",
    body: "Te agradeço pela informação, irei repassar ao meu setor financeiro.\n\nEm até 5 dias úteis, o valor é enviado para sua conta.\n\nMais uma vez, sentimos muito pelo transtorno.\n\nSaiba que não é essa experiência que gostaríamos que tivesse com a nossa empresa.\n\nSe precisar, é só nos chamar! 💛",
    status: "VALIDATED",
    tags: ["saude", "barra", "estorno", "pix"]
  },
  {
    code: "MSG-014",
    title: "Pergunta final",
    channel: "WHATSAPP",
    body: "Posso te ajudar em mais alguma coisa? 😊",
    status: "VALIDATED",
    tags: ["saude", "encerramento", "cliente"]
  },
  {
    code: "MSG-015",
    title: "Cautela na troca pelo mesmo produto",
    channel: "WHATSAPP",
    body: "Como você relatou esse mal-estar durante o uso, talvez seja mais interessante escolhermos outra opção para evitar uma nova experiência parecida. Mas, caso ainda prefira o mesmo produto, podemos seguir dessa forma.",
    status: "DRAFT",
    tags: ["saude", "troca", "seguranca", "validacao-pendente"]
  },
  {
    code: "MSG-016",
    title: "Previsão e rastreio da troca",
    channel: "WHATSAPP",
    body: "Previsão de entrega:\n{previsao_entrega}\n\nEstamos acompanhando de perto todo o processo para garantir que seu pedido chegue o quanto antes. 🚚✨\n\nEsse é o seu rastreio:\nhttps://rastreio.alwaysfitapp.com.br/status/{novo_pedido}\n\nCaso prefira, você também pode acompanhar o rastreio pelo App:\n\n📲 Baixe agora:\n\n📱 Android: https://play.google.com/store/apps/details?id=app.alwaysfit\n\n📱 iOS: https://apps.apple.com/br/app/always-fit-saúde-e-bem-estar/id6746350169\n\nSe precisar, é só nos chamar! 💛",
    status: "VALIDATED",
    tags: ["saude", "troca", "rastreio", "pedido"]
  },
  {
    code: "MSG-017",
    title: "Orientar uso divergente",
    channel: "WHATSAPP",
    body: "{nome_cliente}, verifiquei que a forma de uso realizada foi diferente da recomendação do produto, e isso pode ter influenciado no mal-estar relatado.\n\nA orientação correta é {modo_de_uso}.\n\nMesmo com essa informação, você prefere seguir com a devolução para troca ou estorno?",
    status: "DRAFT",
    tags: ["saude", "modo-de-uso", "validacao-pendente"]
  }
] as const;

interface CatalogChoice {
  label: string;
  target: string;
  allowLoop?: boolean;
}

interface CatalogNode {
  key: string;
  title: string;
  type: FlowNodeType;
  instruction: string;
  messageCodes?: AlwaysFitHealthMessageCode[];
  requiredFacts?: string[];
  optionalFacts?: string[];
  allowedCapabilities?: ActionCapability[];
  forbiddenCapabilities?: ActionCapability[];
  riskLevel?: RiskLevel;
  dependencies?: string[];
  choices?: CatalogChoice[];
  terminal?: boolean;
}

const stage = (
  key: string,
  title: string,
  type: FlowNodeType,
  instruction: string,
  extra: Omit<CatalogNode, "key" | "title" | "type" | "instruction"> = {}
): CatalogNode => ({ key, title, type, instruction, ...extra });

const alwaysHuman: ActionCapability[] = ["SUBMIT", "SEND_MESSAGE"];

export const alwaysFitHealthCatalogNodes: readonly CatalogNode[] = [
  stage("ETAPA-001", "Receber relato de mal-estar", "CONTEXT", "Confirme que o cliente relaciona um mal-estar ao uso de produto Always Fit. Classifique somente este caso no fluxo SAUDE-DEV-TROCA-ESTORNO; dúvidas preventivas, ausência de resultado e problemas logísticos sem saúde ficam fora do escopo.", {
    optionalFacts: ["conversation.intentText", "customer.name", "customer.cpf"], dependencies: ["AlwaysChat"],
    choices: [{ label: "Relato reconhecido como caso deste fluxo", target: "ETAPA-002" }, { label: "Fora do escopo: encaminhar ao fluxo correspondente", target: "RESULTADO-009" }]
  }),
  stage("ETAPA-002", "Apresentação com nome", "MESSAGE", "Preencha o nome, copie MSG-001 da Scriptoteca e envie manualmente no AlwaysChat.", {
    messageCodes: ["MSG-001"], requiredFacts: ["customer.name"], dependencies: ["AlwaysChat"], choices: [{ label: "Apresentação enviada", target: "ETAPA-003" }]
  }),
  stage("ETAPA-003", "Localizar CPF e cadastro", "DECISION", "DECISAO-001. Verifique o CPF no canto superior direito do AlwaysChat e recarregue a página uma vez se estiver ausente. Não registre credenciais no CaseFlow.", {
    messageCodes: ["MSG-002"], optionalFacts: ["customer.cpf", "customer.email", "customer.phone"], dependencies: ["AlwaysChat", "Yampi"],
    choices: [{ label: "CPF visível ou recuperado", target: "ETAPA-004" }, { label: "CPF ausente após recarregar", target: "DECISAO-002" }, { label: "AlwaysChat/Yampi indisponível", target: "ETAPA-034" }]
  }),
  stage("DECISAO-002", "Há e-mail para localizar o CPF?", "DECISION", "DECISAO-002. Se houver e-mail, consulte a Yampi. Se houver apenas nome e celular, use MSG-002 e aguarde um CPF válido. Sem CPF, e-mail ou resposta, encerre em aguardando identificação.", {
    messageCodes: ["MSG-002"], optionalFacts: ["customer.cpf", "customer.email"], dependencies: ["AlwaysChat", "Yampi"],
    choices: [{ label: "CPF obtido pela Yampi ou pelo cliente", target: "ETAPA-004" }, { label: "Sem CPF e sem resposta do cliente", target: "RESULTADO-008" }, { label: "Fonte indisponível ou dado inválido", target: "ETAPA-034" }]
  }),
  stage("ETAPA-004", "Buscar pedidos no Rastreio", "CONSULT", "DECISAO-003. Pesquise o CPF manualmente no Rastreio. Consulte pedidos, produtos, status, data de recebimento e forma de pagamento. Se não localizar, cruze com Yampi e histórico; não invente um pedido.", {
    requiredFacts: ["customer.cpf"], optionalFacts: ["order.primaryId", "order.products", "logistics.deliveredAt", "payment.method"], dependencies: ["Rastreio", "Yampi"],
    choices: [{ label: "Um ou mais pedidos localizados", target: "ETAPA-005" }, { label: "Pedido não localizado após fontes alternativas", target: "ETAPA-034" }, { label: "Rastreio indisponível", target: "ETAPA-034" }]
  }),
  stage("ETAPA-005", "Investigar início do mal-estar e confirmar o pedido", "DECISION", "DECISAO-004. Use MSG-003, cruze o período informado com as datas de recebimento e peça confirmação. Nunca escolha automaticamente apenas o pedido mais recente.", {
    messageCodes: ["MSG-003"], requiredFacts: ["custom.alwaysfit.health.symptom.started"], optionalFacts: ["order.primaryId", "logistics.deliveredAt"], dependencies: ["AlwaysChat", "Rastreio"],
    choices: [{ label: "Pedido provável identificado e confirmado", target: "ETAPA-006" }, { label: "Múltiplos pedidos sem associação segura", target: "ETAPA-034" }]
  }),
  stage("ETAPA-006", "Verificar data de recebimento", "DECISION", "DECISAO-005 e REGRAS REGRA-001/REGRA-002. Conte o prazo exclusivamente desde a data de recebimento no Rastreio, nunca desde compra, aprovação ou faturamento. Menos de 30 dias dá acesso ao valor integral do escopo afetado mesmo com uso divergente. O tratamento do 30º dia exato continua pendente e exige decisão humana.", {
    requiredFacts: ["logistics.deliveredAt"], dependencies: ["Rastreio", "PENDENCIA-001"],
    choices: [{ label: "Recebido há menos de 30 dias", target: "ETAPA-007" }, { label: "Recebido há mais de 30 dias", target: "ETAPA-031" }, { label: "Exatamente 30 dias: bloquear e validar", target: "ETAPA-032" }, { label: "Data ausente ou conflitante", target: "ETAPA-034" }]
  }),
  stage("ETAPA-007", "Confirmar produtos ou kits envolvidos", "DECISION", "DECISAO-006 e REGRA-005. Mostre os produtos do pedido com MSG-004. Aceite um produto, vários, kit usado em conjunto ou produto não identificado; nesse último caso o kit inteiro pode compor o escopo.", {
    messageCodes: ["MSG-004"], requiredFacts: ["order.products"], optionalFacts: ["custom.alwaysfit.health.related.products"], dependencies: ["Rastreio", "Yampi"],
    choices: [{ label: "Um produto identificado", target: "ETAPA-008" }, { label: "Vários produtos identificados", target: "ETAPA-008" }, { label: "Kit usado em conjunto", target: "ETAPA-008" }, { label: "Produto não identificado: considerar kit", target: "ETAPA-008" }]
  }),
  stage("ETAPA-008", "Enviar /saúde_inicio", "MESSAGE", "Copie MSG-005 e colete água, alimentação, medicamentos ou suplementos concomitantes, tempo e horários de uso. Se faltar algo, pergunte somente o dado faltante. Trate as respostas como dados sensíveis de saúde.", {
    messageCodes: ["MSG-005"], requiredFacts: ["custom.alwaysfit.health.usage", "custom.alwaysfit.health.concomitant.products"], dependencies: ["AlwaysChat"],
    choices: [{ label: "Informações suficientes coletadas", target: "ETAPA-009" }, { label: "Resposta incompleta: permanecer nesta etapa", target: "ETAPA-008", allowLoop: true }]
  }),
  stage("ETAPA-009", "Avaliar uso divergente", "DECISION", "DECISAO-007 e REGRA-019. Compare o relato com a recomendação do produto. Uso divergente serve para orientar e contextualizar; nunca elimina o direito dentro do prazo.", {
    requiredFacts: ["custom.alwaysfit.health.usage"], optionalFacts: ["custom.alwaysfit.product.recommended.usage"],
    choices: [{ label: "Uso conforme recomendação", target: "ETAPA-010" }, { label: "Uso divergente identificado", target: "DECISAO-008" }]
  }),
  stage("DECISAO-008", "Cliente deseja continuar após orientação?", "DECISION", "DECISAO-008. Explique a forma correta com MSG-017 sem diagnosticar ou afirmar causalidade. Pergunte se o cliente ainda quer devolução, troca ou estorno.", {
    messageCodes: ["MSG-017"], requiredFacts: ["custom.alwaysfit.product.recommended.usage"],
    choices: [{ label: "Cliente mantém o pedido de solução", target: "ETAPA-010" }, { label: "Cliente desiste após a orientação", target: "RESULTADO-007" }]
  }),
  stage("ETAPA-010", "Verificar se o mal-estar permanece", "RISK_GATE", "DECISAO-009 e REGRA-020. Se o cliente ainda estiver mal, copie MSG-006 e oriente atendimento médico. Não diagnostique, não atribua causa e não interrompa a tratativa comercial.", {
    messageCodes: ["MSG-006"], requiredFacts: ["custom.alwaysfit.health.symptom.persistent"], forbiddenCapabilities: ["SEND_MESSAGE", "SUBMIT"], riskLevel: "CRITICAL",
    choices: [{ label: "Sintoma persiste: orientação médica enviada", target: "ETAPA-011" }, { label: "Sintoma não persiste", target: "ETAPA-011" }]
  }),
  stage("ETAPA-011", "Acolhimento", "MESSAGE", "Copie MSG-007 e reconheça o transtorno. Não prometa efeito médico, diagnóstico ou causalidade.", {
    messageCodes: ["MSG-007"], choices: [{ label: "Acolhimento enviado", target: "ETAPA-012" }]
  }),
  stage("ETAPA-012", "Definir o escopo sem usufruto", "MANUAL_INPUT", "DECISAO-010 e REGRA-004. Use MSG-008 e registre tudo que o cliente ficou impossibilitado ou inseguro de utilizar por causa do episódio: produto usado, unidades iguais, kit e outros itens do pedido. Não limite automaticamente ao frasco aberto.", {
    messageCodes: ["MSG-008"], requiredFacts: ["custom.alwaysfit.treatment.unusable.scope", "order.products"], choices: [{ label: "Escopo afetado confirmado", target: "ETAPA-013" }]
  }),
  stage("ETAPA-013", "Classificar itens lacrados e abertos", "DECISION", "DECISAO-011 e REGRAS REGRA-006/REGRA-007. Use MSG-009. Lacrado significa lacre interno abaixo da tampa intacto. Produto usado ou com lacre rompido é aberto, não retorna e continua no saldo.", {
    messageCodes: ["MSG-009"], requiredFacts: ["custom.alwaysfit.return.open.items", "custom.alwaysfit.return.sealed.items"], dependencies: ["PENDENCIA-008"],
    choices: [{ label: "Há ao menos um item lacrado", target: "ETAPA-014" }, { label: "Tudo está aberto: dispensar reversa", target: "ETAPA-019" }]
  }),
  stage("ETAPA-014", "Confirmar lacrados devolvidos e retidos", "DECISION", "DECISAO-012 e REGRA-008. Produtos abertos não retornam. Lacrados devolvidos permanecem no saldo; o valor efetivamente pago por lacrados retidos deve ser descontado.", {
    requiredFacts: ["custom.alwaysfit.return.sealed.items", "custom.alwaysfit.return.returned.sealed.items", "custom.alwaysfit.return.retained.sealed.items"], dependencies: ["PENDENCIA-008"],
    choices: [{ label: "Devolverá todos os lacrados", target: "ETAPA-015" }, { label: "Devolverá parte; descontar os retidos", target: "ETAPA-015" }, { label: "Não devolverá lacrados; descontar todos", target: "ETAPA-019" }]
  }),
  stage("ETAPA-015", "Calcular valor e gerar logística reversa", "RISK_GATE", "REGRA-022. Consulte pedido e nota fiscal, considere descontos e declare somente o valor dos itens lacrados enviados. A fonte definitiva da NF permanece pendente. A geração no Correios é obrigatoriamente humana.", {
    requiredFacts: ["custom.alwaysfit.return.returned.sealed.items", "custom.alwaysfit.return.declared.value"], dependencies: ["Correios - Logistica Reversa", "Fonte da nota fiscal", "PENDENCIA-004", "LOGISTICA-REVERSA"],
    forbiddenCapabilities: ["CREATE_REVERSE", "SUBMIT", "SEND_MESSAGE"], riskLevel: "HIGH",
    choices: [{ label: "Código válido gerado manualmente", target: "ETAPA-016" }, { label: "Valor ou fonte inconclusiva", target: "ETAPA-034" }]
  }),
  stage("ETAPA-016", "Enviar /reversa e registrar /devolução_reversa", "MESSAGE", "Envie MSG-010 ao cliente e registre MSG-011 somente como sussurro interno. Nunca exponha /devolução_reversa ao cliente. Enquanto a solução não estiver definida, o preenchimento sugerido continua pendente de validação.", {
    messageCodes: ["MSG-010", "MSG-011"], requiredFacts: ["treatment.reverseCode"], dependencies: ["AlwaysChat", "PENDENCIA-005"],
    choices: [{ label: "Mensagem e sussurro registrados", target: "ETAPA-017" }]
  }),
  stage("ETAPA-017", "Aguardar postagem", "WAIT_EXTERNAL", "DECISAO-013 e REGRA-009. Libere a escolha final somente após foto do comprovante ou confirmação no site dos Correios. Sem confirmação, aguarde. Código expirado segue para reemissão.", {
    requiredFacts: ["logistics.returnState"], dependencies: ["Correios - Logistica Reversa"],
    choices: [{ label: "Postagem confirmada por foto ou Correios", target: "ETAPA-019" }, { label: "Ainda não postado: continuar aguardando", target: "ETAPA-017", allowLoop: true }, { label: "Código expirado", target: "ETAPA-018" }, { label: "Encerrar contato aguardando postagem", target: "RESULTADO-001" }]
  }),
  stage("ETAPA-018", "Código de reversa expirado", "RISK_GATE", "Gere manualmente outro código de reversa e reenvie MSG-010. Esta reemissão não exige escalonamento.", {
    messageCodes: ["MSG-010"], dependencies: ["Correios - Logistica Reversa"], forbiddenCapabilities: ["CREATE_REVERSE", "SUBMIT", "SEND_MESSAGE"], riskLevel: "HIGH",
    choices: [{ label: "Novo código gerado e enviado", target: "ETAPA-017", allowLoop: true }]
  }),
  stage("ETAPA-019", "Escolher solução final", "DECISION", "DECISAO-015. Esta escolha só pode ocorrer após postagem confirmada ou bypass porque tudo está aberto. O cliente pode escolher estorno, troca ou composição mista quando a troca ficar abaixo do saldo.", {
    requiredFacts: ["custom.alwaysfit.treatment.solution"], choices: [{ label: "Estorno", target: "ETAPA-020" }, { label: "Troca", target: "ETAPA-024" }, { label: "Solução mista: iniciar pela troca", target: "ETAPA-024" }, { label: "Cliente mudou uma escolha já solicitada", target: "ETAPA-033" }]
  }),
  stage("ETAPA-020", "Preparar estorno", "CHECK", "REGRA-021. Calcule o valor efetivamente pago pelos itens afetados, com descontos, menos lacrados retidos. Nunca use preço nominal quando cupom ou rateio alterou o valor real.", {
    requiredFacts: ["custom.alwaysfit.financial.paid.affected.value", "custom.alwaysfit.financial.retained.sealed.value", "custom.alwaysfit.financial.available.balance"], dependencies: ["Pedido", "Fonte da nota fiscal"],
    choices: [{ label: "Valor final confirmado", target: "ETAPA-021" }]
  }),
  stage("ETAPA-021", "Verificar forma de pagamento original", "DECISION", "DECISAO-018 e REGRAS REGRA-011/REGRA-012. Cartão segue direto ao Slack e não pede Pix. Pix e boleto usam MSG-012 para coletar chave, banco e titular.", {
    messageCodes: ["MSG-012"], requiredFacts: ["payment.method"], optionalFacts: ["payment.pix"],
    choices: [{ label: "Cartão: sem dados Pix", target: "ETAPA-022" }, { label: "Pix: dados completos coletados", target: "ETAPA-022" }, { label: "Boleto: chave Pix coletada", target: "ETAPA-022" }]
  }),
  stage("ETAPA-022", "Solicitar estorno no Slack", "RISK_GATE", "REGRA-013. Ação financeira sempre humana. Preencha a automação no Slack, envie, copie o link e registre no sussurro exatamente ESTORNO - [LINK]. Não prometa conclusão se o Slack estiver indisponível.", {
    requiredFacts: ["custom.alwaysfit.financial.refund.amount", "custom.alwaysfit.treatment.slack.refund.link"], dependencies: ["Slack", "PENDENCIA-002"],
    forbiddenCapabilities: ["POST_SLACK", "ISSUE_REFUND", "CONFIRM_REIMBURSEMENT", "SUBMIT", "SEND_MESSAGE"], riskLevel: "CRITICAL",
    choices: [{ label: "Pix ou boleto solicitado e link registrado", target: "ETAPA-023" }, { label: "Cartão solicitado e link registrado", target: "ETAPA-030" }, { label: "Slack indisponível ou status incerto", target: "ETAPA-034" }]
  }),
  stage("ETAPA-023", "Finalizar estorno Pix ou boleto", "MESSAGE", "Copie MSG-013 e depois MSG-014. O pedido de estorno deve estar registrado no Slack antes desta confirmação.", {
    messageCodes: ["MSG-013", "MSG-014"], choices: [{ label: "Prazo e encerramento enviados", target: "RESULTADO-002" }]
  }),
  stage("ETAPA-024", "Montar troca no Lançador", "RISK_GATE", "DECISAO-019 e REGRAS REGRA-010/REGRA-017. Verifique disponibilidade, ajuste composição com o cliente e não cobre frete. Se ele escolher o produto associado ao mal-estar, use MSG-015 para recomendar outra opção; se insistir, a troca pelo mesmo produto é permitida.", {
    messageCodes: ["MSG-015"], requiredFacts: ["custom.alwaysfit.exchange.items"], dependencies: ["Lancador"],
    forbiddenCapabilities: ["CREATE_ORDER", "CONFIRM_ORDER", "SUBMIT", "SEND_MESSAGE"], riskLevel: "HIGH",
    choices: [{ label: "Cliente escolheu outro produto", target: "DECISAO-020" }, { label: "Cliente mudou após orientação", target: "DECISAO-020" }, { label: "Cliente insiste no mesmo produto", target: "DECISAO-020" }]
  }),
  stage("DECISAO-020", "Produtos escolhidos estão disponíveis?", "DECISION", "DECISAO-020 e REGRA-015. Consulte o estoque no Lançador antes de fechar a composição. Item indisponível exige voltar e refazer com o cliente.", {
    requiredFacts: ["custom.alwaysfit.exchange.stock.available"], dependencies: ["Lancador"], choices: [{ label: "Composição disponível", target: "ETAPA-025" }, { label: "Item indisponível: refazer composição", target: "ETAPA-024", allowLoop: true }]
  }),
  stage("ETAPA-025", "Comparar valor da troca com o saldo", "DECISION", "DECISAO-021. Compare o valor total da composição ao saldo disponível calculado pelo valor efetivamente pago.", {
    requiredFacts: ["custom.alwaysfit.exchange.value", "custom.alwaysfit.financial.available.balance"], choices: [{ label: "Valor igual ao saldo", target: "ETAPA-027" }, { label: "Valor maior que o saldo", target: "ETAPA-026" }, { label: "Valor menor que o saldo", target: "ETAPA-028" }]
  }),
  stage("ETAPA-026", "Cobrar diferença antes do pedido", "RISK_GATE", "DECISAO-022 e REGRA-014. Gere o link exato no Slack e aguarde a confirmação do pagamento. Nunca gere o novo pedido antes dessa confirmação.", {
    requiredFacts: ["custom.alwaysfit.exchange.difference", "custom.alwaysfit.payment.difference.status"], dependencies: ["Slack"],
    forbiddenCapabilities: ["POST_SLACK", "CREATE_ORDER", "CONFIRM_ORDER", "SUBMIT", "SEND_MESSAGE"], riskLevel: "CRITICAL",
    choices: [{ label: "Pagamento da diferença confirmado", target: "ETAPA-027" }, { label: "Pagamento ainda não confirmado", target: "ETAPA-026", allowLoop: true }, { label: "Slack indisponível", target: "ETAPA-034" }]
  }),
  stage("ETAPA-027", "Gerar novo pedido da troca", "RISK_GATE", "REGRA-016. Siga o subfluxo NOVO-PEDIDO-TROCA manualmente no Lançador. Frete deve ser zero; não é necessário reconfirmar o endereço já utilizado no pedido original. Registre o novo código.", {
    requiredFacts: ["order.manualId"], dependencies: ["Lancador", "NOVO-PEDIDO-TROCA"],
    forbiddenCapabilities: ["CREATE_ORDER", "CONFIRM_ORDER", "SUBMIT", "SEND_MESSAGE"], riskLevel: "CRITICAL",
    choices: [{ label: "Novo pedido gerado sem frete", target: "ETAPA-029" }]
  }),
  stage("ETAPA-028", "Executar solução mista", "RISK_GATE", "REGRA-018. Gere a troca manualmente e estorne a diferença pela forma original. Cartão vai direto ao Slack; Pix/boleto usam MSG-012, Slack e MSG-013. Confirme que 100% do saldo foi resolvido.", {
    messageCodes: ["MSG-012", "MSG-013"], requiredFacts: ["order.manualId", "custom.alwaysfit.financial.remaining.refund", "payment.method"], dependencies: ["Lancador", "Slack"],
    forbiddenCapabilities: ["CREATE_ORDER", "CONFIRM_ORDER", "POST_SLACK", "ISSUE_REFUND", "SUBMIT", "SEND_MESSAGE"], riskLevel: "CRITICAL",
    choices: [{ label: "Troca gerada e diferença solicitada", target: "ETAPA-029" }]
  }),
  stage("ETAPA-029", "Enviar previsão e rastreio", "MESSAGE", "Preencha novo pedido e previsão, copie MSG-016 e envie manualmente. O gatilho ou barra definitiva desta mensagem permanece pendente.", {
    messageCodes: ["MSG-016"], requiredFacts: ["order.manualId", "logistics.forecast"], dependencies: ["Rastreio", "PENDENCIA-009"],
    choices: [{ label: "Previsão e rastreio enviados", target: "ETAPA-030" }]
  }),
  stage("ETAPA-030", "Perguntar se pode ajudar em algo mais", "MESSAGE", "Copie MSG-014. Se houver outra demanda, encerre este fluxo e abra o fluxo correspondente; não reutilize este procedimento como fluxo genérico.", {
    messageCodes: ["MSG-014"], choices: [{ label: "Encerrar estorno em cartão", target: "RESULTADO-003" }, { label: "Encerrar troca ou solução mista", target: "RESULTADO-004" }]
  }),
  stage("ETAPA-031", "Pedido recebido há mais de 30 dias", "DECISION", "DECISAO-023 e REGRA-003. Acolha sem oferecer solução automática. Verifique exceção previamente combinada ou necessidade de supervisão. A mensagem padronizada ainda não foi definida.", {
    dependencies: ["PENDENCIA-003"], choices: [{ label: "Sem exceção aprovada", target: "RESULTADO-006" }, { label: "Possível exceção: consultar supervisão", target: "ETAPA-032" }]
  }),
  stage("ETAPA-032", "Validação com superior", "RISK_GATE", "Registre a aprovação ou negativa. O ponto exato de retorno para exceções acima de 30 dias ainda é pendente; só retome ETAPA-007 quando a liderança determinar isso explicitamente.", {
    dependencies: ["Supervisao", "PENDENCIA-010"], forbiddenCapabilities: ["SUBMIT", "SEND_MESSAGE"], riskLevel: "HIGH",
    choices: [{ label: "Aprovado com retorno explícito à ETAPA-007", target: "ETAPA-007", allowLoop: true }, { label: "Aprovado com outro retorno: handoff manual", target: "RESULTADO-009" }, { label: "Exceção negada", target: "RESULTADO-006" }]
  }),
  stage("ETAPA-033", "Cliente muda de ideia", "RISK_GATE", "DECISAO-017 e REGRA-023. Antes de abrir nova solicitação, pesquise o histórico e o Slack para evitar caso duplicado. Se a ação anterior ainda não foi processada, tente cancelar manualmente e volte à escolha; se foi processada, não desfaça. O texto final padronizado segue pendente.", {
    dependencies: ["Slack", "PENDENCIA-007"], forbiddenCapabilities: ["CANCEL_ORDER", "ISSUE_REFUND", "POST_SLACK", "SUBMIT", "SEND_MESSAGE"], riskLevel: "CRITICAL",
    choices: [{ label: "Ainda não processada: cancelada manualmente", target: "ETAPA-019", allowLoop: true }, { label: "Já processada: não alterar", target: "RESULTADO-005" }, { label: "Status incerto", target: "ETAPA-034" }]
  }),
  stage("ETAPA-034", "Dados, pedido ou sistema inconclusivo", "RISK_GATE", "Não decida automaticamente com CPF inválido, pedido ausente, múltiplos pedidos inconclusivos, data ausente, valor complexo ou sistema indisponível. Tente fonte alternativa e, se não resolver, escale. Login, captcha e 2FA são sempre humanos; nunca armazene credenciais.", {
    dependencies: ["AlwaysChat", "Yampi", "Rastreio", "Correios - Logistica Reversa", "Slack", "Lancador", "Fonte da nota fiscal", "PENDENCIA-006"],
    forbiddenCapabilities: ["SUBMIT", "SEND_MESSAGE", "POST_SLACK", "CREATE_ORDER", "CREATE_REVERSE", "ISSUE_REFUND"], riskLevel: "HIGH",
    choices: [{ label: "Fontes insuficientes: escalar para supervisão", target: "RESULTADO-009" }]
  }),
  stage("RESULTADO-001", "Reversa criada e aguardando postagem", "END", "Há lacrados, código enviado e o caso permanece acompanhado até a postagem.", { terminal: true }),
  stage("RESULTADO-002", "Estorno Pix ou boleto solicitado", "END", "Solicitação registrada no Slack, link no sussurro e mensagens finais enviadas.", { terminal: true }),
  stage("RESULTADO-003", "Estorno em cartão solicitado", "END", "Solicitação registrada no Slack. A mensagem final padronizada para cartão permanece pendente.", { terminal: true, dependencies: ["PENDENCIA-002"] }),
  stage("RESULTADO-004", "Troca gerada", "END", "Novo pedido correto, frete zerado e rastreio enviado; solução mista inclui a diferença solicitada.", { terminal: true }),
  stage("RESULTADO-005", "Mudança de escolha não possível", "END", "A solicitação anterior já foi processada e deve ser mantida.", { terminal: true, dependencies: ["PENDENCIA-007"] }),
  stage("RESULTADO-006", "Fora de 30 dias sem exceção", "END", "Acolhimento sem troca ou estorno automático.", { terminal: true, dependencies: ["PENDENCIA-003"] }),
  stage("RESULTADO-007", "Cliente desiste após orientação de uso", "END", "Encerramento com orientação; uso divergente não foi usado para negar um direito solicitado.", { terminal: true }),
  stage("RESULTADO-008", "Aguardando identificação", "END", "CPF ainda não foi informado e o atendimento aguarda dado válido.", { terminal: true }),
  stage("RESULTADO-009", "Caso inconclusivo ou escalado", "END", "Dados, sistema, regra ou retorno excepcional exigem supervisão ou outro fluxo.", { terminal: true })
] as const;

export interface AlwaysFitHealthStepDefinition {
  title: string;
  body: string;
  kind: "MANUAL" | "YES_NO" | "CHECKLIST" | "DECISION";
  decision: {
    nodeKey: string;
    options?: Array<{ label: string; target: string }>;
  };
  order: number;
  required: boolean;
  scriptIds: string[];
}

const kindFor = (node: CatalogNode): AlwaysFitHealthStepDefinition["kind"] => {
  if (node.choices && node.choices.length > 1) return "DECISION";
  if (node.type === "CHECK") return "CHECKLIST";
  return "MANUAL";
};

export function buildAlwaysFitHealthFlow(scriptIdsByCode: Readonly<Record<AlwaysFitHealthMessageCode, string>>) {
  const scriptIds = (codes: readonly AlwaysFitHealthMessageCode[] = []) => codes.map((code) => {
    const id = scriptIdsByCode[code];
    if (!id) throw new Error(`Missing Scriptoteca binding for ${code}`);
    return id;
  });
  const nodes: FlowNodeDefinition[] = [
    {
      key: "START",
      type: "START",
      title: `${ALWAYS_FIT_HEALTH_FLOW_CODE} v${ALWAYS_FIT_HEALTH_FLOW_VERSION}`,
      operatorInstruction: "Fluxo-piloto específico para problema de saúde após uso de suplemento com devolução, troca, estorno ou solução mista.",
      requiredFacts: [], optionalFacts: [], scripts: [], allowedCapabilities: [], forbiddenCapabilities: alwaysHuman,
      autoAdvance: true, riskLevel: "LOW", terminal: false,
      dependencies: ["fluxo_saude_caseflow_always_fit.md"]
    },
    ...alwaysFitHealthCatalogNodes.map((item): FlowNodeDefinition => ({
      key: item.key,
      type: item.type,
      title: `${item.key} — ${item.title}`,
      operatorInstruction: item.instruction,
      requiredFacts: item.requiredFacts ?? [],
      optionalFacts: item.optionalFacts ?? [],
      scripts: (item.messageCodes ?? []).map((code) => ({ scriptId: scriptIds([code])[0], label: code })),
      allowedCapabilities: item.allowedCapabilities ?? ["READ", "COPY"],
      forbiddenCapabilities: item.forbiddenCapabilities ?? alwaysHuman,
      autoAdvance: false,
      riskLevel: item.riskLevel ?? "LOW",
      terminal: item.terminal ?? false,
      dependencies: item.dependencies
    }))
  ];
  const transitions: FlowTransitionDefinition[] = [
    { fromNodeKey: "START", toNodeKey: "ETAPA-001", label: "Iniciar piloto", order: 0, requiresUserChoice: false },
    ...alwaysFitHealthCatalogNodes.flatMap((item) => (item.choices ?? []).map((choice, index): FlowTransitionDefinition => ({
      fromNodeKey: item.key,
      toNodeKey: choice.target,
      label: choice.label,
      order: index,
      requiresUserChoice: (item.choices?.length ?? 0) > 1,
      allowLoop: choice.allowLoop ?? false
    })))
  ];
  const steps: AlwaysFitHealthStepDefinition[] = alwaysFitHealthCatalogNodes.map((item, index) => ({
    title: `${item.key} — ${item.title}`,
    body: item.instruction,
    kind: kindFor(item),
    decision: {
      nodeKey: item.key,
      ...(item.choices?.length ? { options: item.choices.map(({ label, target }) => ({ label, target })) } : {})
    },
    order: index + 1,
    required: item.key === "ETAPA-001",
    scriptIds: scriptIds(item.messageCodes)
  }));
  return { nodes, transitions, steps };
}
