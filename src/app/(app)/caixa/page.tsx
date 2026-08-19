'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  ChevronLeft,
  ChevronRight,
  Calendar,
  PlusCircle,
  Lock,
  CalendarDays,
  PieChart,
  Sparkles,
} from 'lucide-react';
import type { FormaPagamento, Profissional } from '@/types';
import {
  formatCurrency,
  getComissoesPorProfissional,
  COMISSAO_PERCENTUAL,
  PROFISSIONAIS as MOCK_PROFISSIONAIS,
} from '@/data/mock';
import { useCaixa } from '@/hooks/useCaixa';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseService } from '@/services/supabaseService';
import NovoLancamentoModal from '@/components/caixa/novo-lancamento-modal';
import FechamentoResumoModal from '@/components/caixa/fechamento-resumo-modal';

type ModoFiltro = 'dia' | 'mes';
type CaixaTab = 'fechamento' | 'comissoes';

const PAYMENT_ICONS: Record<FormaPagamento, React.ReactNode> = {
  pix: <Smartphone size={14} className="text-teal-400" />,
  credito: <CreditCard size={14} className="text-indigo-400" />,
  debito: <CreditCard size={14} className="text-purple-400" />,
  dinheiro: <Banknote size={14} className="text-emerald-400" />,
  saldo: <Sparkles size={14} className="text-amber-400" />,
};

const PAYMENT_LABELS: Record<FormaPagamento, string> = {
  pix: 'PIX',
  credito: 'Crédito',
  debito: 'Débito',
  dinheiro: 'Dinheiro',
  saldo: 'Saldo / Crédito',
};

