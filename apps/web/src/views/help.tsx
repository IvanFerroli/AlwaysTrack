import { useEffect } from "react";
import type { CurrentUser } from "@alwaystrack/shared";

const helpSections = [
  {
    id: "visao-geral",
    title: "Visão geral",
    who: "Todos os perfis",
    text: "Use o AlwaysTrack para transformar DANFEs em vendas revisadas, ranking, campanhas, extratos, Wiki e auditoria.",
    steps: ["Envie ou receba DANFEs.", "Extraia os dados.", "Revise pendências.", "Acompanhe ranking, extratos e trilha de eventos."],
    check: "Confira vendedor, status, período e campanha antes de tirar conclusão operacional.",
    common: "Filtro restrito ou nota ainda pendente pode fazer ranking e extratos parecerem vazios.",
    support: "Procure suporte se uma tela falhar mesmo sem filtros ou se uma nota sumir depois do envio."
  },
  {
    id: "primeiro-acesso",
    title: "Primeiro acesso",
    who: "Admin cria acessos; demais perfis entram com convite ou usuário já criado.",
    text: "A função do usuário define telas, ações e escopo. Admin opera tudo; vendedor enxerga a própria rotina; supervisor acompanha time.",
    steps: ["Acesse com email e senha.", "Confira seu perfil no topo da página.", "Use Sair quando terminar em computador compartilhado."],
    check: "Antes de operar, confirme se o perfil exibido combina com sua função.",
    common: "Senha incorreta ou usuário inativo impedem entrada.",
    support: "Peça ajuda ao Admin se sua função, vendedor vinculado ou grupo comercial estiver incorreto."
  },
  {
    id: "dashboard-comercial",
    title: "Dashboard comercial",
    who: "Todos os perfis",
    text: "Mostra o pulso da operação: vendas, notas pendentes, ranking do dia e sinais de atenção.",
    steps: ["Leia os cards de resumo.", "Abra a tela indicada pelo atalho.", "Resolva primeiro notas pendentes, duplicadas ou rejeitadas."],
    check: "Confira se os números fazem sentido para seu escopo de acesso.",
    common: "Notas ainda não aprovadas não entram como venda consolidada.",
    support: "Acione suporte se houver erro de carregamento ou contagem muito diferente do relatório."
  },
  {
    id: "upload-danfe",
    title: "Upload de DANFE",
    who: "Vendedor envia a propria nota; Admin/Gestor pode enviar por vendedor.",
    text: "DANFE pode chegar como PDF, XML ou imagem legivel. O vendedor escolhido no upload alimenta ranking e extratos.",
    steps: ["Escolha o vendedor quando seu perfil permitir.", "Anexe o arquivo correto.", "Envie e aguarde a extracao.", "Revise o status na lista."],
    check: "Vendedor, arquivo e nota precisam bater antes de enviar.",
    common: "Enviar a nota no vendedor errado contamina ranking e exige correcao operacional.",
    support: "Chame suporte se o upload retornar erro tecnico ou se o arquivo valido nao gerar nota."
  },
  {
    id: "status-das-notas",
    title: "Status das notas",
    who: "Todos que acompanham DANFEs",
    text: "O status mostra a etapa da nota: enviada, extraindo, pendente de revisão, aprovada, rejeitada ou duplicada.",
    steps: ["Filtre por status.", "Abra a nota pendente.", "Confira dados extraidos.", "Aprove, rejeite, revise ou reprocesse quando necessario."],
    check: "Apenas nota aprovada deve contar em ranking e extrato.",
    common: "PENDING_REVIEW quer dizer que a nota ainda precisa de decisão humana.",
    support: "Procure suporte se o status travar em extracao ou se uma duplicidade parecer falsa."
  },
  {
    id: "reprocessamento-ia",
    title: "Reprocessamento por IA",
    who: "Admin, Gestor, SAC e Financeiro",
    text: "Reprocessar IA força nova tentativa de leitura e mostra origem, provider, modelo, itens, alertas e chave mascarada.",
    steps: ["Clique em Reprocessar IA.", "Leia o card de feedback.", "Confira warnings.", "Revise ou corrija antes de aprovar."],
    check: "Nao aprove se a IA nao retornou itens validos ou se a chave/numero nao batem.",
    common: "Reprocessar sem feedback era um problema; agora a tela deve mostrar saida ou erro.",
    support: "Acione suporte se nao aparecer resultado, erro, provider ou warning depois do reprocessamento."
  },
  {
    id: "duplicidade-danfe",
    title: "Duplicidade de DANFE",
    who: "Revisores e Admin",
    text: "Duplicidade deve indicar uma nota já existente na base, não repetição interna de um mesmo pacote extraido.",
    steps: ["Confira NF e chave de acesso.", "Compare vendedor e arquivo.", "Se for duplicidade real, mantenha sinalizada.", "Se parecer falsa, reprocesse e reporte."],
    check: "Base limpa com pacote gerado pelo sistema nao deveria criar duplicata falsa.",
    common: "Mesmo arquivo com varias linhas da mesma nota nao deve virar varias notas duplicadas.",
    support: "Chame suporte com nome do arquivo, NF e horario se uma duplicidade falsa aparecer."
  },
  {
    id: "aprovacao-de-notas",
    title: "Aprovação de notas",
    who: "Admin, Gestor, SAC e Financeiro",
    text: "Aprovacao libera a nota para ranking e extratos. Rejeicao deve explicar o motivo. Revisao permite ajustar dados antes da decisao.",
    steps: ["Filtre pendentes.", "Selecione uma ou varias notas.", "Revise itens e total.", "Aprove ou rejeite com comentario quando fizer sentido."],
    check: "Aprovacao exige ao menos um item comercial valido.",
    common: "Aprovar em lote sem revisar vendedor, NF e itens pode distorcer ranking.",
    support: "Procure suporte se aprovar/rejeitar mover a tela de forma estranha ou nao registrar auditoria."
  },
  {
    id: "ranking",
    title: "Ranking",
    who: "Admin, Gestor, Supervisor e Vendedor",
    text: "Ranking ordena vendedores com base em notas aprovadas e filtros de campanha, grupo, vendedor e periodo.",
    steps: ["Escolha campanha ou periodo.", "Limpe vendedor para comparar todos.", "Confira total, itens e notas.", "Valide com extratos quando houver duvida."],
    check: "Ranking so e confiavel depois de subir e aprovar notas de mais de um vendedor.",
    common: "Sem notas aprovadas, ranking vazio e esperado.",
    support: "Acione suporte se extrato aprovado divergir claramente do ranking."
  },
  {
    id: "campanhas",
    title: "Campanhas",
    who: "Admin, Gestor e Supervisor",
    text: "Campanhas definem periodo, grupo, metrica e status usados para disputar ranking e gerar snapshots.",
    steps: ["Crie ou edite campanha.", "Escolha metrica.", "Defina periodo.", "Ative quando a regra estiver pronta.", "Crie snapshots para comparar depois."],
    check: "Periodo e metrica precisam refletir a regra comercial combinada.",
    common: "Snapshot congelado nao muda quando novas notas entram; ele serve para comparacao historica.",
    support: "Procure suporte se snapshot nao refletir o ranking no momento em que foi criado."
  },
  {
    id: "extratos",
    title: "Extratos",
    who: "Todos conforme permissao",
    text: "Extratos consolidam notas aprovadas por vendedor e grupo, com CSV usando os mesmos filtros da tela.",
    steps: ["Escolha campanha, grupo, vendedor ou periodo.", "Confira cards de resumo.", "Compare consolidado por vendedor e grupo.", "Baixe CSV se precisar analisar fora do sistema."],
    check: "Use o mesmo periodo do ranking quando for reconciliar numeros.",
    common: "Nota pendente ou rejeitada nao aparece no extrato.",
    support: "Acione suporte se CSV e tela divergirem com os mesmos filtros."
  },
  {
    id: "wiki",
    title: "Wiki",
    who: "Todos leem; Admin publica e revisa",
    text: "Wiki guarda procedimentos publicados por slug. Usuarios podem sugerir alteracoes; Admin aprova, rejeita e comenta a decisao.",
    steps: ["Busque por titulo, slug ou conteudo.", "Abra a pagina.", "Use o link /wiki/slug para compartilhar.", "Sugira alteracao ou publique nova versao conforme permissao."],
    check: "Slug deve ser curto, estavel e nao colidir com outra pagina.",
    common: "Pagina arquivada fica fora da lista padrao para usuarios comuns.",
    support: "Procure suporte se uma pagina publicada nao abrir pelo slug."
  },
  {
    id: "faq",
    title: "FAQ",
    who: "Todos perguntam; perfis superiores organizam conhecimento",
    text: "A FAQ planejada vai permitir perguntas em threads com respostas, comentarios, reacoes e promocao para a Wiki.",
    steps: ["Abra uma pergunta.", "Responda na thread.", "Reaja quando uma resposta ajudar.", "Perfil superior pode transformar a pergunta em secao da Wiki."],
    check: "FAQ continua existindo mesmo quando uma resposta vira Wiki; o link deve apontar para a secao criada.",
    common: "Pergunta operacional recorrente nao deve ficar perdida em conversa solta.",
    support: "Procure suporte se o vinculo FAQ -> Wiki nao aparecer depois da promocao."
  },
  {
    id: "usuarios-times",
    title: "Usuarios e times",
    who: "Admin e Gestor",
    text: "Usuarios/Times deve criar acessos comerciais e vincular vendedor, supervisor, SAC e Admin aos escopos corretos.",
    steps: ["Crie usuario.", "Escolha funcao.", "Vincule SellerProfile quando for vendedor.", "Associe supervisor a grupo quando necessario."],
    check: "Email, funcao e vinculo comercial precisam estar corretos antes de liberar acesso.",
    common: "Usuario vendedor sem SellerProfile nao alimenta a propria operacao corretamente.",
    support: "Chame suporte se nao conseguir corrigir funcao ou vinculo comercial."
  },
  {
    id: "perfis-e-permissoes",
    title: "Perfis e permissoes",
    who: "Todos precisam entender seu alcance",
    text: "ADMIN opera tudo; SAC e FINANCEIRO revisam notas conforme regra; VENDEDOR envia e acompanha; SUPERVISOR acompanha time.",
    steps: ["Confira seu perfil no topo.", "Use filtros do seu escopo.", "Peça ajuste se registros esperados nao aparecerem."],
    check: "Antes de concluir que falta dado, confirme se voce tem permissao para ver ou agir.",
    common: "Supervisor sem grupo ou vendedor sem perfil comercial pode ver menos que o esperado.",
    support: "Acione Admin ou suporte para corrigir perfil, usuario vinculado ou escopo."
  },
  {
    id: "auditoria",
    title: "Auditoria",
    who: "Admin acompanha eventos sensiveis",
    text: "Auditoria registra acoes importantes, quem executou, quando ocorreu e qual registro foi afetado.",
    steps: ["Filtre por acao, entidade, registro, usuario ou periodo.", "Abra o evento.", "Compare metadados com a alteracao esperada."],
    check: "ID e identificador interno do registro, nao NF nem email.",
    common: "Acao tecnica como auth.login descreve o evento gravado pelo sistema.",
    support: "Procure suporte se faltar evento de aprovacao, rejeicao, reprocessamento ou publicacao."
  },
  {
    id: "notificacoes-in-app",
    title: "Notificacoes in-app",
    who: "Todos recebem eventos relevantes",
    text: "O centro de notificacoes planejado deve avisar sobre notas aprovadas, rejeitadas, comentadas, revisadas, Wiki e FAQ.",
    steps: ["Abra o sino ou centro de notificacoes.", "Leia itens novos.", "Siga o link para o registro.", "Marque como lido quando resolver."],
    check: "Notificacao deve apontar para a nota, Wiki ou thread correta.",
    common: "Evento sem link de destino vira ruido operacional.",
    support: "Procure suporte se aprovacoes, rejeicoes ou comentarios nao gerarem notificacao."
  },
  {
    id: "glossario",
    title: "Glossário rápido",
    who: "Todos os perfis",
    text: "Alguns termos aparecem em filtros, tabelas e auditoria.",
    steps: ["DANFE e o documento auxiliar da NF-e.", "Chave de acesso identifica a nota.", "Snapshot congela ranking.", "Slug e o caminho amigavel da Wiki.", "Escopo e o conjunto de dados que o usuario pode ver."],
    check: "Nao confunda ID interno com NF, chave de acesso, email ou credencial.",
    common: "Status tecnico ajuda em filtros, mas a decisao operacional deve considerar a nota real.",
    support: "Peça suporte quando um termo técnico bloquear uma decisão operacional."
  },
  {
    id: "problemas-comuns",
    title: "Problemas comuns",
    who: "Todos os perfis",
    text: "A maioria dos bloqueios vem de filtro restrito, nota pendente, vendedor errado, duplicidade falsa ou permissao insuficiente.",
    steps: ["Limpe filtros.", "Recarregue a tela.", "Confira perfil e escopo.", "Leia a mensagem de erro.", "Tente reproduzir com um registro especifico."],
    check: "Nunca cole tokens, secrets, credenciais Google ou dados sensiveis em campos do sistema.",
    common: "Ranking e extrato vazios normalmente indicam falta de nota aprovada no periodo.",
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
