import React, { useState, useEffect, useRef } from 'react';
import { generatePixPayload, generateQrCodeDataUrl } from '../../utils/pix';
import {
  createMercadoPagoPix,
  checkMercadoPagoPaymentStatus,
} from '../../utils/mercadopago';
import { formatCurrency, openWhatsApp } from '../../utils/formatters';
import confetti from 'canvas-confetti';
import {
  X,
  Copy,
  Check,
  Clock,
  CheckCircle2,
  MessageSquare,
  Zap,
  RefreshCw,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  FileCheck,
  Trash2,
  ShieldCheck,
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
  barberAccessToken?: string;
  clientEmail?: string;
  clientName?: string;
  mode?: 'pix_manual' | 'pix_automatic' | 'pix';
  onConfirmSuccess: (paymentId?: string, proofUrl?: string, transactionCode?: string) => void;
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
  barberAccessToken,
  clientEmail,
  clientName,
  mode = 'pix_manual',
  onConfirmSuccess,
  isConfirmed = false,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(600); // 10 minutes
  const [paymentDone, setPaymentDone] = useState(isConfirmed);

  // Proof of payment states for Manual PIX
  const [proofFileBase64, setProofFileBase64] = useState<string>('');
  const [proofFileName, setProofFileName] = useState<string>('');
  const [transactionCodeInput, setTransactionCodeInput] = useState<string>('');
  const [proofError, setProofError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mercado Pago states
  const [isGeneratingPix, setIsGeneratingPix] = useState(false);
  const [paymentId, setPaymentId] = useState<string>('');
  const [mpQrCodePayload, setMpQrCodePayload] = useState<string>('');
  const [mpQrCodeBase64, setMpQrCodeBase64] = useState<string>('');
  const [generatedDataUrl, setGeneratedDataUrl] = useState<string>('');
  const [isRealMp, setIsRealMp] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const pollIntervalRef = useRef<any>(null);

  const isAutomaticMode = mode === 'pix_automatic' && Boolean(barberAccessToken);

  // Sync external confirmation
  useEffect(() => {
    if (isConfirmed) {
      setPaymentDone(true);
    }
  }, [isConfirmed]);

  // Initial PIX Creation (Mercado Pago for automatic mode OR static QR for manual mode)
  useEffect(() => {
    if (!isOpen || paymentDone) return;

    let isMounted = true;

    async function initPix() {
      if (isAutomaticMode) {
        setIsGeneratingPix(true);
        setApiError(null);
        try {
          const res = await createMercadoPagoPix({
            amount,
            description: description || `Agendamento - ${receiverName}`,
            payerEmail: clientEmail || 'cliente@barberhub.com.br',
            payerName: clientName || 'Cliente BarberHub',
            accessToken: barberAccessToken,
            externalReference: txId,
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
                handleApproved(pId);
              }
            } else {
              setApiError(res.error || 'Não foi possível gerar a transação no Mercado Pago');
              const fallback = generatePixPayload({
                pixKey,
                receiverName,
                amount,
                txId: txId || 'BH' + Math.floor(Math.random() * 90000 + 10000),
                description,
              });
              setMpQrCodePayload(fallback);
              const url = await generateQrCodeDataUrl(fallback, 300);
              if (isMounted) setGeneratedDataUrl(url);
            }
          }
        } catch (err: any) {
          console.error('Error generating MP Pix:', err);
          if (isMounted) {
            setApiError(err.message || 'Falha na conexão com Mercado Pago');
            const fallback = generatePixPayload({
              pixKey,
              receiverName,
              amount,
              txId: txId || 'BH' + Math.floor(Math.random() * 90000 + 10000),
              description,
            });
            setMpQrCodePayload(fallback);
            const url = await generateQrCodeDataUrl(fallback, 300);
            setGeneratedDataUrl(url);
          }
        } finally {
          if (isMounted) setIsGeneratingPix(false);
        }
      } else {
        // Manual PIX Mode: generate QR Code directly using standard EMV payload
        try {
          const fallback = generatePixPayload({
            pixKey,
            receiverName,
            amount,
            txId: txId || 'BH' + Math.floor(Math.random() * 90000 + 10000),
            description,
          });
          setMpQrCodePayload(fallback);
          const url = await generateQrCodeDataUrl(fallback, 300);
          if (isMounted) setGeneratedDataUrl(url);
        } catch (err) {
          console.warn('Error generating QR code:', err);
        }
      }
    }

    initPix();

    return () => {
      isMounted = false;
    };
  }, [isOpen, isAutomaticMode, amount, description, barberAccessToken, clientEmail, clientName, txId, pixKey, receiverName]);

  // Polling for payment status (Automatic mode only)
  useEffect(() => {
    if (!isOpen || paymentDone || !paymentId || !isAutomaticMode) {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      return;
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await checkMercadoPagoPaymentStatus(paymentId, barberAccessToken);
        if (res && res.status === 'approved') {
          handleApproved(paymentId);
        }
      } catch (e) {
        // Fail silently during polling
      }
    }, 2500);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [isOpen, paymentDone, paymentId, barberAccessToken, isAutomaticMode]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || paymentDone) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, paymentDone]);

  const handleApproved = (pId?: string, proofUrl?: string, txCode?: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    setPaymentDone(true);
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
    });
    onConfirmSuccess(pId || paymentId, proofUrl || proofFileBase64, txCode || transactionCodeInput || txId);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setProofError('O comprovante deve ter no máximo 5MB.');
      return;
    }

    setProofError(null);
    setProofFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setProofFileBase64(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleManualProofSubmit = () => {
    if (!proofFileBase64 && !transactionCodeInput.trim()) {
      setProofError('Por favor, anexe a foto/print do comprovante do PIX ou informe o código da transação.');
      return;
    }
    setProofError(null);
    handleApproved(undefined, proofFileBase64, transactionCodeInput.trim() || txId);
  };

  if (!isOpen) return null;

  const fallbackPayload = generatePixPayload({
    pixKey,
    receiverName,
    amount,
    txId: txId || 'BARBERHUB' + Math.floor(Math.random() * 90000 + 10000),
    description,
  });

  const finalPixPayload = mpQrCodePayload || fallbackPayload;

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(finalPixPayload);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleCopyKeyOnly = () => {
    navigator.clipboard.writeText(pixKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2500);
  };

  const handleSendWhatsAppProof = () => {
    if (!barberPhone) return;
    const text = `Olá! Acabei de realizar o pagamento PIX no valor de ${formatCurrency(
      amount
    )} referente ao agendamento de ${description || 'serviço'}. Segue o comprovante do PIX gerado!`;
    openWhatsApp(barberPhone, text);
  };

  const qrImageSrc = mpQrCodeBase64
    ? (mpQrCodeBase64.startsWith('data:') ? mpQrCodeBase64 : `data:image/png;base64,${mpQrCodeBase64}`)
    : generatedDataUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-7 text-slate-900 dark:text-slate-100 max-h-[92vh] overflow-y-auto"
        id="pix-payment-modal"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer z-10"
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
              {isAutomaticMode
                ? 'Recebimento validado pelo Mercado Pago. Seu horário está garantido na agenda!'
                : 'Comprovante do PIX recebido e registrado com sucesso. Seu agendamento está confirmado!'}
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
              {paymentId && (
                <div className="flex justify-between">
                  <span className="text-slate-500">ID Mercado Pago:</span>
                  <span className="font-mono text-sky-600 dark:text-sky-400 font-semibold">{paymentId}</span>
                </div>
              )}
              {txId && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Código da Transação:</span>
                  <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold">{txId}</span>
                </div>
              )}
              {proofFileName && (
                <div className="flex justify-between items-center pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-500">Comprovante Anexado:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 truncate max-w-[180px]">{proofFileName}</span>
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              {barberPhone && (
                <button
                  onClick={handleSendWhatsAppProof}
                  className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-sm text-sm cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  Avisar Barbeiro no WhatsApp
                </button>
              )}
              <button
                onClick={onClose}
                className="py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 font-semibold rounded-xl transition text-sm cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Header with Title & Price */}
            <div className="text-center mb-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-500/20 mb-1.5">
                {isAutomaticMode ? (
                  <>
                    <Zap className="w-3.5 h-3.5 text-sky-500" />
                    PIX Automático Mercado Pago
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    Pagamento via PIX + Comprovante
                  </>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-black">{title}</h3>
              <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                {formatCurrency(amount)}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {description || 'Pague com o QR Code abaixo para confirmar seu agendamento'}
              </p>
            </div>

            {/* Status & Timer badge */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-3.5">
              {isAutomaticMode ? (
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/40 py-1 px-3 rounded-full border border-sky-200 dark:border-sky-800">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span>Aguardando detecção automática...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 py-1 px-3 rounded-full border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Efetue o PIX e anexe o comprovante</span>
                </div>
              )}
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 py-1 px-3 rounded-full border border-amber-200 dark:border-amber-800">
                <Clock className="w-3 h-3" />
                <span>{formatTimer(timeLeftSeconds)}</span>
              </div>
            </div>

            {apiError && (
              <div className="mb-3 p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>{apiError}</span>
              </div>
            )}

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700/80 mb-3.5">
              {isGeneratingPix ? (
                <div className="w-48 h-48 sm:w-56 sm:h-56 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                  <span className="text-xs">Gerando QR Code PIX oficial...</span>
                </div>
              ) : qrImageSrc ? (
                <img
                  src={qrImageSrc}
                  alt="QR Code PIX"
                  className="w-48 h-48 sm:w-56 sm:h-56 bg-white p-2.5 rounded-xl shadow-xs object-contain border border-slate-100"
                />
              ) : (
                <div className="w-48 h-48 sm:w-56 sm:h-56 bg-white p-2.5 rounded-xl shadow-xs flex items-center justify-center text-xs text-slate-400">
                  Carregando QR Code...
                </div>
              )}
              <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 text-center">
                Abra o app do seu banco, escolha <strong>Pagar com PIX</strong> e aponte a câmera.
              </span>
            </div>

            {/* Beneficiary Details */}
            <div className="bg-slate-100 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1 mb-3.5 text-slate-700 dark:text-slate-300">
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
                    className="p-1 text-slate-400 hover:text-amber-500 transition cursor-pointer"
                    title="Copiar chave"
                  >
                    {copiedKey ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              {isRealMp && (
                <div className="flex justify-between items-center text-[10px] text-sky-600 dark:text-sky-400 pt-0.5">
                  <span className="flex items-center gap-1 font-semibold">
                    <Zap className="w-3 h-3" /> Mercado Pago Conectado
                  </span>
                  <span>ID: {paymentId}</span>
                </div>
              )}
            </div>

            {/* PIX Copy & Paste Button */}
            <div className="space-y-3">
              <button
                onClick={handleCopyPayload}
                className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                  copiedCode
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-700'
                }`}
              >
                {copiedCode ? (
                  <>
                    <Check className="w-4 h-4" />
                    Código PIX Copiado com Sucesso!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-emerald-400" />
                    Copiar Código PIX (Copia e Cola)
                  </>
                )}
              </button>

              {/* Attach Proof Section (Mandatory/Recommended for Manual PIX) */}
              <div className="p-3.5 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    Comprovante do PIX:
                  </span>
                  <span className="text-[10px] font-semibold text-amber-800 dark:text-amber-300">
                    {proofFileBase64 ? 'Comprovante Anexado ✓' : 'Anexe a foto do comprovante'}
                  </span>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*,.pdf"
                  className="hidden"
                />

                {proofFileBase64 ? (
                  <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-xl border border-emerald-300 dark:border-emerald-700">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <img
                        src={proofFileBase64}
                        alt="Comprovante"
                        className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div className="overflow-hidden">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                          {proofFileName || 'Comprovante-pix.jpg'}
                        </span>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          Pronto para envio
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setProofFileBase64('');
                        setProofFileName('');
                      }}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                      title="Remover comprovante"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-3 border-2 border-dashed border-amber-300 dark:border-amber-700/80 hover:border-amber-500 rounded-xl bg-white/80 dark:bg-slate-900/60 transition flex items-center justify-center gap-2 text-xs font-bold text-amber-900 dark:text-amber-300 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Clique para Anexar Comprovante do PIX</span>
                  </button>
                )}

                {proofError && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                    {proofError}
                  </p>
                )}
              </div>

              {/* Final Confirm Button */}
              <button
                type="button"
                onClick={handleManualProofSubmit}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar Agendamento com Comprovante</span>
              </button>

              <p className="text-[10px] text-center text-slate-500 dark:text-slate-400 pt-0.5">
                {isAutomaticMode
                  ? 'A validação automática acontece em segundos, ou você pode confirmar com o comprovante acima.'
                  : 'Após anexar o comprovante, seu agendamento fica garantido e o barbeiro recebe os dados.'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
