import {
  Barbershop,
  Service,
  Appointment,
  User,
  PlatformSettings,
  SubscriptionPlan,
  LandingPageContent,
  TrialUserRecord,
} from '../types';
import { getTodayDateString } from '../utils/formatters';

const today = getTodayDateString();

// Calculate yesterday and tomorrow strings for realistic initial schedule
const todayDate = new Date();
const yesterdayDate = new Date(todayDate);
yesterdayDate.setDate(yesterdayDate.getDate() - 1);
const yesterday = yesterdayDate.toISOString().split('T')[0];

const tomorrowDate = new Date(todayDate);
tomorrowDate.setDate(tomorrowDate.getDate() + 1);
const tomorrow = tomorrowDate.toISOString().split('T')[0];

export const INITIAL_PLATFORM_SETTINGS: PlatformSettings = {
  platformName: 'BarberClock',
  platformLogoUrl: '/barber_clock_logo.jpg',
  platformPixKey: 'financeiro@barberclock.com.br',
  platformPixKeyType: 'email',
  platformPixReceiverName: 'BARBERCLOCK TECNOLOGIA LTDA',
  monthlyFee: 49.90,
  supportPhone: '11999887766',
  supportEmail: 'contato@barberclock.com.br',
  pixInstructions: 'Transfira o valor exato da taxa mensal para a chave PIX acima e anexe ou confirme o pagamento para ativação imediata pelo administrador geral.',
  mercadoPagoAccessToken: '',
  mercadoPagoPublicKey: '',
  mercadoPagoEnabled: true,
};

export const INITIAL_TRIAL_RECORDS: TrialUserRecord[] = [
  {
    id: 'trial_rec_demo_1',
    name: 'Carlos Henrique Silva',
    phone: '11988776655',
    email: 'carlos.navalha@gmail.com',
    barbershopName: 'Navalha de Ouro',
    registeredAt: '2026-07-20',
  },
];

export const INITIAL_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'trial',
    name: 'Teste Grátis (30 Dias)',
    periodMonths: 1,
    price: 0,
    monthlyEquivalent: 0,
    discountPercent: 100,
    description: 'Experimente todas as funcionalidades da plataforma por 30 dias sem pagar nada e sem cadastrar cartão.',
    badge: '1 Mês Grátis',
    isPopular: false,
    active: true,
    features: [
      '30 dias de acesso total e irrestrito',
      'Agenda pública online 24h personalizada',
      'Recebimento direto via PIX na sua chave',
      'Painel financeiro em tempo real',
      'Catálogo ilimitado de serviços e preços',
      'QR Code de balcão para imprimir',
      'Sem necessidade de cartão de crédito',
    ],
  },
  {
    id: 'monthly',
    name: 'Plano Mensal',
    periodMonths: 1,
    price: 49.90,
    monthlyEquivalent: 49.90,
    discountPercent: 0,
    description: 'Ideal para barbearias individuais que desejam flexibilidade sem compromisso de longo prazo.',
    badge: 'Sem Fidelidade',
    isPopular: false,
    active: true,
    features: [
      'Agenda pública online 24h para seus clientes',
      'Recebimento direto via PIX na sua chave',
      'Painel financeiro de faturamento em tempo real',
      'Catálogo ilimitado de serviços e preços',
      'QR Code de balcão e link personalizado',
      'Suporte via WhatsApp em horário comercial',
    ],
  },
  {
    id: 'semiannual',
    name: 'Plano Semestral',
    periodMonths: 6,
    price: 249.90,
    originalPrice: 299.40,
    monthlyEquivalent: 41.65,
    discountPercent: 16,
    description: 'O mais escolhido por barbeiros profissionais. Economize 16% e garanta sua agenda ativa por 6 meses.',
    badge: 'Mais Popular',
    isPopular: true,
    active: true,
    features: [
      'Todos os recursos do Plano Mensal',
      '1 mês de economia total garantida',
      'Prioridade na lista de barbearias em destaque',
      'Painel de métricas de retorno e clientes fiéis',
      'Suporte prioritário via WhatsApp',
      'Garantia de congelamento de preço por 6 meses',
    ],
  },
  {
    id: 'annual',
    name: 'Plano Anual',
    periodMonths: 12,
    price: 449.90,
    originalPrice: 598.80,
    monthlyEquivalent: 37.49,
    discountPercent: 25,
    description: 'Maior economia e tranquilidade para o seu negócio. Pague o equivalente a apenas R$ 37,49/mês.',
    badge: 'Melhor Custo-Benefício (25% OFF)',
    isPopular: false,
    active: true,
    features: [
      'Todos os recursos do Plano Semestral',
      'Quase 3 meses grátis de plataforma',
      'Selo Oficial "Barbearia Verificada & Premium"',
      'Personalização avançada de cores e identidade',
      'Consultoria exclusiva para captação de clientes',
      'Suporte VIP direto com o administrador geral',
    ],
  },
];

