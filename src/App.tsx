import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/Header';
import { ClientBookingFlow } from './components/client/ClientBookingFlow';
import { ClientMyAppointments } from './components/client/ClientMyAppointments';
import { BarberDashboard } from './components/barber/BarberDashboard';
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { LandingPage } from './components/landing/LandingPage';
import { BarberRegisterModal } from './components/barber/BarberRegisterModal';
import { AuthLoginModal } from './components/common/AuthLoginModal';
import { Scissors, Shield, Heart, Sparkles, CheckCircle2, User, Eye, Tag } from 'lucide-react';

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
  } = useApp();

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-white">
      {/* Universal Header */}
      <Header onOpenRegister={openRegisterModal} />

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

      {/* Bottom Footer & Global Platform Bar (Hidden or Cleaned for Barber Dashboard) */}
      {currentView !== 'barber_dashboard' && (
        <footer className="bg-slate-900 border-t border-slate-800 py-6 px-4 text-xs text-slate-400">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-3 text-center sm:text-left">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-orange-600 to-amber-500 text-white flex items-center justify-center font-bold shadow-md shadow-orange-600/20 shrink-0">
                <Scissors className="w-4 h-4" />
              </div>
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

            <div className="flex items-center gap-2 text-xs flex-wrap justify-center">
              <button
                onClick={() => setCurrentView('landing_page')}
                className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
                  currentView === 'landing_page'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60'
                }`}
              >
                <Eye className="w-3.5 h-3.5 text-orange-400" />
                Apresentação & Planos
              </button>

              <button
                onClick={() => {
                  switchRole('client');
                  setCurrentView('client_booking');
                }}
                className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
                  currentUser.role === 'client' && currentView !== 'landing_page'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Visão do Cliente
              </button>

              <button
                onClick={() => {
                  switchRole('barber');
                  setCurrentView('barber_dashboard');
                }}
                className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
                  currentUser.role === 'barber' && currentView !== 'landing_page'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60'
                }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                Painel da Barbearia
              </button>

              <button
                onClick={() => {
                  switchRole('super_admin');
                  setCurrentView('super_admin_dashboard');
                }}
                className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-1.5 ${
                  currentUser.role === 'super_admin' && currentView !== 'landing_page'
                    ? 'bg-orange-600 text-white shadow-md'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-700/60'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                Administração Geral
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
