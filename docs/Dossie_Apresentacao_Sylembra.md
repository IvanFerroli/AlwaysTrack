# Dossiê Operacional SyLembra: Guia de Apresentação e Uso Detalhado

Este documento é o guia definitivo sobre o funcionamento do **SyLembra**. Ele foi desenhado não apenas para apresentar o sistema a leigos (Diretoria e Operação), mas também para servir como o **Manual Completo** de como o sistema funciona "por baixo dos panos", detalhando os fluxos ideais e o passo a passo de uso.

---

## 1. Visão Executiva e Proposta de Valor

**O que é o SyLembra?**
O SyLembra é um sistema web modular e inteligente projetado para o controle centralizado de licenças (como registros COREN) e documentos profissionais. 

**A Dor que Resolvemos:**
Instituições de saúde enfrentam altos riscos legais e operacionais quando profissionais atuam com licenças vencidas. O controle manual via planilhas exige que gestores fiquem ativamente "caçando" os profissionais para cobranças. O SyLembra elimina isso, monitorando os vencimentos e fazendo a cobrança de forma **100% autônoma via WhatsApp**.

---

## 2. Conceitos Fundamentais (Como o sistema pensa)

Antes de operar as telas, é importante entender os três pilares de funcionamento do SyLembra:

### A. O Ciclo de Vida e o Cálculo de Status
O sistema não precisa que ninguém mude o status da licença na mão. O status é calculado automaticamente todo dia, baseado na data de validade:
1. **REGULAR:** Licença válida e longe de vencer.
2. **EXPIRING (A Vencer):** Faltam X dias para vencer (configurado por você, ex: 30 dias).
3. **EXPIRED (Vencida):** A data limite já passou.
4. **PENDING_DOCUMENT:** O profissional ainda não enviou nenhum arquivo.
5. **PENDING_VALIDATION:** O profissional enviou a foto/PDF e o sistema está aguardando você (RT ou Admin) dizer se está certo.

### B. O Link Mágico (Zero Atrito)
O profissional da ponta (ex: enfermeiro) **não tem login nem senha** no SyLembra. Para ele não ter dificuldade técnica:
1. O robô envia uma mensagem no WhatsApp: *"Sua licença vence em 10 dias. Clique aqui para enviar o comprovante de renovação: [LINK]"*
2. Ele clica no link no celular, tira uma foto do documento e clica em enviar. Pronto.

### C. Hierarquia e Permissões
A estrutura do SyLembra foi desenhada para espelhar a vida real do hospital. Veja como as engrenagens se conectam:

1. **A Base Organizacional:** Primeiro, o gestor master cadastra a **Organização** (ex: Hospital São Lucas). Dentro dela, cria as **Unidades** (ex: Matriz, Filial Zona Sul). Dentro de cada Unidade, cria os **Setores** (ex: UTI, Pediatria, Centro Cirúrgico). Essa é a espinha dorsal.
2. **Os Usuários do Sistema (Quem opera as telas):**
   - **ADMIN:** É o "deus" do sistema. Vê todas as unidades, cria setores, acessa a Auditoria e configura os robôs de WhatsApp.
   - **SUPERVISOR:** É um gestor regional. Ele é atrelado apenas a determinadas Unidades ou Setores específicos (ex: Supervisor da Pediatria). Ele só enxerga o que acontece no "quintal" dele.
   - **RT (Responsável Técnico):** O líder direto da equipe. Vê apenas os dados e pendências dos profissionais que estão explicitamente sob a sua responsabilidade. Ele não pode alterar regras globais, seu foco é validar documentos e acompanhar sua equipe.
3. **Os Profissionais (Quem é monitorado):** O colaborador final (ex: Enfermeiro João). O João **não tem senha de acesso** ao sistema. O cadastro dele é "amarrado" a uma Unidade (Matriz), a um Setor (UTI) e a um RT (Maria). É por isso que, quando a licença do João vence, a pendência apita e gera notificação apenas no painel da Maria.

---

## 3. Os Fluxos Ideais na Prática

### Fluxo Ideal 1: A Automação de Cobrança
1. O sistema "acorda" todo dia de madrugada (Cron Job).
2. Varre o banco de dados buscando quem vai vencer hoje, amanhã, daqui a 15, 30 ou 60 dias (dependendo da **Regra de Notificação** configurada).
3. O sistema usa um **Template do WhatsApp** aprovado e dispara as mensagens individuais.
4. O envio é registrado na tela de **Relatórios -> Notificações** para que a gestão saiba quem recebeu, leu ou se houve falha no número de telefone.

