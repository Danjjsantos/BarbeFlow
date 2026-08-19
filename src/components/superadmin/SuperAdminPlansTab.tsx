import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { SubscriptionPlan, SubscriptionPlanPeriod } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import {
  Sparkles,
  Check,
  Save,
  Plus,
  Trash2,
  Tag,
  Percent,
  Calendar,
  Layers,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';

export const SuperAdminPlansTab: React.FC = () => {
  const { subscriptionPlans, updateSubscriptionPlan } = useApp();
  const [selectedPlanId, setSelectedPlanId] = useState<SubscriptionPlanPeriod>('semiannual');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const currentPlan =
    subscriptionPlans.find((p) => p.id === selectedPlanId) || subscriptionPlans[0];

  // Local form state for the currently active editing plan
  const [name, setName] = useState(currentPlan.name);
  const [price, setPrice] = useState(String(currentPlan.price));
  const [originalPrice, setOriginalPrice] = useState(
    currentPlan.originalPrice ? String(currentPlan.originalPrice) : ''
  );
  const [monthlyEquivalent, setMonthlyEquivalent] = useState(
    String(currentPlan.monthlyEquivalent)
  );
  const [discountPercent, setDiscountPercent] = useState(
    currentPlan.discountPercent ? String(currentPlan.discountPercent) : '0'
  );
  const [description, setDescription] = useState(currentPlan.description);
  const [badge, setBadge] = useState(currentPlan.badge || '');
  const [isPopular, setIsPopular] = useState(Boolean(currentPlan.isPopular));
  const [features, setFeatures] = useState<string[]>([...currentPlan.features]);
  const [newFeatureText, setNewFeatureText] = useState('');
  const [active, setActive] = useState(currentPlan.active);

  // When switching selected plan tab, sync local edit state
  const handleSelectPlan = (planId: SubscriptionPlanPeriod) => {
    setSelectedPlanId(planId);
    const target = subscriptionPlans.find((p) => p.id === planId);
    if (target) {
      setName(target.name);
      setPrice(String(target.price));
      setOriginalPrice(target.originalPrice ? String(target.originalPrice) : '');
      setMonthlyEquivalent(String(target.monthlyEquivalent));
      setDiscountPercent(target.discountPercent ? String(target.discountPercent) : '0');
      setDescription(target.description);
      setBadge(target.badge || '');
      setIsPopular(Boolean(target.isPopular));
      setFeatures([...target.features]);
      setActive(target.active);
      setSaveSuccess(false);
    }
  };

  // Auto-calculate monthly equivalent and discount when price changes
  const handlePriceChange = (val: string) => {
    setPrice(val);
    const numPrice = parseFloat(val) || 0;
    if (currentPlan.periodMonths > 1) {
      const eq = (numPrice / currentPlan.periodMonths).toFixed(2);
      setMonthlyEquivalent(eq);
    } else {
      setMonthlyEquivalent(val);
    }
  };

  const handleAddFeature = () => {
    if (!newFeatureText.trim()) return;
    setFeatures((prev) => [...prev, newFeatureText.trim()]);
    setNewFeatureText('');
  };

  const handleRemoveFeature = (index: number) => {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const numPrice = parseFloat(price) || 49.9;
    const numOriginal = originalPrice ? parseFloat(originalPrice) : undefined;
    const numMonthlyEq = parseFloat(monthlyEquivalent) || numPrice / currentPlan.periodMonths;
    const numDiscount = discountPercent ? parseInt(discountPercent, 10) : undefined;

    updateSubscriptionPlan(selectedPlanId, {
      name,
      price: numPrice,
      originalPrice: numOriginal,
      monthlyEquivalent: numMonthlyEq,
      discountPercent: numDiscount,
      description,
      badge: badge.trim() || undefined,
      isPopular,
      features,
      active,
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6" id="super-admin-plans-tab">
      {/* Header Info */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 mb-2">
            <Tag className="w-3.5 h-3.5" />
            Monetização & Planos de Adesão
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
            Planos de Credenciamento para Barbearias
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Configure os valores, descontos promocionais e benefícios dos planos <strong>Mensal</strong>, <strong>Semestral</strong> e <strong>Anual</strong>. As alterações serão refletidas instantaneamente na página de apresentação e no cadastro de novos barbeiros.
          </p>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-300 rounded-2xl text-xs font-bold animate-in fade-in">
            <CheckCircle2 className="w-4 h-4" />
            Plano atualizado com sucesso!
          </div>
        )}
      </div>

      {/* Plan Selector Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {subscriptionPlans.map((plan) => {
          const isSelected = plan.id === selectedPlanId;
          return (
            <button
              key={plan.id}
              onClick={() => handleSelectPlan(plan.id)}
              className={`p-5 rounded-3xl text-left border-2 transition-all relative flex flex-col justify-between ${
                isSelected
                  ? 'border-orange-500 bg-orange-50/50 dark:bg-orange-950/20 shadow-md ring-2 ring-orange-500/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-orange-300 dark:hover:border-orange-800'
              }`}
            >
              {plan.isPopular && (
                <span className="absolute -top-3 right-4 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-600 text-white shadow-xs">
                  Mais Popular
                </span>
              )}
              {plan.badge && !plan.isPopular && (
                <span className="absolute -top-3 right-4 px-3 py-0.5 rounded-full text-[10px] font-black tracking-wider bg-amber-500 text-slate-950 shadow-xs">
                  {plan.badge}
                </span>
              )}

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-orange-500" />
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {plan.name}
                  </span>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                  {plan.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-baseline justify-between">
                <div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {formatCurrency(plan.price)}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {plan.periodMonths === 1
                      ? 'por mês'
                      : `eq. a ${formatCurrency(plan.monthlyEquivalent)}/mês`}
                  </span>
                </div>
                {plan.discountPercent && plan.discountPercent > 0 && (
                  <span className="px-2 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-extrabold">
                    {plan.discountPercent}% OFF
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Editor & Live Preview Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Column */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-500" />
              Editar {currentPlan.name}
            </h3>
            <span className="text-xs text-slate-400">
              Período: <strong>{currentPlan.periodMonths} {currentPlan.periodMonths === 1 ? 'mês' : 'meses'}</strong>
            </span>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Título do Plano *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Badge / Selo de Destaque
                </label>
                <input
                  type="text"
                  placeholder="Ex: Mais Popular, Sem Fidelidade, 25% OFF"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            {/* Pricing Section */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
              <span className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Percent className="w-4 h-4 text-orange-500" />
                Valores e Precificação da Taxa
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Preço Cobrado (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    required
                    min="0"
                    value={price}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-orange-300 dark:border-orange-700 rounded-xl text-base font-black text-orange-600 dark:text-orange-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Preço Original Riscado (R$)
                  </label>
                  <input
                    type="number"
                    step="0.10"
                    min="0"
                    placeholder="Opcional"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-500 line-through focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Desconto Exibido (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={discountPercent}
                    onChange={(e) => setDiscountPercent(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {currentPlan.periodMonths > 1 && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    Equivalente Mensal (R$/mês)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={monthlyEquivalent}
                    onChange={(e) => setMonthlyEquivalent(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Calculado: {formatCurrency(parseFloat(price) || 0)} / {currentPlan.periodMonths} meses = <strong>{formatCurrency((parseFloat(price) || 0) / currentPlan.periodMonths)}/mês</strong>
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Descrição do Plano
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                placeholder="Breve descrição dos benefícios e público alvo..."
              />
            </div>

            {/* Features List */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Benefícios Inclusos no Plano ({features.length})
              </label>
              <div className="space-y-2 mb-3">
                {features.map((feat, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="flex-1 font-medium">{feat}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                      title="Remover benefício"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add New Feature */}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Novo benefício (ex: Suporte VIP 24h)..."
                  value={newFeatureText}
                  onChange={(e) => setNewFeatureText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddFeature();
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
                <button
                  type="button"
                  onClick={handleAddFeature}
                  className="px-3.5 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar
                </button>
              </div>
            </div>

            {/* Checkbox Options */}
            <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isPopular}
                  onChange={(e) => setIsPopular(e.target.checked)}
                  className="rounded-md border-slate-300 text-orange-500 focus:ring-orange-500"
                />
                Destacar como "Mais Popular"
              </label>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded-md border-slate-300 text-orange-500 focus:ring-orange-500"
                />
                Plano Ativo para Novos Cadastros
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="submit"
                className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 text-xs"
              >
                <Save className="w-4 h-4" />
                Salvar Alterações no {name}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 dark:text-slate-400">
            <Layers className="w-4 h-4 text-orange-500" />
            Pré-visualização do Cartão na Landing Page
          </div>

          <div
            className={`rounded-3xl p-6 sm:p-7 border-2 transition-all relative flex flex-col justify-between ${
              isPopular
                ? 'border-orange-500 bg-gradient-to-b from-orange-950/40 via-slate-900 to-slate-900 text-white shadow-xl shadow-orange-950/30'
                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md'
            }`}
          >
            {isPopular && (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-orange-600 text-white shadow-md">
                Mais Popular
              </span>
            )}
            {badge && !isPopular && (
              <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-black tracking-wider bg-amber-500 text-slate-950 shadow-md">
                {badge}
              </span>
            )}

            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <h4 className="text-xl font-black">{name || 'Nome do Plano'}</h4>
                {discountPercent && parseInt(discountPercent, 10) > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black border border-emerald-500/30">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-400 mb-6 line-clamp-2">
                {description || 'Descrição do plano configurado.'}
              </p>

              {/* Price Display */}
              <div className="mb-6 p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-baseline gap-2">
                  {originalPrice && parseFloat(originalPrice) > 0 && (
                    <span className="text-xs text-slate-400 line-through">
                      {formatCurrency(parseFloat(originalPrice))}
                    </span>
                  )}
                  <span className="text-3xl font-black text-orange-600 dark:text-orange-400">
                    {formatCurrency(parseFloat(price) || 0)}
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {currentPlan.periodMonths === 1
                    ? 'Cobrado mensalmente via PIX'
                    : `Equivalente a apenas ${formatCurrency(parseFloat(monthlyEquivalent) || 0)}/mês`}
                </div>
              </div>

              {/* Features list */}
              <div className="space-y-2.5 text-xs">
                <span className="font-bold text-[11px] uppercase tracking-wider text-slate-400">
                  O que está incluso:
                </span>
                {features.map((f, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-slate-700 dark:text-slate-300 font-medium">
                      {f}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                disabled
                className="w-full py-3 bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md cursor-not-allowed opacity-90 text-center"
              >
                Credenciar Minha Barbearia ({name})
              </button>
              <p className="text-[10px] text-center text-slate-400 mt-2">
                Simulação do botão de credenciamento
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
