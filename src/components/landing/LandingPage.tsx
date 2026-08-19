import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SubscriptionPlan } from '../../types';
import { formatCurrency, openWhatsApp } from '../../utils/formatters';
import {
  Scissors,
  CheckCircle2,
  Sparkles,
  Play,
  ArrowRight,
  Shield,
  Zap,
  DollarSign,
  TrendingUp,
  Star,
  ChevronDown,
  Calendar,
  Smartphone,
  QrCode,
  Users,
  Check,
  Building2,
  HelpCircle,
  Clock,
  Award,
  Video,
  Eye,
  Percent,
  LogIn,
  KeyRound,
  Lock,
} from 'lucide-react';

interface LandingPageProps {
  onOpenRegister?: (planId?: string) => void;
  onOpenLogin?: (role?: 'barber' | 'super_admin') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenRegister, onOpenLogin }) => {
  const {
    landingPageContent,
    subscriptionPlans,
    platformSettings,
    setCurrentView,
    setIsRegisterModalOpen,
    openRegisterModal,
    openLoginModal,
  } = useApp();

  const handleOpenLogin = (role: 'barber' | 'super_admin' = 'barber') => {
    if (onOpenLogin) {
      onOpenLogin(role);
    } else {
      openLoginModal(role);
    }
  };

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'semiannual' | 'annual'>('annual');
  const [openFaqId, setOpenFaqId] = useState<string | null>(
    landingPageContent.faqs[0]?.id || null
  );

  // ROI Calculator State
  const [cutsPerDay, setCutsPerDay] = useState<number>(10);
  const [avgPrice, setAvgPrice] = useState<number>(45);

  const monthlyGrossEstimate = cutsPerDay * avgPrice * 25; // 25 working days
  const recoveredLossEstimate = Math.round(monthlyGrossEstimate * 0.18); // 18% recovered from no-shows & late bookings

  const handleSelectPlanAndRegister = (planId: string) => {
    if (onOpenRegister) {
      onOpenRegister(planId);
    } else {
      openRegisterModal(planId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-orange-600 selection:text-white" id="landing-presentation-page">
      {/* Top Floating Navigation */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => setCurrentView('client_booking')}
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-orange-600 to-amber-600 flex items-center justify-center text-white shadow-lg shadow-orange-600/30 group-hover:scale-105 transition">
              <Scissors className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white block">
                {platformSettings.platformName}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400">
                Plataforma Para Barbearias
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-300">
            <a href="#video-demo" className="hover:text-orange-400 transition">
              Como Funciona
            </a>
            <a href="#diferenciais" className="hover:text-orange-400 transition">
              Diferenciais
            </a>
            <a href="#galeria" className="hover:text-orange-400 transition">
              Demonstração
            </a>
            <a href="#planos" className="hover:text-orange-400 transition">
              Planos & Preços
            </a>
            <a href="#calculadora" className="hover:text-orange-400 transition">
              Simulador de Ganhos
            </a>
            <a href="#depoimentos" className="hover:text-orange-400 transition">
              Depoimentos
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => handleOpenLogin('barber')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-200 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl transition shadow-xs"
              title="Entrar com login e senha (Barbeiro ou Admin Geral)"
            >
              <KeyRound className="w-3.5 h-3.5 text-orange-400" />
              <span>Acessar Conta</span>
            </button>

            <button
              onClick={() => handleSelectPlanAndRegister('annual')}
              className="px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs font-extrabold rounded-xl shadow-lg shadow-orange-600/25 hover:shadow-orange-600/40 transition transform hover:-translate-y-0.5"
            >
              Credenciar Barbearia
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 overflow-hidden">
        {/* Glowing Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Highlight Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold bg-orange-950/80 text-orange-300 border border-orange-800/80 shadow-md mb-6 animate-in fade-in slide-in-from-bottom-3">
            <Sparkles className="w-3.5 h-3.5 text-orange-400 animate-pulse" />
            {landingPageContent.heroTag}
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight max-w-4xl mx-auto leading-[1.12]">
            {landingPageContent.heroTitle}
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-sm sm:text-lg text-slate-300 max-w-3xl mx-auto font-normal leading-relaxed">
            {landingPageContent.heroSubtitle}
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => handleSelectPlanAndRegister('annual')}
              className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 hover:opacity-95 text-white text-sm sm:text-base font-black rounded-2xl shadow-xl shadow-orange-600/30 transition flex items-center justify-center gap-3 transform hover:-translate-y-0.5"
            >
              <span>{landingPageContent.heroCtaText}</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <a
              href="#video-demo"
              className="w-full sm:w-auto px-6 py-4 bg-slate-900/90 hover:bg-slate-800 text-slate-200 text-sm font-bold rounded-2xl border border-slate-700/80 shadow-md transition flex items-center justify-center gap-2.5"
            >
              <Play className="w-4 h-4 text-orange-400 fill-orange-400" />
              <span>Ver Vídeo da Funcionalidade</span>
            </a>
          </div>

          {/* Trust Numbers */}
          <div className="mt-14 pt-10 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-center max-w-4xl mx-auto">
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white">100% PIX</div>
              <div className="text-xs text-slate-400 mt-1">Direto na sua conta bancária</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white">0% Taxa</div>
              <div className="text-xs text-slate-400 mt-1">Sem comissão por agendamento</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white">24h / 7 dias</div>
              <div className="text-xs text-slate-400 mt-1">Clientes agendando a qualquer hora</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black text-white">+50%</div>
              <div className="text-xs text-slate-400 mt-1">Aumento médio de faturamento</div>
            </div>
          </div>
        </div>
      </section>

      {/* Video Demonstration Section */}
      <section id="video-demo" className="py-20 bg-slate-900/50 border-y border-slate-800/80 relative">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-950/70 text-orange-400 border border-orange-800 mb-3">
              <Video className="w-3.5 h-3.5" />
              Demonstração ao Vivo
            </div>
            <h2 className="text-2xl sm:text-4xl font-black text-white">
              {landingPageContent.videoTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-3">
              {landingPageContent.videoDescription}
            </p>
          </div>

          {/* Video Container */}
          <div className="rounded-3xl overflow-hidden border-2 border-orange-500/30 bg-slate-950 shadow-2xl shadow-orange-950/50 aspect-video relative group">
            {landingPageContent.videoUrl.includes('youtube.com') ||
            landingPageContent.videoUrl.includes('youtu.be') ? (
              <iframe
                src={landingPageContent.videoUrl}
                title="Demonstração do Sistema para Barbearias"
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full relative flex items-center justify-center">
                <img
                  src={landingPageContent.videoPosterUrl}
                  alt="Demonstração em Vídeo"
                  className="w-full h-full object-cover opacity-70"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col items-center justify-center text-center p-6">
                  <div className="w-20 h-20 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-2xl transform group-hover:scale-110 transition cursor-pointer mb-4">
                    <Play className="w-8 h-8 ml-1 fill-white" />
                  </div>
                  <h3 className="text-lg font-bold text-white max-w-md">
                    Clique para assistir o fluxo do cliente ao barbeiro
                  </h3>
                  <span className="text-xs text-orange-400 font-semibold mt-1">
                    Duração: 2 minutos • Passo a passo completo
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Quick Steps after video */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-orange-600/20 text-orange-400 font-black text-base flex items-center justify-center shrink-0">
                1
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Cliente Escolhe Horário</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Acessa seu link ou escaneia o QR Code sem precisar baixar nenhum aplicativo pesado.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 font-black text-base flex items-center justify-center shrink-0">
                2
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Confirmação com PIX Direto</h4>
                <p className="text-xs text-slate-400 mt-1">
                  O cliente paga via PIX diretamente na sua chave bancária e envia o comprovante num clique.
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 font-black text-base flex items-center justify-center shrink-0">
                3
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">Agenda & Caixa Atualizados</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Você recebe notificação no WhatsApp, confere o faturamento e nunca mais perde um cliente.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Differentials / Features Section */}
      <section id="diferenciais" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-950/70 text-orange-400 border border-orange-800 mb-3">
            <Zap className="w-3.5 h-3.5" />
            Vantagens Exclusivas para Sua Barbearia
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white">
            Tudo o que você precisa para dominar o mercado
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-3">
            Desenvolvido sob medida para barbeiros autônomos e barbearias de alto padrão.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {landingPageContent.features.map((feat) => (
            <div
              key={feat.id}
              className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 hover:border-orange-500/50 hover:bg-slate-900 transition duration-300 group flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-2xl bg-orange-600/10 border border-orange-500/20 text-orange-400 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-orange-600 group-hover:text-white transition duration-300">
                  {feat.iconName === 'calendar' && <Calendar className="w-6 h-6" />}
                  {feat.iconName === 'dollar-sign' && <DollarSign className="w-6 h-6" />}
                  {feat.iconName === 'qr-code' && <QrCode className="w-6 h-6" />}
                  {feat.iconName === 'trending-up' && <TrendingUp className="w-6 h-6" />}
                  {!['calendar', 'dollar-sign', 'qr-code', 'trending-up'].includes(feat.iconName) && (
                    <Sparkles className="w-6 h-6" />
                  )}
                </div>
                <h3 className="text-base font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{feat.description}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center gap-1 text-[11px] font-bold text-orange-400">
                <span>Incluso em todos os planos</span>
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Visual Demonstration Gallery */}
      <section id="galeria" className="py-20 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-950/70 text-orange-400 border border-orange-800 mb-3">
              <Eye className="w-3.5 h-3.5" />
              Interface Elegante & Intuitiva
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Veja por dentro do sistema que vai transformar sua rotina
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Telas modernas, responsivas para celular e computador com foco em praticidade total.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {landingPageContent.galleryImages.map((img) => (
              <div
                key={img.id}
                className="group rounded-3xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-orange-500/60 transition shadow-xl"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-slate-950 relative">
                  <img
                    src={img.url}
                    alt={img.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                </div>
                <div className="p-5">
                  <h3 className="text-sm font-bold text-white group-hover:text-orange-400 transition">
                    {img.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">{img.caption}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive ROI Calculator */}
      <section id="calculadora" className="py-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-orange-950/70 via-slate-900 to-amber-950/70 rounded-3xl p-8 sm:p-12 border border-orange-700/40 shadow-2xl relative overflow-hidden">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 mb-3">
              <Percent className="w-3.5 h-3.5" />
              Simulador de Retorno do Investimento
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              Quanto sua barbearia vai ganhar a mais?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-2">
              Calcule quanto faturamento você recupera ao eliminar horários ociosos e faltas de clientes com agendamento online e pagamento antecipado no PIX.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6 bg-slate-950/60 p-6 rounded-2xl border border-slate-800">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                  <span>Atendimentos por dia:</span>
                  <span className="text-orange-400 font-black text-sm">{cutsPerDay} clientes/dia</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="35"
                  value={cutsPerDay}
                  onChange={(e) => setCutsPerDay(Number(e.target.value))}
                  className="w-full accent-orange-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-300 mb-2">
                  <span>Valor médio do serviço:</span>
                  <span className="text-orange-400 font-black text-sm">{formatCurrency(avgPrice)}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="150"
                  step="5"
                  value={avgPrice}
                  onChange={(e) => setAvgPrice(Number(e.target.value))}
                  className="w-full accent-orange-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>

              <div className="pt-2 text-[11px] text-slate-400">
                * Estimativa baseada em 25 dias úteis de trabalho no mês.
              </div>
            </div>

            <div className="bg-orange-900/30 p-6 sm:p-8 rounded-2xl border border-orange-500/40 text-center space-y-4">
              <span className="text-xs uppercase font-extrabold tracking-wider text-orange-300 block">
                Faturamento Adicional Estimado / Mês
              </span>
              <div className="text-3xl sm:text-4xl font-black text-white">
                +{formatCurrency(recoveredLossEstimate)}
              </div>
              <p className="text-xs text-orange-200 leading-relaxed">
                Com o plano anual de apenas{' '}
                <strong className="text-white">
                  {formatCurrency(
                    subscriptionPlans.find((p) => p.id === 'annual')?.price
                      ? subscriptionPlans.find((p) => p.id === 'annual')!.price / 12
                      : 29.9
                  )}
                  /mês
                </strong>
                , o sistema se paga com menos de <strong>1 corte no mês inteiro</strong>!
              </p>

              <button
                onClick={() => handleSelectPlanAndRegister('annual')}
                className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs rounded-xl shadow-lg transition"
              >
                Garantir Minha Vaga no Plano Anual
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing & Subscription Plans Presentation */}
      <section id="planos" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-950/70 text-orange-400 border border-orange-800 mb-3">
            <Award className="w-3.5 h-3.5" />
            Planos de Credenciamento Acessíveis
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Escolha o melhor plano para sua barbearia
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-3">
            Sem contratos de fidelidade abusivos. Liberação imediata após confirmação via PIX.
          </p>
        </div>

        {/* Subscription Plans Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {subscriptionPlans.map((plan) => {
            const isPopular = plan.isPopular;
            const isAnnual = plan.billingCycle === 'annual';
            const monthlyEquiv = isAnnual
              ? plan.price / 12
              : plan.billingCycle === 'semiannual'
              ? plan.price / 6
              : plan.price;

            return (
              <div
                key={plan.id}
                className={`rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 relative ${
                  isPopular
                    ? 'bg-gradient-to-b from-orange-900/40 via-slate-900 to-slate-900 border-2 border-orange-500 shadow-2xl shadow-orange-950/70 md:-translate-y-2'
                    : 'bg-slate-900/80 border border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Popular Tag */}
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 text-white text-[11px] font-black uppercase tracking-wider shadow-lg">
                    {plan.badgeText || 'Mais Escolhido pelos Barbeiros'}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-black text-white">{plan.name}</h3>
                      <p className="text-xs text-slate-400 mt-0.5">{plan.description}</p>
                    </div>
                    {plan.discountPercentage && (
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        -{plan.discountPercentage}% OFF
                      </span>
                    )}
                  </div>

                  {/* Pricing Number */}
                  <div className="my-6 p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xs font-bold text-slate-400">R$</span>
                      <span className="text-4xl font-black text-white">
                        {monthlyEquiv.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-xs font-bold text-slate-400">/mês</span>
                    </div>

                    {isAnnual ? (
                      <div className="text-[11px] text-orange-400 font-semibold mt-1">
                        Cobrado {formatCurrency(plan.price)} anualmente (Economia máxima)
                      </div>
                    ) : plan.billingCycle === 'semiannual' ? (
                      <div className="text-[11px] text-orange-400 font-semibold mt-1">
                        Cobrado {formatCurrency(plan.price)} a cada 6 meses
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 font-semibold mt-1">
                        Cobrado mensalmente via PIX
                      </div>
                    )}
                  </div>

                  {/* Features Checklist */}
                  <div className="space-y-3 pt-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 block mb-3">
                      O que está incluso:
                    </span>
                    {plan.features.map((feat, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <div className="w-4 h-4 rounded-full bg-orange-600/20 text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3" />
                        </div>
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8 mt-8 border-t border-slate-800">
                  <button
                    onClick={() => handleSelectPlanAndRegister(plan.id)}
                    className={`w-full py-4 rounded-2xl font-black text-xs uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-lg ${
                      isPopular
                        ? 'bg-orange-600 hover:bg-orange-500 text-white shadow-orange-600/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    <span>Começar com {plan.name}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <span className="block text-center text-[10px] text-slate-500 mt-2 font-medium">
                    Ativação com validação rápida via PIX
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Testimonials & Social Proof */}
      <section id="depoimentos" className="py-20 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-950/70 text-orange-400 border border-orange-800 mb-3">
              <Star className="w-3.5 h-3.5 fill-orange-400 text-orange-400" />
              Histórias Reais de Sucesso
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              O que dizem os barbeiros que usam nossa tecnologia
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-2">
              Mais de 98% de satisfação entre os profissionais credenciados.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {landingPageContent.testimonials.map((test) => (
              <div
                key={test.id}
                className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col justify-between shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex text-amber-400 gap-1">
                      {Array.from({ length: test.rating || 5 }).map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    {test.revenueGrowth && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {test.revenueGrowth}
                      </span>
                    )}
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 italic leading-relaxed mb-6">
                    "{test.comment}"
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-slate-800/80">
                  <img
                    src={test.avatarUrl}
                    alt={test.name}
                    className="w-11 h-11 rounded-full object-cover border-2 border-orange-500 shrink-0"
                  />
                  <div>
                    <h4 className="font-bold text-xs text-white">{test.name}</h4>
                    <span className="text-[11px] text-slate-400 block">
                      {test.shopName} • {test.city}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions (FAQ) */}
      <section className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-950/70 text-orange-400 border border-orange-800 mb-3">
            <HelpCircle className="w-3.5 h-3.5" />
            Tire Suas Dúvidas
          </div>
          <h2 className="text-3xl font-black text-white">
            Perguntas Frequentes sobre o Credenciamento
          </h2>
        </div>

        <div className="space-y-3">
          {landingPageContent.faqs.map((faq) => {
            const isOpen = openFaqId === faq.id;
            return (
              <div
                key={faq.id}
                className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaqId(isOpen ? null : faq.id)}
                  className="w-full p-5 text-left font-bold text-xs sm:text-sm text-white flex items-center justify-between gap-4 hover:bg-slate-800/50 transition"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-orange-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-slate-400 leading-relaxed border-t border-slate-800/60 pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Final Call to Action (CTA) Section */}
      <section className="py-20 bg-gradient-to-b from-slate-950 via-orange-950/40 to-slate-950 border-t border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 rounded-3xl bg-orange-600 text-white flex items-center justify-center mx-auto mb-6 shadow-xl shadow-orange-600/30">
            <Scissors className="w-8 h-8" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            {landingPageContent.ctaTitle}
          </h2>

          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-xl mx-auto">
            {landingPageContent.ctaSubtitle}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => handleSelectPlanAndRegister('annual')}
              className="w-full sm:w-auto px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white text-sm font-black rounded-2xl shadow-xl shadow-orange-600/30 transition flex items-center justify-center gap-2"
            >
              <span>{landingPageContent.ctaButtonText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() =>
                openWhatsApp(
                  platformSettings.supportPhone,
                  'Olá! Gostaria de tirar dúvidas sobre o credenciamento da minha barbearia no sistema.'
                )
              }
              className="w-full sm:w-auto px-6 py-4 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-bold rounded-2xl border border-slate-700 transition"
            >
              Falar com Consultor no WhatsApp
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-slate-950 border-t border-slate-900 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-orange-500" />
            <span className="font-bold text-slate-300">
              {platformSettings.platformName} © {new Date().getFullYear()}
            </span>
            <span>• Todos os direitos reservados.</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setCurrentView('client_booking')}
              className="hover:text-orange-400 transition"
            >
              Agenda do Cliente
            </button>
            <button
              onClick={() => handleOpenLogin('barber')}
              className="hover:text-orange-400 transition flex items-center gap-1.5"
            >
              <KeyRound className="w-3 h-3 text-orange-400" />
              <span>Login Barbeiro</span>
            </button>
            <button
              onClick={() => handleOpenLogin('super_admin')}
              className="hover:text-orange-400 transition flex items-center gap-1.5"
            >
              <Shield className="w-3 h-3 text-orange-400" />
              <span>Login Admin Geral</span>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
