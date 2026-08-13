'use client';

import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PlusCircle,
  Plus,
  Trash2,
  Lock,
  Sparkles,
  Check,
  Calendar,
  Home,
  Wifi,
  Zap,
  ShoppingBag,
  Users,
  Wrench,
  Tag,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFluxoCaixa, PeriodoFiltro } from '@/hooks/useFluxoCaixa';
import { CATEGORIAS_FLUXO_CAIXA, CategoriaMovimentacao } from '@/types';

function formatarMoeda(centavos: number) {
  return (centavos / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

function getCategoriaIcon(categoria: CategoriaMovimentacao) {
  switch (categoria) {
    case 'caixa_automatico':
      return <Wallet size={16} className="text-emerald-400" />;
    case 'aluguel':
      return <Home size={16} className="text-rose-400" />;
    case 'internet':
      return <Wifi size={16} className="text-purple-400" />;
    case 'energia_agua':
      return <Zap size={16} className="text-amber-400" />;
    case 'insumos':
      return <ShoppingBag size={16} className="text-indigo-400" />;
    case 'folha_repasse':
      return <Users size={16} className="text-sky-400" />;
    case 'manutencao':
      return <Wrench size={16} className="text-orange-400" />;
    case 'receita_avulsa':
      return <DollarSign size={16} className="text-teal-400" />;
    default:
      return <Tag size={16} className="text-slate-400" />;
  }
}

export default function FluxoCaixaPage() {
  const { salaoId, hasModule } = useAuth();
  const temModuloFluxo = hasModule('fluxo_de_caixa');

  const [periodo, setPeriodo] = useState<PeriodoFiltro>('mes');
  const {
    movimentacoes,
    totalEntradas,
    totalSaidas,
    saldoLiquido,
    caixaAutoValor,
    isLoading,
    labelPeriodo,
    adicionarMovimentacao,
    excluirMovimentacao,
    refetch,
  } = useFluxoCaixa(salaoId, periodo);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTipo, setModalTipo] = useState<'saida' | 'entrada'>('saida');
  const [categoria, setCategoria] = useState<CategoriaMovimentacao>('aluguel');
  const [descricao, setDescricao] = useState('');
  const [valorInput, setValorInput] = useState('');
  const [dataInput, setDataInput] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleOpenModal(tipo: 'saida' | 'entrada') {
    setModalTipo(tipo);
    setCategoria(tipo === 'saida' ? 'aluguel' : 'receita_avulsa');
    setDescricao('');
    setValorInput('');
    setDataInput(new Date().toISOString().split('T')[0]);
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!descricao.trim() || !valorInput) return;

    // Convert decimal value string to centavos (integer), supports 100,00 and 1.000,00
    const cleanValor = valorInput.replace(/\./g, '').replace(',', '.');
    const valorFloat = parseFloat(cleanValor);
    if (isNaN(valorFloat) || valorFloat <= 0) {
      alert('Por favor, digite um valor numérico válido.');
      return;
    }

    const valorCentavos = Math.round(valorFloat * 100);

    setIsSubmitting(true);
    try {
      await adicionarMovimentacao({
        tipo: modalTipo,
        categoria,
        descricao: descricao.trim(),
        valor: valorCentavos,
        data: dataInput,
      });
      setIsModalOpen(false);
    } catch (err: any) {
      console.error('Erro ao adicionar lançamento:', err);
      alert(`Erro ao salvar lançamento: ${err?.message || 'Tente novamente.'}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Se o salão NÃO possui o módulo ativado, exibe a tela de bloqueio com CTA Pro
  if (!temModuloFluxo) {
    return (
      <div className="animate-fade-in-up space-y-6">
        <div className="flex items-center justify-between p-4 rounded-3xl bg-card border border-border shadow-xs">
          <div>
            <h1 className="text-base font-bold text-foreground flex items-center gap-2">
              <TrendingUp size={20} className="text-accent-light" />
              Fluxo de Caixa
            </h1>
            <p className="text-xs text-muted">
              Gestão financeira completa de despesas e receitas do salão
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
            <Lock size={12} />
            Módulo Pro
          </span>
        </div>

        {/* Lock Banner Card */}
        <div className="rounded-3xl bg-gradient-to-br from-card via-card/90 to-background border border-border p-6 text-center space-y-6 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/20 shadow-lg">
            <Sparkles size={32} />
          </div>
          <div className="space-y-2 max-w-md mx-auto">
            <h2 className="text-xl font-black tracking-tight text-foreground">
              Módulo Fluxo de Caixa Completo
            </h2>
            <p className="text-xs text-muted leading-relaxed">
              Tenha o controle total da saúde financeira do seu salão! Registre despesas fixas (aluguel, luz, internet, repasses) e veja as entradas do caixa sincronizadas automaticamente.
            </p>
          </div>

          <div className="p-4 bg-background/60 rounded-2xl border border-border/80 text-xs text-left max-w-md mx-auto space-y-3">
            <p className="font-bold text-foreground flex items-center gap-2">
              <Check size={16} className="text-emerald-400" />
              O que você ganha ativando este módulo?
            </p>
            <ul className="space-y-2 text-muted pl-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                Puxada automática das receitas do caixa sem precisar digitar de novo
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                Lançamento de despesas fixas (Aluguel, Luz, Internet, Insumos)
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                Cálculo em tempo real do Saldo Líquido do salão no mês
              </li>
            </ul>
          </div>

          <div className="pt-2 max-w-md mx-auto">
            <a
              href="https://wa.me/5551998455784?text=Olá!%20Gostaria%20de%20ativar%20o%20Módulo%20Fluxo%20de%20Caixa%20no%20meu%20salão."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-2xl bg-accent text-sm font-bold text-white hover:bg-accent-dark transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
            >
              Fazer Upgrade Agora no WhatsApp
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up space-y-5 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl bg-card border border-border shadow-xs">
        <div>
          <h1 className="text-base font-bold text-foreground flex items-center gap-2">
            <TrendingUp size={20} className="text-accent-light" />
            Fluxo de Caixa
          </h1>
          <p className="text-xs text-muted">
            Controle de receitas, saídas e despesas fixas ({labelPeriodo})
          </p>
        </div>

        {/* Period Selector Tabs */}
        <div className="flex items-center gap-1 bg-background/80 p-1 rounded-2xl border border-border shrink-0">
          {(['mes', 'hoje', '30dias'] as PeriodoFiltro[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                periodo === p
                  ? 'bg-accent text-white shadow-md'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {p === 'mes' ? 'Mês Atual' : p === 'hoje' ? 'Hoje' : '30 Dias'}
            </button>
          ))}
        </div>
      </div>

      {/* Metrics Row (3 Hero Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Entradas */}
        <div className="rounded-3xl bg-card border border-border p-4 space-y-2 relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between text-muted text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <ArrowUpRight size={16} className="text-emerald-400" />
              Total Entradas
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
              Receitas
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-400">
            {formatarMoeda(totalEntradas)}
          </p>
          {caixaAutoValor > 0 && (
            <p className="text-[11px] text-muted flex items-center gap-1">
              <Wallet size={12} className="text-emerald-400 shrink-0" />
              {formatarMoeda(caixaAutoValor)} puxados do Caixa
            </p>
          )}
        </div>

        {/* Saídas */}
        <div className="rounded-3xl bg-card border border-border p-4 space-y-2 relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between text-muted text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <ArrowDownRight size={16} className="text-rose-400" />
              Total Saídas
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-bold border border-rose-500/20">
              Despesas
            </span>
          </div>
          <p className="text-2xl font-black text-rose-400">
            {formatarMoeda(totalSaidas)}
          </p>
          <p className="text-[11px] text-muted truncate">
            Aluguel, luz, internet e custos
          </p>
        </div>

        {/* Saldo Líquido */}
        <div className="rounded-3xl bg-card border border-border p-4 space-y-2 relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between text-muted text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <DollarSign size={16} className="text-accent-light" />
              Saldo Líquido
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                saldoLiquido >= 0
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
              }`}
            >
              {saldoLiquido >= 0 ? 'Positivo' : 'Negativo'}
            </span>
          </div>
          <p
            className={`text-2xl font-black ${
              saldoLiquido >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatarMoeda(saldoLiquido)}
          </p>
          <p className="text-[11px] text-muted">
            {labelPeriodo}
          </p>
        </div>
      </div>

      {/* Action Buttons Row */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleOpenModal('saida')}
          className="flex-1 py-2.5 px-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-bold hover:bg-rose-500/25 transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-95"
        >
          <Plus size={16} />
          Registrar Despesa (Saída)
        </button>
        <button
          onClick={() => handleOpenModal('entrada')}
          className="flex-1 py-2.5 px-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500/25 transition-all flex items-center justify-center gap-1.5 shadow-xs active:scale-95"
        >
          <Plus size={16} />
          Registrar Receita Avulsa
        </button>
      </div>

      {/* Transactions History List */}
      <div className="rounded-3xl bg-card border border-border p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <h2 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Movimentações do Período ({movimentacoes.length})
          </h2>
          <button
            onClick={refetch}
            disabled={isLoading}
            className="p-1 text-muted hover:text-foreground transition-all"
            title="Atualizar dados"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {isLoading ? (
          <div className="py-8 text-center text-xs text-muted animate-pulse">
            Carregando movimentações...
          </div>
        ) : movimentacoes.length === 0 ? (
          <div className="py-8 text-center text-xs text-muted space-y-1">
            <TrendingUp size={28} className="mx-auto text-muted/50" />
            <p className="font-semibold text-foreground">Nenhuma movimentação registrada no período</p>
            <p className="text-[11px]">Clique nos botões acima para registrar despesas ou receitas.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {movimentacoes.map((item) => {
              const catConfig = CATEGORIAS_FLUXO_CAIXA[item.categoria] || {
                label: item.categoria,
                tipo: item.tipo,
              };

              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-background/50 border border-border/80 hover:border-border transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center shrink-0">
                      {getCategoriaIcon(item.categoria)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {item.descricao}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-muted">
                        <span>{item.data}</span>
                        <span>&middot;</span>
                        <span className="font-semibold">{catConfig.label}</span>
                        {item.origem_caixa_auto && (
                          <>
                            <span>&middot;</span>
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                              Automático do Caixa
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-xs font-black ${
                        item.tipo === 'entrada' ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {item.tipo === 'entrada' ? '+' : '-'} {formatarMoeda(item.valor)}
                    </span>
                    {!item.origem_caixa_auto && (
                      <button
                        onClick={() => excluirMovimentacao(item.id)}
                        className="p-1.5 text-muted/60 hover:text-rose-400 transition-colors"
                        title="Excluir lançamento"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL: NOVA MOVIMENTAÇÃO (DESPESA OU RECEITA) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md bg-card border border-border rounded-3xl p-6 space-y-4 shadow-2xl animate-fade-in-up"
          >
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                {modalTipo === 'saida' ? (
                  <ArrowDownRight size={18} className="text-rose-400" />
                ) : (
                  <ArrowUpRight size={18} className="text-emerald-400" />
                )}
                {modalTipo === 'saida' ? 'Registrar Nova Despesa (Saída)' : 'Registrar Receita Avulsa'}
              </h3>
            </div>

            {/* Categoria */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted">Categoria</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaMovimentacao)}
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:border-accent"
              >
                {modalTipo === 'saida' ? (
                  <>
                    <option value="aluguel">Aluguel do Salão</option>
                    <option value="internet">Internet / Telefone</option>
                    <option value="energia_agua">Luz / Água</option>
                    <option value="insumos">Insumos & Produtos</option>
                    <option value="folha_repasse">Folha & Repasse de Equipe</option>
                    <option value="manutencao">Manutenção / Equipamentos</option>
                    <option value="outros">Outras Despesas</option>
                  </>
                ) : (
                  <>
                    <option value="receita_avulsa">Receita Avulsa / Vendas</option>
                    <option value="outros">Outras Receitas</option>
                  </>
                )}
              </select>
            </div>

            {/* Descrição */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted">Descrição</label>
              <input
                type="text"
                placeholder={
                  modalTipo === 'saida'
                    ? 'Ex: Aluguel do Salão referente a Agosto'
                    : 'Ex: Venda avulsa de shampoo'
                }
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:border-accent"
              />
            </div>

            {/* Valor & Data Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted">Valor (R$)</label>
                <input
                  type="text"
                  placeholder="0.00"
                  value={valorInput}
                  onChange={(e) => setValorInput(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground placeholder:text-muted/60 focus:outline-none focus:border-accent font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted">Data</label>
                <input
                  type="date"
                  value={dataInput}
                  onChange={(e) => setDataInput(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted hover:bg-card-hover"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md ${
                  modalTipo === 'saida'
                    ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                }`}
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Lançamento'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
