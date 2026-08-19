import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { BarberScheduleView } from './BarberScheduleView';
import { BarberFinancialView } from './BarberFinancialView';
import { BarberServicesView } from './BarberServicesView';
import { BarberSettingsView } from './BarberSettingsView';
import { ChangePasswordModal } from '../common/ChangePasswordModal';
import {
  Calendar,
  DollarSign,
  Scissors,
  Settings,
  Store,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  KeyRound,
  Lock,
} from 'lucide-react';

export const BarberDashboard: React.FC = () => {
  const { currentUser, barbershops, getBarbershopById } = useApp();
  const [activeTab, setActiveTab] = useState<'schedule' | 'financial' | 'services' | 'settings'>('schedule');
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6" id="barber-dashboard-container">
      {/* Top Banner with Shop Overview */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={
              userShop.logoUrl ||
              'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=300'
            }
            alt={userShop.name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/40 shrink-0 bg-slate-800"
          />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-black text-slate-900 dark:text-white">
                {userShop.name}
              </h1>
              {userShop.subscriptionStatus === 'active' ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                  <ShieldCheck className="w-3 h-3" />
                  Assinatura Ativa
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                  <AlertCircle className="w-3 h-3" />
                  Aguardando Aprovação de Mensalidade
                </span>
              )}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Barbeiro Responsável: <strong>{userShop.ownerName}</strong> • {userShop.city}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-500" />
            <span>Alterar Senha</span>
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'schedule', label: 'Agenda & Atendimentos', icon: Calendar },
          { id: 'financial', label: 'Rendimentos & Finanças', icon: DollarSign },
          { id: 'services', label: 'Meus Serviços & Preços', icon: Scissors },
          { id: 'settings', label: 'Horários & Configurações', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`pb-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content Views */}
      <div>
        {activeTab === 'schedule' && <BarberScheduleView barbershop={userShop} />}
        {activeTab === 'financial' && <BarberFinancialView barbershop={userShop} />}
        {activeTab === 'services' && <BarberServicesView barbershop={userShop} />}
        {activeTab === 'settings' && <BarberSettingsView barbershop={userShop} />}
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        userName={userShop.ownerName}
      />
    </div>
  );
};
