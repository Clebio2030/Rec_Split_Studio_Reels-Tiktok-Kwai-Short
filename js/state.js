/**
 * Cs Digital Z Studio - State & Persistence Manager
 */

export const DEFAULT_SCRIPTS = [
  {
    id: '1',
    titulo: "Roteiro 01 — Atendimento Centralizado & Multiatendentes",
    hook: "Sua empresa ainda perde vendas porque cada vendedor usa um WhatsApp pessoal diferente?",
    dado: "Segundo pesquisa da Harvard Business Review, responder um lead nos primeiros 5 minutos aumenta as chances de qualificação em quase quatrocentas vezes.",
    solucao: "Com o ZapRun, toda a sua equipe atende no mesmo número oficial do WhatsApp, com painel centralizado no computador e distribuição automática de chamados.",
    cta: "Comente ZAPRUN aqui embaixo para testar a plataforma gratuitamente!"
  },
  {
    id: '2',
    titulo: "Roteiro 02 — Vendas no Piloto Automático (24/7)",
    hook: "Quantos clientes chegam no seu WhatsApp fora do horário comercial e ficam sem resposta?",
    dado: "Estudos da Salesforce comprovam que empresas com atendimento automatizado 24 horas convertem até trinta e oito por cento mais vendas que a concorrência.",
    solucao: "O ZapRun mantém robôs inteligentes qualificando leads, enviando propostas e agendando reuniões enquanto você dorme ou cuida da gestão do seu negócio.",
    cta: "Quer ver funcionando na prática? Comente ZAPRUN para receber a demonstração!"
  },
  {
    id: '3',
    titulo: "Roteiro 03 — Fim das Mensagens Perdidas",
    hook: "Você já perdeu um cliente importante porque a conversa sumiu no meio de centenas de mensagens?",
    dado: "Pesquisas de mercado indicam que mais de setenta por cento dos clientes desistem da compra se não recebem retorno no mesmo dia.",
    solucao: "Com o sistema de tags, etiquetas coloridas e histórico do ZapRun, você sabe exatamente o status de cada negociação sem esquecer ninguém.",
    cta: "Elimine o caos no seu WhatsApp hoje mesmo: comente ZAPRUN!"
  },
  {
    id: '4',
    titulo: "Roteiro 04 — Disparos em Massa Sem Bloqueio",
    hook: "Fazer disparo em massa manual no WhatsApp tá travando a sua operação e gerando bloqueios?",
    dado: "Mais de setenta e dois por cento dos consumidores preferem receber ofertas e promoções diretamente no WhatsApp do que por e-mail.",
    solucao: "O ZapRun possui tecnologia de campanhas inteligentes com intervalos humanos para enviar promoções para toda a sua base com segurança.",
    cta: "Ative suas campanhas de WhatsApp: comente ZAPRUN e comece agora!"
  },
  {
    id: '5',
    titulo: "Roteiro 05 — Blindagem da Carteira de Clientes",
    hook: "Quem é o verdadeiro dono dos clientes da sua empresa hoje?",
    dado: "Estudos da Gartner mostram que mais de sessenta por cento das empresas perdem o contato com clientes quando um vendedor sai levando as conversas no chip pessoal.",
    solucao: "Sua base de clientes é seu maior patrimônio. Com o ZapRun, todas as conversas ficam salvas com segurança na nuvem da empresa, com controle total de permissões.",
    cta: "Proteja a carteira da sua empresa: comente ZAPRUN!"
  },
  {
    id: '6',
    titulo: "Roteiro 06 — Fuga de Clientes por Demora",
    hook: "Quanto tempo o seu cliente aguenta esperar no WhatsApp antes de desistir?",
    dado: "O relatório global da Zendesk aponta que mais de cinquenta e sete por cento dos consumidores trocam de empresa após apenas UMA experiência de atendimento demorado.",
    solucao: "A tolerância na internet é zero. O ZapRun organiza suas conversas em filas por departamento com transferência imediata entre setores.",
    cta: "Zere a espera no atendimento: comente ZAPRUN para testar grátis!"
  },
  {
    id: '7',
    titulo: "Roteiro 07 — Desistência Precoce no Follow-up",
    hook: "Quantas propostas enviadas sumiram no seu WhatsApp esse mês?",
    dado: "Estudos da Invesp mostram que quarenta e quatro por cento dos vendedores desistem no primeiro contato, mas oitenta por cento das vendas fecham entre o quinto e o décimo segundo contato!",
    solucao: "O dinheiro tá no acompanhamento. Com o funil Kanban do ZapRun direto no WhatsApp, você acompanha cada cliente de proposta enviada até o pagamento.",
    cta: "Não perca mais nenhuma venda no funil: comente ZAPRUN!"
  },
  {
    id: '8',
    titulo: "Roteiro 08 — Escala Sem Inchar Equipe",
    hook: "Você NÃO precisa contratar mais gente para dobrar o atendimento da sua empresa!",
    dado: "Pesquisas da McKinsey comprovam que processos automatizados e centralização aumentam em até trezentos por cento a capacidade de atendimento de cada operador.",
    solucao: "No ZapRun, duas pessoas atendem como dez com distribuição automática, painel integrado no computador e histórico compartilhado.",
    cta: "Escale suas vendas sem inchar a folha: comente ZAPRUN!"
  },
  {
    id: '9',
    titulo: "Roteiro 09 — Desperdício de Tráfego Pago",
    hook: "Se o seu WhatsApp tem mais de cinquenta mensagens não lidas, você tá no prejuízo!",
    dado: "Estudos de conversão da HubSpot mostram que até trinta por cento do investimento em anúncios é jogado fora porque as empresas demoram para atender os leads gerados.",
    solucao: "Não adianta investir em tráfego se o balde tá furado. O ZapRun faz a triagem instantânea de cem por cento dos leads que chegam dos seus anúncios de Instagram e Facebook.",
    cta: "Pare de queimar dinheiro em anúncios: comente ZAPRUN!"
  },
  {
    id: '10',
    titulo: "Roteiro 10 — Gestão por Métricas Reais",
    hook: "Você sabe exatamente quem é o melhor e o pior atendente da sua empresa hoje?",
    dado: "Empresas que monitoram tempo de resposta e taxa de conversão por vendedor aumentam em média mais de trinta por cento o faturamento nos primeiros noventa dias.",
    solucao: "O ZapRun entrega relatórios completos em tempo real: tempo de fila, quantidade de chamados e conversões de cada vendedor direto no seu painel.",
    cta: "Gerencie seu time com dados reais: comente ZAPRUN e teste grátis!"
  }
];

