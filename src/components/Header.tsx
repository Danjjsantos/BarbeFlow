import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { QrCodeModal } from './common/QrCodeModal';
import {
  Scissors,
  QrCode,
  LogOut,
  Calendar,
  DollarSign,
  Settings,
  Menu,
} from 'lucide-react';

interface HeaderProps {
  onOpenRegister?: (planId?: string) => void;
}

export const Header: React.FC<HeaderProps> = () => {
  const {
    currentUser,
    setCurrentView,
    activeBarbershopId,
    barbershops,
    getBarbershopById,
    logoutUser,
    activeBarberTab,
    setActiveBarberTab,
    setIsBarberDrawerOpen,
    newAppointmentsCount,
    markAppointmentsAsSeen,
  } = useApp();

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  const activeShop = getBarbershopById(activeBarbershopId) || barbershops[0];
  const userShop = currentUser.barbershopId
    ? getBarbershopById(currentUser.barbershopId)
    : activeShop;

  // Generate public booking URL preview
  const publicBookingUrl = `${window.location.origin}/#${userShop?.slug || 'navalha-de-ouro'}`;

  const isBarber = currentUser.role === 'barber';

  // Only show badge when there is genuinely a new appointment
  const barberNavOptions = [
    {
      id: 'schedule' as const,
      label: 'Agenda',
      icon: Calendar,
      badge: newAppointmentsCount > 0 ? `${newAppointmentsCount}` : undefined,
    },
    { id: 'financial' as const, label: 'Financeiro', icon: DollarSign },
    { id: 'services' as const, label: 'Serviços', icon: Scissors },
    { id: 'settings' as const, label: 'Configurações', icon: Settings },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-950 border-b border-slate-800 text-slate-100 shadow-2xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Main Top Header Bar */}
          <div className="flex items-center justify-between py-2 sm:py-3 gap-2 sm:gap-4">
            {/* Left: Barbershop Brand Logo & Name */}
            <div className="flex items-center gap-2.5 sm:gap-3.5 overflow-hidden">
              <div
                className="cursor-pointer shrink-0"
                onClick={() => {
                  if (isBarber) {
                    setCurrentView('barber_dashboard');
                  } else if (currentUser.role === 'super_admin') {
                    setCurrentView('super_admin_dashboard');
                  } else {
                    setCurrentView('landing_page');
                  }
                }}
              >
                {userShop?.logoUrl ? (
                  <img
                    src={userShop.logoUrl}
                    alt={userShop.name}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl object-cover border-2 border-amber-500/70 shadow-lg shadow-amber-500/10 shrink-0 bg-slate-900"
                  />
                ) : (
                  <img
                    src="/barber_clock_logo.jpg"
                    alt="BarberClock"
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl object-cover border-2 border-amber-500/70 shadow-lg shadow-amber-500/10 shrink-0 bg-slate-900"
                  />
                )}
              </div>

              {/* Barbershop Name & Status */}
              <div className="overflow-hidden">
                <div className="flex items-center gap-2">
                  <h1
                    onClick={() => {
                      if (isBarber) setCurrentView('barber_dashboard');
                    }}
                    className="font-black text-base sm:text-xl text-white tracking-tight leading-tight truncate cursor-pointer hover:text-amber-400 transition"
                  >
                    {userShop?.name || 'BarberClock'}
                  </h1>

                  {userShop?.subscriptionStatus === 'active' && (
                    <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="hidden xs:inline">Ativa</span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {userShop?.ownerName ? `Resp. ${userShop.ownerName}` : 'Painel da Barbearia'}
                </p>
              </div>
            </div>

            {/* Right: QR Code Icon-only & Logout Icon-only */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* QR Code Icon-only Button */}
              {userShop && (
                <button
                  onClick={() => setIsQrModalOpen(true)}
                  title="Abrir QR Code da Barbearia"
                  className="p-2 sm:p-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl transition shadow-md shadow-amber-500/20 active:scale-95 shrink-0 flex items-center justify-center"
                  aria-label="QR Code da Barbearia"
                >
                  <QrCode className="w-5 h-5 text-slate-950" />
                </button>
              )}

              {/* Logout Icon-only Button */}
              <button
                onClick={logoutUser}
                className="p-2 sm:p-2.5 bg-rose-600/20 hover:bg-rose-600/35 border border-rose-500/40 text-rose-300 hover:text-white rounded-xl transition shadow-sm active:scale-95 shrink-0 flex items-center justify-center"
                title="Sair do painel"
                aria-label="Sair"
              >
                <LogOut className="w-5 h-5 text-rose-400" />
              </button>
            </div>
          </div>

          {/* Bottom Bar: Icon-only Navigation Options */}
          {isBarber && (
            <div className="border-t border-slate-800/80 py-2 sm:py-2.5 flex items-center justify-start gap-2 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-2 min-w-max">
                {/* 3 Stripes / Hamburger Menu Icon Button */}
                <button
                  onClick={() => setIsBarberDrawerOpen(true)}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 hover:text-white border border-slate-800 hover:border-amber-500/40 transition shadow-xs group shrink-0 active:scale-95 flex items-center justify-center"
                  title="Menu Lateral (Todas as Opções)"
                  aria-label="Menu"
                >
                  <Menu className="w-5 h-5 transition-transform group-hover:scale-110" />
                </button>

                <div className="h-5 w-px bg-slate-800 mx-1 shrink-0" />

                {/* Option Icons without text (Agenda, Financial $, Services scissors, Settings gear) */}
                {barberNavOptions.map((opt) => {
                  const Icon = opt.icon;
                  const isActive = activeBarberTab === opt.id;

                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        setActiveBarberTab(opt.id);
                        if (opt.id === 'schedule') {
                          markAppointmentsAsSeen();
                        }
                        setCurrentView('barber_dashboard');
                      }}
                      className={`relative p-2.5 rounded-xl transition shrink-0 active:scale-95 flex items-center justify-center ${
                        isActive
                          ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                          : 'bg-slate-900/80 text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-slate-800/60'
                      }`}
                      title={opt.label}
                      aria-label={opt.label}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                      {opt.badge && (
                        <span
                          className={`absolute -top-1 -right-1 text-[9px] font-black w-4 h-4 rounded-full flex items-center justify-center shadow-xs ${
                            isActive ? 'bg-slate-950 text-amber-400' : 'bg-amber-500 text-slate-950'
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* QR Code Modal for Barbershop Public Link */}
      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title={`QR Code de Agendamento`}
        subtitle={userShop?.name || 'Sua Barbearia'}
        qrValue={publicBookingUrl}
        badgeText="Acesso Rápido dos Clientes"
        footerText="Imprima ou coloque no balcão da sua barbearia para que os clientes apontem a câmera do celular e agendem imediatamente."
      />
    </>
  );
};
