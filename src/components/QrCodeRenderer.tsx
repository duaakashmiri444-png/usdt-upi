import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Copy, Check, QrCode as QrIcon } from 'lucide-react';

interface QrCodeRendererProps {
  value: string;
  size?: number;
  label?: string;
  copyable?: boolean;
}

export const QrCodeRenderer: React.FC<QrCodeRendererProps> = ({
  value,
  size = 180,
  label,
  copyable = true,
}) => {
  const [qrUrl, setQrUrl] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    QRCode.toDataURL(value || 'https://upipay.exchange', {
      width: size * 2,
      margin: 1,
      color: {
        dark: '#050b14',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isMounted) {
          setQrUrl(url);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('QR generation error:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [value, size]);

  const handleCopy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="p-3 bg-white rounded-xl shadow-lg border border-slate-200 flex items-center justify-center relative group"
        style={{ width: size + 24, height: size + 24 }}
      >
        {isLoading || !qrUrl ? (
          <div className="flex flex-col items-center justify-center text-slate-400 gap-1">
            <QrIcon className="w-8 h-8 animate-pulse text-slate-300" />
            <span className="text-[11px]">Generating QR...</span>
          </div>
        ) : (
          <img
            src={qrUrl}
            alt="Payment QR Code"
            width={size}
            height={size}
            className="rounded"
          />
        )}
      </div>

      {label && <p className="text-xs text-slate-400 text-center max-w-[220px]">{label}</p>}

      {copyable && value && (
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-lg transition-colors border border-slate-700 max-w-[240px] truncate"
          title="Click to copy raw value"
        >
          {copied ? (
            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          )}
          <span className="truncate">{copied ? 'Copied to clipboard' : value}</span>
        </button>
      )}
    </div>
  );
};
