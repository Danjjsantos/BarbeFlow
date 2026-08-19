import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Barbershop, PixKeyType } from '../../types';
import { formatCurrency, formatPhone, getDayOfWeekName } from '../../utils/formatters';
import { QrCodeModal } from '../common/QrCodeModal';
import { BarberSubscriptionPayModal } from './BarberSubscriptionPayModal';
import { ChangePasswordModal } from '../common/ChangePasswordModal';
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
} from 'lucide-react';

interface BarberSettingsViewProps {
  barbershop: Barbershop;
}

export const BarberSettingsView: React.FC<BarberSettingsViewProps> = ({ barbershop }) => {
  const { updateBarbershop, platformSettings } = useApp();

  // Basic Info Form State
  const [name, setName] = useState(barbershop.name);
  const [phone, setPhone] = useState(barbershop.phone);
  const [address, setAddress] = useState(barbershop.address);
  const [city, setCity] = useState(barbershop.city);
  const [instagram, setInstagram] = useState(barbershop.instagram || '');
  const [bio, setBio] = useState(barbershop.bio);
  const [themeColor, setThemeColor] = useState(barbershop.themeColor || '#d97706');

  // PIX Key State
  const [pixKey, setPixKey] = useState(barbershop.pixKey);
  const [pixKeyType, setPixKeyType] = useState<PixKeyType>(barbershop.pixKeyType);
  const [pixReceiverName, setPixReceiverName] = useState(
    barbershop.pixReceiverName || barbershop.name
  );

  // Working Hours State
  const [slotIntervalMinutes, setSlotIntervalMinutes] = useState(
    barbershop.slotIntervalMinutes || 30
  );
  const [workingHours, setWorkingHours] = useState(barbershop.workingHours);

  // Modals
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const publicLink = `${window.location.origin}/#${barbershop.slug}`;

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
      pixKey,
      pixKeyType,
      pixReceiverName,
      slotIntervalMinutes,
      workingHours,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const isSubscriptionActive = barbershop.subscriptionStatus === 'active';
  const isSubscriptionPending = barbershop.subscriptionStatus === 'pending';

  return (
    <div className="space-y-6" id="barber-settings-view">
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

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              navigator.clipboard.writeText(publicLink);
              alert('Link da sua barbearia copiado!');
            }}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition"
          >
            Copiar Link
          </button>
          <button
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
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-500" />
                Disponibilidade da Agenda & Horários de Funcionamento
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Configure os dias em que a barbearia abre, horários de atendimento e pausas de almoço.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Intervalo entre horários:
              </label>
              <select
                value={slotIntervalMinutes}
                onChange={(e) => setSlotIntervalMinutes(Number(e.target.value))}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
              >
                <option value="20">20 minutos</option>
                <option value="30">30 minutos</option>
                <option value="45">45 minutos</option>
                <option value="60">60 minutos</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 pt-2">
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

        {/* SECTION 2: PIX Settings */}
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tipo de Chave PIX
              </label>
              <select
                value={pixKeyType}
                onChange={(e) => setPixKeyType(e.target.value as PixKeyType)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
              >
                <option value="phone">Telefone</option>
                <option value="cpf">CPF</option>
                <option value="cnpj">CNPJ</option>
                <option value="email">E-mail</option>
                <option value="random">Chave Aleatória</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chave PIX *
              </label>
              <input
                type="text"
                required
                value={pixKey}
                onChange={(e) => setPixKey(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nome do Titular da Conta PIX *
              </label>
              <input
                type="text"
                required
                value={pixReceiverName}
                onChange={(e) => setPixReceiverName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Customization & Branding */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-orange-500" />
              Personalização da Barbearia & Identidade Visual
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Personalize o nome, contato e cor de destaque da sua página de agendamentos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* Security & Access Password Section */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
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
        userName={barbershop.ownerName}
      />
    </div>
  );
};
