import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
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
    switchRole,
    setCurrentView,
  } = useApp();

  const [step, setStep] = useState<'form' | 'payment_pix'>('form');
  const [selectedPlanId, setSelectedPlanId] = useState(initialPlanId);

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
  const [pixReceiverName, setPixReceiverName] = useState('');

  const [registeredShopId, setRegisteredShopId] = useState<string | null>(null);
  const [copiedPix, setCopiedPix] = useState(false);
  const [proofNote, setProofNote] = useState('');

  useEffect(() => {
    if (initialPlanId) {
      setSelectedPlanId(initialPlanId);
    }
  }, [initialPlanId]);

  if (!isOpen) return null;

  const currentPlan =
    subscriptionPlans.find((p) => p.id === selectedPlanId) ||
    subscriptionPlans[0];

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

    const createdShop = registerNewBarbershop({
      shopName,
      barberName: ownerName,
      phone: ownerPhone,
      email: ownerEmail,
      password: password.trim(),
      city: city || 'São Paulo',
      address: address || 'Endereço Principal',
      pixKey,
      pixKeyType,
      planId: selectedPlanId as any,
    });

    setRegisteredShopId(createdShop.id);
    setStep('payment_pix');

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  const handleFinishToDashboard = () => {
    onClose();
    switchRole('barber');
    setCurrentView('barber_dashboard');
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(platformSettings.platformPixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div
        className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl overflow-hidden my-8"
        id="barber-register-modal"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-orange-950 via-slate-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-600 flex items-center justify-center text-white shadow-md">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">
                {step === 'form'
                  ? 'Credenciamento de Nova Barbearia'
                  : 'Confirmação do Credenciamento via PIX'}
              </h2>
              <p className="text-xs text-orange-200">
                {step === 'form'
                  ? 'Preencha os dados da sua barbearia para ativar sua agenda online'
                  : 'Efetue o pagamento da adesão para liberar seu acesso instantâneo'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {step === 'form' ? (
          <form onSubmit={handleSubmitRegistration} className="p-6 sm:p-8 space-y-6">
            {/* Error message */}
            {formError && (
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            {/* Plan Selector Bar */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-orange-600" />
                Selecione o Plano de Credenciamento
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {subscriptionPlans.map((plan) => {
                  const isSelected = selectedPlanId === plan.id;
                  const isAnnual = plan.billingCycle === 'annual';
                  const monthlyVal = isAnnual
                    ? plan.price / 12
                    : plan.billingCycle === 'semiannual'
                    ? plan.price / 6
                    : plan.price;

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                        isSelected
                          ? 'border-orange-600 bg-orange-50 dark:bg-orange-950/40 text-orange-950 dark:text-orange-100 shadow-md ring-2 ring-orange-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-xs">{plan.name}</span>
                        {plan.discountPercentage && (
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            -{plan.discountPercentage}%
                          </span>
                        )}
                      </div>

                      <div className="mt-2">
                        <span className="text-base font-black">
                          {formatCurrency(monthlyVal)}
                          <span className="text-[10px] font-normal text-slate-500">/mês</span>
                        </span>
                        <span className="block text-[10px] text-slate-400 mt-0.5 font-medium">
                          Total: {formatCurrency(plan.price)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shop Details */}
            <div className="space-y-4">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 block border-b border-slate-100 dark:border-slate-800 pb-2">
                Dados da Barbearia & Responsável
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nome do Barbeiro / Dono *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Pedro Henrique"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500"
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500"
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail para Acesso / Login *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="seuemail@barbearia.com.br"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                {/* Password Fields */}
                <div className="sm:col-span-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-orange-600" />
                      Crie sua Senha de Acesso Exclusiva *
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] font-bold text-orange-600 hover:text-orange-500 flex items-center gap-1"
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
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500"
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
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <div className="mt-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-300 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>
                      Apenas você terá acesso ao painel exclusivo da sua barbearia com suas credenciais protegidas.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Barber PIX Info (where the client pays the barber) */}
            <div className="space-y-4">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 block border-b border-slate-100 dark:border-slate-800 pb-2">
                Sua Chave PIX (Para Receber dos Seus Clientes)
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
                    Chave PIX da Barbearia *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Sua chave PIX para cair direto na sua conta"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2"
              >
                <span>Avançar para Pagamento do Plano</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        ) : (
          /* Step 2: PIX Master Payment */
          <div className="p-6 sm:p-8 space-y-6">
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <h3 className="font-bold text-xs text-emerald-900 dark:text-emerald-200">
                  Cadastro da {shopName} Pré-Aprovado com Sucesso!
                </h3>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                  Para ativar sua agenda pública e receber clientes, efetue o pagamento do {currentPlan.name}.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-4">
              <span className="text-xs uppercase font-extrabold tracking-wider text-slate-500">
                Valor do Credenciamento
              </span>
              <div className="text-3xl sm:text-4xl font-black text-orange-600 dark:text-orange-400">
                {formatCurrency(currentPlan.price)}
              </div>
              <span className="inline-block px-3 py-1 bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 font-bold text-xs rounded-full border border-orange-300 dark:border-orange-800">
                {currentPlan.name}
              </span>

              {/* PIX Key Box */}
              <div className="pt-2">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-400 block mb-1">
                  Chave PIX do Administrador Geral:
                </span>
                <div className="flex items-center justify-center gap-2 max-w-md mx-auto">
                  <div className="p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl font-mono text-xs font-bold text-slate-900 dark:text-slate-100 flex-1 truncate">
                    {platformSettings.platformPixKey}
                  </div>
                  <button
                    onClick={handleCopyPix}
                    className="p-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold text-xs flex items-center gap-1 shrink-0 transition"
                  >
                    {copiedPix ? (
                      <>
                        <Check className="w-4 h-4" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        Copiar
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Favorecido: <strong>{platformSettings.platformPixReceiver}</strong>
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="px-4 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-700"
              >
                Voltar
              </button>

              <button
                onClick={handleFinishToDashboard}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2"
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
