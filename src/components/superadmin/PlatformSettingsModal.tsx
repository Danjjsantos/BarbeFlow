import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { PixKeyType } from '../../types';
import { ChangePasswordModal } from '../common/ChangePasswordModal';
import { testMercadoPagoCredentials } from '../../utils/mercadopago';
import {
  X,
  Save,
  Shield,
  CreditCard,
  Phone,
  Mail,
  FileText,
  KeyRound,
  Lock,
  Zap,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Upload,
  FolderOpen,
  RotateCcw,
  Sparkles,
  Link2,
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
  const [platformLogoUrl, setPlatformLogoUrl] = useState(
    platformSettings.platformLogoUrl || '/barber_clock_logo.jpg'
  );
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingFile, setIsLoadingFile] = useState(false);
  const [logoFeedback, setLogoFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      setPlatformLogoUrl(platformSettings.platformLogoUrl || '/barber_clock_logo.jpg');
      setPlatformPixKey(platformSettings.platformPixKey);
      setPlatformPixKeyType(platformSettings.platformPixKeyType);
      setPlatformPixReceiverName(platformSettings.platformPixReceiverName);
      setMonthlyFee(String(platformSettings.monthlyFee));
      setSupportPhone(platformSettings.supportPhone);
      setSupportEmail(platformSettings.supportEmail);
      setPixInstructions(platformSettings.pixInstructions);
      setMercadoPagoAccessToken(platformSettings.mercadoPagoAccessToken || '');
      setMercadoPagoEnabled(platformSettings.mercadoPagoEnabled !== false);
    }
  }, [isOpen, platformSettings]);

  if (!isOpen) return null;

  // Process image file from device storage (resizing to max 400x400 for high quality & fast persistence)
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setLogoFeedback({
        type: 'error',
        message: 'Por favor, selecione um arquivo de imagem válido (PNG, JPG, WEBP, GIF).',
      });
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setLogoFeedback({
        type: 'error',
        message: 'A imagem deve ter no máximo 8MB.',
      });
      return;
    }

    setIsLoadingFile(true);
    setLogoFeedback(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 400; // 400x400 max dimension for crisp logo
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.9);
            setPlatformLogoUrl(optimizedBase64);
            setIsLoadingFile(false);
            setLogoFeedback({
              type: 'success',
              message: 'Nova imagem de perfil carregada com sucesso!',
            });
          } else {
            setPlatformLogoUrl(result);
            setIsLoadingFile(false);
          }
        };
        img.onerror = () => {
          setPlatformLogoUrl(result);
          setIsLoadingFile(false);
        };
        img.src = result;
      } else {
        setIsLoadingFile(false);
      }
    };
    reader.onerror = () => {
      setIsLoadingFile(false);
      setLogoFeedback({
        type: 'error',
        message: 'Erro ao ler arquivo do dispositivo.',
      });
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleApplyCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim()) return;
    setPlatformLogoUrl(customUrl.trim());
    setCustomUrl('');
    setShowUrlInput(false);
    setLogoFeedback({
      type: 'success',
      message: 'Link de imagem aplicado!',
    });
  };

  const handleResetToDefault = () => {
    setPlatformLogoUrl('/barber_clock_logo.jpg');
    setLogoFeedback({
      type: 'success',
      message: 'Restaurado para o logotipo padrão.',
    });
  };

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
      platformLogoUrl,
      platformPixKey,
      platformPixKeyType,
      platformPixReceiverName,
      monthlyFee: parseFloat(monthlyFee) || 49.9,
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
          <h3 className="text-xl font-bold">Configurações & Apresentação</h3>
          <p className="text-xs text-slate-500 mt-1">
            Personalize a imagem/logotipo da página de apresentação, nome da plataforma, taxas e pagamentos.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Logo / Profile Image Picker from Storage */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-800 dark:text-white text-xs">
                Logotipo & Imagem de Perfil da Apresentação
              </label>
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-[11px] font-semibold text-slate-500 hover:text-amber-600 dark:hover:text-amber-400 flex items-center gap-1 transition"
                title="Voltar ao logotipo padrão"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Padrão</span>
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative shrink-0 group">
                <img
                  src={platformLogoUrl || '/barber_clock_logo.jpg'}
                  alt="Logo Preview"
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500 shadow-md bg-slate-900"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white"
                  title="Trocar imagem"
                >
                  <Upload className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 space-y-2">
                {/* Drag and Drop / Choose File button */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg, image/webp, image/gif"
                  className="hidden"
                />

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1 ${
                    isDragging
                      ? 'border-amber-500 bg-amber-500/10'
                      : 'border-slate-300 dark:border-slate-600 hover:border-amber-500 hover:bg-amber-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-xs">
                    <FolderOpen className="w-4 h-4" />
                    <span>Buscar no Armazenamento do Dispositivo</span>
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    Clique para escolher foto ou arraste um arquivo aqui (PNG, JPG, WEBP)
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-[10px] text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 underline"
                  >
                    <Link2 className="w-3 h-3" />
                    {showUrlInput ? 'Ocultar campo de link' : 'Ou inserir link da web (URL)'}
                  </button>

                  {isLoadingFile && (
                    <span className="text-[10px] text-amber-500 flex items-center gap-1 animate-pulse">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Processando imagem...
                    </span>
                  )}
                </div>
              </div>
            </div>

            {showUrlInput && (
              <div className="flex gap-2 pt-1">
                <input
                  type="url"
                  placeholder="https://exemplo.com/minha-logo.png"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-xs"
                />
                <button
                  type="button"
                  onClick={handleApplyCustomUrl}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Aplicar URL
                </button>
              </div>
            )}

            {logoFeedback && (
              <div
                className={`p-2 rounded-xl text-[11px] font-medium flex items-center gap-2 ${
                  logoFeedback.type === 'success'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300'
                }`}
              >
                {logoFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                )}
                <span>{logoFeedback.message}</span>
              </div>
            )}
          </div>

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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
