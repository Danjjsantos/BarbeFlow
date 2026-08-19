import React, { useState, useEffect } from 'react';
import { generatePixPayload, generateQrCodeSvg } from '../../utils/pix';
import { formatCurrency, openWhatsApp } from '../../utils/formatters';
import confetti from 'canvas-confetti';
import {
  X,
  Copy,
  Check,
  QrCode,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Phone,
  MessageSquare,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface PixPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  amount: number;
  pixKey: string;
  pixKeyType?: string;
  receiverName: string;
  description?: string;
  txId?: string;
  barberPhone?: string;
  onConfirmSuccess: () => void;
  isConfirmed?: boolean;
}

export const PixPaymentModal: React.FC<PixPaymentModalProps> = ({
  isOpen,
  onClose,
  title = 'Pagamento via PIX',
  amount,
  pixKey,
  receiverName,
  description,
  txId,
  barberPhone,
  onConfirmSuccess,
  isConfirmed = false,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(600); // 10 minutes
  const [paymentDone, setPaymentDone] = useState(isConfirmed);

  useEffect(() => {
    setPaymentDone(isConfirmed);
  }, [isConfirmed]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || paymentDone) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, paymentDone]);

  if (!isOpen) return null;

  const pixPayload = generatePixPayload({
    pixKey,
    receiverName,
    amount,
    txId: txId || 'BARBERHUB' + Math.floor(Math.random() * 90000 + 10000),
    description,
  });

  const svgQrCode = generateQrCodeSvg(pixPayload, 260);

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(pixPayload);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyKeyOnly = () => {
    navigator.clipboard.writeText(pixKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleConfirmPix = () => {
    setPaymentDone(true);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });
    onConfirmSuccess();
  };

  const handleSendWhatsAppProof = () => {
    if (!barberPhone) return;
    const text = `Olá! Acabei de realizar o pagamento PIX no valor de ${formatCurrency(
      amount
    )} referente ao agendamento de ${description || 'serviço'}. Segue o código de confirmação: ${txId || ''}`;
    openWhatsApp(barberPhone, text);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-slate-900 dark:text-slate-100 max-h-[95vh] overflow-y-auto"
        id="pix-payment-modal"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {paymentDone ? (
          <div className="text-center py-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-300 dark:border-emerald-700 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              Pagamento PIX Confirmado!
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-sm mx-auto">
              Seu horário está garantido na agenda. O barbeiro recebeu a notificação do seu agendamento.
            </p>

            <div className="mt-6 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Valor Pago:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Beneficiário:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{receiverName}</span>
              </div>
              {txId && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Código da Transação:</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">{txId}</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              {barberPhone && (
                <button
                  onClick={handleSendWhatsAppProof}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm text-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  Avisar Barbeiro no WhatsApp
                </button>
              )}
              <button
                onClick={onClose}
                className="py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold rounded-xl transition text-sm"
              >
                Concluir
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header with Title & Price */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20 mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                PIX Instantâneo & Seguro
              </div>
              <h3 className="text-xl sm:text-2xl font-black">{title}</h3>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
                {formatCurrency(amount)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {description || 'Confirmação automática do agendamento'}
              </p>
            </div>

            {/* Timer countdown pill */}
            <div className="flex items-center justify-center gap-2 mb-4 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 py-1.5 px-3 rounded-full w-fit mx-auto border border-amber-200 dark:border-amber-800">
              <Clock className="w-3.5 h-3.5" />
              <span>QR Code válido por: {formatTimer(timeLeftSeconds)}</span>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/80 mb-5">
              <div
                className="w-56 h-56 sm:w-60 sm:h-60 bg-white p-2.5 rounded-xl shadow-xs flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: svgQrCode }}
              />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 text-center">
                Abra o aplicativo do seu banco, escolha <strong>Pagar com PIX</strong> e aponte a câmera.
              </span>
            </div>

            {/* Beneficiary Details */}
            <div className="bg-slate-100 dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5 mb-5 text-slate-700 dark:text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Recebedor:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{receiverName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Chave PIX:</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-medium text-slate-900 dark:text-slate-100">{pixKey}</span>
                  <button
                    onClick={handleCopyKeyOnly}
                    className="p-1 text-slate-400 hover:text-amber-500 transition"
                    title="Copiar chave"
                  >
                    {copiedKey ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            </div>

            {/* PIX Copy & Paste Button */}
            <div className="space-y-2.5">
              <button
                onClick={handleCopyPayload}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2 shadow-xs ${
                  copiedCode
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-700'
                }`}
              >
                {copiedCode ? (
                  <>
                    <Check className="w-4 h-4" />
                    Código PIX Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-emerald-400" />
                    Copiar Código PIX (Copia e Cola)
                  </>
                )}
              </button>

              {/* Confirm Payment Action */}
              <button
                onClick={handleConfirmPix}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                Já realizei o pagamento PIX
              </button>

              <p className="text-[11px] text-center text-slate-500 dark:text-slate-400 pt-1">
                Ao clicar em confirmar, seu agendamento será registrado imediatamente.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
