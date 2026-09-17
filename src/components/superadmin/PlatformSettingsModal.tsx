import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { PixKeyType } from '../../types';
import { ChangePasswordModal } from '../common/ChangePasswordModal';
import { testMercadoPagoCredentials, isMercadoPagoPublicKey } from '../../utils/mercadopago';
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
  ShieldCheck,
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
  const [showMpInstructions, setShowMpInstructions] = useState(false);
  const [isTestingMp, setIsTestingMp] = useState(false);
  const [mpTestResult, setMpTestResult] = useState<{
    success?: boolean;
    message?: string;
    isProduction?: boolean;
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
    const tokenToTest = (mercadoPagoAccessToken || '').trim();
    if (!tokenToTest) {
      setMpTestResult({
        success: false,
        message: 'Digite o Access Token do Mercado Pago antes de testar.',
      });
      return;
    }

    if (isMercadoPagoPublicKey(tokenToTest)) {
      setMpTestResult({
        success: false,
        message: 'Você inseriu a Public Key (Chave Pública). No Mercado Pago Developers, acesse "Credenciais de produção" e copie o ACCESS TOKEN (começa com APP_USR-).',
      });
      return;
    }

    setIsTestingMp(true);
    setMpTestResult(null);
    try {
      const res = await testMercadoPagoCredentials(tokenToTest);
      if (res && res.success) {
        const accName = res.nickname || res.email || 'Conta Comercial';
        const prodTag = res.isProduction ? ' (Produção Ativa)' : ' (Sandbox/Teste)';
        setMpTestResult({
          success: true,
          isProduction: res.isProduction,
          message: typeof res.message === 'string'
            ? res.message
            : `Conectado com sucesso ao Mercado Pago${prodTag} — Conta: ${accName}. PIX automático ativo!`,
        });
      } else {
        const errMsg = res && res.error
          ? (typeof res.error === 'string' ? res.error : JSON.stringify(res.error))
          : 'Access Token recusado pelo Mercado Pago. Verifique se o token é válido e se as credenciais de produção estão ativadas.';
        setMpTestResult({
          success: false,
          message: errMsg,
        });
      }
    } catch (err: any) {
      setMpTestResult({
        success: false,
        message: typeof err?.message === 'string' ? err.message : 'Erro de comunicação ao testar token.',
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
      mercadoPagoAccessToken: (mercadoPagoAccessToken || '').trim(),
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
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
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
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white placeholder:text-slate-400"
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
              className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400"
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
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-700 dark:text-slate-300 text-xs">
                  Mercado Pago Access Token (Produção):
                </label>
                <button
                  type="button"
                  onClick={() => setShowMpInstructions(!showMpInstructions)}
                  className="text-[11px] text-sky-600 hover:text-sky-700 dark:text-sky-400 font-semibold underline flex items-center gap-1"
                >
                  <span>Instruções de Produção</span>
                </button>
              </div>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  placeholder="APP_USR-..."
                  value={mercadoPagoAccessToken}
                  onChange={(e) => {
                    setMercadoPagoAccessToken(e.target.value);
                    if (mpTestResult) setMpTestResult(null);
                  }}
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

              {/* Warning if Public Key format was entered */}
              {isMercadoPagoPublicKey(mercadoPagoAccessToken) && (
                <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
                  <div>
                    <strong className="block font-bold">Atenção: Você colou a Public Key!</strong>
                    <span>Para cobranças PIX, copie o <strong>Access Token</strong> de Produção no painel do Mercado Pago Developers (começa com APP_USR-).</span>
                  </div>
                </div>
              )}

              {/* Production Token Instructions */}
              {showMpInstructions && (
                <div className="mt-2.5 p-3.5 bg-sky-100/60 dark:bg-sky-900/40 rounded-xl border border-sky-300 dark:border-sky-800 text-xs text-slate-700 dark:text-slate-200 space-y-2">
                  <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <span>Como ativar e obter o Access Token de Produção:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                    <li>Acesse <strong>mercadopago.com.br/developers</strong> e faça login.</li>
                    <li>Vá em <strong>Suas integrações</strong> &gt; selecione sua aplicação.</li>
                    <li>No menu lateral, clique em <strong>Credenciais de produção</strong>.</li>
                    <li>Se solicitado, clique em <strong>"Ativar credenciais de produção"</strong> e preencha as informações do negócio.</li>
                    <li>Copie o <strong>Access Token</strong> completo (não copie a Public Key) e cole acima.</li>
                  </ol>
                </div>
              )}
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
                    <span>Testando Token...</span>
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
                className={`p-3 rounded-xl text-xs font-medium flex items-start gap-2.5 ${
                  mpTestResult.success
                    ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
                    : 'bg-rose-100 text-rose-900 dark:bg-rose-950/70 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
                }`}
              >
                {mpTestResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                )}
                <div className="space-y-1">
                  <div className="font-bold flex items-center gap-2">
                    <span>{mpTestResult.success ? 'Conexão Mercado Pago Aprovada!' : 'Falha ao validar Access Token'}</span>
                    {mpTestResult.isProduction && (
                      <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] rounded-full font-bold">
                        PRODUÇÃO ATIVA
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] whitespace-pre-line leading-relaxed">
                    {typeof mpTestResult.message === 'string' ? mpTestResult.message : JSON.stringify(mpTestResult.message)}
                  </div>
                </div>
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
          userId={currentUser?.id || ''}
          userName={currentUser?.name || ''}
        />
      </div>
    </div>
  );
};
