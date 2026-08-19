import React, { useState } from 'react';
import { generateQrCodeSvg } from '../../utils/pix';
import { X, Copy, Check, QrCode, Download, Share2 } from 'lucide-react';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  qrValue: string;
  footerText?: string;
  badgeText?: string;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  qrValue,
  footerText,
  badgeText,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(qrValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const svgString = generateQrCodeSvg(qrValue, 260);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 text-slate-900 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200"
        id="qr-code-modal-card"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-4">
          {badgeText && (
            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 mb-2">
              {badgeText}
            </span>
          )}
          <h3 className="text-xl font-bold">{title}</h3>
          {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{subtitle}</p>}
        </div>

        <div className="flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 mb-4">
          <div
            className="w-64 h-64 bg-white p-3 rounded-lg shadow-xs flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: svgString }}
          />
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 text-center">
            {footerText || 'Aponte a câmera do celular ou o app do banco para escanear'}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-mono break-all line-clamp-2 select-all border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300">
            {qrValue}
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-medium text-sm transition shadow-xs ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-amber-600 dark:hover:bg-amber-500'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copiado com Sucesso!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar Código
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl font-medium text-sm border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