export function getStoredScripts() {
  const stored = localStorage.getItem('csdigital_scripts');
  if (stored) {
    try { return JSON.parse(stored); } catch {}
  }
  return DEFAULT_SCRIPTS;
}

export function saveStoredScripts(scripts) {
  localStorage.setItem('csdigital_scripts', JSON.stringify(scripts));
}

export const StudioState = {
  camStream: null,
  screenStream: null,
  audioStream: null,
  audioContext: null,
  mediaRecorder: null,
  recordedChunks: [],
  recordStartTime: 0,
  recordTimerInterval: null,
  isRecordingPaused: false,
  pausedDuration: 0,
  pauseStartTime: 0,

  // Saved Device IDs
  savedCameraId: null,
  savedMicId: null,

  // Camera Adjustments
  camZoom: 1.0,
  camPanX: 0.5,
  camPanY: 0.5,
  camBrightness: 100,
  camContrast: 100,
  camSaturation: 100,
  isCamMirrored: true,

  // Screen Adjustments
  screenZoom: 1.0,
  screenPanX: 0.5,
  screenPanY: 0.5,

  // Layout, Resolution & Quality
  currentLayout: 'split-vertical',
  splitRatio: 0.5,
  aspectRatio: '9:16',
  videoQuality: '1080p', // '1080p' (Full HD), '2k' (Quad HD), '4k' (Ultra HD)
  dividerColor: '#f97316',
  pipSize: 0.32,
  bannerText: '⚡ ZAPRUN NA PRÁTICA',
  previewScale: 1.0,

  // Prompter State
  isPrompterScrolling: false,
  prompterScrollTimer: null,
  allScripts: getStoredScripts()
};
