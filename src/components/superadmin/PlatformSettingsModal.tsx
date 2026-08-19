import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PixKeyType } from '../../types';
import { ChangePasswordModal } from '../common/ChangePasswordModal';
import { X, Save, Shield, CreditCard, Phone, Mail, FileText, KeyRound, Lock } from 'lucide-react';

interface PlatformSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlatformSettingsModal: React.FC<PlatformSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { platformSettings, updatePlatformSettings, currentUser } = useApp();

  const [platformName, setPlatformName] = useState(platformSettings.platformName);
  const [platformPixKey, setPlatformPixKey] = useState(platformSettings.platformPixKey);
  const [platformPixKeyType, setPlatformPixKeyType] = useState<PixKeyType>(
    platformSettings.platformPixKeyType
  );
  const [platformPixReceiverName, setPlatformPixReceiverName] = useState(
    platformSettings.platformPixReceiverName
  );
  const [monthlyFee, setMonthlyFee] = useState(String(platformSettings.monthlyFee));
  const [supportPhone, setSupportPhone] = useState(platformSettings.supportPhone);
  const [supportEmail, setSupportEmail] = useState(platformSettings.supportEmail);
  const [pixInstructions, setPixInstructions] = useState(
    platformSettings.pixInstructions
  );
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePlatformSettings({
      platformName,
      platformPixKey,
      platformPixKeyType,
      platformPixReceiverName,
      monthlyFee: parseFloat(monthlyFee) || 49.9,
      supportPhone,
      supportEmail,
      pixInstructions,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-slate-900 dark:text-slate-100 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 mb-2">
            <Shield className="w-3.5 h-3.5" />
            Configurações Globais da Plataforma
          </span>
          <h3 className="text-xl font-bold">Taxa Mensal & Chave PIX Master</h3>
          <p className="text-xs text-slate-500 mt-1">
            Defina o valor da taxa mensal cobrada dos barbeiros e a conta PIX onde você receberá as assinaturas.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nome da Plataforma
            </label>
            <input
              type="text"
              required
              value={platformName}
              onChange={(e) => setPlatformName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Valor da Taxa Mensal por Barbeiro (R$) *
              </label>
              <input
                type="number"
                step="0.50"
                required
                min="0"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-bold text-orange-600 dark:text-orange-400"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo da Chave PIX Master
              </label>
              <select
                value={platformPixKeyType}
                onChange={(e) => setPlatformPixKeyType(e.target.value as PixKeyType)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
              >
                <option value="email">E-mail</option>
                <option value="phone">Telefone</option>
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
                <option value="random">Chave Aleatória</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chave PIX da Plataforma (Admin) *
              </label>
              <input
                type="text"
                required
                value={platformPixKey}
                onChange={(e) => setPlatformPixKey(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome do Beneficiário no PIX *
              </label>
              <input
                type="text"
                required
                value={platformPixReceiverName}
                onChange={(e) => setPlatformPixReceiverName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                WhatsApp de Suporte aos Barbeiros
              </label>
              <input
                type="text"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                E-mail de Suporte
              </label>
              <input
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>
          </div>

          {/* Admin Security Block */}
          <div className="p-3.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-800 dark:text-white block">
                  Segurança do Administrador Geral
                </span>
                <span className="text-[10px] text-slate-500">
                  Altere a senha mestre de acesso ao painel geral.
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
            >
              <KeyRound className="w-3.5 h-3.5 text-orange-400" />
              <span>Alterar Senha</span>
            </button>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs"
            >
              <Save className="w-4 h-4" />
              Salvar Configurações da Plataforma
            </button>
          </div>
        </form>

        {/* Change Password Modal */}
        <ChangePasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
          userId={currentUser.id}
          userName={currentUser.name}
        />
      </div>
    </div>
  );
};
