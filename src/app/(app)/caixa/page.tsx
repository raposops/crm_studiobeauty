'use client';

import { useState, useMemo } from 'react';
import {
  TrendingUp,
  Scissors,
  Users,
  CreditCard,
  Smartphone,
  Banknote,
  Check,
  Clock,
  ChevronDown,
  ChevronUp,
  DollarSign,
} from 'lucide-react';
import type { FormaPagamento } from '@/types';
import {
  formatCurrency,
  getComissoesPorProfissional,
  COMISSAO_PERCENTUAL,
} from '@/data/mock';
import { useCaixa } from '@/hooks/useCaixa';
import { useAuth } from '@/contexts/AuthContext';

type CaixaTab = 'fechamento' | 'comissoes';

const PAYMENT_ICONS: Record<FormaPagamento, React.ReactNode> = {
  pix: <Smartphone size={14} />,
  credito: <CreditCard size={14} />,
  debito: <CreditCard size={14} />,
  dinheiro: <Banknote size={14} />,
};

const PAYMENT_LABELS: Record<FormaPagamento, string> = {
  pix: 'PIX',
  credito: 'Crédito',
  debito: 'Débito',
  dinheiro: 'Dinheiro',
};

export default function CaixaPage() {
  const { salaoId } = useAuth();
  const [activeTab, setActiveTab] = useState<CaixaTab>('fechamento');
  const [expandedProfId, setExpandedProfId] = useState<string | null>(null);
  
  const dateStr = new Date().toISOString().split('T')[0];
  const { lancamentos, isLoading, marcarLancamentoComoPago } = useCaixa(salaoId, dateStr);

  // Metrics
  const faturamentoDia = useMemo(
    () => lancamentos.reduce((sum, l) => sum + l.valor_total, 0),
    [lancamentos]
  );

  const totalAtendimentos = lancamentos.length;

  const comissoesAPagar = useMemo(
    () =>
      lancamentos
        .filter((l) => !l.status_pago_profissional)
        .reduce((sum, l) => sum + l.comissao_profissional, 0),
    [lancamentos]
  );

  const comissoesPorProf = useMemo(
    () => getComissoesPorProfissional(lancamentos),
    [lancamentos]
  );

  // Sort lancamentos by time (most recent first)
  const lancamentosOrdenados = useMemo(
    () => [...lancamentos].sort((a, b) => b.hora.localeCompare(a.hora)),
    [lancamentos]
  );

  function handleMarcarPago(lancamentoId: string) {
    marcarLancamentoComoPago.mutate(lancamentoId);
  }

  return (
    <div className="animate-fade-in-up space-y-5">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Caixa</h2>
        <p className="text-sm text-muted">
          Fechamento e comissões do dia
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-2">
        {/* Faturamento */}
        <div className="rounded-2xl bg-card border border-border p-3 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
            <TrendingUp size={16} className="text-success" />
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted font-medium">
              Faturamento
            </p>
            <p className="text-base font-bold text-success">
              {formatCurrency(faturamentoDia)}
            </p>
          </div>
        </div>

        {/* Atendimentos */}
        <div className="rounded-2xl bg-card border border-border p-3 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Scissors size={16} className="text-accent-light" />
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted font-medium">
              Atendimentos
            </p>
            <p className="text-base font-bold text-foreground">
              {totalAtendimentos}
            </p>
          </div>
        </div>

        {/* Comissões a Pagar */}
        <div className="rounded-2xl bg-card border border-border p-3 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
            <Users size={16} className="text-warning" />
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-wider text-muted font-medium">
              Comissões
            </p>
            <p className="text-base font-bold text-warning">
              {formatCurrency(comissoesAPagar)}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-card rounded-2xl border border-border p-1">
        <button
          onClick={() => setActiveTab('fechamento')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
            activeTab === 'fechamento'
              ? 'bg-accent/15 text-accent-light'
              : 'text-muted hover:text-foreground'
          }`}
        >
          Fechamento do Dia
        </button>
        <button
          onClick={() => setActiveTab('comissoes')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
            activeTab === 'comissoes'
              ? 'bg-accent/15 text-accent-light'
              : 'text-muted hover:text-foreground'
          }`}
        >
          Comissões ({COMISSAO_PERCENTUAL}%)
        </button>
      </div>

      {/* Tab Content */}
      {isLoading ? (
        <div className="py-10 text-center text-sm text-muted animate-pulse">
          Carregando lançamentos...
        </div>
      ) : activeTab === 'fechamento' ? (
        /* ===== Fechamento do Dia ===== */
        <div className="space-y-2 animate-fade-in-up">
          {lancamentosOrdenados.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <DollarSign size={32} className="text-muted mx-auto" />
              <p className="text-sm text-muted">
                Sem lançamentos hoje
              </p>
            </div>
          ) : (
            lancamentosOrdenados.map((lanc) => (
              <div
                key={lanc.id}
                className="rounded-2xl bg-card border border-border p-3.5 space-y-2"
              >
                {/* Top Row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">
                      {lanc.cliente_nome}
                    </p>
                    <p className="text-[11px] text-muted truncate">
                      {lanc.servicos.join(' + ')}
                      {lanc.produtos_extras.length > 0 && (
                        <span className="text-accent-light">
                          {' '}+ {lanc.produtos_extras.join(', ')}
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="text-base font-bold text-foreground shrink-0">
                    {formatCurrency(lanc.valor_total)}
                  </span>
                </div>

                {/* Bottom Row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {/* Time */}
                    <div className="flex items-center gap-1">
                      <Clock size={10} className="text-muted" />
                      <span className="text-[10px] font-mono text-muted">
                        {lanc.hora}
                      </span>
                    </div>

                    {/* Payment Method */}
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-card-hover">
                      <span className="text-muted">
                        {PAYMENT_ICONS[lanc.forma_pagamento]}
                      </span>
                      <span className="text-[10px] font-semibold text-muted">
                        {PAYMENT_LABELS[lanc.forma_pagamento]}
                      </span>
                    </div>

                    {/* Professional */}
                    <div className="flex items-center gap-1">
                      <div
                        className={`w-4 h-4 rounded-full bg-gradient-to-br ${lanc.profissional.cor} flex items-center justify-center`}
                      >
                        <span className="text-[6px] font-bold text-white">
                          {lanc.profissional.iniciais}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Commission info */}
                  <span className="text-[10px] text-muted">
                    Com: {formatCurrency(lanc.comissao_profissional)}
                  </span>
                </div>
              </div>
            ))
          )}

          {/* Day Summary */}
          {lancamentosOrdenados.length > 0 && (
            <div className="rounded-2xl bg-gradient-to-br from-accent/5 to-indigo-500/5 border border-accent/15 p-4 space-y-2 mt-4">
              <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">
                Resumo do Dia
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Faturamento Bruto</span>
                <span className="text-sm font-bold text-foreground">
                  {formatCurrency(faturamentoDia)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">
                  Comissões ({COMISSAO_PERCENTUAL}%)
                </span>
                <span className="text-sm font-semibold text-warning">
                  -{formatCurrency(
                    lancamentos.reduce(
                      (sum, l) => sum + l.comissao_profissional,
                      0
                    )
                  )}
                </span>
              </div>
              <div className="h-px bg-border/50" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">
                  Líquido Salão
                </span>
                <span className="text-lg font-bold text-success">
                  {formatCurrency(
                    lancamentos.reduce(
                      (sum, l) => sum + l.valor_liquido_salao,
                      0
                    )
                  )}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ===== Comissões por Profissional ===== */
        <div className="space-y-3 animate-fade-in-up">
          {comissoesPorProf.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Users size={32} className="text-muted mx-auto" />
              <p className="text-sm text-muted">
                Sem comissões registradas
              </p>
            </div>
          ) : (
            comissoesPorProf.map((cp) => {
              const isExpanded = expandedProfId === cp.profissional.id;

              return (
                <div
                  key={cp.profissional.id}
                  className="rounded-2xl bg-card border border-border overflow-hidden"
                >
                  {/* Professional Header */}
                  <button
                    onClick={() =>
                      setExpandedProfId(
                        isExpanded ? null : cp.profissional.id
                      )
                    }
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-card-hover transition-colors"
                  >
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${cp.profissional.cor} flex items-center justify-center shrink-0`}
                    >
                      <span className="text-xs font-bold text-white">
                        {cp.profissional.iniciais}
                      </span>
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-bold text-foreground">
                        {cp.profissional.nome}
                      </p>
                      <p className="text-[11px] text-muted">
                        {cp.total_atendimentos} atendimento
                        {cp.total_atendimentos !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-foreground">
                        {formatCurrency(cp.total_comissao)}
                      </p>
                      {cp.total_pendente > 0 && (
                        <p className="text-[10px] text-warning font-medium">
                          {formatCurrency(cp.total_pendente)} pendente
                        </p>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp size={16} className="text-muted shrink-0" />
                    ) : (
                      <ChevronDown size={16} className="text-muted shrink-0" />
                    )}
                  </button>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="border-t border-border/50 px-4 py-3 space-y-2 animate-fade-in-up">
                      {cp.lancamentos.map((lanc) => (
                        <div
                          key={lanc.id}
                          className="flex items-center justify-between gap-2 py-2 border-b border-border/30 last:border-0"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">
                              {lanc.cliente_nome}
                            </p>
                            <p className="text-[10px] text-muted">
                              {lanc.hora} &middot;{' '}
                              {lanc.servicos.join(' + ')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-bold text-foreground">
                              {formatCurrency(lanc.comissao_profissional)}
                            </span>
                            {lanc.status_pago_profissional ? (
                              <span className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-success/10 text-success">
                                <Check size={10} />
                                <span className="text-[9px] font-bold uppercase">
                                  Pago
                                </span>
                              </span>
                            ) : (
                              <button
                                onClick={() => handleMarcarPago(lanc.id)}
                                className="flex items-center gap-0.5 px-2 py-1 rounded-lg bg-warning/10 text-warning hover:bg-warning/20 active:scale-95 transition-all"
                              >
                                <DollarSign size={10} />
                                <span className="text-[9px] font-bold uppercase">
                                  Pagar
                                </span>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