export const INITIAL_LANDING_CONTENT: LandingPageContent = {
  brandLogoUrl: '/barber_clock_logo.jpg',
  heroTag: 'Tecnologia Completa para Barbearias Modernas',
  heroTitle: 'Multiplique seus agendamentos e zere as faltas com confirmação automática no PIX',
  heroSubtitle: 'A plataforma definitiva para barbeiros: tenha sua própria página de agendamento online personalizada, receba o pagamento na hora direto na sua chave PIX e controle o faturamento do seu negócio em tempo real.',
  heroCtaText: 'Credenciar Minha Barbearia Agora',
  videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0',
  videoTitle: 'Veja como funciona o BarberHub na prática',
  videoDescription: 'Demonstração completa do fluxo do cliente agendando em menos de 1 minuto e do painel exclusivo do barbeiro recebendo o PIX com comprovante.',
  videoPosterUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&auto=format&fit=crop&q=80',
  features: [
    {
      id: 'feat_1',
      icon: 'Calendar',
      title: 'Agenda Online 24 Horas',
      description: 'Seus clientes marcam horários a qualquer hora do dia ou da noite pelo celular, sem você precisar parar o corte para responder mensagens.',
    },
    {
      id: 'feat_2',
      icon: 'DollarSign',
      title: 'PIX Direto na sua Conta',
      description: 'O cliente confirma o agendamento pagando na sua própria chave PIX. Zero maquininha, zero taxas abusivas de intermediação.',
    },
    {
      id: 'feat_3',
      icon: 'QrCode',
      title: 'QR Code de Balcão e Link Próprio',
      description: 'Receba um link exclusivo (ex: barberhub.com.br/#minhabarbearia) e um QR Code para imprimir no balcão da sua barbearia.',
    },
    {
      id: 'feat_4',
      icon: 'TrendingUp',
      title: 'Gestão Financeira & Rendimentos',
      description: 'Acompanhe seu faturamento diário, semanal e mensal, ticket médio por cliente e serviços mais lucrativos em gráficos fáceis.',
    },
    {
      id: 'feat_5',
      icon: 'Clock',
      title: 'Eliminação de "No-Show" (Faltas)',
      description: 'Como o agendamento exige confirmação com PIX, seus clientes comparecem rigorosamente no horário marcado.',
    },
    {
      id: 'feat_6',
      icon: 'ShieldCheck',
      title: 'Aprovação Rápida & Suporte Humano',
      description: 'Seu cadastro é aprovado diretamente pelo Administrador Geral da plataforma mediante uma pequena taxa justa.',
    },
  ],
  galleryImages: [
    {
      id: 'gal_1',
      title: 'Experiência de Agendamento do Cliente',
      url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop&q=80',
      caption: 'Interface rápida e intuitiva onde o cliente escolhe serviço, barbeiro, data e horário disponível em segundos.',
    },
    {
      id: 'gal_2',
      title: 'Confirmação com PIX Instantâneo',
      url: 'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=800&auto=format&fit=crop&q=80',
      caption: 'QR Code automático e código PIX Copia e Cola gerados na hora para o cliente pagar diretamente.',
    },
    {
      id: 'gal_3',
      title: 'Painel do Barbeiro & Gestão de Agenda',
      url: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800&auto=format&fit=crop&q=80',
      caption: 'Visão detalhada dos horários do dia, status de pagamento dos clientes e controle de faturamento em tempo real.',
    },
    {
      id: 'gal_4',
      title: 'Personalização Visual da sua Barbearia',
      url: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=800&auto=format&fit=crop&q=80',
      caption: 'Defina suas cores, banner, logo, horários de almoço, valores dos cortes e bio da sua barbearia.',
    },
  ],
  stats: [
    { value: '98%', label: 'Redução de Faltas', subtext: 'Com confirmação prévia no PIX' },
    { value: '3.5x', label: 'Mais Agendamentos', subtext: 'Disponíveis 24h sem esperar resposta' },
    { value: '0%', label: 'Taxa sobre os Cortes', subtext: 'Todo o valor do serviço é 100% seu' },
    { value: '1 min', label: 'Tempo de Agendamento', subtext: 'Super rápido para qualquer cliente' },
  ],
  testimonials: [
    {
      id: 'test_1',
      name: 'Carlos Silva',
      shopName: 'Barbearia Navalha de Ouro',
      city: 'São Paulo - SP',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      comment: 'Antes eu perdia horas no WhatsApp respondendo cliente enquanto cortava cabelo. Hoje minha agenda enche sozinha e o dinheiro do PIX cai direto na minha conta antes do cliente sentar na cadeira!',
      rating: 5,
      revenueGrowth: '+42% faturamento',
    },
    {
      id: 'test_2',
      name: 'Marcos Rocha',
      shopName: 'Vintage Barber Club',
      city: 'São Paulo - SP',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      comment: 'O QR Code no balcão foi um divisor de águas. O cliente já sai de um corte e escaneia para marcar o próximo. A taxa mensal da plataforma se paga no primeiro dia do mês.',
      rating: 5,
      revenueGrowth: 'Zero faltas',
    },
    {
      id: 'test_3',
      name: 'Thiago Lima',
      shopName: 'Studio Barber Prime',
      city: 'São Paulo - SP',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      comment: 'O suporte do administrador geral é impecável e a aprovação foi super rápida. Recomendo para qualquer barbeiro que quer profissionalizar seu negócio.',
      rating: 5,
      revenueGrowth: '+15 novos clientes/semana',
    },
  ],
  faqs: [
    {
      id: 'faq_1',
      question: 'Como recebo o dinheiro dos cortes dos meus clientes?',
      answer: 'O dinheiro do corte vai 100% direto para a sua conta bancária! Na hora do agendamento, o cliente escaneia o QR Code com a SUA chave PIX cadastrada. O BarberHub não desconta nenhuma porcentagem dos seus serviços.',
    },
    {
      id: 'faq_2',
      question: 'Quanto custa para manter minha barbearia no ar?',
      answer: 'Você paga apenas uma taxa fixa de manutenção da plataforma (Plano Mensal, Semestral com desconto ou Anual). Sem taxas ocultas, sem comissões sobre os cortes.',
    },
    {
      id: 'faq_3',
      question: 'Como funciona a aprovação do meu cadastro?',
      answer: 'Após preencher o formulário simples de credenciamento e escolher seu plano, o Administrador Geral da plataforma valida seu pagamento da taxa via PIX e ativa sua página imediatamente para receber clientes.',
    },
    {
      id: 'faq_4',
      question: 'Meus clientes precisam baixar algum aplicativo pesado?',
      answer: 'Não! O BarberHub funciona direto no navegador do celular (web app responsivo). Basta o cliente clicar no seu link do WhatsApp ou escanear seu QR Code que a tela de agendamento abre instantaneamente.',
    },
    {
      id: 'faq_5',
      question: 'Posso alterar meus preços e horários quando quiser?',
      answer: 'Sim! No seu Painel do Barbeiro você tem controle total para adicionar novos serviços, reajustar valores, cadastrar pausas de almoço e bloquear datas especiais.',
    },
  ],
  ctaTitle: 'Pronto para elevar o nível da sua barbearia?',
  ctaSubtitle: 'Cadastre-se agora mesmo, escolha o melhor plano para você e comece a receber agendamentos online hoje.',
  ctaButtonText: 'Quero Credenciar Minha Barbearia',
};

export const INITIAL_USERS: User[] = [
  {
    id: 'client_guest_default',
    name: 'Cliente Visitante',
    phone: '',
    email: '',
    role: 'client',
  },
  {
    id: 'user_superadmin_dan',
    name: 'Danilo Santos (Admin Geral)',
    phone: '11999998888',
    email: 'danjs23@gmail.com',
    password: 'admin123',
    role: 'super_admin',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'user_superadmin_dan_alt',
    name: 'Danilo Santos (Admin Geral)',
    phone: '11999998887',
    email: 'danjjsantos@gmail.com',
    password: 'admin123',
    role: 'super_admin',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
  {
    id: 'user_superadmin',
    name: 'Administrador Geral',
    phone: '11988887777',
    email: 'admin@barberhub.com.br',
    password: 'admin123',
    role: 'super_admin',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
  },
];

export const INITIAL_BARBERSHOPS: Barbershop[] = [];

export const INITIAL_SERVICES: Service[] = [];

export const INITIAL_APPOINTMENTS: Appointment[] = [];

