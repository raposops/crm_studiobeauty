'use client';

import { useMemo } from 'react';
import {
  X,
  Lock,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  Smartphone,
  Banknote,
  Users,
  Printer,
  Sparkles,
} from 'lucide-react';
import type { LancamentoFinanceiro, FormaPagamento } from '@/types';
import { formatCurrency } from '@/data/mock';

interface FechamentoResumoModalProps {
  isOpen: boolean;
  onClose: () => void;
  dateStr: string; // YYYY-MM-DD
  lancamentos: LancamentoFinanceiro[];
}

const PAYMENT_LABELS: Record<FormaPagamento, string> = {
  pix: 'PIX',
  credito: 'Cartão de Crédito',
  debito: 'Cartão de Débito',
  dinheiro: 'Dinheiro Espécie',
  saldo: 'Crédito / Saldo Cliente',
};

const PAYMENT_ICONS: Record<FormaPagamento, React.ReactNode> = {
  pix: <Smartphone size={16} className="text-teal-400" />,
  credito: <CreditCard size={16} className="text-indigo-400" />,
  debito: <CreditCard size={16} className="text-purple-400" />,
  dinheiro: <Banknote size={16} className="text-emerald-400" />,
  saldo: <Sparkles size={16} className="text-amber-400" />,
};

export default function FechamentoResumoModal({
  isOpen,
  onClose,
  dateStr,
  lancamentos,
}: FechamentoResumoModalProps) {
  // Compute totals
  const totalBruto = useMemo(
    () => lancamentos.reduce((sum, l) => sum + l.valor_total, 0),
    [lancamentos]
  );

  const totalComissoes = useMemo(
    () => lancamentos.reduce((sum, l) => sum + l.comissao_profissional, 0),
    [lancamentos]
  );

  const totalLiquido = useMemo(
    () => lancamentos.reduce((sum, l) => sum + l.valor_liquido_salao, 0),
    [lancamentos]
  );

  const porFormaPagamento = useMemo(() => {
    const totals: Record<FormaPagamento, { valor: number; qtd: number }> = {
      pix: { valor: 0, qtd: 0 },
      credito: { valor: 0, qtd: 0 },
      debito: { valor: 0, qtd: 0 },
      dinheiro: { valor: 0, qtd: 0 },
      saldo: { valor: 0, qtd: 0 },
    };

    lancamentos.forEach((l) => {
      if (totals[l.forma_pagamento]) {
        totals[l.forma_pagamento].valor += l.valor_total;
        totals[l.forma_pagamento].qtd += 1;
      }
    });

    return totals;
  }, [lancamentos]);

  const formattedDate = useMemo(() => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }, [dateStr]);

  function handlePrint() {
    window.print();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-background border border-border rounded-t-3xl sm:rounded-3xl max-h-[90dvh] flex flex-col animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <Lock size={18} className="text-accent-light" />
            <div>
              <h3 className="text-base font-bold text-foreground">
                Fechamento do Caixa
              </h3>
              <p className="text-xs text-muted">
                Resumo do dia {formattedDate}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-card-hover transition-all active:scale-95"
          >
            <X size={16} className="text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
          {/* Main Card */}
          <div className="rounded-2xl bg-gradient-to-br from-accent/10 to-indigo-500/10 border border-accent/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted uppercase tracking-wider font-semibold">
                Faturamento Bruto Total
              </span>
              <span className="text-xl font-bold text-foreground">
                {formatCurrency(totalBruto)}
              </span>
            </div>
            <div className="h-px bg-border/50" />
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">Total de Atendimentos</span>
              <span className="font-bold text-foreground">
                {lancamentos.length}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">Comissões a Pagar</span>
              <span className="font-semibold text-warning">
                -{formatCurrency(totalComissoes)}
              </span>
            </div>
            <div className="h-px bg-border/50" />
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-foreground">Líquido do Salão</span>
              <span className="text-lg font-bold text-success">
                {formatCurrency(totalLiquido)}
              </span>
            </div>
          </div>

          {/* Breakdown por Forma de Pagamento */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-muted uppercase tracking-wider">
              Entradas por Forma de Pagamento
            </p>

            <div className="grid grid-cols-1 gap-2">
              {(Object.keys(porFormaPagamento) as FormaPagamento[]).map((fp) => {
                const info = porFormaPagamento[fp];
                const pct = totalBruto > 0 ? Math.round((info.valor / totalBruto) * 100) : 0;

                return (
                  <div
                    key={fp}
                    className="flex items-center justify-between p-3 rounded-xl bg-card border border-border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-card-hover flex items-center justify-center">
                        {PAYMENT_ICONS[fp]}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">
                          {PAYMENT_LABELS[fp]}
                        </p>
                        <p className="text-[10px] text-muted">
                          {info.qtd} lançamento{info.qtd !== 1 ? 's' : ''} ({pct}%)
                        </p>
                      </div>
                    </div>

                    <span className="text-sm font-bold text-foreground">
                      {formatCurrency(info.valor)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Status Badge */}
          <div className="rounded-xl bg-success/10 border border-success/20 p-3 flex items-center gap-2 text-success">
            <CheckCircle2 size={16} className="shrink-0" />
            <span className="text-xs font-semibold">
              Caixa conferido e atualizado com sucesso.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-2 border-t border-border/50 flex gap-2">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-card border border-border text-foreground text-xs font-bold hover:bg-card-hover transition-all"
          >
            <Printer size={16} />
            Imprimir Resumo
          </button>
          <button
            onClick={onClose}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-accent text-white text-xs font-bold hover:bg-accent-dark transition-all"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
