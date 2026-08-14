'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Scissors,
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
  CheckCircle2,
  ArrowRight,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { PLANOS_SAAS } from '@/types';

function AssinarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { salao, salaoId: authSalaoId, logout, refreshAuth } = useAuth();

  const querySalaoId = searchParams.get('salaoId');
  const queryPlano = searchParams.get('plano');

  const targetSalaoId = querySalaoId || authSalaoId || salao?.id || '';
  const initialPlan = queryPlano === 'basico' || salao?.plano === 'basico' ? 'basico' : 'pro';

  const [selectedPlanId, setSelectedPlanId] = useState<'basico' | 'pro'>(initialPlan);
  const [cpfCnpj, setCpfCnpj] = useState((salao as any)?.documento || '');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [copiedPix, setCopiedPix] = useState(false);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);

  // PIX Data
  const [pixData, setPixData] = useState<{
    encodedImage: string;
    payload: string;
    expirationDate: string;
  } | null>(null);
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);

  const currentPlan = PLANOS_SAAS[selectedPlanId];

  // 1. Gera o PIX automaticamente assim que tiver o salaoId
  useEffect(() => {
    if (targetSalaoId && !pixData && !isLoading) {
      gerarCobrancaPix(selectedPlanId);
    }
  }, [targetSalaoId, selectedPlanId]);

  // 2. Polling para verificar em tempo real se o PIX foi pago
  useEffect(() => {
    if (!targetSalaoId || isPaymentConfirmed) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/asaas/status?salaoId=${targetSalaoId}`);
        const data = await res.json();
        if (data.isAtivo) {
          setIsPaymentConfirmed(true);
          clearInterval(interval);
          if (refreshAuth) await refreshAuth();
          setTimeout(() => {
            router.replace('/agenda');
          }, 2500);
        }
      } catch (err) {
        // Silently retry
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [targetSalaoId, isPaymentConfirmed, router, refreshAuth]);

  async function gerarCobrancaPix(planToCharge: 'basico' | 'pro') {
    if (!targetSalaoId) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/asaas/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          salaoId: targetSalaoId,
          plano: planToCharge,
          cpfCnpj: cpfCnpj.trim(),
          billingType: 'PIX',
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Erro ao gerar cobrança no Asaas.');
      }

      if (data.pix) {
        setPixData(data.pix);
      }
      if (data.payment?.invoiceUrl) {
        setInvoiceUrl(data.payment.invoiceUrl);
      }
    } catch (err: any) {
      console.error('Erro no checkout:', err);
      setErrorMessage(err?.message || 'Erro ao comunicar com o Asaas.');
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

  if (isPaymentConfirmed) {
    return (
      <div className="relative min-h-dvh flex items-center justify-center p-4 bg-slate-950 text-white">
        <div className="w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-3xl p-8 space-y-5 text-center shadow-2xl animate-fade-in-up">
          <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30 shadow-xl shadow-emerald-500/20 animate-bounce">
            <CheckCircle2 size={42} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">
              Pagamento Confirmado!
            </h2>
            <p className="text-sm text-slate-300">
              Sua assinatura do <strong>{currentPlan.nome}</strong> foi ativada com sucesso.
            </p>
          </div>
          <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 text-xs text-emerald-300 font-medium flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            <span>Redirecionando para o seu painel...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh flex items-center justify-center px-4 py-10 overflow-hidden bg-slate-950 text-white">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full max-w-lg space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent via-indigo-600 to-purple-600 shadow-2xl shadow-accent/40 mb-1 border border-white/20">
            <Scissors className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            Ativação da Assinatura
          </h1>
          <p className="text-xs text-slate-300 max-w-sm mx-auto">
            Quase lá! Realize o pagamento do seu plano para liberar o acesso imediato ao <strong>CRM Studio Beauty</strong>.
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Plan Selector Grid */}
        <div className="grid grid-cols-2 gap-3">
          {(['basico', 'pro'] as const).map((pKey) => {
            const p = PLANOS_SAAS[pKey];
            const isSelected = selectedPlanId === pKey;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedPlanId(pKey);
                  setPixData(null);
                  gerarCobrancaPix(pKey);
                }}
                className={`relative text-left p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/30 shadow-lg'
                    : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/60'
                }`}
              >
                {p.destaque && (
                  <span className="absolute -top-2.5 right-3 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm">
                    Recomendado
                  </span>
                )}
                <p className="text-xs font-bold text-white">{p.nome}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-lg font-extrabold text-white">{p.precoFormatado}</span>
                  <span className="text-[10px] text-slate-400">/mês</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* PIX Payment Box */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
            <div>
              <p className="text-xs font-bold text-white">Plano Selecionado:</p>
              <p className="text-sm font-extrabold text-purple-400">
                {currentPlan.nome} &middot; {currentPlan.precoFormatado}/mês
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[11px] font-bold text-amber-400">
              <Clock size={13} className="animate-pulse" />
              <span>Aguardando PIX</span>
            </div>
          </div>

          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-center">
              <Loader2 size={36} className="text-purple-500 animate-spin" />
              <p className="text-xs font-semibold text-slate-300">
                Gerando QR Code PIX com o Asaas...
              </p>
            </div>
          ) : pixData ? (
            <div className="space-y-4 text-center">
              {/* QR Code Container */}
              {pixData.encodedImage ? (
                <div className="inline-block p-3.5 bg-white rounded-2xl shadow-xl border border-slate-200">
                  <img
                    src={`data:image/png;base64,${pixData.encodedImage}`}
                    alt="QR Code PIX Asaas"
                    className="w-48 h-48 mx-auto object-contain"
                  />
                </div>
              ) : (
                <div className="w-48 h-48 mx-auto bg-slate-800 rounded-2xl flex items-center justify-center text-xs text-slate-400">
                  QR Code indisponível
                </div>
              )}

              <p className="text-xs text-slate-300 max-w-xs mx-auto">
                Abra o app do seu banco, escolha <strong>Pagar com PIX</strong> e aponte a câmera ou use o código abaixo:
              </p>

              {/* Action Buttons */}
              <div className="space-y-2">
                <button
                  onClick={handleCopyPayload}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 hover:shadow-purple-600/50 active:scale-[0.98] transition-all cursor-pointer"
                >
                  {copiedPix ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copiedPix ? 'Código PIX Copiado com Sucesso!' : 'Copiar Código PIX (Copia e Cola)'}</span>
                </button>

                {invoiceUrl && (
                  <a
                    href={invoiceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-2xl bg-slate-800/80 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-800 transition-all"
                  >
                    <ExternalLink size={14} />
                    <span>Pagar com Cartão / Abrir Fatura no Asaas</span>
                  </a>
                )}
              </div>

              <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-slate-400">
                <Loader2 size={13} className="animate-spin text-purple-400" />
                <span>Identificando pagamento automaticamente...</span>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer info & Logout */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-2">
          <span className="flex items-center gap-1">
            <ShieldCheck size={14} className="text-emerald-400" />
            Pagamento Seguro via Asaas
          </span>

          <button
            onClick={async () => {
              await logout();
              router.replace('/login');
            }}
            className="hover:text-rose-400 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <LogOut size={13} />
            <span>Sair / Entrar com outra conta</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AssinarPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
          <Loader2 size={32} className="animate-spin text-purple-500" />
        </div>
      }
    >
      <AssinarContent />
    </Suspense>
  );
}
