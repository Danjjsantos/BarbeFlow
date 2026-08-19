import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { RoleSwitcherModal } from './RoleSwitcherModal';
import { QrCodeModal } from './common/QrCodeModal';
import {
  Scissors,
  Calendar,
  DollarSign,
  Shield,
  Layers,
  Store,
  UserCheck,
  Share2,
  QrCode,
  Sparkles,
  ChevronDown,
  Menu,
  X,
  Phone,
  Clock,
  ExternalLink,
  Eye,
  Award,
  KeyRound,
} from 'lucide-react';

interface HeaderProps {
  onOpenRegister?: (planId?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenRegister }) => {
  const {
    currentUser,
    currentView,
    setCurrentView,
    activeBarbershopId,
    setActiveBarbershopId,
    barbershops,
    getBarbershopById,
    setIsRegisterModalOpen,
    openRegisterModal,
    openLoginModal,
  } = useApp();

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeShop = getBarbershopById(activeBarbershopId) || barbershops[0];
  const barberShop = currentUser.barbershopId
    ? getBarbershopById(currentUser.barbershopId)
    : null;

  // Generate public booking URL preview
  const publicBookingUrl = `${window.location.origin}/#${activeShop?.slug || 'navalha-de-ouro'}`;

  const handleRegisterClick = () => {
    if (onOpenRegister) {
      onOpenRegister('annual');
    } else {
      openRegisterModal('annual');
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-slate-100 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo & Brand */}
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setCurrentView('landing_page')}
            >
              <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/20">
                <Scissors className="w-5 h-5 sm:w-6 sm:h-6" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                    Barber<span className="text-amber-400">Hub</span>
                  </span>
                  <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider hidden xs:inline-block">
                    PIX Ready
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 hidden sm:block">
                  Gestão & Agendamento de Barbearias
                </p>
              </div>
            </div>

            {/* Navigation Tabs - Hidden for Super Admin as it has the dedicated Left Sidebar */}
            {currentUser.role !== 'super_admin' && (
              <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/80">
                {/* Universal Presentation Link */}
                <button
                  onClick={() => setCurrentView('landing_page')}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    currentView === 'landing_page'
                      ? 'bg-orange-500 text-slate-950 shadow-xs'
                      : 'text-orange-300 hover:text-orange-200 hover:bg-orange-950/40'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Apresentação & Planos
                </button>

                {currentUser.role === 'client' && (
                  <>
                    <button
                      onClick={() => setCurrentView('client_booking')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                        currentView === 'client_booking'
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Agendar Horário
                    </button>
                    <button
                      onClick={() => setCurrentView('client_appointments')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                        currentView === 'client_appointments'
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      Meus Agendamentos
                    </button>
                  </>
                )}

                {currentUser.role === 'barber' && (
                  <>
                    <button
                      onClick={() => setCurrentView('barber_dashboard')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                        currentView === 'barber_dashboard'
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Painel do Barbeiro
                    </button>
                    <button
                      onClick={() => setCurrentView('client_booking')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                        currentView === 'client_booking'
                          ? 'bg-amber-500 text-slate-950 shadow-xs'
                          : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Ver Minha Agenda Pública
                    </button>
                  </>
                )}
              </nav>
            )}

            {/* User Profile & Demo Switcher Button */}
            <div className="flex items-center gap-2">
              {/* Quick Login Button */}
              <button
                onClick={() => openLoginModal('barber')}
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-xl transition shadow-xs"
                title="Entrar com login e senha (Barbeiro ou Admin Geral)"
              >
                <KeyRound className="w-3.5 h-3.5 text-orange-400" />
                <span>Entrar</span>
              </button>

              {/* Quick Credenciar Button */}
              <button
                onClick={handleRegisterClick}
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold text-slate-950 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-90 rounded-xl shadow-xs transition"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                Credenciar Barbearia
              </button>

              {/* Share / QR code button if on barber or client (hidden for super admin) */}
              {activeShop && currentUser.role !== 'super_admin' && currentView !== 'super_admin_dashboard' && (
                <button
                  onClick={() => setIsQrModalOpen(true)}
                  title="Compartilhar Link da Barbearia / QR Code"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition"
                >
                  <QrCode className="w-3.5 h-3.5 text-amber-400" />
                  QR Code
                </button>
              )}

              {/* Role Switcher Pill */}
              <button
                onClick={() => setIsRoleModalOpen(true)}
                className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-xl transition text-left group"
                title="Clique para alternar perfil (Admin, Barbeiro ou Cliente)"
              >
                <div className="relative">
                  <img
                    src={
                      currentUser.avatarUrl ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
                    }
                    alt={currentUser.name}
                    className="w-8 h-8 rounded-lg object-cover ring-1 ring-amber-500/40"
                  />
                  {currentUser.role === 'super_admin' && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-orange-600 text-white rounded-full flex items-center justify-center text-[8px] font-bold">
                      ★
                    </span>
                  )}
                </div>

                <div className="hidden sm:block">
                  <div className="text-xs font-bold text-slate-100 flex items-center gap-1">
                    <span className="truncate max-w-[130px]">{currentUser.name.split(' ')[0]}</span>
                    <span
                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-sm ${
                        currentUser.role === 'super_admin'
                          ? 'bg-orange-600 text-white'
                          : currentUser.role === 'barber'
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-blue-600 text-white'
                      }`}
                    >
                      {currentUser.role === 'super_admin'
                        ? 'Admin Geral'
                        : currentUser.role === 'barber'
                        ? 'Barbeiro'
                        : 'Cliente'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span>Mudar perfil</span>
                    <ChevronDown className="w-2.5 h-2.5 text-slate-400 group-hover:translate-y-0.5 transition" />
                  </div>
                </div>
              </button>

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden px-4 pt-2 pb-4 space-y-2 border-t border-slate-800 bg-slate-900 animate-in slide-in-from-top duration-200">
            <button
              onClick={() => {
                setCurrentView('landing_page');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                currentView === 'landing_page'
                  ? 'bg-orange-500 text-slate-950 font-bold'
                  : 'text-orange-300 hover:bg-slate-800'
              }`}
            >
              <Eye className="w-4 h-4 text-orange-400" />
              Página de Apresentação & Planos
            </button>

            {currentUser.role === 'client' && (
              <>
                <button
                  onClick={() => {
                    setCurrentView('client_booking');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                    currentView === 'client_booking'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Calendar className="w-4 h-4 text-amber-400" />
                  Agendar Horário
                </button>
                <button
                  onClick={() => {
                    setCurrentView('client_appointments');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                    currentView === 'client_appointments'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Clock className="w-4 h-4 text-amber-400" />
                  Meus Agendamentos
                </button>
              </>
            )}

            {currentUser.role === 'barber' && (
              <>
                <button
                  onClick={() => {
                    setCurrentView('barber_dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                    currentView === 'barber_dashboard'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Layers className="w-4 h-4 text-amber-400" />
                  Painel do Barbeiro
                </button>
                <button
                  onClick={() => {
                    setCurrentView('client_booking');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                    currentView === 'client_booking'
                      ? 'bg-amber-500 text-slate-950'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <ExternalLink className="w-4 h-4 text-amber-400" />
                  Ver Minha Agenda Pública
                </button>
              </>
            )}

            {currentUser.role === 'super_admin' && (
              <>
                <button
                  onClick={() => {
                    setCurrentView('super_admin_dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                    currentView === 'super_admin_dashboard'
                      ? 'bg-orange-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Shield className="w-4 h-4 text-orange-400" />
                  Painel Super Admin & Planos
                </button>
                <button
                  onClick={() => {
                    setCurrentView('client_booking');
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${
                    currentView === 'client_booking'
                      ? 'bg-orange-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Store className="w-4 h-4 text-orange-400" />
                  Visão de Cliente
                </button>
              </>
            )}

            <button
              onClick={() => {
                handleRegisterClick();
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              Credenciar Nova Barbearia
            </button>

            <button
              onClick={() => {
                setIsRoleModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold bg-slate-800 text-amber-400 flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Trocar Perfil de Demonstração
            </button>
          </div>
        )}
      </header>

      {/* Role Switcher Modal */}
      <RoleSwitcherModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
      />

      {/* QR Code Modal for Barbershop Public Link */}
      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title={`QR Code de Agendamento`}
        subtitle={activeShop?.name}
        qrValue={publicBookingUrl}
        badgeText="Acesso Rápido dos Clientes"
        footerText="Imprima ou coloque no balcão da barbearia para que seus clientes agendem apontando a câmera do celular"
      />
    </>
  );
};