### Fluxo Ideal 2: O Recebimento e Validação (Automático ou Manual)
O SyLembra permite duas formas de receber arquivos de renovação:
1. **Envio Automático (Link Mágico):** O profissional clica no link do WhatsApp e faz o **Upload** da foto pelo próprio celular.
2. **Envio Manual:** Se o profissional entregar a carteirinha impressa presencialmente, o RH ou RT pode entrar no sistema e anexar o arquivo manualmente no perfil dele.

Independentemente de como o documento entrou, ele cai no **Dashboard** e na tela de **Documentos**. A licença muda o status para `PENDING_VALIDATION` (Em validação).
A partir daqui, entra a **Validação Híbrida**:
* **Inteligência Artificial (IA):** Opcionalmente, o sistema passa a foto por uma IA que tenta ler o arquivo e extrair o Nome, CPF e Data de Validade, cruzando com os dados do sistema para ver se batem.
* **Revisão Humana (Aceite/Recusa):** A IA não aprova sozinha. O gestor abre o documento, vê o que a IA leu, confere a imagem e decide:
   - **Aprovar:** A data de validade é atualizada, a licença fica `REGULAR` e o histórico é salvo.
   - **Recusar:** O gestor digita um motivo (ex: "Foto cortada"). O sistema **automaticamente** avisa o profissional no WhatsApp: *"Seu documento foi recusado. Motivo: Foto cortada. Envie novamente."*

### Fluxo Ideal 3: O Escalonamento Inteligente (Envolvendo a Chefia)
E se o profissional ignorar os alertas do robô? O SyLembra lida com isso através do recurso de **Escalonamento**.
1. Nos avisos preventivos iniciais (ex: 60 ou 30 dias antes), o robô envia a mensagem **apenas** para o celular do profissional, evitando sobrecarregar o gestor. Mas a mensagem já avisa: *"Se não houver regularização até o último aviso, [Nome do RT] também será notificado"*.
2. Quando a licença atinge a régua final de tolerância (ex: Último aviso, faltando 7 dias ou já Vencido), o robô aciona o Escalonamento: Ele cobra o profissional novamente, mas **também dispara uma notificação diretamente para o WhatsApp do RT responsável** contendo os detalhes do risco.
3. Isso garante conformidade sem microgerenciamento: a chefia só é incomodada quando há risco real e iminente.

---

## 4. Passo a Passo das Telas: O que faz o quê?

### 4.1. Login e Acesso
* **O que faz:** Autenticação exclusiva para gestores (RH, RTs e Admins).
* **Passo a Passo:** Insira seu e-mail corporativo e senha cadastrada. Apenas pessoas com perfil ativo na tela de configurações podem entrar.
* `![Tela de Login do SyLembra - [INSERIR PRINT DO LOGIN AQUI]](placeholder_login.png)`

### 4.2. Dashboard (Visão Operacional do Dia)
* **O que faz:** É o seu "Raio-X" diário.
* **O que você encontra aqui:**
  - **Cards Superiores:** Indicadores rápidos de saúde (quantos estão regulares, a vencer, vencidos).
  - **Vencendo em 30 dias:** Lista vermelha de prioridades.
  - **Uploads Recentes e Documentos Pendentes:** A fila de trabalho dos RTs. Se tem arquivo aqui, tem que validar.
  - **Falhas de Notificação:** Avisa se o robô tentou mandar mensagem e falhou (ex: número errado).
* `![Dashboard do SyLembra - [INSERIR PRINT DO DASHBOARD AQUI]](placeholder_dashboard.png)`

### 4.3. Profissionais (Cadastro e Acompanhamento)
* **O que faz:** Onde você gerencia as pessoas.
* **Passos Ideais:**
  - **Criar Unitário:** Clique em "Novo Profissional", insira Nome, Cargo, Unidade, Setor e o RT Responsável. Útil para contratações pingadas.
  - **Upload em Lote (Importação CSV):** O sistema possui um modelo de planilha nativo (você clica em "Baixar Modelo" na própria tela). Você preenche as colunas exatas exigidas (Nome, CPF, Tipo, etc.) e sobe o arquivo (Batch upload). O sistema valida linha a linha e aponta erros antes de confirmar.
  - **Desligamentos:** Quando alguém sai da empresa, você **Desativa** o profissional. O histórico fica salvo para sempre, mas ele para de receber notificações.
* **Dica de Usabilidade:** Viu um ícone redondo com a letra **"i"** (informação) do lado de algum campo? Pode passar o mouse ou clicar! Ele explica na hora para que serve aquele botão ou direciona você para o manual interno.
* `![Tela de Profissionais - [INSERIR PRINT DE PROFISSIONAIS AQUI]](placeholder_profissionais.png)`

### 4.4. Licenças (Vencimentos e Status)
* **O que faz:** Gerencia o documento específico de cada pessoa.
* **O que você encontra aqui:**
  - **Tipos de Licença:** Você pode criar o tipo "COREN", "Treinamento NR32", "Certificado de Bombeiro", etc.
  - **Emissão e Validade:** O preenchimento da validade é o que "acorda" os robôs de cobrança.
