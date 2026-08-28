import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Barbershop, PixKeyType, PaymentMethodType } from '../../types';
import { formatCurrency, formatPhone, getDayOfWeekName } from '../../utils/formatters';
import { testMercadoPagoCredentials } from '../../utils/mercadopago';
import { QrCodeModal } from '../common/QrCodeModal';
import { BarberSubscriptionPayModal } from './BarberSubscriptionPayModal';
import { ChangePasswordModal } from '../common/ChangePasswordModal';
import { BarbershopMediaManager } from './BarbershopMediaManager';
import { NotificationBanner } from '../common/NotificationBanner';
import {
  Settings,
  Clock,
  CreditCard,
  Building2,
  Share2,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Save,
  Palette,
  ExternalLink,
  ShieldCheck,
  Calendar,
  Lock,
  KeyRound,
  Check,
  Zap,
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
  MessageSquare,
  Smartphone,
  BellRing,
  Banknote,
  Sparkles,
} from 'lucide-react';

interface BarberSettingsViewProps {
  barbershop: Barbershop;
}

export const BarberSettingsView: React.FC<BarberSettingsViewProps> = ({ barbershop }) => {
  const { updateBarbershop, platformSettings, currentUser, setActiveBarbershopId, setCurrentView, getBarbershopPublicUrl } = useApp();

  // Basic Info Form State
  const [name, setName] = useState(barbershop.name);
  const [phone, setPhone] = useState(barbershop.phone);
  const [address, setAddress] = useState(barbershop.address);
  const [city, setCity] = useState(barbershop.city);
  const [instagram, setInstagram] = useState(barbershop.instagram || '');
  const [bio, setBio] = useState(barbershop.bio);
  const [themeColor, setThemeColor] = useState(barbershop.themeColor || '#d97706');
  const [logoUrl, setLogoUrl] = useState(barbershop.logoUrl || '');
  const [bannerUrl, setBannerUrl] = useState(barbershop.bannerUrl || '');

  // Payment Methods Configuration State
  const [acceptedPaymentMethods, setAcceptedPaymentMethods] = useState<PaymentMethodType[]>(
    barbershop.acceptedPaymentMethods && barbershop.acceptedPaymentMethods.length > 0
      ? barbershop.acceptedPaymentMethods
      : ['pix_manual', 'cash', 'card']
  );

  // PIX Key State
  const [pixKey, setPixKey] = useState(barbershop.pixKey);
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>(barbershop.pixKeyType);
  const [pixReceiverName, setPixReceiverName] = useState(
    barbershop.pixReceiverName || barbershop.name
  );

  // Mercado Pago State
  const [mercadoPagoAccessToken, setMercadoPagoAccessToken] = useState(
    barbershop.mercadoPagoAccessToken || ''
  );
  const [showMpToken, setShowMpToken] = useState(false);
  const [isTestingMp, setIsTestingMp] = useState(false);
  const [mpTestResult, setMpTestResult] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);

  // Working Hours State
  const [slotIntervalMinutes, setSlotIntervalMinutes] = useState(
    barbershop.slotIntervalMinutes || 30
  );
  const [bookingWindowDays, setBookingWindowDays] = useState<number>(
    barbershop.bookingWindowDays || 15
  );
  const [confirmationMode, setConfirmationMode] = useState<'pix' | 'whatsapp'>(
    barbershop.confirmationMode || 'pix'
  );
  const [workingHours, setWorkingHours] = useState(barbershop.workingHours);

  // Modals
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const isPlanEligibleForAutoPix =
    barbershop.subscriptionPlanId === 'semiannual' ||
    barbershop.subscriptionPlanId === 'annual';

  useEffect(() => {
    setName(barbershop.name);
    setPhone(barbershop.phone);
    setAddress(barbershop.address);
    setCity(barbershop.city);
    setInstagram(barbershop.instagram || '');
    setBio(barbershop.bio);
    setThemeColor(barbershop.themeColor || '#d97706');
    setLogoUrl(barbershop.logoUrl || '');
    setBannerUrl(barbershop.bannerUrl || '');
    setAcceptedPaymentMethods(
      barbershop.acceptedPaymentMethods && barbershop.acceptedPaymentMethods.length > 0
        ? barbershop.acceptedPaymentMethods
        : ['pix_manual', 'cash', 'card']
    );
    setPixKey(barbershop.pixKey);
    setPixKeyType(barbershop.pixKeyType);
    setPixReceiverName(barbershop.pixReceiverName || barbershop.name);
    setMercadoPagoAccessToken(barbershop.mercadoPagoAccessToken || '');
    setSlotIntervalMinutes(barbershop.slotIntervalMinutes || 30);
    setBookingWindowDays(barbershop.bookingWindowDays || 15);
    setConfirmationMode(barbershop.confirmationMode || 'pix');
    setWorkingHours(barbershop.workingHours);
  }, [barbershop]);

  const togglePaymentMethod = (method: PaymentMethodType) => {
    if (method === 'pix_automatic' && !isPlanEligibleForAutoPix) {
      return;
    }
    setAcceptedPaymentMethods((prev) => {
      const exists = prev.includes(method);
      if (exists) {
        if (prev.length === 1) {
          alert('Você deve manter pelo menos uma forma de pagamento habilitada para seus clientes.');
          return prev;
        }
        return prev.filter((m) => m !== method);
      } else {
        return [...prev, method];
      }
    });
  };

  const publicLink = getBarbershopPublicUrl(barbershop.slug);

  const handleTestMercadoPago = async () => {
    if (!mercadoPagoAccessToken.trim()) {
      setMpTestResult({
        success: false,
        message: 'Digite seu Access Token do Mercado Pago antes de testar.',
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
          message: res.error || 'Token inválido ou não autorizado.',
        });
      }
    } catch (err: any) {
      setMpTestResult({
        success: false,
        message: 'Erro ao validar token do Mercado Pago.',
      });
    } finally {
      setIsTestingMp(false);
    }
  };

  const handleWorkingHourChange = (
    dayIndex: number,
    field: 'isOpen' | 'openTime' | 'closeTime' | 'breakStart' | 'breakEnd',
    val: any
  ) => {
    setWorkingHours((prev) => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        [field]: val,
      },
    }));
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    updateBarbershop(barbershop.id, {
      name,
      phone,
      address,
      city,
      instagram,
      bio,
      themeColor,
      logoUrl,
      bannerUrl,
      acceptedPaymentMethods,
      pixKey,
      pixKeyType,
      pixReceiverName,
      mercadoPagoAccessToken: mercadoPagoAccessToken.trim(),
      slotIntervalMinutes,
      bookingWindowDays,
      confirmationMode,
      workingHours,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const isSubscriptionActive = barbershop.subscriptionStatus === 'active';
  const isSubscriptionPending = barbershop.subscriptionStatus === 'pending';

  return (
    <div className="space-y-6 relative" id="barber-settings-view">
      {/* Floating Success Notification on Save */}
      {savedSuccess && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200 border border-emerald-400">
          <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm">Informações Salvas com Sucesso!</p>
            <p className="text-xs text-emerald-100">Todas as alterações foram gravadas e continuam ativas.</p>
          </div>
        </div>
      )}
      {/* Subscription Status Callout Banner */}
      <div
        className={`p-6 rounded-3xl border shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          isSubscriptionActive
            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
            : isSubscriptionPending
            ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800'
            : 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800'
        }`}
      >
        <div className="flex items-start gap-3.5">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
              isSubscriptionActive
                ? 'bg-emerald-600 text-white'
                : isSubscriptionPending
                ? 'bg-amber-500 text-slate-950'
                : 'bg-rose-600 text-white'
            }`}
          >
            {isSubscriptionActive ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <AlertCircle className="w-6 h-6" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Assinatura da Plataforma:{' '}
                {isSubscriptionActive
                  ? 'Ativa'
                  : isSubscriptionPending
                  ? 'Aguardando Aprovação'
                  : 'Vencida'}
              </h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-800/80 shadow-2xs">
                {formatCurrency(barbershop.subscriptionMonthlyFee || platformSettings.monthlyFee)} / mês
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              {isSubscriptionActive
                ? `Plano ativo até ${barbershop.subscriptionValidUntil}. Sua agenda está visível publicamente para todos os clientes.`
                : isSubscriptionPending
                ? 'Seu comprovante foi enviado e está sendo validado pelo Administrador Geral da plataforma.'
                : 'Sua assinatura mensal está pendente de pagamento para liberação da agenda pública.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsPayModalOpen(true)}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white dark:bg-amber-600 dark:hover:bg-amber-500 font-bold text-xs rounded-xl shadow-xs transition shrink-0 flex items-center justify-center gap-1.5"
        >
          <CreditCard className="w-4 h-4" />
          {isSubscriptionActive ? 'Ver / Renovar Taxa PIX' : 'Pagar Mensalidade via PIX'}
        </button>
      </div>

      {/* Barbershop Public Booking Link & QR Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Share2 className="w-4 h-4 text-amber-500" />
            Link Público & QR Code da sua Barbearia
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Envie este link no seu Instagram ou gere o QR Code para imprimir e colocar no balcão da barbearia.
          </p>
          <div className="mt-2 text-xs font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-slate-700 dark:text-slate-300 inline-block">
            {publicLink}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setActiveBarbershopId(barbershop.id);
              setCurrentView('client_booking');
            }}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-slate-700/60"
            title="Verificar agenda pública para o período selecionado"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Ver Agenda Pública</span>
          </button>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(publicLink);
              alert('Link da sua barbearia copiado!');
            }}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition"
          >
            Copiar Link
          </button>
          <button
            type="button"
            onClick={() => setIsQrModalOpen(true)}
            className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <QrCode className="w-4 h-4" />
            Gerar QR Code de Balcão
          </button>
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSaveAll} className="space-y-6">
        {/* SECTION 1: Working Hours & Availability */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Disponibilidade da Agenda & Horários de Funcionamento
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Configure o período em que a agenda fica aberta para os clientes, dias de atendimento e pausas.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Intervalo entre horários:
              </label>
              <select
                value={slotIntervalMinutes}
                onChange={(e) => setSlotIntervalMinutes(Number(e.target.value))}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              >
                <option value="20">20 minutos</option>
                <option value="30">30 minutos</option>
                <option value="45">45 minutos</option>
                <option value="60">60 minutos</option>
              </select>
            </div>
          </div>

          {/* Booking Window (Período em que a Agenda ficará aberta) */}
          <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <span className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  Período em que a Agenda ficará Aberta (Antecedência Máxima)
                </span>
                <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80 mt-0.5">
                  Escolha quantos dias para frente os clientes conseguem visualizar vagas e agendar serviços na página pública.
                </p>
              </div>

              <div className="text-xs font-black text-amber-700 dark:text-amber-300 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800 shrink-0 self-start sm:self-auto">
                {bookingWindowDays === 8 && '8 dias (1 semana + 1 dia)'}
                {bookingWindowDays === 15 && '15 dias (2 semanas)'}
                {bookingWindowDays === 30 && '30 dias (1 mês completo)'}
                {bookingWindowDays === 60 && '60 dias (2 meses)'}
                {![8, 15, 30, 60].includes(bookingWindowDays) && `${bookingWindowDays} dias`}
              </div>
            </div>

            {/* Quick Presets */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { days: 8, label: '8 Dias', desc: '1 semana + 1 dia' },
                { days: 15, label: '15 Dias', desc: '2 semanas (Recomendado)' },
                { days: 30, label: '1 Mês', desc: '30 dias completos' },
                { days: 60, label: '2 Meses', desc: '60 dias adiante' },
              ].map((opt) => {
                const isSelected = bookingWindowDays === opt.days;
                return (
                  <button
                    key={opt.days}
                    type="button"
                    onClick={() => setBookingWindowDays(opt.days)}
                    className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500 border-amber-600 text-slate-950 shadow-sm font-bold'
                        : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-400'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-black">{opt.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-slate-950" />}
                    </div>
                    <span className={`text-[10px] mt-1 ${isSelected ? 'text-slate-900 font-medium' : 'text-slate-500 dark:text-slate-400'}`}>
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 pt-1">
            {[0, 1, 2, 3, 4, 5, 6].map((dayIndex) => {
              const schedule = workingHours[dayIndex] || {
                isOpen: dayIndex !== 0,
                openTime: '09:00',
                closeTime: '19:00',
              };
              return (
                <div
                  key={dayIndex}
                  className={`p-3.5 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    schedule.isOpen
                      ? 'bg-slate-50/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                      : 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 w-40">
                    <input
                      type="checkbox"
                      id={`day-${dayIndex}`}
                      checked={schedule.isOpen}
                      onChange={(e) =>
                        handleWorkingHourChange(dayIndex, 'isOpen', e.target.checked)
                      }
                      className="w-4 h-4 text-amber-600 rounded-sm focus:ring-amber-500"
                    />
                    <label
                      htmlFor={`day-${dayIndex}`}
                      className="text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer"
                    >
                      {getDayOfWeekName(dayIndex)}
                    </label>
                  </div>

                  {schedule.isOpen ? (
                    <div className="flex items-center gap-4 text-xs flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Abertura:</span>
                        <input
                          type="time"
                          value={schedule.openTime}
                          onChange={(e) =>
                            handleWorkingHourChange(dayIndex, 'openTime', e.target.value)
                          }
                          className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-semibold"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Fechamento:</span>
                        <input
                          type="time"
                          value={schedule.closeTime}
                          onChange={(e) =>
                            handleWorkingHourChange(dayIndex, 'closeTime', e.target.value)
                          }
                          className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md font-semibold"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500">Almoço (Pausa):</span>
                        <input
                          type="time"
                          value={schedule.breakStart || '12:00'}
                          onChange={(e) =>
                            handleWorkingHourChange(dayIndex, 'breakStart', e.target.value)
                          }
                          className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[11px]"
                        />
                        <span className="text-slate-400">às</span>
                        <input
                          type="time"
                          value={schedule.breakEnd || '13:00'}
                          onChange={(e) =>
                            handleWorkingHourChange(dayIndex, 'breakEnd', e.target.value)
                          }
                          className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-[11px]"
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-rose-500 font-semibold">
                      Barbearia Fechada neste dia
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: Payment Methods Allowed by Barber */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-500" />
                Formas de Pagamento Aceitas na Barbearia
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Selecione quais opções seus clientes poderão escolher ao agendar serviços na página da sua barbearia.
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {acceptedPaymentMethods.length} forma(s) selecionada(s)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Option 1: Pix Manual (Chave + Comprovante) */}
            <div
              onClick={() => togglePaymentMethod('pix_manual')}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition cursor-pointer relative flex flex-col justify-between ${
                acceptedPaymentMethods.includes('pix_manual')
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500 shadow-xs'
                  : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0 border border-emerald-500/20">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        Pix (Chave + Comprovante)
                      </h4>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">
                        Transferência Direta
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      acceptedPaymentMethods.includes('pix_manual')
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {acceptedPaymentMethods.includes('pix_manual') && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  O cliente escaneia o QR Code da sua chave PIX, copia a chave e anexa a foto do comprovante para confirmar o horário.
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                <span>Disponível em todos os planos</span>
                <span className="text-slate-400 font-normal">Sem taxa extra</span>
              </div>
            </div>

            {/* Option 2: Pix Automático (Mercado Pago) */}
            <div
              onClick={() => {
                if (isPlanEligibleForAutoPix) {
                  togglePaymentMethod('pix_automatic');
                }
              }}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition relative flex flex-col justify-between ${
                !isPlanEligibleForAutoPix
                  ? 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 opacity-85 cursor-not-allowed'
                  : acceptedPaymentMethods.includes('pix_automatic')
                  ? 'bg-sky-50/50 dark:bg-sky-950/30 border-sky-500 shadow-xs cursor-pointer'
                  : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 opacity-75 cursor-pointer'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold shrink-0 border border-sky-500/20">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                          Pix Automático (Mercado Pago)
                        </h4>
                        {!isPlanEligibleForAutoPix && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/40 flex items-center gap-1">
                            <Lock className="w-2.5 h-2.5" />
                            Semestral e Anual
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-sky-700 dark:text-sky-400 font-bold uppercase tracking-wider">
                        Confirmação Instantânea
                      </span>
                    </div>
                  </div>

                  {isPlanEligibleForAutoPix ? (
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        acceptedPaymentMethods.includes('pix_automatic')
                          ? 'border-sky-600 bg-sky-600 text-white'
                          : 'border-slate-300 dark:border-slate-600'
                      }`}
                    >
                      {acceptedPaymentMethods.includes('pix_automatic') && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  ) : (
                    <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Gera QR Code dinâmico do Mercado Pago e valida o recebimento em tempo real na agenda sem você precisar conferir o comprovante.
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/80">
                {!isPlanEligibleForAutoPix ? (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-amber-700 dark:text-amber-400 font-bold">
                      Não incluso no plano mensal.
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsPayModalOpen(true);
                      }}
                      className="text-[11px] font-black text-amber-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      Fazer Upgrade
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[11px] text-sky-600 dark:text-sky-400 font-bold">
                    <span>Liberado no seu plano {barbershop.subscriptionPlanId === 'annual' ? 'Anual' : 'Semestral'}</span>
                    <span>Validação via API</span>
                  </div>
                )}
              </div>
            </div>

            {/* Option 3: Dinheiro (Presencial / Balcão) */}
            <div
              onClick={() => togglePaymentMethod('cash')}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition cursor-pointer relative flex flex-col justify-between ${
                acceptedPaymentMethods.includes('cash')
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-500 shadow-xs'
                  : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0 border border-emerald-500/20">
                      <Banknote className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        Dinheiro (No Balcão)
                      </h4>
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">
                        Pagamento no Local
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      acceptedPaymentMethods.includes('cash')
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {acceptedPaymentMethods.includes('cash') && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  O cliente agenda e o sistema confirma o horário com status <strong>"Pagamento Pendente no Local"</strong>. O pagamento é feito em espécie na barbearia.
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                <span>Confirmado com aviso de pendência</span>
                <span className="text-slate-400 font-normal">Presencial</span>
              </div>
            </div>

            {/* Option 4: Cartão de Débito / Crédito (Presencial) */}
            <div
              onClick={() => togglePaymentMethod('card')}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition cursor-pointer relative flex flex-col justify-between ${
                acceptedPaymentMethods.includes('card')
                  ? 'bg-purple-50/40 dark:bg-purple-950/20 border-purple-500 shadow-xs'
                  : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold shrink-0 border border-purple-500/20">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        Cartão (Maquininha Presencial)
                      </h4>
                      <span className="text-[10px] text-purple-700 dark:text-purple-400 font-bold uppercase tracking-wider">
                        Débito ou Crédito
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                      acceptedPaymentMethods.includes('card')
                        ? 'border-purple-600 bg-purple-600 text-white'
                        : 'border-slate-300 dark:border-slate-600'
                    }`}
                  >
                    {acceptedPaymentMethods.includes('card') && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  O cliente agenda e o sistema confirma informando <strong>"Pagamento Pendente no Local (Cartão)"</strong>. O valor é passado na sua máquina após o atendimento.
                </p>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-[11px] text-purple-600 dark:text-purple-400 font-bold">
                <span>Confirmado com aviso de pendência</span>
                <span className="text-slate-400 font-normal">Maquininha</span>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 3: PIX Settings */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-500" />
              Chave PIX para Recebimentos dos Clientes
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Os pagamentos dos seus clientes cairão 100% diretamente nesta conta bancária.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1">
                Tipo de Chave PIX
              </label>
              <select
                value={pixKeyType}
                onChange={(e) => setPixKeyType(e.target.value as PixKeyType)}
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-900 dark:text-white shadow-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              >
                <option value="phone">Telefone</option>
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
                <option value="email">E-mail</option>
                <option value="random">Chave Aleatória</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1">
                Chave PIX *
              </label>
              <input
                type="text"
                required
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                placeholder="Informe sua chave PIX"
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white placeholder:text-slate-400 shadow-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 dark:text-slate-200 mb-1">
                Nome do Titular da Conta PIX *
              </label>
              <input
                type="text"
                required
                value={pixReceiverName}
                onChange={(e) => setPixReceiverName(e.target.value)}
                placeholder="Nome completo do beneficiário"
                className="w-full px-3 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-900 dark:text-white placeholder:text-slate-400 shadow-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>
          </div>

          {/* Mercado Pago Token Integration for Barber */}
          {isPlanEligibleForAutoPix && (
            <div className="mt-4 p-4 bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block text-xs">
                      Credenciais Mercado Pago para PIX Automático
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Conecte seu Access Token do Mercado Pago para confirmações 100% automatizadas em tempo real.
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Seu Access Token do Mercado Pago (Produção ou Teste):
                </label>
                <div className="relative">
                  <input
                    type={showMpToken ? 'text' : 'password'}
                    placeholder="APP_USR-..."
                    value={mercadoPagoAccessToken}
                    onChange={(e) => setMercadoPagoAccessToken(e.target.value)}
                    className="w-full px-3 py-2.5 pr-16 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white placeholder:text-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMpToken(!showMpToken)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-slate-500 hover:text-slate-800 text-[10px] font-bold"
                  >
                    {showMpToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Gere em: <strong>mercadopago.com.br/developers</strong> &gt; Suas integrações &gt; Credenciais
                </p>
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
                      <span>Validando Token...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5" />
                      <span>Testar Conexão Mercado Pago</span>
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
          )}
        </div>

        {/* SECTION 3: Customization, Branding & Media Storage */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-orange-500" />
              Fotos, Capa & Identidade Visual da Barbearia
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Altere a foto de perfil/logo e a imagem de fundo (capa) a partir do seu dispositivo, galeria de modelos ou link direto.
            </p>
          </div>

          {/* Media Manager for Logo and Banner */}
          <BarbershopMediaManager
            currentLogo={logoUrl}
            currentBanner={bannerUrl}
            onLogoChange={setLogoUrl}
            onBannerChange={setBannerUrl}
            shopName={name}
          />

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome da Barbearia
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                WhatsApp de Atendimento
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Endereço Completo
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Instagram (@seuperfil)
              </label>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Bio / Descrição da Barbearia
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs resize-none"
            />
          </div>
        </div>

        {/* Push Notifications Configuration for Barber */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Notificações Push no Navegador
              </h4>
              <p className="text-xs text-slate-500">
                Receba alertas em tempo real no seu dispositivo quando um novo cliente agendar um horário.
              </p>
            </div>
          </div>

          <NotificationBanner role="barber" variant="card" />
        </div>

        {/* Security & Access Password Section */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Segurança & Senha de Acesso
                </h4>
                <p className="text-xs text-slate-500">
                  Defina ou altere a senha de login para proteger seu painel e finanças.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPasswordModalOpen(true)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl font-bold text-xs transition flex items-center gap-2 shadow-xs"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>Alterar Minha Senha</span>
            </button>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Configurações salvas com sucesso!
            </span>
          )}
          <button
            type="submit"
            className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Salvar Configurações da Barbearia
          </button>
        </div>
      </form>

      {/* QR Code Modal */}
      <QrCodeModal
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        title="QR Code de Agendamento da Barbearia"
        subtitle={barbershop.name}
        qrValue={publicLink}
        badgeText="Exclusivo da sua Barbearia"
      />

      {/* Barber Monthly Subscription PIX Pay Modal */}
      <BarberSubscriptionPayModal
        isOpen={isPayModalOpen}
        onClose={() => setIsPayModalOpen(false)}
        barbershopId={barbershop.id}
      />

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
        userId={currentUser.id}
        userName={barbershop.ownerName}
      />
    </div>
  );
};
