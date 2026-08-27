import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
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