export default function CaixaPage() {
  const { salaoId, hasModule } = useAuth();
  const temFluxoCaixaAvancado = hasModule('fluxo_caixa_avancado');
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentMonthStr = useMemo(() => todayStr.slice(0, 7), [todayStr]);

  const [modoFiltro, setModoFiltro] = useState<ModoFiltro>('dia');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonthStr);
  
  const [activeTab, setActiveTab] = useState<CaixaTab>('fechamento');
  const [expandedProfId, setExpandedProfId] = useState<string | null>(null);

  // Modals state
  const [isNovoLancamentoOpen, setIsNovoLancamentoOpen] = useState(false);
  const [isFechamentoResumoOpen, setIsFechamentoResumoOpen] = useState(false);

  // Fetch Professionals
  const { data: profissionaisDb } = useQuery({
    queryKey: ['profissionais', salaoId],
    queryFn: () => supabaseService.fetchProfissionais(salaoId),
    enabled: !!salaoId,
  });

  const profissionaisList: Profissional[] = useMemo(() => {
    if (profissionaisDb && profissionaisDb.length > 0) return profissionaisDb;
    return MOCK_PROFISSIONAIS;
  }, [profissionaisDb]);

  // Fetch Lancamentos based on filter mode
  const activeFilterStr = modoFiltro === 'dia' ? selectedDate : selectedMonth;
  const { lancamentos, isLoading, marcarLancamentoComoPago, criarLancamentoManual } = useCaixa(
    salaoId,
    activeFilterStr,
    modoFiltro
  );

  // Metrics calculation
  const faturamentoTotal = useMemo(
    () => lancamentos.reduce((sum, l) => sum + l.valor_total, 0),
    [lancamentos]
  );

  const totalAtendimentos = lancamentos.length;

  const comissoesTotais = useMemo(
    () => lancamentos.reduce((sum, l) => sum + l.comissao_profissional, 0),
    [lancamentos]
  );

  const comissoesAPagar = useMemo(
    () =>
      lancamentos
        .filter((l) => !l.status_pago_profissional)
        .reduce((sum, l) => sum + l.comissao_profissional, 0),
    [lancamentos]
  );

  const liquidoSalaoTotal = useMemo(
    () => lancamentos.reduce((sum, l) => sum + l.valor_liquido_salao, 0),
    [lancamentos]
  );

  const comissoesPorProf = useMemo(
    () => getComissoesPorProfissional(lancamentos),
    [lancamentos]
  );

  // Payment Breakdown
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

  // Sort lancamentos (most recent first)
  const lancamentosOrdenados = useMemo(
    () => [...lancamentos].sort((a, b) => {
      if (a.data !== b.data) {
        return b.data.localeCompare(a.data);
      }
      return b.hora.localeCompare(a.hora);
    }),
    [lancamentos]
  );

  // Date Navigation handlers
  function handlePrevDay() {
    const d = new Date(`${selectedDate}T12:00:00`);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  }

  function handleNextDay() {
    const d = new Date(`${selectedDate}T12:00:00`);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  }

  function handleGoToToday() {
    setSelectedDate(todayStr);
  }

  // Month Navigation handlers
  function handlePrevMonth() {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    const yearStr = d.getFullYear();
    const monthStr = String(d.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${yearStr}-${monthStr}`);
  }

  function handleNextMonth() {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m, 1);
    const yearStr = d.getFullYear();
    const monthStr = String(d.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${yearStr}-${monthStr}`);
  }

  function handleMarcarPago(lancamentoId: string) {
    marcarLancamentoComoPago.mutate(lancamentoId);
  }

  async function handleNovoLancamentoSubmit(data: {
    clienteNome: string;
    profissionalId: string;
    servicoNome: string;
    valorTotal: number;
    formaPagamento: FormaPagamento;
    dataFechamento: string;
    comissaoPct: number;
  }) {
    await criarLancamentoManual.mutateAsync(data);
  }

  const isSelectedPastDate = modoFiltro === 'dia' && selectedDate < todayStr;
  const formattedSelectedDate = useMemo(() => {
    const [y, m, d] = selectedDate.split('-');
    return `${d}/${m}/${y}`;
  }, [selectedDate]);

  const formattedSelectedMonth = useMemo(() => {
    const [y, m] = selectedMonth.split('-');
    const date = new Date(Number(y), Number(m) - 1, 1);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  }, [selectedMonth]);

  return (
    <div className="animate-fade-in-up space-y-5 pb-10">
      {/* Header & Filter Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-foreground">Caixa</h2>
          <p className="text-sm text-muted">
            Fechamento de caixa e acompanhamento de faturamento
          </p>
        </div>

        {/* Filter Mode Switcher (Dia / Mês) */}
        <div className="flex bg-card rounded-2xl border border-border p-1 self-start sm:self-auto">
          <button
            onClick={() => setModoFiltro('dia')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
              modoFiltro === 'dia'
                ? 'bg-accent/15 text-accent-light'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Calendar size={14} />
            Visão Diária
          </button>

          <button
            onClick={() => setModoFiltro('mes')}
            className={`flex items-center gap-1.5 py-1.5 px-3 rounded-xl text-xs font-semibold transition-all duration-200 ${
              modoFiltro === 'mes'
                ? 'bg-accent/15 text-accent-light'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <CalendarDays size={14} />
            Faturamento Mensal
          </button>
        </div>
      </div>

      {/* Selector Bar */}
      {modoFiltro === 'dia' ? (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-card border border-border rounded-2xl p-2">
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevDay}
                className="w-9 h-9 rounded-xl bg-card-hover border border-border flex items-center justify-center hover:bg-card hover:scale-105 active:scale-95 transition-all"
                title="Dia Anterior"
              >
                <ChevronLeft size={18} className="text-foreground" />
              </button>

              <div className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background border border-border">
                <Calendar size={14} className="text-accent-light" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-sm font-bold text-foreground focus:outline-none cursor-pointer"
                />
              </div>

              <button
                onClick={handleNextDay}
                className="w-9 h-9 rounded-xl bg-card-hover border border-border flex items-center justify-center hover:bg-card hover:scale-105 active:scale-95 transition-all"
                title="Próximo Dia"
              >
                <ChevronRight size={18} className="text-foreground" />
              </button>

              {selectedDate !== todayStr && (
                <button
                  onClick={handleGoToToday}
                  className="px-3 py-1.5 rounded-xl bg-accent/15 text-accent-light text-xs font-bold hover:bg-accent/20 transition-all"
                >
                  Hoje
                </button>
              )}
            </div>

            {/* Actions for Day */}
            <div className="flex items-center gap-2">
              {temFluxoCaixaAvancado ? (
                <button
                  onClick={() => setIsNovoLancamentoOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-accent text-white text-xs font-bold shadow-md shadow-accent/20 hover:bg-accent-dark active:scale-95 transition-all"
                >
                  <PlusCircle size={14} />
                  Lançamento Avulso
                </button>
              ) : (
                <button
                  onClick={() => setIsUpgradeModalOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 text-xs font-bold hover:bg-amber-500/20 active:scale-95 transition-all"
                  title="Módulo de Fluxo de Caixa Avançado desativado"
                >
                  <Lock size={14} />
                  Lançamento Avulso (Pro)
                </button>
              )}

              <button
                onClick={() => setIsFechamentoResumoOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card border border-border text-foreground text-xs font-bold hover:bg-card-hover active:scale-95 transition-all"
              >
                <Lock size={14} className="text-accent-light" />
                Conferir Fechamento
              </button>
            </div>
          </div>

          {/* Past Date Banner Warning */}
          {isSelectedPastDate && (
            <div className="px-4 py-2 rounded-xl bg-warning/10 border border-warning/20 text-warning text-xs font-semibold flex items-center gap-2">
              <Clock size={14} />
              <span>
                Visualizando e lançando dados retroativos de <strong>{formattedSelectedDate}</strong> (Dia Anterior).
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Month Selector Bar */
        <div className="flex items-center justify-between gap-2 bg-card border border-border rounded-2xl p-2">
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="w-9 h-9 rounded-xl bg-card-hover border border-border flex items-center justify-center hover:bg-card hover:scale-105 active:scale-95 transition-all"
              title="Mês Anterior"
            >
              <ChevronLeft size={18} className="text-foreground" />
            </button>

            <div className="relative flex items-center gap-2 px-3 py-1.5 rounded-xl bg-background border border-border">
              <CalendarDays size={14} className="text-accent-light" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-sm font-bold text-foreground focus:outline-none cursor-pointer"
              />
            </div>

            <button
              onClick={handleNextMonth}
              className="w-9 h-9 rounded-xl bg-card-hover border border-border flex items-center justify-center hover:bg-card hover:scale-105 active:scale-95 transition-all"
              title="Próximo Mês"
            >
              <ChevronRight size={18} className="text-foreground" />
            </button>
          </div>

          <div className="text-xs font-semibold text-muted capitalize">
            Faturamento acumulado: <strong className="text-foreground">{formattedSelectedMonth}</strong>
          </div>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Faturamento */}
        <div className="rounded-2xl bg-card border border-border p-3.5 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
            <TrendingUp size={16} className="text-success" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">
              {modoFiltro === 'dia' ? 'Faturamento do Dia' : 'Faturamento do Mês'}
            </p>
            <p className="text-lg font-bold text-success">
              {formatCurrency(faturamentoTotal)}
            </p>
          </div>
        </div>

        {/* Atendimentos */}
        <div className="rounded-2xl bg-card border border-border p-3.5 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Scissors size={16} className="text-accent-light" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">
              Atendimentos
            </p>
            <p className="text-lg font-bold text-foreground">
              {totalAtendimentos}
            </p>
          </div>
        </div>

        {/* Comissões Totais */}
        <div className="rounded-2xl bg-card border border-border p-3.5 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
            <Users size={16} className="text-warning" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">
              Comissões Totais
            </p>
            <p className="text-lg font-bold text-warning">
              {formatCurrency(comissoesTotais)}
            </p>
          </div>
        </div>

        {/* Líquido Salão */}
        <div className="rounded-2xl bg-card border border-border p-3.5 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <DollarSign size={16} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted font-semibold">
              Líquido do Salão
            </p>
            <p className="text-lg font-bold text-emerald-400">
              {formatCurrency(liquidoSalaoTotal)}
            </p>
          </div>
        </div>
      </div>

      {/* Breakdown per Payment Method in Monthly View */}
      {modoFiltro === 'mes' && (
        <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
          <div className="flex items-center gap-2">
            <PieChart size={16} className="text-accent-light" />
            <h3 className="text-sm font-bold text-foreground">
              Distribuição do Faturamento por Forma de Pagamento no Mês
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
            {(Object.keys(porFormaPagamento) as FormaPagamento[]).map((fp) => {
              const info = porFormaPagamento[fp];
              const pct = faturamentoTotal > 0 ? Math.round((info.valor / faturamentoTotal) * 100) : 0;

              return (
                <div
                  key={fp}
                  className="rounded-xl bg-background border border-border/60 p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted flex items-center gap-1.5">
                      {PAYMENT_ICONS[fp]}
                      {PAYMENT_LABELS[fp]}
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      {pct}%
                    </span>
                  </div>

                  <p className="text-sm font-bold text-foreground">
                    {formatCurrency(info.valor)}
                  </p>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 rounded-full bg-card-hover overflow-hidden">
                    <div
                      className="h-full bg-accent transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
          {modoFiltro === 'dia' ? 'Lançamentos do Dia' : 'Histórico do Mês'}
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
        <div className="py-12 text-center text-sm text-muted animate-pulse">
          Carregando lançamentos...
        </div>
      ) : activeTab === 'fechamento' ? (
        /* ===== Fechamento / Lançamentos ===== */
        <div className="space-y-2 animate-fade-in-up">
          {lancamentosOrdenados.length === 0 ? (
            <div className="text-center py-12 space-y-2 bg-card rounded-2xl border border-border p-6">
              <DollarSign size={32} className="text-muted mx-auto" />
              <p className="text-sm font-medium text-foreground">
                Nenhum lançamento registrado {modoFiltro === 'dia' ? `no dia ${formattedSelectedDate}` : `no mês de ${formattedSelectedMonth}`}
              </p>
              {modoFiltro === 'dia' && (
                <button
                  onClick={() => setIsNovoLancamentoOpen(true)}
                  className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent-dark transition-all"
                >
                  <PlusCircle size={14} />
                  Fazer Lançamento Manual
                </button>
              )}
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
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground truncate">
                        {lanc.cliente_nome}
                      </p>
                      {modoFiltro === 'mes' && (
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-md bg-card-hover text-muted border border-border">
                          {lanc.data.split('-').reverse().join('/')}
                        </span>
                      )}
                    </div>
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
                      <span className="text-[10px] text-muted hidden sm:inline">
                        {lanc.profissional.nome}
                      </span>
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

          {/* Period Summary */}
          {lancamentosOrdenados.length > 0 && (
            <div className="rounded-2xl bg-gradient-to-br from-accent/5 to-indigo-500/5 border border-accent/15 p-4 space-y-2 mt-4">
              <p className="text-[10px] uppercase tracking-widest text-muted font-semibold">
                Resumo {modoFiltro === 'dia' ? 'do Dia' : 'do Mês'}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Faturamento Bruto</span>
                <span className="text-sm font-bold text-foreground">
                  {formatCurrency(faturamentoTotal)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">
                  Comissões Totais
                </span>
                <span className="text-sm font-semibold text-warning">
                  -{formatCurrency(comissoesTotais)}
                </span>
              </div>
              <div className="h-px bg-border/50" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">
                  Líquido Salão
                </span>
                <span className="text-lg font-bold text-success">
                  {formatCurrency(liquidoSalaoTotal)}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ===== Comissões por Profissional ===== */
        <div className="space-y-3 animate-fade-in-up">
          {comissoesPorProf.length === 0 ? (
            <div className="text-center py-12 space-y-2 bg-card rounded-2xl border border-border p-6">
              <Users size={32} className="text-muted mx-auto" />
              <p className="text-sm text-muted">
                Sem comissões registradas no período
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
                              {lanc.data.split('-').reverse().join('/')} &middot; {lanc.hora} &middot;{' '}
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

      {/* Modals */}
      <NovoLancamentoModal
        isOpen={isNovoLancamentoOpen}
        onClose={() => setIsNovoLancamentoOpen(false)}
        defaultDate={selectedDate}
        profissionais={profissionaisList}
        onSubmit={handleNovoLancamentoSubmit}
      />

      <FechamentoResumoModal
        isOpen={isFechamentoResumoOpen}
        onClose={() => setIsFechamentoResumoOpen(false)}
        dateStr={selectedDate}
        lancamentos={lancamentos}
      />

      {/* UPGRADE MODAL PARA MÓDULO BLOQUEADO */}
      {isUpgradeModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 space-y-4 animate-fade-in-up text-center shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20 shadow-lg">
              <Sparkles size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">
                Módulo Lançamento Avulso
              </h3>
              <p className="text-xs text-muted">
                Recurso exclusivo para salões com o módulo ativado no sistema
              </p>
            </div>

            <div className="p-3.5 bg-background/50 rounded-2xl border border-border/80 text-xs text-left space-y-2">
              <p className="font-bold text-foreground flex items-center gap-1.5">
                <Check size={14} className="text-emerald-400" />
                O que este módulo libera no seu salão?
              </p>
              <ul className="list-disc list-inside text-muted space-y-1 pl-1">
                <li>Lançamento manual de receitas e vendas avulsas</li>
                <li>Controle de despesas e retiradas de caixa</li>
                <li>Ajuste fino de comissões por atendimento</li>
              </ul>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => setIsUpgradeModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted hover:bg-card-hover"
              >
                Fechar
              </button>
              <a
                href="https://wa.me/5551998455784?text=Olá!%20Gostaria%20de%20ativar%20o%20Módulo%20Lançamento%20Avulso%20no%20meu%20salão."
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 rounded-xl bg-accent text-xs font-bold text-white hover:bg-accent-dark transition-all flex items-center justify-center gap-1.5 shadow-md shadow-accent/20"
              >
                Fazer Upgrade
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
