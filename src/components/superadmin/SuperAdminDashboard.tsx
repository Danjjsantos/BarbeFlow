import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Barbershop, SubscriptionStatus } from '../../types';
import {
  formatCurrency,
  formatPhone,
  formatDateBr,
  openWhatsApp,
} from '../../utils/formatters';
import { PlatformSettingsModal } from './PlatformSettingsModal';
import { SuperAdminPlansTab } from './SuperAdminPlansTab';
import { SuperAdminLandingEditorTab } from './SuperAdminLandingEditorTab';
import { ChangePasswordModal } from '../common/ChangePasswordModal';
import { AdminProfileModal } from './AdminProfileModal';
import { SupabaseStatusModal } from '../common/SupabaseStatusModal';
import confetti from 'canvas-confetti';
import {
  Shield,
  Building2,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Settings,
  DollarSign,
  Phone,
  MessageSquare,
  Search,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Tag,
  Palette,
  Eye,
  Store,
  LayoutDashboard,
  UserCheck,
  Globe,
  Sliders,
  Menu,
  KeyRound,
  Lock,
  LogOut,
  Database,
  Trash2,
  AlertTriangle,
  Camera,
  UserCog,
  Scissors,
} from 'lucide-react';

export const SuperAdminDashboard: React.FC = () => {
  const {
    barbershops,
    approveBarbershopSubscription,
    rejectBarbershopSubscription,
    updateBarbershopSubscriptionStatus,
    deleteBarbershop,
    platformSettings,
    setActiveBarbershopId,
    setCurrentView,
    currentUser,
    switchRole,
    logoutUser,
    isSupabaseActive,
    getBarbershopPublicUrl,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'shops' | 'plans' | 'landing_editor'>(() => {
    const saved = localStorage.getItem('barberhub_admin_tab_v2');
    if (saved && ['shops', 'plans', 'landing_editor'].includes(saved)) {
      return saved as any;
    }
    return 'shops';
  });

  React.useEffect(() => {
    localStorage.setItem('barberhub_admin_tab_v2', activeTab);
  }, [activeTab]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [shopToDelete, setShopToDelete] = useState<Barbershop | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter pending barbershops that need approval
  const pendingBarbershops = barbershops.filter(
    (shop) => shop.subscriptionStatus === 'pending'
  );

  const activeBarbershops = barbershops.filter(
    (shop) => shop.subscriptionStatus === 'active'
  );

  // Platform recurring monthly revenue from active barbers
  const totalPlatformMonthlyRevenue = activeBarbershops.reduce(
    (sum, shop) => sum + (shop.subscriptionMonthlyFee || platformSettings.monthlyFee),
    0
  );

  // Filtered all barbers list
  const filteredBarbershops = barbershops.filter((shop) => {
    const matchesSearch =
      shop.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      shop.city.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === 'all') return true;
    return shop.subscriptionStatus === statusFilter;
  });

  const handleApprove = (shop: Barbershop) => {
    approveBarbershopSubscription(shop.id, 30);
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.5 },
    });
  };

  const handleReject = (shop: Barbershop) => {
    if (window.confirm(`Recusar comprovante de ${shop.name}? O barbeiro será notificado para reenviar.`)) {
      rejectBarbershopSubscription(shop.id);
    }
  };

  // Role Access Guard: Only super_admin role can view this dashboard
  if (currentUser.role !== 'super_admin') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Acesso Restrito ao Administrador Geral</h3>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            Você está conectado como <strong className="text-white">{currentUser.name || currentUser.email || 'Usuário'}</strong>.
            Esta área é de gestão exclusiva da administração da plataforma.
          </p>
          <div className="flex flex-col gap-3">
            {currentUser.role === 'barber' ? (
              <button
                onClick={() => setCurrentView('barber_dashboard')}
                className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
              >
                <Scissors className="w-5 h-5" />
                Ir para o Meu Painel de Barbeiro
              </button>
            ) : (
              <button
                onClick={() => setCurrentView('landing_page')}
                className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2"
              >
                Ir para a Página Inicial
              </button>
            )}
            <button
              onClick={logoutUser}
              className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair da Conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-100 dark:bg-slate-950 flex flex-col lg:flex-row" id="super-admin-dashboard">
      {/* Mobile Toggle Bar for Left Sidebar */}
      <div className="lg:hidden bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between text-white">
        <div 
          onClick={() => setIsProfileModalOpen(true)}
          className="flex items-center gap-2.5 cursor-pointer group"
          title="Ver dados do perfil de administrador"
        >
          <div className="w-8 h-8 rounded-xl bg-slate-950 border border-amber-500/80 shadow-md shadow-amber-500/20 flex items-center justify-center font-bold shrink-0">
            <Scissors className="w-4 h-4 text-amber-400 -rotate-45" />
          </div>
          <div>
            <span className="font-extrabold text-sm text-white block leading-tight group-hover:text-amber-400 transition">
              Painel Administrativo
            </span>
            <span className="text-[11px] text-amber-400 font-medium">
              {currentUser.name}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
        >
          {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* LEFT SIDEBAR NAVIGATION */}
      <aside
        className={`w-full lg:w-72 bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col shrink-0 transition-all duration-200 z-30 ${
          isMobileSidebarOpen ? 'block' : 'hidden lg:flex'
        }`}
      >
        {/* Sidebar Header / Brand Profile */}
        <div className="p-5 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div 
              onClick={() => setIsProfileModalOpen(true)}
              className="relative group cursor-pointer shrink-0"
              title="Clique para ver seu perfil de administrador"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border-2 border-amber-500/80 shadow-lg shadow-amber-500/20 flex items-center justify-center font-black group-hover:scale-105 transition">
                <Scissors className="w-6 h-6 text-amber-400 -rotate-45" />
              </div>
            </div>

            <div className="overflow-hidden flex-1">
              <div className="flex items-center gap-1.5">
                <h2 
                  onClick={() => setIsProfileModalOpen(true)}
                  className="font-black text-sm text-white truncate cursor-pointer hover:text-amber-400 transition"
                  title="Clique para editar seu perfil"
                >
                  {currentUser.name}
                </h2>
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              </div>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                Super Administrador
              </span>
              <button
                onClick={() => setIsProfileModalOpen(true)}
                className="text-[10px] text-slate-400 hover:text-amber-300 font-medium flex items-center gap-1 mt-0.5 transition"
              >
                <span>Dados do perfil</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Navigation Items */}
        <div className="flex-1 p-4 space-y-6 overflow-y-auto">
          {/* Group 1: Gestão Geral */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Gestão Geral
            </div>
            <div className="space-y-1">
              <button
                onClick={() => {
                  setActiveTab('shops');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-extrabold transition text-left ${
                  activeTab === 'shops'
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/25'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 shrink-0" />
                  <span>Barbearias & Aprovações</span>
                </div>
                {pendingBarbershops.length > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                      activeTab === 'shops'
                        ? 'bg-white text-orange-600'
                        : 'bg-amber-500 text-slate-950'
                    }`}
                  >
                    {pendingBarbershops.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => {
                  setIsProfileModalOpen(true);
                  setIsMobileSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition text-left"
              >
                <UserCog className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Meu Perfil de Administrador</span>
              </button>

              <button
                onClick={() => {
                  setIsSettingsOpen(true);
                  setIsMobileSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition text-left"
              >
                <Sliders className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Configurações Gerais</span>
              </button>

              <button
                onClick={() => {
                  setIsSupabaseModalOpen(true);
                  setIsMobileSidebarOpen(false);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition text-left"
              >
                <div className="flex items-center gap-3">
                  <Database className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Banco de Dados Supabase</span>
                </div>
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isSupabaseActive
                      ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse'
                      : 'bg-amber-400'
                  }`}
                />
              </button>

              <button
                onClick={() => {
                  setIsPasswordModalOpen(true);
                  setIsMobileSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition text-left"
              >
                <KeyRound className="w-4 h-4 text-orange-400 shrink-0" />
                <span>Alterar Minha Senha</span>
              </button>
            </div>
          </div>

          {/* Group 2: Apresentação e Planos */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Apresentação e Planos
            </div>
            <div className="space-y-1">
              <button
                onClick={() => {
                  setActiveTab('plans');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-extrabold transition text-left ${
                  activeTab === 'plans'
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/25'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Tag className="w-4 h-4 shrink-0" />
                <span>Planos de Assinatura</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('landing_editor');
                  setIsMobileSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl text-xs font-extrabold transition text-left ${
                  activeTab === 'landing_editor'
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/25'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Palette className="w-4 h-4 shrink-0" />
                <span>Personalizar Apresentação</span>
              </button>

              <button
                onClick={() => {
                  setCurrentView('landing_page');
                  setIsMobileSidebarOpen(false);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-orange-300 hover:bg-orange-950/40 hover:text-orange-200 transition text-left"
              >
                <div className="flex items-center gap-3">
                  <Eye className="w-4 h-4 text-orange-400 shrink-0" />
                  <span>Ver Página de Apresentação</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 opacity-70" />
              </button>
            </div>
          </div>

          {/* Group 3: Sessão & Logout */}
          <div>
            <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Sessão & Acesso
            </div>
            <div className="space-y-1">
              <button
                onClick={() => {
                  logoutUser();
                  setIsMobileSidebarOpen(false);
                }}
                className="w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold text-rose-300 bg-rose-950/40 hover:bg-rose-900/60 hover:text-white border border-rose-800/40 transition text-left group"
              >
                <div className="flex items-center gap-3">
                  <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Sair do Painel</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-rose-400/60 group-hover:translate-x-0.5 transition" />
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar Footer Status Card */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/60">
          <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Status do Sistema
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Operacional
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              {barbershops.length} barbearias cadastradas
            </div>
          </div>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-8 overflow-x-hidden">
        {/* Top Header Banner for Current Section */}
        <div className="bg-gradient-to-r from-orange-950 via-slate-900 to-slate-900 rounded-3xl p-6 sm:p-8 border border-orange-800/40 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 mb-2">
              <Shield className="w-3.5 h-3.5" />
              {activeTab === 'shops' && 'Gestão Geral • Barbearias & Aprovações'}
              {activeTab === 'plans' && 'Apresentação & Planos • Planos de Assinatura'}
              {activeTab === 'landing_editor' && 'Apresentação & Planos • Editor de Captação'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              {activeTab === 'shops' && 'Gestão Geral & Barbearias Credenciadas'}
              {activeTab === 'plans' && 'Configuração dos Planos de Assinatura'}
              {activeTab === 'landing_editor' && 'Personalização da Página de Apresentação'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
              {activeTab === 'shops' &&
                'Aprove cadastros de barbearias, valide comprovantes PIX e monitore a receita da plataforma.'}
              {activeTab === 'plans' &&
                'Edite os valores dos planos Mensal, Semestral e Anual cobrados dos proprietários de barbearias.'}
              {activeTab === 'landing_editor' &&
                'Edite títulos, vantagens, textos e destaques da página pública de captação de novas barbearias.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
            <button
              onClick={() => setCurrentView('landing_page')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 border border-slate-700"
            >
              <Eye className="w-4 h-4 text-orange-400" />
              Ver Apresentação
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Configurações Gerais
            </button>

            <button
              onClick={logoutUser}
              className="px-4 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 hover:text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 border border-rose-500/30"
              title="Sair do painel e voltar para a página de apresentação"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
              Sair
            </button>
          </div>
        </div>

        {/* Tab 2: Subscription Plans Manager */}
        {activeTab === 'plans' && <SuperAdminPlansTab />}

        {/* Tab 3: Landing Page Customizer */}
        {activeTab === 'landing_editor' && <SuperAdminLandingEditorTab />}

        {/* Tab 1: Barbershops & Approvals Queue */}
        {activeTab === 'shops' && (
          <div className="space-y-8 animate-in fade-in">
            {/* KPI Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Pending Approvals (Urgent) */}
              <div
                className={`p-5 rounded-3xl border shadow-xs transition ${
                  pendingBarbershops.length > 0
                    ? 'bg-amber-500/10 border-amber-500/40 text-amber-900 dark:text-amber-200 ring-2 ring-amber-500/20'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Aprovações Pendentes
                  </span>
                  <span className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                    {pendingBarbershops.length}
                  </span>
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white">
                  {pendingBarbershops.length}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {pendingBarbershops.length > 0
                    ? 'Aguardando validação do PIX'
                    : 'Nenhuma pendência'}
                </p>
              </div>

              {/* Active Barbershops */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-emerald-500" />
                    Barbearias Ativas
                  </span>
                  <span className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs">
                    {activeBarbershops.length}
                  </span>
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white">
                  {activeBarbershops.length}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Credenciadas e recebendo agendamentos
                </p>
              </div>

              {/* Recurring Monthly Revenue */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-orange-500" />
                    Receita Recorrente Est.
                  </span>
                  <span className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center font-bold text-xs">
                    <TrendingUp className="w-4 h-4" />
                  </span>
                </div>
                <div className="text-3xl font-black text-orange-600 dark:text-orange-400">
                  {formatCurrency(totalPlatformMonthlyRevenue)}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Total arrecadado em assinaturas
                </p>
              </div>

              {/* Total Barbershops */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    Total Cadastradas
                  </span>
                  <span className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs">
                    {barbershops.length}
                  </span>
                </div>
                <div className="text-3xl font-black text-slate-900 dark:text-white">
                  {barbershops.length}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Todas as contas registradas
                </p>
              </div>
            </div>

            {/* Pending Approval Section (if any) */}
            {pendingBarbershops.length > 0 && (
              <div className="bg-amber-500/5 dark:bg-amber-950/20 border-2 border-amber-500/30 rounded-3xl p-6 sm:p-8 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-600 flex items-center justify-center font-bold">
                      <Clock className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">
                        Fila de Aprovação de Mensalidade / PIX ({pendingBarbershops.length})
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Valide o comprovante de pagamento via PIX para liberar o acesso da barbearia aos clientes.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  {pendingBarbershops.map((shop) => (
                    <div
                      key={shop.id}
                      className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-md flex flex-col justify-between space-y-4"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                              {shop.subscriptionPlanId === 'annual'
                                ? 'Plano Anual'
                                : shop.subscriptionPlanId === 'semiannual'
                                ? 'Plano Semestral'
                                : shop.subscriptionPlanId === 'trial'
                                ? 'Teste Grátis (30d)'
                                : 'Plano Mensal'}
                            </span>
                            <h4 className="text-lg font-black text-slate-900 dark:text-white">
                              {shop.name}
                            </h4>
                            <p className="text-xs text-slate-500">
                              Proprietário: <strong>{shop.ownerName}</strong> ({shop.city})
                            </p>
                          </div>
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                            Aprovação Pendente
                          </span>
                        </div>

                        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1.5 border border-slate-200 dark:border-slate-700">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Valor da Taxa:</span>
                            <span className="font-bold text-orange-600 dark:text-orange-400">
                              {formatCurrency(shop.subscriptionMonthlyFee || platformSettings.monthlyFee)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Chave PIX do Barbeiro:</span>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                              {shop.pixKey} ({shop.pixKeyType.toUpperCase()})
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Comprovante / Nota:</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200 max-w-[200px] truncate text-right">
                              {shop.subscriptionProofUrl || 'Pagamento via PIX'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                        <button
                          onClick={() =>
                            openWhatsApp(
                              shop.ownerPhone,
                              `Olá ${shop.ownerName}, confirmamos o recebimento do PIX para o credenciamento da sua ${shop.name} no BarberHub! Sua conta já está liberada.`
                            )
                          }
                          className="p-2.5 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 rounded-xl transition text-xs font-bold flex items-center gap-1.5"
                          title="Falar no WhatsApp com o Barbeiro"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          WhatsApp
                        </button>

                        <button
                          onClick={() => handleReject(shop)}
                          className="p-2.5 bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 text-rose-800 dark:text-rose-300 rounded-xl transition text-xs font-bold flex items-center gap-1"
                          title="Recusar comprovante"
                        >
                          <X className="w-3.5 h-3.5" />
                          Recusar
                        </button>

                        <button
                          onClick={() => setShopToDelete(shop)}
                          className="p-2.5 bg-slate-100 hover:bg-rose-100 dark:bg-slate-800 dark:hover:bg-rose-950/50 text-slate-600 hover:text-rose-700 dark:text-slate-400 dark:hover:text-rose-300 rounded-xl transition text-xs font-bold flex items-center gap-1"
                          title="Excluir cadastro da barbearia"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => handleApprove(shop)}
                          className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-4 h-4" />
                          Aprovar Cadastro & Ativar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Barbershops Management Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Todas as Barbearias Cadastradas
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Pesquise, altere o status de assinatura e gerencie os parceiros da plataforma.
                  </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Buscar barbearia, dono, cidade..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500 w-56 sm:w-64"
                    />
                  </div>

                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="all">Todos os Status</option>
                    <option value="active">Ativas</option>
                    <option value="pending">Pendentes</option>
                    <option value="overdue">Vencidas</option>
                    <option value="suspended">Suspensas</option>
                  </select>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                      <th className="pb-3 font-semibold">Barbearia / Dono</th>
                      <th className="pb-3 font-semibold">Plano & Taxa</th>
                      <th className="pb-3 font-semibold">Chave PIX Recebimento</th>
                      <th className="pb-3 font-semibold">Status</th>
                      <th className="pb-3 font-semibold">Validade</th>
                      <th className="pb-3 font-semibold text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {filteredBarbershops.map((shop) => {
                      const isPending = shop.subscriptionStatus === 'pending';
                      const isActive = shop.subscriptionStatus === 'active';
                      const isOverdue = shop.subscriptionStatus === 'overdue';

                      return (
                        <tr key={shop.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={shop.logoUrl}
                                alt={shop.name}
                                className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                              />
                              <div>
                                <span className="font-bold text-sm text-slate-900 dark:text-white block">
                                  {shop.name}
                                </span>
                                <span className="text-[11px] text-slate-500 block">
                                  {shop.ownerName} • {formatPhone(shop.ownerPhone)}
                                </span>
                                <code className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded-md font-mono mt-0.5 inline-block">
                                  ?view={shop.slug}
                                </code>
                              </div>
                            </div>
                          </td>

                          <td className="py-4">
                            <span className="font-black text-orange-600 dark:text-orange-400 block">
                              {formatCurrency(shop.subscriptionMonthlyFee || platformSettings.monthlyFee)}
                            </span>
                            <span className="text-[11px] text-slate-500">
                              {shop.subscriptionPlanId === 'annual'
                                ? 'Plano Anual'
                                : shop.subscriptionPlanId === 'semiannual'
                                ? 'Plano Semestral'
                                : shop.subscriptionPlanId === 'trial'
                                ? 'Teste Grátis (30d)'
                                : 'Plano Mensal'}
                            </span>
                          </td>

                          <td className="py-4 font-mono text-[11px]">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {shop.pixKey}
                            </span>
                            <span className="text-[10px] text-slate-400 block uppercase">
                              {shop.pixKeyType} ({shop.pixReceiverName})
                            </span>
                          </td>

                          <td className="py-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                  : isPending
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                  : isOverdue
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                                  : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                              }`}
                            >
                              {isActive && <CheckCircle2 className="w-3 h-3" />}
                              {isPending && <Clock className="w-3 h-3" />}
                              {isOverdue && <AlertCircle className="w-3 h-3" />}
                              {shop.subscriptionStatus === 'active' && 'Ativa'}
                              {shop.subscriptionStatus === 'pending' && 'Pendente PIX'}
                              {shop.subscriptionStatus === 'overdue' && 'Vencida'}
                              {shop.subscriptionStatus === 'suspended' && 'Suspensa'}
                            </span>
                          </td>

                          <td className="py-4 text-slate-600 dark:text-slate-400">
                            {formatDateBr(shop.subscriptionValidUntil)}
                          </td>

                          <td className="py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isPending ? (
                                <button
                                  onClick={() => handleApprove(shop)}
                                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-lg text-xs transition"
                                >
                                  Aprovar
                                </button>
                              ) : (
                                <select
                                  value={shop.subscriptionStatus}
                                  onChange={(e) =>
                                    updateBarbershopSubscriptionStatus(
                                      shop.id,
                                      e.target.value as SubscriptionStatus
                                    )
                                  }
                                  className="px-2 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-semibold"
                                >
                                  <option value="active">Ativa</option>
                                  <option value="overdue">Vencida</option>
                                  <option value="suspended">Suspensa</option>
                                  <option value="pending">Pendente</option>
                                </select>
                              )}

                              <button
                                onClick={() => {
                                  setActiveBarbershopId(shop.id);
                                  setCurrentView('client_booking');
                                }}
                                className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
                                title="Abrir Agenda Pública da Barbearia"
                                aria-label={`Abrir agenda pública de ${shop.name}`}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => setShopToDelete(shop)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                                title="Excluir barbearia da plataforma"
                                aria-label={`Excluir barbearia ${shop.name}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Delete Barbershop Confirmation Modal */}
      {shopToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
            id="delete-barbershop-modal"
          >
            <div className="p-6 bg-rose-500/10 dark:bg-rose-950/30 border-b border-rose-200 dark:border-rose-900/50 flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500 text-white flex items-center justify-center font-bold shadow-lg shadow-rose-500/25 shrink-0">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Ação do Administrador Geral
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white leading-tight">
                  Excluir Barbearia Credenciada
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Confirme para remover permanentemente a conta
                </p>
              </div>
              <button
                onClick={() => setShopToDelete(null)}
                disabled={isDeleting}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                <div className="flex items-center gap-3">
                  {shopToDelete.logoUrl ? (
                    <img
                      src={shopToDelete.logoUrl}
                      alt={shopToDelete.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-300 dark:border-slate-600 shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-slate-700 text-white flex items-center justify-center font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                      {shopToDelete.name}
                    </h4>
                    <p className="text-xs text-slate-500 truncate">
                      Proprietário: {shopToDelete.ownerName} • {shopToDelete.city}
                    </p>
                  </div>
                </div>
                <div className="text-[11px] text-slate-500 font-mono pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-between">
                  <span>Chave PIX: {shopToDelete.pixKey}</span>
                  <span className="uppercase font-bold text-slate-600 dark:text-slate-300">
                    {shopToDelete.subscriptionStatus}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/20 rounded-xl border border-rose-200 dark:border-rose-900/40 text-xs text-rose-900 dark:text-rose-200 space-y-1.5">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  Consequências da exclusão:
                </p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-800 dark:text-rose-300 pl-1">
                  <li>Todos os serviços e agendamentos serão excluídos;</li>
                  <li>O acesso do barbeiro à plataforma será revogado;</li>
                  <li>O link público e QR Code da barbearia deixarão de funcionar.</li>
                </ul>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShopToDelete(null)}
                  disabled={isDeleting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      deleteBarbershop(shopToDelete.id);
                      setShopToDelete(null);
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isDeleting}
                  className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-600/30 transition flex items-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Excluindo...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Sim, Excluir Barbearia</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Platform Settings Modal */}
      <PlatformSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Admin Password Change Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        userId={currentUser.id}
        userName={currentUser.name}
      />

      {/* Admin Profile & Photo Modal */}
      <AdminProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />

      {/* Supabase Database Connection & Sync Modal */}
      <SupabaseStatusModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </div>
  );
};
