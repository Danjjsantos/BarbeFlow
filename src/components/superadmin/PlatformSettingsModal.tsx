import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PixKeyType } from '../../types';
import { ChangePasswordModal } from '../common/ChangePasswordModal';
import { testMercadoPagoCredentials } from '../../utils/mercadopago';
import {
  X,
  Save,
  Shield,
  KeyRound,
  Lock,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
} from 'lucide-react';

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
  const [supportPhone, setSupportPhone] = useState(platformSettings.supportPhone);
  const [supportEmail, setSupportEmail] = useState(platformSettings.supportEmail);
  const [pixInstructions, setPixInstructions] = useState(
    platformSettings.pixInstructions
  );

  // Mercado Pago states
  const [mercadoPagoAccessToken, setMercadoPagoAccessToken] = useState(
    platformSettings.mercadoPagoAccessToken || ''
  );
  const [mercadoPagoEnabled, setMercadoPagoEnabled] = useState(
    platformSettings.mercadoPagoEnabled !== false
  );
  const [showToken, setShowToken] = useState(false);
  const [isTestingMp, setIsTestingMp] = useState(false);
  const [mpTestResult, setMpTestResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPlatformName(platformSettings.platformName);
      setPlatformPixKey(platformSettings.platformPixKey);
      setPlatformPixKeyType(platformSettings.platformPixKeyType);
      setPlatformPixReceiverName(platformSettings.platformPixReceiverName);
      setSupportPhone(platformSettings.supportPhone);
      setSupportEmail(platformSettings.supportEmail);
      setPixInstructions(platformSettings.pixInstructions);
      setMercadoPagoAccessToken(platformSettings.mercadoPagoAccessToken || '');
      setMercadoPagoEnabled(platformSettings.mercadoPagoEnabled !== false);
    }
  }, [isOpen, platformSettings]);

  if (!isOpen) return null;

  const handleTestMercadoPago = async () => {
    if (!mercadoPagoAccessToken.trim()) {
      setMpTestResult({
        success: false,
        message: 'Digite o Access Token do Mercado Pago antes de testar.',
      });
      return;
    }
    setIsTestingMp(true);
    setMpTestResult(null);
    try {
      const res = await testMercadoPagoCredentials(mercadoPagoAccessToken);
      if (res.success) {
        setMpTestResult({
          success: true,
          message: res.message || `Conectado com sucesso à conta: ${res.nickname || res.email || 'Mercado Pago'}`,
        });
      } else {
        setMpTestResult({
          success: false,
          message: res.error || 'Token inválido ou sem permissão.',
        });
      }
    } catch (err: any) {
      setMpTestResult({
        success: false,
        message: 'Erro de comunicação ao testar token.',
      });
    } finally {
      setIsTestingMp(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePlatformSettings({
      platformName,
      platformPixKey,
      platformPixKeyType,
      platformPixReceiverName,
      monthlyFee: platformSettings.monthlyFee,
      supportPhone,
      supportEmail,
      pixInstructions,
      mercadoPagoAccessToken: mercadoPagoAccessToken.trim(),
      mercadoPagoEnabled,
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
          <h3 className="text-xl font-bold">Configurações Gerais</h3>
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
              <label className="block font-bold text-slate-900 dark:text-slate-200 mb-1">
                Tipo da Chave PIX Master
              </label>
              <select
                value={platformPixKeyType}
                onChange={(e) => setPlatformPixKeyType(e.target.value as PixKeyType)}
                className="w-full px-3 py-2.5 bg-white border-2 border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-black"
              >
                <option value="email">E-mail</option>
                <option value="phone">Telefone</option>
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
                <option value="random">Chave Aleatória</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-900 dark:text-slate-200 mb-1">
                Chave PIX da Plataforma (Admin) *
              </label>
              <input
                type="text"
                required
                value={platformPixKey}
                onChange={(e) => setPlatformPixKey(e.target.value)}
                placeholder="Chave PIX do administrador"
                className="w-full px-3 py-2.5 bg-white border-2 border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono font-bold text-black placeholder:text-slate-400"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-900 dark:text-slate-200 mb-1">
              Nome do Beneficiário no PIX *
            </label>
            <input
              type="text"
              required
              value={platformPixReceiverName}
              onChange={(e) => setPlatformPixReceiverName(e.target.value)}
              placeholder="Nome do titular da conta"
              className="w-full px-3 py-2.5 bg-white border-2 border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-black placeholder:text-slate-400"
            />
          </div>

          {/* Mercado Pago Master Integration */}
          <div className="p-4 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block text-xs">
                    Mercado Pago API (Confirmação Automática de Assinaturas)
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Gera QR Code PIX dinâmico e aprova a assinatura do barbeiro instantaneamente.
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Mercado Pago Access Token (Produção ou Teste):
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  placeholder="APP_USR-..."
                  value={mercadoPagoAccessToken}
                  onChange={(e) => setMercadoPagoAccessToken(e.target.value)}
                  className="w-full px-3 py-2 pr-16 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-slate-400 hover:text-slate-600 text-[10px]"
                >
                  {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestMercadoPago}
                disabled={isTestingMp}
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
              >
                {isTestingMp ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Testando...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-3.5 h-3.5" />
                    <span>Testar Conexão</span>
                  </>
                )}
              </button>
            </div>

            {mpTestResult && (
              <div
                className={`p-2.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  mpTestResult.success
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300'
                }`}
              >
                {mpTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{mpTestResult.message}</span>
              </div>
            )}
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
