import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { generatePixPayload, generateQrCodeDataUrl } from '../../utils/pix';
import {
  createMercadoPagoPix,
  checkMercadoPagoPaymentStatus,
} from '../../utils/mercadopago';
import { formatCurrency, getTodayDateString } from '../../utils/formatters';
import confetti from 'canvas-confetti';
import {
  X,
  Copy,
  Check,
  Building2,
  CheckCircle2,
  Send,
  Zap,
  RefreshCw,
  AlertTriangle,
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
    approveBarbershopSubscription,
    updateBarbershop,
  } = useApp();

  const shop = getBarbershopById(barbershopId);
  const [copiedCode, setCopiedCode] = useState(false);
  const [proofNote, setProofNote] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isApprovedAuto, setIsApprovedAuto] = useState(false);

  // Mercado Pago states
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [paymentId, setPaymentId] = useState<string>('');
  const [mpQrCodePayload, setMpQrCodePayload] = useState<string>('');
  const [mpQrCodeBase64, setMpQrCodeBase64] = useState<string>('');
  const [generatedDataUrl, setGeneratedDataUrl] = useState<string>('');
  const [isRealMp, setIsRealMp] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const pollIntervalRef = useRef<any>(null);

  const monthlyFee = shop ? shop.subscriptionMonthlyFee || platformSettings.monthlyFee : 49.9;

  // Initialize PIX via Mercado Pago
  useEffect(() => {
    if (!isOpen || !shop || submitted || isApprovedAuto) return;

    let isMounted = true;

    async function initSubscriptionPix() {
      setIsGeneratingPix(true);
      setApiError(null);
      try {
        const phoneDigits = (shop?.ownerPhone || '').replace(/\D/g, '');
        const res = await createMercadoPagoPix({
          amount: monthlyFee,
          description: `Mensalidade BarberHub - ${shop?.name || 'Assinatura'}`,
          payerEmail: phoneDigits ? `barbeiro_${phoneDigits}@barberhub.com.br` : 'barbeiro@barberhub.com.br',
          payerName: shop?.ownerName || shop?.name || 'Barbeiro Parceiro',
          accessToken: platformSettings.mercadoPagoAccessToken,
          externalReference: `sub_${shop?.id}_${Date.now()}`,
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
              handleAutoApproved();
            }
          } else {
            setApiError(res.error || 'Não foi possível conectar ao Mercado Pago da plataforma');
            const fallback = generatePixPayload({
              pixKey: platformSettings.platformPixKey,
              receiverName: platformSettings.platformPixReceiverName,
              amount: monthlyFee,
              txId: `MENSAL${shop?.slug.substring(0, 8).toUpperCase()}`,
              description: `Mensalidade BarberHub - ${shop?.name}`,
            });
            setMpQrCodePayload(fallback);
            const url = await generateQrCodeDataUrl(fallback, 300);
            if (isMounted) setGeneratedDataUrl(url);
          }
        }
      } catch (err: any) {
        console.error('Error generating Subscription Pix:', err);
        if (isMounted) {
          setApiError(err.message || 'Falha ao gerar QR Code');
          const fallback = generatePixPayload({
            pixKey: platformSettings.platformPixKey,
            receiverName: platformSettings.platformPixReceiverName,
            amount: monthlyFee,
            txId: `MENSAL${shop?.slug.substring(0, 8).toUpperCase()}`,
            description: `Mensalidade BarberHub - ${shop?.name}`,
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
  }, [isOpen, shop, monthlyFee, platformSettings.mercadoPagoAccessToken, platformSettings.platformPixKey, platformSettings.platformPixReceiverName]);

  // Polling for Mercado Pago status
  useEffect(() => {
    if (!isOpen || !shop || submitted || isApprovedAuto || !paymentId) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      return;
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await checkMercadoPagoPaymentStatus(paymentId, platformSettings.mercadoPagoAccessToken);
        if (res && res.status === 'approved') {
          handleAutoApproved();
        }
      } catch (e) {
        // silent polling catch
      }
    }, 2500);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isOpen, shop, submitted, isApprovedAuto, paymentId, platformSettings.mercadoPagoAccessToken]);

  const handleAutoApproved = () => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setIsApprovedAuto(true);
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
    });

    if (shop) {
      approveBarbershopSubscription(shop.id, 30);
    }

    setTimeout(() => {
      onClose();
    }, 3000);
  };

  if (!isOpen || !shop) return null;

  const fallbackPixPayload = generatePixPayload({
    pixKey: platformSettings.platformPixKey,
    receiverName: platformSettings.platformPixReceiverName,
    amount: monthlyFee,
    txId: `MENSAL${shop.slug.substring(0, 8).toUpperCase()}`,
    description: `Mensalidade BarberHub - ${shop.name}`,
  });

  const finalPixPayload = mpQrCodePayload || fallbackPixPayload;

  const handleCopy = () => {
    navigator.clipboard.writeText(finalPixPayload);
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
    }, 2500);
  };

  const qrImageSrc = mpQrCodeBase64
    ? (mpQrCodeBase64.startsWith('data:') ? mpQrCodeBase64 : `data:image/png;base64,${mpQrCodeBase64}`)
    : generatedDataUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 text-slate-900 dark:text-slate-100 max-h-[95vh] overflow-y-auto"
        id="barber-subscription-modal"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {isApprovedAuto ? (
          <div className="text-center py-6 animate-in fade-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-300">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              Assinatura Ativada com Sucesso!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
              Pagamento PIX confirmado via Mercado Pago. Sua barbearia está 100% ativa para receber clientes!
            </p>
          </div>
        ) : submitted ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-300">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              Pagamento Enviado para Aprovação!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto">
              O Administrador Geral da plataforma foi notificado e validará seu plano em instantes.
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

            {/* Status pill */}
            <div className="flex items-center justify-center gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 py-1 px-3 rounded-full border border-sky-200 dark:border-sky-800">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Aguardando confirmação bancária em tempo real...</span>
              </div>
            </div>

            {apiError && (
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{apiError}</span>
              </div>
            )}

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700/80">
              {isGeneratingPix ? (
                <div className="w-52 h-52 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
                  <span className="text-xs">Gerando PIX Mercado Pago...</span>
                </div>
              ) : qrImageSrc ? (
                <img
                  src={qrImageSrc}
                  alt="QR Code PIX Assinatura"
                  className="w-52 h-52 bg-white p-3 rounded-xl shadow-xs object-contain border border-slate-100"
                />
              ) : (
                <div className="w-52 h-52 bg-white p-3 rounded-xl shadow-xs flex items-center justify-center text-xs text-slate-400">
                  Carregando QR Code...
                </div>
              )}
              <span className="text-[11px] text-slate-500 mt-2">
                Pague via PIX no seu banco para ativar o plano instantaneamente
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
              {paymentId && (
                <div className="flex justify-between items-center text-[10px] text-sky-600 dark:text-sky-400 pt-0.5">
                  <span className="flex items-center gap-1 font-semibold">
                    <Zap className="w-3 h-3" /> Mercado Pago ID
                  </span>
                  <span>{paymentId}</span>
                </div>
              )}
            </div>

            {/* Copy PIX button */}
            <button
              onClick={handleCopy}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition flex items-center justify-center gap-2 border cursor-pointer ${
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
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                Informar Pagamento Manual ao Administrador
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
