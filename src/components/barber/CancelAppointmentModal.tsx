import React, { useState, useEffect } from 'react';
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
  MessageSquare,
  Copy,
  Check,
  Send,
  Calendar,
  Clock,
  User,
  Scissors,
  DollarSign,
  Info,
} from 'lucide-react';

interface CancelAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  barbershop: Barbershop;
  onConfirmCancel: (appointmentId: string, reason: string) => void;
}

const PRESET_REASONS = [
  'Imprevisto pessoal / saúde do barbeiro',
  'Problema técnico / falta de energia na barbearia',
  'Horário indisponível / necessidade de remarcação',
  'Cliente solicitou o cancelamento via mensagem',
  'Outro motivo personalizado',
];

export const CancelAppointmentModal: React.FC<CancelAppointmentModalProps> = ({
  isOpen,
  onClose,
  appointment,
  barbershop,
  onConfirmCancel,
}) => {
  if (!isOpen || !appointment) return null;

  const [selectedReasonOption, setSelectedReasonOption] = useState<string>(PRESET_REASONS[0]);
  const [customReasonText, setCustomReasonText] = useState<string>('');
  const [autoOpenWhatsApp, setAutoOpenWhatsApp] = useState<boolean>(true);
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [refundInstruction, setRefundInstruction] = useState<string>(
    appointment.status === 'confirmed'
      ? 'Como seu pagamento via PIX foi confirmado, favor informar sua chave para estorno imediato ou utilizar como crédito para remarcação.'
      : ''
  );

  const effectiveReason =
    selectedReasonOption === 'Outro motivo personalizado'
      ? customReasonText || 'Imprevisto na barbearia'
      : selectedReasonOption;

  // Build default message
  const generateWhatsAppMessage = () => {
    const isPixPaid = appointment.status === 'confirmed';
    return (
      `Olá *${appointment.clientName}*, tudo bem?\n\n` +
      `Aqui é *${barbershop.ownerName}* da *${barbershop.name}*.\n\n` +
      `Infelizmente precisei cancelar o seu agendamento de:\n` +
      `✂️ *Serviço:* ${appointment.serviceName} (${formatCurrency(appointment.servicePrice)})\n` +
      `📅 *Data:* ${formatDateBr(appointment.date)} às ${appointment.time}\n` +
      `⚠️ *Motivo:* ${effectiveReason}\n\n` +
      (isPixPaid && refundInstruction
        ? `💰 *Pagamento PIX:* ${refundInstruction}\n\n`
        : '') +
      `Pedimos sinceras desculpas pelo transtorno e estamos à disposição para reagendar para o melhor horário para você!\n\n` +
      `Qualquer dúvida ou para remarcar, por favor responda a esta mensagem. Obrigado pela compreensão!`
    );
  };

  const [customMessage, setCustomMessage] = useState<string>(generateWhatsAppMessage());

  // Update generated message when reason or refund instruction changes
  useEffect(() => {
    setCustomMessage(generateWhatsAppMessage());
  }, [selectedReasonOption, customReasonText, refundInstruction]);

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(customMessage);
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
    } catch (err) {
      console.error('Falha ao copiar texto', err);
    }
  };

  const handleSubmitCancel = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Trigger cancellation in application context
    onConfirmCancel(appointment.id, effectiveReason);

    // 2. Open WhatsApp if selected
    if (autoOpenWhatsApp && appointment.clientPhone) {
      openWhatsApp(appointment.clientPhone, customMessage);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-rose-50 dark:bg-rose-950/30 border-b border-rose-100 dark:border-rose-900/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/30">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                Cancelar Atendimento
              </h3>
              <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                Notificação automática para o cliente via WhatsApp
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-white/50 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
          {/* Appointment Details Summary Box */}
          <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] uppercase font-bold text-slate-400">
                Dados do Agendamento
              </span>
              {appointment.status === 'confirmed' ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  PIX Confirmado ({formatCurrency(appointment.servicePrice)})
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Pendente PIX ({formatCurrency(appointment.servicePrice)})
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {appointment.clientName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300 font-mono">
                  {formatPhone(appointment.clientPhone)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Scissors className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="text-slate-700 dark:text-slate-300 font-medium">
                  {appointment.serviceName}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {formatDateBr(appointment.date)} às {appointment.time}
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmitCancel} id="cancel-appointment-form" className="space-y-4">
            {/* Reason selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Motivo do Cancelamento *
              </label>
              <select
                value={selectedReasonOption}
                onChange={(e) => setSelectedReasonOption(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              >
                {PRESET_REASONS.map((reason, idx) => (
                  <option key={idx} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom reason input if selected */}
            {selectedReasonOption === 'Outro motivo personalizado' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Descreva o motivo que será informado ao cliente:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Reforma elétrica na barbearia no período da tarde"
                  value={customReasonText}
                  onChange={(e) => setCustomReasonText(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>
            )}

            {/* PIX Refund Instruction (if appointment was confirmed) */}
            {appointment.status === 'confirmed' && (
              <div>
                <label className="block text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                  Instruções sobre o PIX já pago:
                </label>
                <input
                  type="text"
                  value={refundInstruction}
                  onChange={(e) => setRefundInstruction(e.target.value)}
                  placeholder="Ex: Envie sua chave para estorno ou use como crédito"
                  className="w-full px-3 py-2 bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            {/* WhatsApp Message Preview & Edit */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                  Mensagem que será enviada para o Cliente:
                </label>

                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  {copiedSuccess ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      Copiar texto
                    </>
                  )}
                </button>
              </div>

              <textarea
                rows={6}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-200 font-mono leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Auto Open WhatsApp Checkbox */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-xl flex items-start gap-2.5">
              <input
                type="checkbox"
                id="auto-whatsapp"
                checked={autoOpenWhatsApp}
                onChange={(e) => setAutoOpenWhatsApp(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded-md text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer"
              />
              <label
                htmlFor="auto-whatsapp"
                className="text-xs text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
              >
                <strong>Abrir WhatsApp automaticamente</strong> com a mensagem pronta para envio para o número{' '}
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                  {formatPhone(appointment.clientPhone)}
                </span>
                .
              </label>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition"
          >
            Voltar / Não Cancelar
          </button>

          <button
            type="submit"
            form="cancel-appointment-form"
            className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Confirmar Cancelamento & Notificar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
