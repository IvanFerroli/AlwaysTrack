import { useEffect } from "react";
import type { CurrentUser } from "@alwaystrack/shared";

const helpSections = [
  {
    id: "visao-geral",
    title: "Visão geral",
    who: "Todos os perfis",
    text: "O AlwaysTrack organiza a operação de SAC: capacidade de atendimento, pausas, desempenho, campanhas, fluxos guiados, mensagens, conhecimento e auditoria.",
    steps: ["Leia o painel do dia.", "Escolha sua pausa.", "Siga o fluxo adequado no atendimento.", "Consulte scripts e conhecimento quando necessário."],
    check: "Confirme data, time e escopo antes de interpretar qualquer indicador.",
    common: "Misturar períodos ou times diferentes produz conclusões operacionais incorretas.",
    support: "Procure suporte se uma tela continuar indisponível depois de recarregar ou se seu perfil mostrar áreas indevidas."
  },
  {
    id: "primeiro-acesso",
    title: "Primeiro acesso",
    who: "Admin cria acessos; os demais perfis entram com usuário já criado.",
    text: "A função e o vínculo ao time definem telas, ações e escopo. SAC executa a rotina; Gestor e Admin acompanham e configuram a operação.",
    steps: ["Acesse com email e senha.", "Confira seu perfil no topo da página.", "Use Sair quando terminar em computador compartilhado."],
    check: "Antes de operar, confirme se o perfil exibido combina com sua função.",
    common: "Senha incorreta ou usuário inativo impedem entrada.",
    support: "Peça ajuda ao Admin se sua função ou seu time de atendimento estiver incorreto."
  },
  {
    id: "dashboard-sac",
    title: "Dashboard do SAC",
    who: "SAC, Gestor e Admin",
    text: "Reúne capacidade do dia, risco de sobreposição de pausas, indicadores de qualidade, campanhas, avisos e conhecimento pendente.",
    steps: ["Escolha a data.", "Alterne entre Visão geral, Pausas e Qualidade.", "Abra o módulo indicado pelo card que exige ação."],
    check: "Diferencie dado vazio de falha de carregamento e observe o horário da última atualização.",
    common: "Uma média sem base suficiente de respostas ou atendimentos não deve ser usada isoladamente para cobrar resultado.",
    support: "Acione suporte se cards do mesmo período divergirem entre dashboard e módulo detalhado."
  },
  {
    id: "pausas-e-cobertura",
    title: "Pausas e cobertura",
    who: "SAC escolhe; Gestor e Admin configuram",
    text: "Os slots limitam quantas pessoas podem pausar ao mesmo tempo sem reduzir a cobertura mínima do time.",
    steps: ["Escolha a data e o time.", "Leia ocupação e cobertura projetada.", "Reserve um slot disponível.", "Cancele a reserva se não for utilizá-la."],
    check: "Confirme horário, capacidade e cobertura antes de reservar.",
    common: "Atualizações concorrentes podem preencher um slot entre a leitura e a confirmação; nesse caso, escolha outro horário.",
    support: "Chame o Gestor se nenhum slot viável existir ou se a composição real do time estiver incorreta."
  },
  {
    id: "trocas-de-pausa",
    title: "Trocas de pausa",
    who: "SAC solicita e responde; Gestor e Admin acompanham",
    text: "Uma troca transfere duas reservas de forma atômica, preservando capacidade e deixando a decisão registrada.",
    steps: ["Escolha a reserva desejada.", "Envie a solicitação ao colega.", "Aguarde aceite ou recusa.", "Confira os horários atualizados."],
    check: "As duas reservas precisam continuar ativas até a resposta.",
    common: "Combinar a troca apenas por mensagem não altera a agenda oficial.",
    support: "Procure o Gestor se a troca foi aceita mas a agenda não refletiu os novos horários."
  },
  {
    id: "desempenho-sac",
    title: "Desempenho do SAC",
    who: "SAC consulta; Gestor e Admin registram",
    text: "A área acompanha notas, durações, taxas e contagens por operação, equipe ou atendente, preservando canal e período de cada série.",
    steps: ["Escolha período, métrica, canal, tipo e escopo.", "Leia valor, tendência e a forma de consolidação.", "Registre ou corrija o KPI quando autorizado."],
    check: "CSAT usa nota de 1 a 5; SLA e tempos usam duração. Bases informadas permitem consolidação ponderada sem misturar séries.",
    common: "Comparar valores sem considerar base, canal, período ou sentido da métrica pode inverter a interpretação.",
    support: "Acione o Gestor se a fonte do indicador estiver ausente ou se a consolidação divergir do dado registrado."
  },
  {
    id: "campanhas-sac",
    title: "Campanhas do SAC",
    who: "SAC acompanha; Gestor e Admin criam",
    text: "Campanhas transformam um KPI em objetivo temporal para a operação, um time ou uma pessoa, com resultado e progresso calculados no próprio sistema.",
    steps: ["Defina nome, métrica, canal, período da série e público.", "Escolha a meta na unidade indicada.", "Ative a campanha.", "Acompanhe resultado e progresso."],
    check: "A meta precisa usar a mesma unidade e o mesmo sentido definidos para a métrica.",
    common: "Campanha sem dados no período não equivale a meta não atingida; significa que ainda não há base para cálculo.",
    support: "Procure suporte se o resultado não refletir os KPIs do mesmo período e escopo."
  },
  {
    id: "avisos-e-ciencia",
    title: "Avisos e ciência",
    who: "Todos leem; Gestor e Admin publicam e acompanham",
    text: "Avisos distribuem comunicados operacionais e registram quem já marcou ciência e quem ainda precisa ler.",
    steps: ["Abra o aviso ativo.", "Leia o conteúdo completo.", "Marque ciência.", "Gestores expandem o acompanhamento para ver pendências nominais."],
    check: "A quantidade esperada considera usuários ativos no público do aviso.",
    common: "Abrir o aviso não substitui a ação de marcar ciência.",
    support: "Acione suporte se o botão de ciência não aparecer para um aviso direcionado ao seu perfil."
  },
  {
    id: "fluxos-de-atendimento",
    title: "Fluxos de atendimento",
    who: "SAC executa; Gestor e Admin publicam",
    text: "Fluxos guiam decisões, mantêm a ficha mínima do caso, preparam mensagens e geram um resumo progressivo para troca de responsável ou sussurro.",
    steps: ["Escolha um fluxo específico.", "Preencha nome, CPF e itens quando exigidos.", "Conclua cada decisão.", "Use o resumo lateral durante ou ao final do caso."],
    check: "Reabrir uma etapa exige reconfirmar as decisões seguintes que dependem dela.",
    common: "Usar um fluxo fora do seu escopo cria orientações erradas; encaminhe ao fluxo correspondente.",
    support: "Procure suporte se Concluir etapa não avançar, se a ficha sumir ou se o resumo deixar de acompanhar as decisões."
  },
  {
    id: "scriptoteca",
    title: "Scriptoteca",
    who: "SAC usa e sugere; Gestor e Admin governam",
    text: "A Scriptoteca concentra textos validados e macros ligadas aos fluxos, evitando improviso e retrabalho no atendimento.",
    steps: ["Busque por assunto ou tag.", "Confira canal e contexto.", "Copie o texto.", "Personalize apenas os campos previstos."],
    check: "Confirme se a mensagem corresponde à etapa e ao canal atuais.",
    common: "Copiar um script parecido, mas de outro fluxo, pode prometer uma ação indevida.",
    support: "Procure o Gestor se faltar um texto recorrente ou se uma macro não preencher os dados da ficha."
  },
  {
    id: "wiki",
    title: "Wiki",
    who: "Todos leem; perfis autorizados sugerem ou publicam",
    text: "A Wiki guarda procedimentos transversais e versões aprovadas do conhecimento operacional.",
    steps: ["Busque por título, slug ou conteúdo.", "Abra a página.", "Compartilhe o link estável.", "Sugira alteração quando o procedimento mudar."],
    check: "Confirme status e versão antes de seguir uma instrução sensível.",
    common: "Uma sugestão ainda em revisão não substitui a versão publicada.",
    support: "Procure suporte se uma página publicada não abrir ou se o histórico de versão estiver inconsistente."
  },
  {
    id: "faq",
    title: "FAQ",
    who: "Todos perguntam; perfis superiores organizam conhecimento",
    text: "A FAQ mantém perguntas em threads com respostas, comentários, reações e promoção para a Wiki.",
    steps: ["Abra uma pergunta.", "Responda na thread.", "Reaja quando uma resposta ajudar.", "Perfil superior pode transformar a pergunta em secao da Wiki."],
    check: "FAQ continua existindo mesmo quando uma resposta vira Wiki; o link deve apontar para a secao criada.",
    common: "Pergunta operacional recorrente nao deve ficar perdida em conversa solta.",
    support: "Procure suporte se o vinculo FAQ -> Wiki nao aparecer depois da promocao."
  },
  {
    id: "usuarios-times",
    title: "Usuarios e times",
    who: "Admin e Gestor",
    text: "Usuários e times controlam acesso, função, vínculo operacional e histórico de composição das equipes.",
    steps: ["Crie o usuário.", "Escolha a função.", "Vincule ao time SAC com período de vigência.", "Desative o acesso quando necessário."],
    check: "Email, função, time e vigência precisam estar corretos antes de liberar acesso.",
    common: "Usuário SAC sem vínculo ativo pode não aparecer corretamente em cobertura, campanhas ou indicadores.",
    support: "Chame suporte se não conseguir corrigir função, vínculo ou período de participação no time."
  },
  {
    id: "perfis-e-permissoes",
    title: "Perfis e permissoes",
    who: "Todos precisam entender seu alcance",
    text: "ADMIN governa o sistema; GESTOR configura e acompanha o SAC; SAC executa a operação. Perfis comerciais preservados existem apenas para consulta histórica.",
    steps: ["Confira seu perfil no topo.", "Use filtros do seu escopo.", "Peça ajuste se registros esperados nao aparecerem."],
    check: "Antes de concluir que falta dado, confirme se voce tem permissao para ver ou agir.",
    common: "Um vínculo de time ausente ou vencido pode reduzir o escopo mesmo quando a função está correta.",
    support: "Acione Admin ou suporte para corrigir perfil, time ou vigência."
  },
  {
    id: "auditoria",
    title: "Auditoria",
    who: "Admin acompanha eventos sensiveis",
    text: "Auditoria registra acoes importantes, quem executou, quando ocorreu e qual registro foi afetado.",
    steps: ["Filtre por acao, entidade, registro, usuario ou periodo.", "Abra o evento.", "Compare metadados com a alteracao esperada."],
    check: "O ID identifica o registro interno; use ator, data e entidade para interpretar o evento.",
    common: "Ação técnica como auth.login descreve o evento gravado pelo sistema.",
    support: "Procure suporte se faltar evento de reserva, troca, alteração de KPI, campanha ou publicação."
  },
  {
    id: "notificacoes-in-app",
    title: "Notificacoes in-app",
    who: "Todos recebem eventos relevantes",
    text: "O centro de notificações informa eventos relevantes, incluindo avisos pendentes e confirmação de leitura por todo o público.",
    steps: ["Abra o sino ou centro de notificacoes.", "Leia itens novos.", "Siga o link para o registro.", "Marque como lido quando resolver."],
    check: "A notificação deve apontar para o aviso, Wiki ou thread correta.",
    common: "Evento sem link de destino vira ruido operacional.",
    support: "Procure suporte se aprovacoes, rejeicoes ou comentarios nao gerarem notificacao."
  },
  {
    id: "glossario",
    title: "Glossário rápido",
    who: "Todos os perfis",
    text: "Alguns termos aparecem em filtros, tabelas e auditoria.",
    steps: ["Slot é uma janela disponível para pausa.", "Overlap é a quantidade simultânea de pessoas pausadas.", "Base é o total de respostas ou atendimentos usado na consolidação.", "Slug é o caminho amigável da Wiki.", "Escopo é o conjunto de dados que o usuário pode ver."],
    check: "Não confunda média, base de consolidação, meta e progresso da campanha.",
    common: "Status técnico ajuda nos filtros, mas não substitui a leitura do contexto operacional.",
    support: "Peça suporte quando um termo técnico bloquear uma decisão operacional."
  },
  {
    id: "problemas-comuns",
    title: "Problemas comuns",
    who: "Todos os perfis",
    text: "A maioria dos bloqueios vem de filtro restrito, vínculo de time, concorrência em um slot, período sem dados ou permissão insuficiente.",
    steps: ["Limpe filtros.", "Recarregue a tela.", "Confira perfil e escopo.", "Leia a mensagem de erro.", "Tente reproduzir com um registro especifico."],
    check: "Nunca cole tokens, secrets, credenciais Google ou dados sensiveis em campos do sistema.",
    common: "Dashboard vazio pode significar período sem dados; erro de carregamento aparece como falha explícita.",
    support: "Procure suporte se o erro persistir, envolver credenciais ou impactar a operacao real."
  }
];

