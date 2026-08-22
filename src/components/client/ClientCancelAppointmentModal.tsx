import React, { useState } from 'react';
import { Appointment, Barbershop } from '../../types';
import {
  formatCurrency,
  formatDateBr,
  formatDateExtenso,
  formatPhone,
  openWhatsApp,
} from '../../utils/formatters';
import {
  AlertTriangle,
  X,
  Calendar,
  Clock,
  Scissors,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Undo2,
} from 'lucide-react';

interface ClientCancelAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  barbershop?: Barbershop;
  onConfirmCancel: (appointmentId: string, reason: string) => void;
}

const PRESET_CLIENT_REASONS = [
  'Imprevisto pessoal ou familiar',
  'Horário incompatível com novo compromisso',
  'Desejo reagendar para outro dia / horário',
  'Problema de transporte ou trânsito',
  'Outro motivo personalizado',
];

export const ClientCancelAppointmentModal: React.FC<ClientCancelAppointmentModalProps> = ({
  isOpen,
  onClose,
  appointment,
  barbershop,
  onConfirmCancel,
}) => {
  if (!isOpen || !appointment) return null;

  const [selectedReason, setSelectedReason] = useState<string>(PRESET_CLIENT_REASONS[0]);
  const [customReasonText, setCustomReasonText] = useState<string>('');
  const [notifyWhatsApp, setNotifyWhatsApp] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const effectiveReason =
    selectedReason === 'Outro motivo personalizado'
      ? customReasonText.trim() || 'Cancelamento solicitado pelo cliente'
      : selectedReason;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    onConfirmCancel(appointment.id, effectiveReason);

    // If opted into sending WhatsApp notification to barbershop
    if (notifyWhatsApp && barbershop?.phone) {
      const msg =
        `Olá *${barbershop.name}*! 👋\n\n` +
        `Eu sou o(a) cliente *${appointment.clientName}* e informo que precisei cancelar o meu agendamento de *${appointment.serviceName}* no dia *${formatDateBr(appointment.date)}* às *${appointment.time}*.\n\n` +
        `📝 *Motivo:* ${effectiveReason}\n\n` +
        `O horário já foi liberado no sistema. Agradeço pela compreensão e em breve realizo um novo agendamento!`;
      openWhatsApp(barbershop.phone, msg);
    }

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-rose-50/70 dark:bg-rose-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-800 shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Cancelar Agendamento
              </h2>
              <p className="text-xs text-rose-700 dark:text-rose-400 font-semibold">
                O horário será liberado na agenda da barbearia
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center transition border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="p-5 sm:p-6 space-y-5">
          {/* Appointment Summary Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Scissors className="w-4 h-4 text-amber-500" />
                {appointment.serviceName}
              </span>
              <span className="text-sm font-black text-slate-900 dark:text-white">
                {formatCurrency(appointment.servicePrice)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <span>{formatDateBr(appointment.date)}</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-amber-600 dark:text-amber-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{appointment.time} ({appointment.durationMinutes} min)</span>
              </div>
            </div>

            {barbershop && (
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                Barbearia: <strong>{barbershop.name}</strong> • Profissional: <strong>{appointment.barberName}</strong>
              </div>
            )}
          </div>

          {/* Schedule Release Explanation Box */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-xs text-emerald-900 dark:text-emerald-300 space-y-1">
            <div className="font-black flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              Liberação Imediata do Horário
            </div>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-300/90 leading-relaxed font-medium">
              Ao confirmar o cancelamento, o horário das <strong>{appointment.time}</strong> no dia <strong>{formatDateBr(appointment.date)}</strong> ficará imediatamente disponível na agenda online para que você ou outro cliente possam agendar.
            </p>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-900 dark:text-slate-200">
              Motivo do Cancelamento
            </label>
            <div className="space-y-1.5">
              {PRESET_CLIENT_REASONS.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                    selectedReason === reason
                      ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-500 font-bold text-slate-900 dark:text-white'
                      : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancel_reason"
                    checked={selectedReason === reason}
                    onChange={() => setSelectedReason(reason)}
                    className="text-amber-600 focus:ring-amber-500"
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            {selectedReason === 'Outro motivo personalizado' && (
              <div className="mt-2 animate-fade-in">
                <input
                  type="text"
                  required
                  placeholder="Descreva brevemente o motivo..."
                  value={customReasonText}
                  onChange={(e) => setCustomReasonText(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border-2 border-slate-300 dark:border-slate-600 rounded-xl text-xs font-bold text-black placeholder:text-slate-400 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            )}
          </div>

          {/* WhatsApp notification checkbox */}
          {barbershop?.phone && (
            <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyWhatsApp}
                onChange={(e) => setNotifyWhatsApp(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded-md focus:ring-emerald-500"
              />
              <span className="flex items-center gap-1.5 font-semibold">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                Avisar a barbearia pelo WhatsApp após confirmar
              </span>
            </label>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
            >
              Voltar / Manter Agendamento
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-black shadow-lg shadow-rose-600/20 active:scale-95 transition flex items-center gap-2 cursor-pointer"
            >
              <AlertTriangle className="w-4 h-4" />
              <span>Confirmar Cancelamento e Liberar Horário</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