* `![Tela de Licenças - [INSERIR PRINT DE LICENÇAS AQUI]](placeholder_licencas.png)`

### 4.5. Documentos (A Fila de Trabalho)
* **O que faz:** Caixa de entrada de arquivos. Tudo que foi enviado via link ou manualmente cai aqui.
* **Passos Ideais:**
  - O gestor entra e filtra pelo Status `UPLOADED` (Enviado).
  - Clica no botão **Analisar** para rodar a Inteligência Artificial, caso a instituição ative o módulo. A IA tentará extrair os dados legíveis da foto.
  - Clica em **Ver Análise** para comparar o que o robô leu com a foto real.
  - Clica em **Aprovar** (dando o aceite final que regulariza a licença) ou **Recusar** (gerando a re-cobrança ao profissional).
* `![Tela de Documentos - [INSERIR PRINT DE DOCUMENTOS AQUI]](placeholder_documentos.png)`

### 4.6. Relatórios (Extração de Dados)
* **O que faz:** Gera visões para auditorias, fechamentos mensais e diretorias.
* **Como usar:**
  - Selecione o relatório desejado (ex: "Licenças Vencidas", "Documentos Recusados", "Resumo por RT").
  - Aplique os filtros (Janela de tempo, Setor específico).
  - Clique em **Exportar CSV** para abrir no Excel.
* `![Tela de Relatórios - [INSERIR PRINT DE RELATÓRIOS AQUI]](placeholder_relatorios.png)`

### 4.7. Auditoria (Segurança e Rastreabilidade)
* **O que faz:** É a "câmera de segurança" do SyLembra. Tudo que altera dados gera um log irremovível.
* **Como usar:** Se você precisa saber quem inativou um profissional ou aprovou uma foto falsa, basta filtrar pela data ou pelo nome do profissional. O sistema dirá o ator (ex: "Ivan"), a ação (`document.analyze` ou `auth.login`) e a hora exata.
* `![Tela de Auditoria - [INSERIR PRINT DE AUDITORIA AQUI]](placeholder_auditoria.png)`

### 4.8. Configurações (O Motor do Sistema)
* **O que faz:** Permite adaptar o SyLembra à estrutura do hospital e afinar a inteligência do robô.
* **O que você encontra aqui:**
  - **Unidades e Setores:** Crie a hierarquia do hospital.
  - **Novo Usuário Administrativo:** Dê acesso a outros gestores.
  - **Templates de WhatsApp:** Escreva as mensagens oficiais que o robô vai disparar.
  - **Regras de Notificação:** Diga ao robô: *"Quero avisar o profissional 60 dias antes, depois 30 dias antes, e se vencer, mande mensagem a cada 5 dias até ele resolver"*.
* `![Tela de Configurações - [INSERIR PRINT DE CONFIGURAÇÕES AQUI]](placeholder_configuracoes.png)`

### 4.9. Como Usar (Base de Conhecimento Interna)
* **O que faz:** Corta custos com suporte e treinamento. É um painel de tutoriais que reside dentro da própria plataforma.
* **Como usar:** Lembra dos ícones de **"i"** (informação) espalhados pelo sistema? Eles estão **linkados diretamente** a esta tela de ajuda. Ou seja, se o usuário tiver dúvida na tela de configuração de regras, ele clica no "i" e o sistema já abre a seção exata do "Como Usar" que explica como não quebrar o envio do WhatsApp.
* `![Tela Como Usar - [INSERIR PRINT DE COMO USAR AQUI]](placeholder_comousar.png)`

---

## 5. Dicas de Apresentação (Como vender a ideia amanhã)

1. **Abrace a Falha Humana:** Inicie deixando claro que esquecer prazos é humano. O Excel não envia SMS, e ligar para 300 enfermeiros toma horas do RT. Venda o SyLembra como o "Assistente Incansável" do RT.
2. **Mostre o Fim a Fim (O Fluxo de Ouro):** 
   - Mostre a Regra de Configuração ("Aqui o robô sabe quando cobrar").
   - Mostre a Tela de Documentos ("Aqui a foto do WhatsApp chega pronta para o RT dar um clique").
3. **Calmante para a Diretoria:** Mostre a tela de Relatórios e Auditoria. Diretores amam conformidade. Mostre que nenhuma aprovação fica "sem dono", a Auditoria grava tudo.
4. **Calmante para o RT:** Diga repetidamente: *"Você não vai mais precisar usar seu WhatsApp pessoal para cobrar ninguém"*.
5. **A Mágica do Link:** Dê ênfase total ao "Sem senha, Sem app". O profissional da ponta já sofre com excesso de sistemas. Receber um link, clicar, tirar a foto e fechar é o que vai garantir a adesão de 100% dos usuários.

