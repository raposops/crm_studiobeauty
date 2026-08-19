'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Scissors,
  CreditCard,
  Smartphone,
  Banknote,
  Percent,
  Check,
  PlusCircle,
  Sparkles,
} from 'lucide-react';
import type { FormaPagamento, Profissional } from '@/types';
import { formatCurrency, COMISSAO_PERCENTUAL } from '@/data/mock';

interface NovoLancamentoModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate: string; // YYYY-MM-DD
  profissionais: Profissional[];
  onSubmit: (data: {
    clienteNome: string;
    profissionalId: string;
    servicoNome: string;
    valorTotal: number; // centavos
    formaPagamento: FormaPagamento;
    dataFechamento: string; // ISO string
    comissaoPct: number;
  }) => Promise<void>;
}

const FORMAS_PAGAMENTO: {
  id: FormaPagamento;
  label: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  {
    id: 'pix',
    label: 'PIX',
    icon: <Smartphone size={18} />,
    color: 'from-teal-500 to-cyan-500',
  },
  {
    id: 'credito',
    label: 'Crédito',
    icon: <CreditCard size={18} />,
    color: 'from-blue-500 to-indigo-500',
  },
  {
    id: 'debito',
    label: 'Débito',
    icon: <CreditCard size={18} />,
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'dinheiro',
    label: 'Dinheiro',
    icon: <Banknote size={18} />,
    color: 'from-green-500 to-emerald-500',
  },
  {
    id: 'saldo',
    label: 'Saldo / Crédito',
    icon: <Sparkles size={18} />,
    color: 'from-amber-500 to-yellow-500',
  },
];

export default function NovoLancamentoModal({
  isOpen,
  onClose,
  defaultDate,
  profissionais,
  onSubmit,
}: NovoLancamentoModalProps) {
  const [dateStr, setDateStr] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [timeStr, setTimeStr] = useState('12:00');
  const [clienteNome, setClienteNome] = useState('');
  const [profissionalId, setProfissionalId] = useState('');
  const [servicoNome, setServicoNome] = useState('');
  const [valorInput, setValorInput] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('pix');
  const [comissaoPct, setComissaoPct] = useState<number>(COMISSAO_PERCENTUAL);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (defaultDate) {
      setDateStr(defaultDate);
    }
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    setTimeStr(`${h}:${m}`);

    if (profissionais.length > 0 && !profissionalId) {
      setProfissionalId(profissionais[0].id);
    }
  }, [defaultDate, profissionais, isOpen]);

  useEffect(() => {
    if (profissionalId && profissionais.length > 0) {
      const prof = profissionais.find((p) => p.id === profissionalId);
      if (prof) {
        setComissaoPct(prof.comissao_padrao_pct ?? COMISSAO_PERCENTUAL);
      }
    }
  }, [profissionalId, profissionais]);

  // Computed values
  const valorTotalCentavos = useMemo(() => {
    const parsed = parseFloat(valorInput.replace(',', '.'));
    if (isNaN(parsed) || parsed < 0) return 0;
    return Math.round(parsed * 100);
  }, [valorInput]);

  const comissaoCentavos = useMemo(() => {
    return Math.round((valorTotalCentavos * comissaoPct) / 100);
  }, [valorTotalCentavos, comissaoPct]);

  const liquidoCentavos = useMemo(() => {
    return valorTotalCentavos - comissaoCentavos;
  }, [valorTotalCentavos, comissaoCentavos]);

  function resetForm() {
    setClienteNome('');
    setServicoNome('');
    setValorInput('');
    setFormaPagamento('pix');
    setComissaoPct(COMISSAO_PERCENTUAL);
    setIsSubmitting(false);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!clienteNome.trim() || !profissionalId || valorTotalCentavos <= 0) return;

    setIsSubmitting(true);
    try {
      const dataFechamento = `${dateStr}T${timeStr}:00.000Z`;
      await onSubmit({
        clienteNome: clienteNome.trim(),
        profissionalId,
        servicoNome: servicoNome.trim() || 'Lançamento Avulso',
        valorTotal: valorTotalCentavos,
        formaPagamento,
        dataFechamento,
        comissaoPct,
      });
      handleClose();
    } catch (err) {
      console.error('Erro ao salvar lançamento:', err);
      alert('Erro ao salvar lançamento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-background border border-border rounded-t-3xl sm:rounded-3xl max-h-[90dvh] flex flex-col animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <PlusCircle size={20} className="text-accent-light" />
            <div>
              <h3 className="text-base font-bold text-foreground">
                Novo Lançamento / Dia Anterior
              </h3>
              <p className="text-xs text-muted">
                Registre receitas de hoje ou retroativas
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-card-hover transition-all active:scale-95"
          >
            <X size={16} className="text-muted" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted flex items-center gap-1">
                <Calendar size={12} /> Data do Lançamento
              </label>
              <input
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted flex items-center gap-1">
                <Clock size={12} /> Hora
              </label>
              <input
                type="time"
                value={timeStr}
                onChange={(e) => setTimeStr(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Cliente e Profissional */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted flex items-center gap-1">
                <User size={12} /> Nome do Cliente
              </label>
              <input
                type="text"
                placeholder="Ex: Maria Silva"
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted flex items-center gap-1">
                <Scissors size={12} /> Profissional
              </label>
              <select
                value={profissionalId}
                onChange={(e) => setProfissionalId(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent"
              >
                <option value="" disabled>Selecione...</option>
                {profissionais.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Serviço / Descrição */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted">
              Descrição / Serviço(s)
            </label>
            <input
              type="text"
              placeholder="Ex: Corte + Escova"
              value={servicoNome}
              onChange={(e) => setServicoNome(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-foreground text-sm font-medium focus:outline-none focus:border-accent"
            />
          </div>

          {/* Forma de Pagamento */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted">
              Forma de Pagamento
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {FORMAS_PAGAMENTO.map((fp) => {
                const isSelected = formaPagamento === fp.id;
                return (
                  <button
                    key={fp.id}
                    type="button"
                    onClick={() => setFormaPagamento(fp.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? 'bg-accent/15 border-accent text-accent-light'
                        : 'bg-card border-border text-foreground hover:bg-card-hover'
                    }`}
                  >
                    <span className="shrink-0">{fp.icon}</span>
                    <span className="text-xs font-semibold truncate">
                      {fp.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Valor e Comissão % */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted">
                Valor Total (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={valorInput}
                onChange={(e) => setValorInput(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-foreground text-base font-bold focus:outline-none focus:border-accent"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted flex items-center gap-1">
                <Percent size={12} /> Comissão Profissional (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={comissaoPct}
                onChange={(e) => setComissaoPct(Number(e.target.value))}
                required
                className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-foreground text-base font-bold focus:outline-none focus:border-accent"
              />
            </div>
          </div>

          {/* Resumo de Calculos */}
          <div className="rounded-2xl bg-gradient-to-br from-accent/5 to-indigo-500/5 border border-accent/15 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">Valor Total</span>
              <span className="text-foreground font-bold">
                {formatCurrency(valorTotalCentavos)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">Comissão ({comissaoPct}%)</span>
              <span className="text-warning font-semibold">
                -{formatCurrency(comissaoCentavos)}
              </span>
            </div>
            <div className="h-px bg-border/50" />
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">
                Líquido Salão
              </span>
              <span className="text-sm font-bold text-success">
                {formatCurrency(liquidoCentavos)}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || valorTotalCentavos <= 0 || !clienteNome.trim()}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-accent text-white text-sm font-bold shadow-lg shadow-accent/20 hover:bg-accent-dark transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check size={18} />
                  Salvar Lançamento
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
