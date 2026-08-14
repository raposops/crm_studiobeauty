'use client';

import { useState } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  Zap,
  Sparkles,
  AlertCircle,
  Loader2,
  Clock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface AssinaturaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AssinaturaModal({ isOpen, onClose }: AssinaturaModalProps) {
  const { salao, salaoId, refreshAuth } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedPix, setCopiedPix] = useState(false);

  // Payment result state
  const [pixData, setPixData] = useState<{
    encodedImage: string;
    payload: string;
    expirationDate: string;
  } | null>(null);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);

  if (!isOpen) return null;

  const statusAssinatura = salao?.status_assinatura || 'ativo';
  const isAtivo = statusAssinatura === 'ativo';

  async function handleGerarPix() {
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/asaas/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salaoId,
          plano: salao?.plano || 'pro',
          valor: 97.00,
          billingType: 'PIX',
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Falha ao gerar cobrança no Asaas.');
      }

      if (data.pix) {
        setPixData(data.pix);
      }
      if (data.payment?.invoiceUrl) {
        setInvoiceUrl(data.payment.invoiceUrl);
      }
    } catch (err: any) {
      console.error('Erro ao gerar checkout Asaas:', err);
      setErrorMessage(err?.message || 'Não foi possível conectar com o Asaas Sandbox. Verifique sua chave de API.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleCopyPayload() {
    if (pixData?.payload && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(pixData.payload);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2500);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-background border border-border rounded-3xl p-6 space-y-5 shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-accent to-purple-600 flex items-center justify-center text-white shadow-md shadow-accent/20">
              <CreditCard size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Minha Assinatura SaaS
              </h3>
              <p className="text-xs text-muted">Gestão do Plano & Pagamento Asaas</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center text-muted hover:text-foreground transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Plan Card */}
        <div className="relative overflow-hidden rounded-3xl border border-accent/30 bg-gradient-to-br from-accent/10 via-card to-background p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-accent/20 text-accent-light border border-accent/30 flex items-center gap-1">
              <Sparkles size={12} />
              Plano {salao?.plano?.toUpperCase() || 'PRO'}
            </span>

            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                isAtivo
                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isAtivo ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
              {isAtivo ? 'Assinatura Ativa' : 'Pendente de Pagamento'}
            </span>
          </div>

          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-foreground">R$ 97,00</span>
              <span className="text-xs text-muted font-medium">/ mês</span>
            </div>
            <p className="text-xs text-muted mt-1">
              Cobrança processada de forma segura via <strong>Asaas Gateway</strong>.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-border/50 text-xs text-foreground/80">
            <div className="flex items-center gap-2">
              <ShieldCheck size={15} className="text-emerald-500 shrink-0" />
              <span>Acesso ilimitado à Agenda & Profissionais</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap size={15} className="text-accent-light shrink-0" />
              <span>Controle Financeiro & Fluxo de Caixa Completo</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles size={15} className="text-purple-400 shrink-0" />
              <span>Disparo Automático de WhatsApp com Evolution API</span>
            </div>
          </div>
        </div>

        {/* PIX QR CODE SECTION (IF GENERATED) */}
        {pixData ? (
          <div className="rounded-3xl bg-card border border-border p-5 space-y-4 text-center animate-fade-in">
            <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-accent-light">
              <QrCode size={16} />
              <span>Pague com PIX Instantâneo</span>
            </div>

            {/* QR Code Image */}
            {pixData.encodedImage ? (
              <div className="inline-block p-3 bg-white rounded-2xl shadow-md border border-slate-200">
                <img
                  src={`data:image/png;base64,${pixData.encodedImage}`}
                  alt="QR Code PIX Asaas"
                  className="w-48 h-48 mx-auto object-contain"
                />
              </div>
            ) : (
              <div className="w-48 h-48 mx-auto bg-muted/10 rounded-2xl flex items-center justify-center text-xs text-muted">
                QR Code indisponível
              </div>
            )}

            <p className="text-[11px] text-muted max-w-xs mx-auto">
              Abra o aplicativo do seu banco, escolha <strong>Pagar com QR Code</strong> ou use a opção <strong>PIX Copia e Cola</strong> abaixo:
            </p>

            {/* Copia e Cola Button */}
            <div className="space-y-2">
              <button
                onClick={handleCopyPayload}
                className="w-full py-3 px-4 rounded-2xl bg-accent text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-accent/20 hover:bg-accent/90 active:scale-[0.98] transition-all cursor-pointer"
              >
                {copiedPix ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedPix ? 'Código PIX Copiado!' : 'Copiar Código PIX'}</span>
              </button>

              {invoiceUrl && (
                <a
                  href={invoiceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-2xl bg-card-hover border border-border text-foreground font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-card transition-all"
                >
                  <ExternalLink size={14} />
                  <span>Abrir Fatura Completa no Asaas</span>
                </a>
              )}
            </div>

            <div className="pt-2 flex items-center justify-center gap-1 text-[10px] text-muted">
              <Clock size={12} />
              <span>A confirmação do PIX ativa sua conta em segundos.</span>
            </div>
          </div>
        ) : (
          /* ACTION: GENERATE PAYMENT */
          <div className="space-y-3 pt-1">
            <button
              onClick={handleGerarPix}
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-accent via-indigo-600 to-purple-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-accent/30 hover:shadow-accent/50 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Gerando PIX no Asaas Sandbox...</span>
                </>
              ) : (
                <>
                  <QrCode size={18} />
                  <span>Gerar PIX da Mensalidade (Asaas)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
