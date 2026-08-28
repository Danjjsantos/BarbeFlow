import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { BarberScheduleView } from './BarberScheduleView';
import { BarberFinancialView } from './BarberFinancialView';
import { BarberServicesView } from './BarberServicesView';
import { BarberSettingsView } from './BarberSettingsView';
import { ChangePasswordModal } from '../common/ChangePasswordModal';
import { QrCodeModal } from '../common/QrCodeModal';
import { NotificationBanner } from '../common/NotificationBanner';
import {
  Calendar,
  DollarSign,
  Scissors,
  Settings,
  X,
  ExternalLink,
  ChevronRight,
  KeyRound,
  LogOut,
  QrCode,
  Share2,
  CheckCircle2,
  Menu,
  Eye,
  BellRing,
} from 'lucide-react';

export const BarberDashboard: React.FC = () => {
  const {
    currentUser,
    barbershops,
    getBarbershopById,
    logoutUser,
    appointments,
    services,
    activeBarberTab,
    setActiveBarberTab,
    isBarberDrawerOpen,
    setIsBarberDrawerOpen,
    newAppointmentsCount,
    markAppointmentsAsSeen,
    setActiveBarbershopId,
    setCurrentView,
    getBarbershopPublicUrl,
  } = useApp();

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Automatically clear notification when actively viewing the schedule
  useEffect(() => {
    if (activeBarberTab === 'schedule') {
      markAppointmentsAsSeen();
    }
  }, [activeBarberTab]);

  // Barber shop for current user
  const userShop = currentUser.barbershopId
    ? getBarbershopById(currentUser.barbershopId)
    : barbershops[0];

  if (!userShop) {
    return (
      <div className="max-w-4xl mx-auto p-12 text-center text-slate-500">
        Nenhuma barbearia vinculada a este usuário.
      </div>
    );
  }

  const shopServicesCount = services.filter(
    (s) => s.barbershopId === userShop.id
  ).length;

  const publicLink = getBarbershopPublicUrl(userShop.slug);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  const navMenuItems = [
    {
      id: 'schedule' as const,
      label: 'Agenda e Atendimentos',
      description: 'Marcações, horários e fila do dia',
      icon: Calendar,
      badge: newAppointmentsCount > 0 ? `${newAppointmentsCount} novo(s)` : undefined,
      badgeColor: 'bg-amber-500 text-slate-950 font-black',
    },
    {
      id: 'financial' as const,
      label: 'Financeiro',
      description: 'Faturamento, extrato e métricas PIX',
      icon: DollarSign,
      badge: 'Rendimentos',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    },
    {
      id: 'services' as const,
      label: 'Meus Serviços',
      description: 'Catálogo de cortes, barbas e combos',
      icon: Scissors,
      badge: `${shopServicesCount} serviços`,
      badgeColor: 'bg-slate-800 text-slate-400',
    },
    {
      id: 'settings' as const,
      label: 'Horário e Configurações',
      description: 'Expediente, PIX, Senha e perfil',
      icon: Settings,
      badge: 'Config',
      badgeColor: 'bg-slate-800 text-slate-400',
    },
  ];

  return (
    <div
      className="min-h-[calc(100vh-4.75rem)] bg-slate-100 dark:bg-slate-950 flex flex-col relative"
      id="barber-dashboard-container"
    >
      {/* SLIDE-OUT LATERAL DRAWER MENU (TRIGGERED FROM THE SUBTLE MENU ICON) */}
      {isBarberDrawerOpen && (
        <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity"
            onClick={() => setIsBarberDrawerOpen(false)}
          />

          {/* Drawer Sidebar */}
          <aside
            className="relative w-full max-w-xs sm:w-80 bg-slate-900 text-slate-200 flex flex-col h-full shadow-2xl border-r border-slate-800 z-10 animate-in slide-in-from-left duration-250"
            id="barber-lateral-menu"
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
              <div className="flex items-center gap-3 overflow-hidden">
                <img
                  src={
                    userShop.logoUrl ||
                    'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=300'
                  }
                  alt={userShop.name}
                  className="w-10 h-10 rounded-xl object-cover border-2 border-amber-500/60 shadow-md shrink-0 bg-slate-800"
                />
                <div className="overflow-hidden">
                  <h2 className="font-black text-sm text-white truncate">
                    {userShop.name}
                  </h2>
                  <p className="text-[11px] text-amber-400 font-medium truncate">
                    Menu de Opções
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsBarberDrawerOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                aria-label="Fechar menu lateral"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Menu Navigation Items */}
            <div className="flex-1 p-4 space-y-6 overflow-y-auto">
              <div>
                <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Gerenciamento da Barbearia
                </div>
                <div className="space-y-1.5">
                  {navMenuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeBarberTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveBarberTab(item.id);
                          setIsBarberDrawerOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-extrabold transition text-left group ${
                          isActive
                            ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-lg shadow-amber-500/20'
                            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Icon
                            className={`w-4 h-4 shrink-0 transition-transform ${
                              isActive
                                ? 'text-slate-950 scale-110'
                                : 'text-amber-400 group-hover:scale-110'
                            }`}
                          />
                          <div>
                            <span className="block leading-tight">{item.label}</span>
                            <span
                              className={`text-[10px] font-medium block leading-tight ${
                                isActive ? 'text-slate-900/80' : 'text-slate-400'
                              }`}
                            >
                              {item.description}
                            </span>
                          </div>
                        </div>

                        {item.badge && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-lg shrink-0 ${
                              isActive
                                ? 'bg-slate-950/20 text-slate-950 font-black'
                                : item.badgeColor
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions & Security */}
              <div>
                <div className="px-3 mb-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Ferramentas & Segurança
                </div>
                <div className="space-y-1">
                  {/* QR Code Action */}
                  <button
                    onClick={() => {
                      setIsQrModalOpen(true);
                      setIsBarberDrawerOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      <QrCode className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>QR Code da Barbearia</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  {/* Alterar Senha */}
                  <button
                    onClick={() => {
                      setActiveBarberTab('settings');
                      setIsPasswordModalOpen(true);
                      setIsBarberDrawerOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>Alterar Senha de Acesso</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  {/* Copiar Link de Agendamento */}
                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Share2 className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{linkCopied ? 'Link Copiado!' : 'Copiar Link de Agendamento'}</span>
                    </div>
                    {linkCopied ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </button>

                  {/* Ver Página Pública */}
                  <button
                    onClick={() => {
                      setActiveBarbershopId(userShop.id);
                      setCurrentView('client_booking');
                      setIsBarberDrawerOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition text-left cursor-pointer"
                    title="Ver como seus clientes visualizam horários e vagas na agenda pública"
                  >
                    <div className="flex items-center gap-3">
                      <ExternalLink className="w-4 h-4 text-sky-400 shrink-0" />
                      <span>Ver Agenda Pública</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>
                </div>
              </div>
            </div>

            {/* Sidebar Drawer Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/70 space-y-2">
              <div className="px-2 text-[11px] text-slate-400 truncate">
                Conectado como <span className="text-white font-bold">{currentUser.name}</span>
              </div>
              <button
                onClick={logoutUser}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sair do Painel</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* TOP HEADER BAR FOR BARBER DASHBOARD */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-xl border-b border-slate-800 shadow-xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
          {/* Left: Brand Logo & Barber Shop Details */}
          <div className="flex items-center gap-2.5 sm:gap-3 overflow-hidden min-w-0">
            <button
              onClick={() => setIsBarberDrawerOpen(true)}
              className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/50 text-amber-400 hover:text-white transition shrink-0 active:scale-95 flex items-center justify-center cursor-pointer"
              title="Abrir menu lateral completo"
              aria-label="Abrir Menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div
              className="flex items-center gap-2.5 cursor-pointer group min-w-0"
              onClick={() => setActiveBarberTab('schedule')}
              title="Painel BarberClock - Clique para voltar à Agenda"
            >
              <div className="relative shrink-0">
                <img
                  src={userShop.logoUrl || '/barber_clock_logo.jpg'}
                  alt={userShop.name}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border-2 border-amber-500/80 shadow-md shadow-amber-500/20 group-hover:scale-105 transition shrink-0 bg-slate-900"
                />
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500 border-2 border-slate-950"></span>
              </div>
              <div className="min-w-0 overflow-hidden flex flex-col justify-center">
                <div className="flex items-center gap-1.5 min-w-0">
                  <h1 className="font-black text-xs sm:text-base text-white tracking-tight leading-tight truncate">
                    {userShop.name}
                  </h1>
                  <span className="text-[8px] sm:text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
                    Ativa
                  </span>
                </div>
                <p className="text-[10px] text-amber-400/90 font-medium truncate hidden sm:block">
                  Painel de Gestão
                </p>
              </div>
            </div>
          </div>

          {/* Center: Navigation Buttons with Justified Text */}
          <nav className="hidden md:flex items-center gap-1.5">
            {[
              {
                id: 'schedule' as const,
                label: 'Agenda',
                icon: Calendar,
                badge: newAppointmentsCount > 0 ? `${newAppointmentsCount}` : undefined,
              },
              { id: 'financial' as const, label: 'Financeiro', icon: DollarSign },
              { id: 'services' as const, label: 'Serviços', icon: Scissors },
              { id: 'settings' as const, label: 'Configurações', icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeBarberTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveBarberTab(item.id);
                    if (item.id === 'schedule') {
                      markAppointmentsAsSeen();
                    }
                  }}
                  className={`relative px-3.5 py-2 rounded-xl text-center flex items-center justify-center gap-1.5 font-bold text-xs transition shadow-xs whitespace-nowrap min-w-[90px] ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                      : 'bg-slate-900/90 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                  <span className="w-full text-center">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.2 rounded-full shrink-0 ${
                        isActive ? 'bg-slate-950 text-amber-400' : 'bg-amber-500 text-slate-950'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Buttons with Justified Text */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={() => {
                setActiveBarbershopId(userShop.id);
                setCurrentView('client_booking');
              }}
              className="px-3 py-2 rounded-xl text-center flex items-center justify-center gap-1.5 font-bold text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 text-slate-200 hover:text-white transition shadow-xs"
              title="Ver página de agendamento do cliente"
            >
              <Eye className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="w-full text-center hidden sm:inline">Ver Agenda Pública</span>
            </button>

            <button
              onClick={() => setIsQrModalOpen(true)}
              className="p-2 sm:px-3 sm:py-2 rounded-xl text-center flex items-center justify-center gap-1.5 font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 transition shadow-md shadow-amber-500/20 active:scale-95"
              title="QR Code de Balcão"
            >
              <QrCode className="w-4 h-4 text-slate-950 shrink-0" />
              <span className="w-full text-center hidden md:inline">QR Code</span>
            </button>

            <button
              onClick={logoutUser}
              className="p-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/35 border border-rose-500/40 text-rose-300 hover:text-white transition shadow-xs active:scale-95 flex items-center justify-center"
              title="Sair do painel"
              aria-label="Sair"
            >
              <LogOut className="w-4 h-4 text-rose-400" />
            </button>
          </div>
        </div>
      </header>

      {/* MAIN VIEW CONTENT AREA (CLEAN FULL-WIDTH, NO EXTRA BARS) */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-4 sm:space-y-6">
        {/* Browser Push Alert Status / Quick Bar */}
        <NotificationBanner role="barber" variant="compact" />

        <div className="animate-in fade-in duration-200">
          {activeBarberTab === 'schedule' && (
            <BarberScheduleView barbershop={userShop} />
          )}
          {activeBarberTab === 'financial' && (
            <BarberFinancialView barbershop={userShop} />
          )}
          {activeBarberTab === 'services' && (
            <BarberServicesView barbershop={userShop} />
          )}
          {activeBarberTab === 'settings' && (
            <BarberSettingsView barbershop={userShop} />
          )}
        </div>
      </main>

      {/* QR Code Modal */}
      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title={`QR Code de Agendamento`}
        subtitle={userShop.name}
        qrValue={publicLink}
        badgeText="Acesso Rápido dos Clientes"
        footerText="Imprima ou coloque no balcão da sua barbearia para que seus clientes agendem rapidamente apontando a câmera do celular"
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        userId={currentUser.id}
        userName={userShop.ownerName}
      />
    </div>
  );
};
