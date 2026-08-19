import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { generatePixPayload, generateQrCodeSvg } from '../../utils/pix';
import { formatCurrency, getTodayDateString, openWhatsApp } from '../../utils/formatters';
import confetti from 'canvas-confetti';
import {
  X,
  Copy,
  Check,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Clock,
  Send,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface BarberSubscriptionPayModalProps {
  isOpen: boolean;
  onClose: () => void;
  barbershopId: string;
}

export const BarberSubscriptionPayModal: React.FC<BarberSubscriptionPayModalProps> = ({
  isOpen,
  onClose,
  barbershopId,
}) => {
  const {
    getBarbershopById,
    platformSettings,
    submitSubscriptionPaymentProof,
  } = useApp();

  const shop = getBarbershopById(barbershopId);
  const [copiedCode, setCopiedCode] = useState(false);
  const [proofNote, setProofNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen || !shop) return null;

  const monthlyFee = shop.subscriptionMonthlyFee || platformSettings.monthlyFee;

  const pixPayload = generatePixPayload({
    pixKey: platformSettings.platformPixKey,
    receiverName: platformSettings.platformPixReceiverName,
    amount: monthlyFee,
    txId: `MENSAL${shop.slug.substring(0, 8).toUpperCase()}`,
    description: `Mensalidade BarberHub - ${shop.name}`,
  });

  const svgQrCode = generateQrCodeSvg(pixPayload, 240);

  const handleCopy = () => {
    navigator.clipboard.writeText(pixPayload);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleSubmitProof = (e: React.FormEvent) => {
    e.preventDefault();
    const note =
      proofNote.trim() ||
      `Comprovante PIX de ${formatCurrency(monthlyFee)} pago em ${getTodayDateString()}`;
    submitSubscriptionPaymentProof(shop.id, note);
    setSubmitted(true);
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });
    setTimeout(() => {
      setSubmitted(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-slate-900 dark:text-slate-100 max-h-[95vh] overflow-y-auto"
        id="barber-subscription-modal"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-300">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              Pagamento Enviado para Aprovação!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
              O Administrador Geral da plataforma foi notificado e irá validar a sua taxa mensal em instantes.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-300 dark:border-orange-800 mb-2">
                <Building2 className="w-3.5 h-3.5" />
                Taxa Mensal da Plataforma
              </span>
              <h3 className="text-xl sm:text-2xl font-black">
                Renovação / Ativação de Plano
              </h3>
              <div className="text-3xl font-black text-orange-600 dark:text-orange-400 mt-1">
                {formatCurrency(monthlyFee)}
                <span className="text-xs font-normal text-slate-400"> / mês</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Barbearia: <strong>{shop.name}</strong>
              </p>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80">
              <div
                className="w-52 h-52 bg-white p-2.5 rounded-xl shadow-xs flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: svgQrCode }}
              />
              <span className="text-[11px] text-slate-500 mt-2">
                Pague via PIX para o Administrador Geral da Plataforma
              </span>
            </div>

            {/* Beneficiary Details */}
            <div className="bg-slate-100 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1 text-slate-700 dark:text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Favorecido:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {platformSettings.platformPixReceiverName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Chave PIX da Plataforma:</span>
                <span className="font-mono font-bold text-orange-600 dark:text-orange-400">
                  {platformSettings.platformPixKey}
                </span>
              </div>
            </div>

            {/* Copy PIX button */}
            <button
              onClick={handleCopy}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 border ${
                copiedCode
                  ? 'bg-emerald-600 text-white border-transparent'
                  : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 border-slate-700'
              }`}
            >
              {copiedCode ? (
                <>
                  <Check className="w-4 h-4" />
                  Código PIX Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-orange-400" />
                  Copiar Código PIX (Copia e Cola)
                </>
              )}
            </button>

            {/* Proof submission form */}
            <form onSubmit={handleSubmitProof} className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Número do Comprovante / Observação do Pagamento
                </label>
                <input
                  type="text"
                  placeholder="Ex: PIX enviado pelo Banco Inter - Chave final 8877"
                  value={proofNote}
                  onChange={(e) => setProofNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-hidden focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Informar Pagamento ao Administrador Geral
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
