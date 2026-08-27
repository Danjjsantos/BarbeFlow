import React, { useState, useEffect } from 'react';
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

  // Listen and synchronize device/OS dark mode preferences dynamically
  useEffect(() => {
    const updateTheme = () => {
      const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDarkMode) {
        document.documentElement.classList.add('dark');
        document.documentElement.setAttribute('data-theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.documentElement.setAttribute('data-theme', 'light');
      }
    };

    // Initial check
    updateTheme();

    // Event listener for live changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateTheme);
      return () => mediaQuery.removeEventListener('change', updateTheme);
    } else if (mediaQuery.addListener) {
      // Compatibility with older WebKit
      mediaQuery.addListener(updateTheme);
      return () => mediaQuery.removeListener(updateTheme);
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-white w-full overflow-x-hidden transition-colors duration-200">
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