export function HelpView({ user }: { user: CurrentUser }) {
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (!hash) return;
    window.setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }, []);

  return (
    <div className="content-stack">
      <section className="panel help-hero">
        <p className="eyebrow">Ajuda operacional</p>
        <h2>Como usar o AlwaysTrack sem treinamento técnico</h2>
        <p className="muted">
          Você está como {user.role}. Use o sumário para ir direto ao fluxo, ou clique nos ícones i dos campos para abrir a seção certa.
        </p>
      </section>

      <section className="panel help-card help-summary" aria-label="Sumário do Como usar">
        {helpSections.map((section) => (
          <a href={`#${section.id}`} key={section.id}>
            {section.title}
          </a>
        ))}
      </section>

      <div className="help-section-grid">
        {helpSections.map((section) => (
          <section className="panel help-card help-section" id={section.id} key={section.id}>
            <p className="eyebrow">{section.who}</p>
            <h2>{section.title}</h2>
            <p>{section.text}</p>
            <div>
              <strong>Passo a passo</strong>
              <ol>
                {section.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
            <p>
              <strong>Antes de salvar/processar:</strong> {section.check}
            </p>
            <p>
              <strong>Erro comum:</strong> {section.common}
            </p>
            <p>
              <strong>Quando chamar suporte:</strong> {section.support}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}
