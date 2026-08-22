import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { ClientBookingFlow } from './components/client/ClientBookingFlow';
import { ClientMyAppointments } from './components/client/ClientMyAppointments';
import { BarberDashboard } from './components/barber/BarberDashboard';
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { LandingPage } from './components/landing/LandingPage';
import { BarberRegisterModal } from './components/barber/BarberRegisterModal';
import { AuthLoginModal } from './components/common/AuthLoginModal';
import { AccessLinksModal } from './components/common/AccessLinksModal';
import { Scissors, Shield, Heart, Sparkles, CheckCircle2, User, Eye, Tag, Link2 } from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    currentView,
    currentUser,
    platformSettings,
    setCurrentView,
    switchRole,
    isRegisterModalOpen,
    setIsRegisterModalOpen,
    registerPlanId,
    openRegisterModal,
    isLoginModalOpen,
    setIsLoginModalOpen,
    loginModalRole,
    openLoginModal,
    isAccessLinksModalOpen,
    setIsAccessLinksModalOpen,
    openAccessLinksModal,
  } = useApp();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-white w-full overflow-x-hidden">
      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'landing_page' && (
          <LandingPage onOpenRegister={openRegisterModal} onOpenLogin={openLoginModal} />
        )}
        {currentView === 'client_booking' && <ClientBookingFlow />}
        {currentView === 'client_appointments' && <ClientMyAppointments />}
        {currentView === 'barber_dashboard' && <BarberDashboard />}
        {currentView === 'super_admin_dashboard' && <SuperAdminDashboard />}
      </main>

      {/* Barber Registration Modal */}
      <BarberRegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
        initialPlanId={registerPlanId}
      />

      {/* Auth Login Modal */}
      <AuthLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        initialRole={loginModalRole}
        onOpenRegister={openRegisterModal}
      />

      {/* System Access Links Modal */}
      <AccessLinksModal
        isOpen={isAccessLinksModalOpen}
        onClose={() => setIsAccessLinksModalOpen(false)}
      />

      {/* Bottom Footer & Global Platform Bar (Displayed strictly on landing page) */}
      {currentView === 'landing_page' && (
        <footer className="bg-slate-900 border-t border-slate-800 py-6 px-4 text-xs text-slate-400">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <img
                src="/barber_clock_logo.jpg"
                alt="BarberClock Logo"
                className="w-9 h-9 rounded-xl object-cover border border-amber-500/80 shadow-md shadow-amber-500/20 shrink-0 bg-slate-950"
              />
              <div>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <span className="font-extrabold text-sm text-white">
                    {platformSettings.platformName}
                  </span>
                  <span className="text-[10px] bg-orange-500/20 text-orange-300 border border-orange-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                    Plataforma para Barbearias
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Sistema completo de agendamento online com confirmação instantânea via PIX e gestão inteligente de barbearias.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-end gap-2.5 flex-wrap w-full sm:w-auto text-xs shrink-0">
              <button
                type="button"
                onClick={openAccessLinksModal}
                className="px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 hover:border-amber-500/40 cursor-pointer"
                title="Visualizar todos os links de acesso do sistema"
              >
                <Link2 className="w-4 h-4 text-amber-400" />
                <span>Links de Acesso</span>
              </button>

              <button
                type="button"
                onClick={() => openLoginModal('barber')}
                className="px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 cursor-pointer"
                title="Acesso direto para Barbeiros"
              >
                <Scissors className="w-4 h-4 text-amber-400" />
                <span>Acesso Barbeiro</span>
              </button>

              <button
                type="button"
                onClick={() => openLoginModal('super_admin')}
                className="px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border border-indigo-800/60 cursor-pointer"
                title="Acesso direto do Administrador Geral"
              >
                <Shield className="w-4 h-4 text-indigo-400" />
                <span>Admin Geral</span>
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};


export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
