import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency, getTodayDateString } from '../../utils/formatters';
import { generatePixPayload, generateQrCodeDataUrl } from '../../utils/pix';
import {
  createMercadoPagoPix,
  checkMercadoPagoPaymentStatus,
} from '../../utils/mercadopago';
import { Barbershop } from '../../types';
import {
  X,
  Building2,
  Scissors,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Shield,
  Copy,
  Check,
  QrCode,
  Tag,
  Phone,
  User,
  Key,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldCheck,
  Zap,
  RefreshCw,
  Clock,
  AlertTriangle,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BarberRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPlanId?: string;
}

export const BarberRegisterModal: React.FC<BarberRegisterModalProps> = ({
  isOpen,
  onClose,
  initialPlanId = 'annual',
}) => {
  const {
    subscriptionPlans,
    platformSettings,
    registerNewBarbershop,
    approveBarbershopSubscription,
    checkTrialEligibility,
    setCurrentUser,
    users,
    setActiveBarbershopId,
    setCurrentView,
  } = useApp();

  const [step, setStep] = useState<'form' | 'payment_pix' | 'approved'>('form');
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId);
  const [trialWarning, setTrialWarning] = useState<string | null>(null);

  // Form Fields
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState<'cpf' | 'cnpj' | 'email' | 'phone' | 'random'>('phone');

  // Created Entity State
  const [createdShop, setCreatedShop] = useState<Barbershop | null>(null);

  // Mercado Pago States
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [paymentId, setPaymentId] = useState<string>('');
  const [mpQrCodePayload, setMpQrCodePayload] = useState<string>('');
  const [mpQrCodeBase64, setMpQrCodeBase64] = useState<string>('');
  const [generatedDataUrl, setGeneratedDataUrl] = useState<string>('');
  const [isRealMp, setIsRealMp] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(600); // 10 minutes
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedAdminPixKey, setCopiedAdminPixKey] = useState(false);
  const [approvedValidityDate, setApprovedValidityDate] = useState<string>('');

  const pollIntervalRef = useRef<any>(null);

  useEffect(() => {
    if (initialPlanId) {
      setSelectedPlanId(initialPlanId);
    }
  }, [initialPlanId]);

  const currentPlan =
    subscriptionPlans.find((p) => p.id === selectedPlanId) ||
    subscriptionPlans[0];

  const isTrialSelected = selectedPlanId === 'trial' || currentPlan.id === 'trial';

  // Calculate duration in days for the chosen plan
  const getPlanDurationDays = (periodMonths?: number, planId?: string): number => {
    if (planId === 'annual' || periodMonths === 12) return 365;
    if (planId === 'semiannual' || periodMonths === 6) return 180;
    if (planId === 'monthly' || periodMonths === 1) return 30;
    if (planId === 'trial') return 30;
    return (periodMonths || 1) * 30;
  };

  const planDays = getPlanDurationDays(currentPlan.periodMonths, currentPlan.id);

  // Check trial eligibility in real time when user inputs data
  useEffect(() => {
    if (isTrialSelected && (ownerPhone.trim().length >= 8 || ownerEmail.trim() || ownerName.trim().length >= 3)) {
      const eligibility = checkTrialEligibility(ownerName.trim(), ownerPhone.trim(), ownerEmail.trim());
      if (!eligibility.isEligible) {
        setTrialWarning(eligibility.reason || 'Este usuário já utilizou o período de teste grátis.');
      } else {
        setTrialWarning(null);
      }
    } else {
      setTrialWarning(null);
    }
  }, [isTrialSelected, ownerName, ownerPhone, ownerEmail]);

  // Initial PIX Creation via Mercado Pago backend API when entering step 'payment_pix'
  useEffect(() => {
    if (!isOpen || step !== 'payment_pix' || !createdShop) return;

    let isMounted = true;

    async function initSubscriptionPix() {
      setIsGeneratingPix(true);
      setApiError(null);
      try {
        const phoneDigits = (ownerPhone || '').replace(/\D/g, '');
        const payerEmail = ownerEmail.trim() || `barbeiro_${phoneDigits || Date.now()}@barberhub.com.br`;

        const res = await createMercadoPagoPix({
          amount: currentPlan.price,
          description: `Adesão ${currentPlan.name} - ${createdShop?.name || 'Barbearia'}`,
          payerEmail: payerEmail,
          payerName: ownerName.trim() || 'Barbeiro Parceiro',
          accessToken: platformSettings.mercadoPagoAccessToken,
          externalReference: `sub_reg_${createdShop?.id}_${currentPlan.id}_${Date.now()}`,
        });

        if (isMounted) {
          if (res.success) {
            const pId = res.paymentId || res.payment?.id || '';
            const payload = res.qrCode || res.payment?.qrCode || '';
            const b64 = res.qrCodeBase64 || res.payment?.qrCodeBase64 || '';

            setPaymentId(pId);
            setMpQrCodePayload(payload);
            setMpQrCodeBase64(b64);
            setIsRealMp(Boolean(res.isRealMercadoPago));

            if (!b64 && payload) {
              const url = await generateQrCodeDataUrl(payload, 300);
              if (isMounted) setGeneratedDataUrl(url);
            }

            if (res.status === 'approved') {
              handleAutoApproved(pId);
            }
          } else {
            setApiError(res.error || 'Não foi possível conectar ao Mercado Pago da plataforma.');
            const fallback = generatePixPayload({
              pixKey: platformSettings.platformPixKey,
              receiverName: platformSettings.platformPixReceiverName,
              amount: currentPlan.price,
              txId: `ADESAO${createdShop?.slug.substring(0, 8).toUpperCase()}`,
              description: `Adesão ${currentPlan.name} - ${createdShop?.name}`,
            });
            setMpQrCodePayload(fallback);
            const url = await generateQrCodeDataUrl(fallback, 300);
            if (isMounted) setGeneratedDataUrl(url);
          }
        }
      } catch (err: any) {
        console.error('Error generating Registration Pix:', err);
        if (isMounted) {
          setApiError(err.message || 'Falha na conexão com Mercado Pago');
          const fallback = generatePixPayload({
            pixKey: platformSettings.platformPixKey,
            receiverName: platformSettings.platformPixReceiverName,
            amount: currentPlan.price,
            txId: `ADESAO${createdShop?.slug.substring(0, 8).toUpperCase()}`,
            description: `Adesão ${currentPlan.name} - ${createdShop?.name}`,
          });
          setMpQrCodePayload(fallback);
          const url = await generateQrCodeDataUrl(fallback, 300);
          setGeneratedDataUrl(url);
        }
      } finally {
        if (isMounted) setIsGeneratingPix(false);
      }
    }

    initSubscriptionPix();

    return () => {
      isMounted = false;
    };
  }, [isOpen, step, createdShop, currentPlan, platformSettings.mercadoPagoAccessToken, platformSettings.platformPixKey, platformSettings.platformPixReceiverName]);

  // Polling for Mercado Pago status every 2.5 seconds
  useEffect(() => {
    if (!isOpen || step !== 'payment_pix' || !paymentId || !createdShop) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      return;
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await checkMercadoPagoPaymentStatus(paymentId, platformSettings.mercadoPagoAccessToken);
        if (res && res.status === 'approved') {
          handleAutoApproved(paymentId);
        }
      } catch (e) {
        // Fail silently during polling
      }
    }, 2500);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isOpen, step, paymentId, createdShop, platformSettings.mercadoPagoAccessToken]);

  // Countdown timer for PIX payment step
  useEffect(() => {
    if (!isOpen || step !== 'payment_pix') return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, step]);

  const handleAutoApproved = (confirmedPaymentId?: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    
    if (!createdShop) return;

    // Calculate expiration date
    const validDate = new Date();
    validDate.setDate(validDate.getDate() + planDays);
    const validUntilStr = validDate.toISOString().split('T')[0];
    const formattedValidDate = validDate.toLocaleDateString('pt-BR');
    setApprovedValidityDate(formattedValidDate);

    // Automatically approve and activate the barbershop in AppContext
    approveBarbershopSubscription(createdShop.id, planDays);

    setStep('approved');

    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.55 },
    });
  };

  if (!isOpen) return null;

  const handleSubmitRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!shopName.trim() || !ownerName.trim() || !ownerPhone.trim() || !pixKey.trim()) {
      setFormError('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    if (!password.trim()) {
      setFormError('Por favor, crie uma senha de acesso para proteger sua página.');
      return;
    }

    if (password.trim().length < 5) {
      setFormError('A senha de acesso deve ter no mínimo 5 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('A confirmação da senha não confere com a senha digitada.');
      return;
    }

    // Check trial eligibility if trial is selected
    if (selectedPlanId === 'trial') {
      const check = checkTrialEligibility(ownerName.trim(), ownerPhone.trim(), ownerEmail.trim());
      if (!check.isEligible) {
        setFormError(check.reason || 'Este usuário já utilizou o período de teste grátis de 30 dias. Selecione um plano pago para prosseguir.');
        return;
      }
    }

    // Register Barbershop in AppContext
    const newShop = registerNewBarbershop({
      shopName: shopName.trim(),
      barberName: ownerName.trim(),
      phone: ownerPhone.trim(),
      email: ownerEmail.trim(),
      password: password.trim(),
      city: city.trim() || 'São Paulo',
      address: address.trim() || 'Endereço Principal',
      pixKey: pixKey.trim(),
      pixKeyType,
      planId: selectedPlanId as any,
    });

    setCreatedShop(newShop);

    if (selectedPlanId === 'trial') {
      const validDate = new Date();
      validDate.setDate(validDate.getDate() + 30);
      setApprovedValidityDate(validDate.toLocaleDateString('pt-BR'));
      setStep('approved');
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.55 },
      });
    } else {
      setTimeLeftSeconds(600);
      setStep('payment_pix');
    }
  };

  const handleGoToBarberDashboard = () => {
    if (createdShop) {
      setActiveBarbershopId(createdShop.id);
      const shopUser = users.find((u) => u.barbershopId === createdShop.id || u.id === createdShop.ownerId) || {
        id: createdShop.ownerId,
        name: createdShop.ownerName,
        phone: createdShop.phone || createdShop.ownerPhone,
        email: ownerEmail.trim() || `${createdShop.slug}@barberhub.com.br`,
        role: 'barber' as const,
        barbershopId: createdShop.id,
      };
      try {
        localStorage.setItem('barberhub_active_shop_id_v2', createdShop.id);
        localStorage.setItem('barberhub_current_user_id_v2', shopUser.id);
        localStorage.setItem('barberhub_auth_logged_in_v2', 'true');
        localStorage.setItem('barberhub_view_v2', 'barber_dashboard');
      } catch {}
      setCurrentUser(shopUser);
      setCurrentView('barber_dashboard');
    }
    onClose();
  };

  const handleGoToPublicBooking = () => {
    if (createdShop) {
      setActiveBarbershopId(createdShop.id);
      try {
        localStorage.setItem('barberhub_active_shop_id_v2', createdShop.id);
        localStorage.setItem('barberhub_view_v2', 'client_booking');
      } catch {}
      setCurrentView('client_booking');
    }
    onClose();
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const fallbackPayload = createdShop
    ? generatePixPayload({
        pixKey: platformSettings.platformPixKey,
        receiverName: platformSettings.platformPixReceiverName,
        amount: currentPlan.price,
        txId: `ADESAO${createdShop.slug.substring(0, 8).toUpperCase()}`,
        description: `Adesão ${currentPlan.name} - ${createdShop.name}`,
      })
    : '';

  const finalPixPayload = mpQrCodePayload || fallbackPayload;

  const handleCopyPayload = () => {
    if (finalPixPayload) {
      navigator.clipboard.writeText(finalPixPayload);
      setCopiedPayload(true);
      setTimeout(() => setCopiedPayload(false), 2500);
    }
  };

  const handleCopyAdminPixKey = () => {
    navigator.clipboard.writeText(platformSettings.platformPixKey);
    setCopiedAdminPixKey(true);
    setTimeout(() => setCopiedAdminPixKey(false), 2500);
  };

  const qrImageSrc = mpQrCodeBase64
    ? (mpQrCodeBase64.startsWith('data:') ? mpQrCodeBase64 : `data:image/png;base64,${mpQrCodeBase64}`)
    : generatedDataUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 md:p-6 bg-slate-950/80 backdrop-blur-xs overflow-hidden">
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl max-h-[94dvh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        id="barber-register-modal"
      >
        {/* Header - Fixed at the top */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center text-slate-950 font-black shadow-md shrink-0">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                {step === 'form' && 'Credenciamento de Nova Barbearia'}
                {step === 'payment_pix' && 'Pagamento da Adesão via PIX'}
                {step === 'approved' && 'Barbearia Credenciada & Ativada!'}
              </h2>
              <p className="text-[11px] sm:text-xs text-amber-200 leading-tight mt-0.5">
                {step === 'form' && 'Preencha os dados e escolha seu plano para liberar sua agenda online'}
                {step === 'payment_pix' && 'Aprovação automática e instantânea pelo Mercado Pago'}
                {step === 'approved' && 'Tudo pronto! Sua barbearia já pode receber agendamentos'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer shrink-0"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: REGISTRATION FORM - Scrollable body with custom scrollbar */}
        {step === 'form' && (
          <form onSubmit={handleSubmitRegistration} className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-7 overscroll-contain custom-modal-scrollbar space-y-5 flex flex-col justify-between">
            <div className="space-y-5">
              {/* Error message */}
              {formError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Plan Selector Bar */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-amber-500" />
                    1. Selecione o Plano de Credenciamento
                  </span>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    Experimente 30 dias grátis
                  </span>
                </label>

                {trialWarning && (
                  <div className="mb-3 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/80 text-amber-900 dark:text-amber-200 text-xs font-medium flex items-start gap-2.5 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-amber-800 dark:text-amber-300">
                        Período de Teste Grátis já utilizado
                      </p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-400">
                        {trialWarning} Selecione um dos planos pagos abaixo (Mensal, Semestral ou Anual) para continuar.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                  {(() => {
                    // Ensure trial is always present in the display list
                    let plansToDisplay = [...subscriptionPlans];
                    if (!plansToDisplay.some((p) => p.id === 'trial')) {
                      const trialObj = {
                        id: 'trial' as any,
                        name: 'EXPERIMENTE 30 DIAS GRÁTIS',
                        periodMonths: 1,
                        price: 0,
                        monthlyEquivalent: 0,
                        discountPercent: 100,
                        description: 'Acesso total por 30 dias grátis sem cartão.',
                        badge: '1 Mês Grátis',
                        isPopular: false,
                        active: true,
                        features: [],
                      };
                      plansToDisplay = [trialObj, ...plansToDisplay];
                    }

                    // Sort order: trial, monthly, semiannual, annual
                    const orderMap: Record<string, number> = {
                      trial: 1,
                      monthly: 2,
                      semiannual: 3,
                      annual: 4,
                    };
                    plansToDisplay.sort((a, b) => (orderMap[a.id] || 99) - (orderMap[b.id] || 99));

                    return plansToDisplay.map((plan) => {
                      const isSelected = selectedPlanId === plan.id;
                      const isTrial = plan.id === 'trial';
                      const isMonthly = plan.id === 'monthly';
                      const isSemiannual = plan.id === 'semiannual';
                      const isAnnual = plan.billingCycle === 'annual' || plan.periodMonths === 12 || plan.id === 'annual';
                      const discountValue = plan.discountPercent ?? (plan as any).discountPercentage;
                      const monthlyVal = isTrial
                        ? 0
                        : isAnnual
                        ? plan.price / 12
                        : isSemiannual || plan.periodMonths === 6
                        ? plan.price / 6
                        : plan.price;

                      const displayName = isTrial ? 'EXPERIMENTE 30 DIAS GRÁTIS' : plan.name;
                      const subLabel = isTrial
                        ? 'Degustação total'
                        : isMonthly
                        ? 'Sem fidelidade'
                        : isSemiannual
                        ? 'Cobrança semestral'
                        : 'Economia máxima';

                      return (
                        <div
                          key={plan.id}
                          onClick={() => setSelectedPlanId(plan.id)}
                          className={`p-3 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between relative min-w-0 select-none ${
                            isSelected
                              ? isTrial
                                ? 'border-emerald-500 bg-emerald-500/10 text-slate-900 dark:text-white shadow-md ring-2 ring-emerald-500/30'
                                : 'border-amber-500 bg-amber-500/10 text-slate-900 dark:text-white shadow-md ring-2 ring-amber-500/30'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <div className="flex flex-col gap-1 w-full min-w-0">
                            <div className="flex items-start justify-between gap-1 min-w-0">
                              <span
                                className="font-black text-xs leading-tight text-slate-900 dark:text-white"
                                title={displayName}
                              >
                                {displayName}
                              </span>
                              {isTrial ? (
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0 whitespace-nowrap leading-none text-center">
                                  GRÁTIS
                                </span>
                              ) : discountValue && discountValue > 0 ? (
                                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0 whitespace-nowrap leading-none text-center">
                                  -{discountValue}%
                                </span>
                              ) : null}
                            </div>

                            {/* Subtitle placed directly below the plan title */}
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-tight">
                              {subLabel}
                            </span>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 min-w-0">
                            {isTrial ? (
                              <div>
                                <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 block leading-tight">
                                  R$ 0,00
                                </span>
                                <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5 truncate">
                                  30 dias sem custo
                                </span>
                              </div>
                            ) : (
                              <div>
                                <span className="text-sm sm:text-base font-black text-slate-900 dark:text-white block leading-tight">
                                  {formatCurrency(monthlyVal)}
                                  <span className="text-[10px] font-normal text-slate-500">/mês</span>
                                </span>
                                <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium truncate">
                                  Total: {formatCurrency(plan.price)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Shop Details */}
              <div className="space-y-3.5">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  2. Dados da Barbearia & Responsável
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nome da Barbearia *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Barbearia Dom Pedro"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nome do Barbeiro / Proprietário *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Pedro Henrique"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      WhatsApp para Notificações *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="(11) 99999-9999"
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Cidade / Bairro
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: São Paulo - SP"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      E-mail para Acesso / Login *
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="seuemail@barbearia.com.br"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  {/* Password Fields */}
                  <div className="sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        Crie sua Senha de Acesso Exclusiva *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[11px] font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showPassword ? 'Ocultar' : 'Mostrar'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Senha de Acesso (Mínimo 5 dígitos) *
                        </label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="Digite sua senha"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                          Confirmar Senha *
                        </label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          placeholder="Repita sua senha"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>

                    <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>
                        Apenas você terá acesso ao painel exclusivo da sua barbearia com suas credenciais protegidas.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Barber PIX Info (where the client pays the barber) */}
              <div className="space-y-3.5">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block border-b border-slate-100 dark:border-slate-800 pb-1.5">
                  3. Sua Chave PIX (Para Receber dos Seus Clientes)
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tipo de Chave PIX
                    </label>
                    <select
                      value={pixKeyType}
                      onChange={(e) => setPixKeyType(e.target.value as any)}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
                    >
                      <option value="phone">Telefone</option>
                      <option value="cpf">CPF</option>
                      <option value="cnpj">CNPJ</option>
                      <option value="email">E-mail</option>
                      <option value="random">Chave Aleatória</option>
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Chave PIX da Sua Barbearia *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Sua chave PIX para os clientes pagarem a você"
                      value={pixKey}
                      onChange={(e) => setPixKey(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions - Sticky at bottom with clear touch targets */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer text-center"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className={`w-full sm:w-auto px-6 py-3.5 font-black text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 ${
                  isTrialSelected
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/25'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25'
                }`}
              >
                {isTrialSelected ? (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Ativar 30 Dias de Teste Grátis</span>
                  </>
                ) : (
                  <>
                    <span>Avançar para Pagamento do Plano via PIX</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: AUTOMATED MERCADO PAGO PIX PAYMENT */}
        {step === 'payment_pix' && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 overscroll-contain custom-modal-scrollbar space-y-5">
            {/* Header with Title & Price */}
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20 mb-2">
                <Zap className="w-3.5 h-3.5 text-sky-500" />
                PIX Mercado Pago Oficial
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                Pagamento do Plano de Adesão
              </h3>
              <div className="text-3xl sm:text-4xl font-black text-amber-500 mt-1">
                {formatCurrency(currentPlan.price)}
              </div>
              <div className="flex items-center justify-center gap-2 mt-1.5">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold text-xs border border-amber-500/20">
                  {currentPlan.name} • {planDays} dias de acesso liberado
                </span>
              </div>
            </div>

            {/* Status & Timer badge */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 py-1 px-3 rounded-full border border-sky-200 dark:border-sky-800">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Aguardando pagamento no banco...</span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 py-1 px-3 rounded-full border border-amber-200 dark:border-amber-800">
                <Clock className="w-3 h-3" />
                <span>{formatTimer(timeLeftSeconds)}</span>
              </div>
            </div>

            {apiError && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{apiError}</span>
              </div>
            )}

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/80">
              {isGeneratingPix ? (
                <div className="w-56 h-56 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
                  <span className="text-xs">Gerando QR Code PIX oficial Mercado Pago...</span>
                </div>
              ) : qrImageSrc ? (
                <img
                  src={qrImageSrc}
                  alt="QR Code PIX Mercado Pago"
                  className="w-52 h-52 sm:w-60 sm:h-60 bg-white p-3 rounded-xl shadow-xs object-contain border border-slate-100"
                />
              ) : (
                <div className="w-52 h-52 sm:w-60 sm:h-60 bg-white p-3 rounded-xl shadow-xs flex items-center justify-center text-xs text-slate-400">
                  Carregando QR Code...
                </div>
              )}
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 text-center">
                Abra o app do seu banco, escolha <strong>Pagar com PIX</strong> e aponte a câmera.
              </span>
            </div>

            {/* Beneficiary Details */}
            <div className="bg-slate-100 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5 text-slate-700 dark:text-slate-300 text-left">
              <div className="flex justify-between">
                <span className="text-slate-500">Beneficiário da Plataforma:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{platformSettings.platformPixReceiverName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Chave PIX:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-medium text-slate-900 dark:text-slate-100">{platformSettings.platformPixKey}</span>
                  <button
                    onClick={handleCopyAdminPixKey}
                    className="p-1 text-slate-400 hover:text-amber-500 transition cursor-pointer"
                    title="Copiar chave"
                  >
                    {copiedAdminPixKey ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              {paymentId && (
                <div className="flex justify-between items-center text-[10px] text-sky-600 dark:text-sky-400 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="flex items-center gap-1 font-semibold">
                    <Zap className="w-3 h-3" /> Mercado Pago Conectado
                  </span>
                  <span>ID Transação: {paymentId}</span>
                </div>
              )}
            </div>

            {/* Actions: Copy & Paste + Confirm */}
            <div className="space-y-2.5">
              <button
                onClick={handleCopyPayload}
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                  copiedPayload
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-700'
                }`}
              >
                {copiedPayload ? (
                  <>
                    <Check className="w-4 h-4" />
                    Código PIX Copiado com Sucesso!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-amber-400" />
                    Copiar Código PIX (Copia e Cola)
                  </>
                )}
              </button>

              <button
                onClick={() => handleAutoApproved(paymentId)}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Já realizei o pagamento PIX
              </button>

              <p className="text-[10px] text-center text-slate-500 dark:text-slate-400 pt-0.5">
                Assim que você efetuar o pagamento no seu banco, o sistema reconhecerá automaticamente via Mercado Pago e ativará sua barbearia.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
              >
                ← Voltar e alterar dados
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: PAYMENT CONFIRMED & BARBERSHOP ACTIVE */}
        {step === 'approved' && createdShop && (
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 overscroll-contain custom-modal-scrollbar space-y-5 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-1 border border-emerald-300 dark:border-emerald-700 shadow-xl shadow-emerald-500/20">
              <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>

            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-xs border border-emerald-500/20 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                {createdShop.subscriptionPlanId === 'trial'
                  ? 'Teste Grátis de 30 Dias Ativado'
                  : 'Adesão Concluída com Sucesso'}
              </span>
              <h3 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white">
                {createdShop.subscriptionPlanId === 'trial'
                  ? 'Barbearia Credenciada & Teste Liberado!'
                  : 'Barbearia Ativada & Pronta!'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-md mx-auto">
                {createdShop.subscriptionPlanId === 'trial'
                  ? 'Sua conta de teste grátis por 30 dias está ativa. Aproveite todas as funcionalidades do BarberClock para receber agendamentos online.'
                  : 'Seu pagamento PIX foi confirmado pelo Mercado Pago. Sua agenda online já está 100% liberada com o plano contratado.'}
              </p>
            </div>

            {/* Receipt Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-left space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Barbearia:</span>
                <span className="font-black text-slate-900 dark:text-white">{createdShop.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Proprietário:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{createdShop.ownerName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Plano Ativado:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {currentPlan.name} {createdShop.subscriptionPlanId === 'trial' && '(30 Dias Grátis)'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Duração / Validade:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {planDays} dias ({approvedValidityDate || 'Até ' + planDays + ' dias'})
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Valor:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {createdShop.subscriptionPlanId === 'trial'
                    ? 'R$ 0,00 (Gratuito por 1 mês)'
                    : formatCurrency(currentPlan.price)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <span className="text-slate-500">Status da Conta:</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-[10px] uppercase tracking-wider">
                  {createdShop.subscriptionPlanId === 'trial' ? 'Teste Grátis Ativo' : 'Aprovada & Ativa'}
                </span>
              </div>
            </div>

            {createdShop.subscriptionPlanId === 'trial' && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300 text-left flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Aviso:</strong> Ao final dos 30 dias, para manter a agenda aberta e continuar recebendo agendamentos, basta contratar qualquer um dos planos pagos diretamente no seu painel.
                </span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleGoToPublicBooking}
                className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-amber-500" />
                Ver Minha Agenda Pública
              </button>

              <button
                onClick={handleGoToBarberDashboard}
                className="flex-1 py-3.5 px-6 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs rounded-xl shadow-xl shadow-amber-500/25 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Acessar Painel do Barbeiro</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