*(Documento gerado a partir do código, documentações e especificações arquiteturais do projeto SyLembra)*

---

## 6. Perguntas Frequentes (FAQ) para a Apresentação

Se surgirem dúvidas técnicas ou de usabilidade durante a reunião de amanhã, aqui estão as respostas "na ponta da língua", baseadas no comportamento real do sistema:

**1. O profissional tem que baixar algum aplicativo ou criar senha?**
*Não.* O profissional recebe um link único pelo WhatsApp. Ele clica, o link abre uma página super leve no próprio navegador do celular, ele tira a foto do documento (ou faz upload de um PDF) e clica em enviar. O link então perde a validade por segurança. Zero atrito, zero senhas esquecidas.

**2. E se o profissional mandar a foto borrada ou errada?**
O RT, ao abrir a foto no sistema, clica no botão "Recusar". O sistema vai exigir que o RT digite um motivo. Assim que ele salva, o robô do SyLembra manda uma nova mensagem de WhatsApp para o profissional em tempo real dizendo: *"Atenção, seu documento foi recusado pelo seguinte motivo: [Motivo escrito pelo RT]. Por favor, clique no link abaixo e envie novamente"*.

**3. O que acontece se o celular do profissional estiver cadastrado errado ou ele não usar WhatsApp?**
O Dashboard mostrará um card de alerta chamado "Falhas de Notificação" dizendo que a mensagem não foi entregue. O gestor pode ir no cadastro do profissional, corrigir o número de telefone e, na próxima varredura, o sistema tentará avisar novamente. 

**4. A gente já tem uma planilha de Excel com 800 profissionais. Vai ter que cadastrar um por um?**
*Não.* O SyLembra possui uma tela nativa de "Importação de CSV". Você adapta sua planilha, sobe no sistema e ele vai ler linha a linha, avisando se tem algum CPF em branco ou cargo inválido. Ao confirmar, ele cria os 800 profissionais de uma só vez, já atrelando eles aos seus respectivos setores e RTs.

**5. E se um profissional estiver com dúvida técnica e pedir ajuda pela página do Link Mágico? Quem vai socorrê-lo?**
O sistema é inteligente: quando o profissional clica em "Ajuda" na tela de upload, o SyLembra identifica automaticamente quem é o RT responsável por aquele colaborador e redireciona a dúvida para o WhatsApp do RT. Caso o profissional não tenha um RT específico, o pedido de ajuda cai automaticamente no número de suporte geral do hospital (definido nas Configurações).

**6. Como o sistema garante que o RT só veja a equipe dele e não bagunce os dados do resto do hospital?**
A "mágica" acontece na tela de Cadastro de Profissionais. Lá existe o campo "RT Responsável". A partir do momento que o profissional X é atrelado ao RT Y, o sistema aplica um filtro de segurança ("Scope"). Quando o RT faz o Login, todas as listas, o Dashboard e as estatísticas vêm filtradas exclusivamente para ele. É impossível que ele enxergue dados cruzados de outras unidades.

**7. A Inteligência Artificial aprova os documentos sozinha? Vai tirar o emprego de alguém?**
*Não.* A IA atua apenas como um "assistente de leitura rápida". Ela tenta ler o CPF e o nome na foto borrada para mastigar a informação para o gestor. A IA gera um relatório de confiança e aponta divergências, mas a decisão legal final de clicar no botão "Aprovar" ou "Recusar" é **sempre humana**. A IA serve para ganhar tempo, não para tomar decisões.

**8. E se o profissional tiver dificuldade com tecnologia e não souber mandar foto pelo WhatsApp de jeito nenhum?**
Sem problemas. O fluxo de "Link Mágico" é o cenário ideal que cobre a maioria esmagadora dos casos, mas o sistema conta com o fluxo de **Envio Manual**. O profissional leva a carteirinha física na unidade, o RH tira uma foto ou faz um PDF, entra no perfil do profissional dentro do SyLembra e faz o upload manualmente por ele. Tudo continua sendo auditado e rastreado da mesma forma.

**9. E se o profissional simplesmente ignorar a mensagem do robô várias vezes?**
É aí que a regra do **Escalonamento** atua. Durante a configuração, você diz ao sistema que os primeiros avisos (ex: 60 e 30 dias) vão apenas para o funcionário. Mas no "Último Aviso" (ex: 7 dias antes de vencer), você marca a opção "Notificar RT". Se chegar nesse ponto, o robô avisa o funcionário e manda uma cópia da bronca para o WhatsApp do líder direto dele. Isso gera engajamento imediato e evita que o funcionário diga "Eu não fui avisado".
