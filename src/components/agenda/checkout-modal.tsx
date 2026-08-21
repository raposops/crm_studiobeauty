'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  X,
  User,
  Clock,
  Scissors,
  ShoppingBag,
  Check,
  CreditCard,
  Smartphone,
  Banknote,
  Plus,
  Minus,
  Receipt,
  Percent,
  Sparkles,
  Wallet,
} from 'lucide-react';
import type { Agendamento, FormaPagamento, ProdutoExtra } from '@/types';
import {
  PRODUTOS_EXTRAS,
  COMISSAO_PERCENTUAL,
  calcularComissao,
  formatCurrency,
} from '@/data/mock';
import { useCaixa } from '@/hooks/useCaixa';
import { useAuth } from '@/contexts/AuthContext';

interface CheckoutModalProps {
  agendamento: Agendamento | null;
  isOpen: boolean;
  onClose: () => void;
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
    icon: <Smartphone size={20} />,
    color: 'from-teal-500 to-cyan-500',
  },
  {
    id: 'credito',
    label: 'Crédito',
    icon: <CreditCard size={20} />,
    color: 'from-blue-500 to-indigo-500',
  },
  {
    id: 'debito',
    label: 'Débito',
    icon: <CreditCard size={20} />,
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'dinheiro',
    label: 'Dinheiro',
    icon: <Banknote size={20} />,
    color: 'from-green-500 to-emerald-500',
  },
];

export default function CheckoutModal({
  agendamento,
  isOpen,
  onClose,
}: CheckoutModalProps) {
  const [selectedExtras, setSelectedExtras] = useState<
    Map<string, { produto: ProdutoExtra; quantidade: number }>
  >(new Map());
  const [formaPagamento, setFormaPagamento] =
    useState<FormaPagamento | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comissaoPct, setComissaoPct] = useState<number>(
    agendamento?.profissional?.comissao_padrao_pct ?? COMISSAO_PERCENTUAL
  );

  // Estados de Crédito e Dinheiro
  const [usarCredito, setUsarCredito] = useState(false);
  const [valorDinheiroEntregueInput, setValorDinheiroEntregueInput] = useState('');
  const [deixarTrocoComoCredito, setDeixarTrocoComoCredito] = useState(true);

  // Estado de Desconto
  const [valorDescontoInput, setValorDescontoInput] = useState('');

  useEffect(() => {
    if (agendamento?.profissional) {
      setComissaoPct(
        agendamento.profissional.comissao_padrao_pct ?? COMISSAO_PERCENTUAL
      );
    }
    // Auto sugerir usar crédito se a cliente tiver saldo
    if (agendamento?.cliente?.saldo_credito && agendamento.cliente.saldo_credito > 0) {
      setUsarCredito(true);
    } else {
      setUsarCredito(false);
    }
  }, [agendamento]);

  const { salaoId } = useAuth();
  const { concluirAtendimento } = useCaixa(salaoId, agendamento?.data || '');

  // Computed
  const valorServicos = (agendamento as any)?.valor_servico || agendamento?.valor_total || 0;

  const valorProdutos = useMemo(() => {
    let total = 0;
    selectedExtras.forEach(({ produto, quantidade }) => {
      total += produto.preco * quantidade;
    });
    return total;
  }, [selectedExtras]);

  const valorDescontoCentavos = useMemo(() => {
    const parsed = parseFloat(valorDescontoInput.replace(',', '.'));
    if (isNaN(parsed) || parsed < 0) return 0;
    return Math.round(parsed * 100);
  }, [valorDescontoInput]);

  const valorTotalBruto = Math.max(0, valorServicos + valorProdutos - valorDescontoCentavos);
  
  // Saldo da cliente disponível
  const saldoCliente = agendamento?.cliente?.saldo_credito || 0;
  
  // Abatimento de crédito
  const valorCreditoAbatido = usarCredito ? Math.min(saldoCliente, valorTotalBruto) : 0;
  const valorRestanteAPagar = Math.max(0, valorTotalBruto - valorCreditoAbatido);

  // Se o saldo cobrir 100% da conta, a forma de pagamento é saldo
  useEffect(() => {
    if (valorRestanteAPagar === 0 && valorTotalBruto > 0 && usarCredito) {
      setFormaPagamento('saldo');
    } else if (formaPagamento === 'saldo' && valorRestanteAPagar > 0) {
      setFormaPagamento(null);
    }
  }, [valorRestanteAPagar, valorTotalBruto, usarCredito, formaPagamento]);

  // Cálculo de troco quando em dinheiro
  const valorDinheiroEntregueCentavos = useMemo(() => {
    const parsed = parseFloat(valorDinheiroEntregueInput.replace(',', '.'));
    if (isNaN(parsed) || parsed < 0) return 0;
    return Math.round(parsed * 100);
  }, [valorDinheiroEntregueInput]);

  const trocoCentavos = useMemo(() => {
    if (formaPagamento !== 'dinheiro') return 0;
    return Math.max(0, valorDinheiroEntregueCentavos - valorRestanteAPagar);
  }, [formaPagamento, valorDinheiroEntregueCentavos, valorRestanteAPagar]);

  const creditoGerado = formaPagamento === 'dinheiro' && deixarTrocoComoCredito ? trocoCentavos : 0;

  // Comissão: aplicada sobre o valor bruto dos serviços
  const { comissao } = calcularComissao(valorServicos, comissaoPct);
  const liquido = valorTotalBruto - comissao;

  function toggleExtra(produto: ProdutoExtra) {
    setSelectedExtras((prev) => {
      const next = new Map(prev);
      if (next.has(produto.id)) {
        next.delete(produto.id);
      } else {
        next.set(produto.id, { produto, quantidade: 1 });
      }
      return next;
    });
  }

  function updateQuantidade(produtoId: string, delta: number) {
    setSelectedExtras((prev) => {
      const next = new Map(prev);
      const item = next.get(produtoId);
      if (!item) return next;
      const newQty = item.quantidade + delta;
      if (newQty <= 0) {
        next.delete(produtoId);
      } else {
        next.set(produtoId, { ...item, quantidade: newQty });
      }
      return next;
    });
  }

  function resetForm() {
    setSelectedExtras(new Map());
    setFormaPagamento(null);
    setUsarCredito(false);
    setValorDinheiroEntregueInput('');
    setDeixarTrocoComoCredito(true);
    setValorDescontoInput('');
    setIsSubmitting(false);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit() {
    if (!agendamento) return;
    const finalFormaPagamento = (valorRestanteAPagar === 0 && valorCreditoAbatido > 0) ? 'saldo' : formaPagamento;
    if (!finalFormaPagamento) return;

    setIsSubmitting(true);

    const produtosExtrasNomes = Array.from(selectedExtras.values()).map(
      ({ produto, quantidade }) =>
        quantidade > 1 ? `${produto.nome} (x${quantidade})` : produto.nome
    );

    concluirAtendimento.mutate(
      {
        agendamentoId: agendamento.id,
        formaPagamento: finalFormaPagamento,
        valorTotal: valorTotalBruto,
        comissaoProfissional: comissao,
        valorLiquidoSalao: liquido,
        produtosExtrasNomes,
        valorServicos,
        valorProdutos,
        clienteNome: agendamento.cliente.nome,
        profissionalId: agendamento.profissional.id,
        servicosNomes: agendamento.servicos.map((s) => s.nome),
        opcoesCredito: {
          clienteId: agendamento.cliente.id,
          creditoUtilizado: valorCreditoAbatido,
          creditoGerado: creditoGerado,
        },
      },
      {
        onSuccess: () => {
          handleClose();
        },
        onError: (err) => {
          console.error('Erro ao concluir atendimento:', err);
          alert('Erro ao registrar pagamento.');
        },
        onSettled: () => {
          setIsSubmitting(false);
        }
      }
    );
  }

  if (!isOpen || !agendamento) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-background border border-border rounded-t-3xl sm:rounded-3xl max-h-[90dvh] flex flex-col animate-fade-in-up">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <Receipt size={18} className="text-accent-light" />
            <h3 className="text-base font-bold text-foreground">
              Fechar Comanda
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-card-hover transition-all active:scale-95"
          >
            <X size={16} className="text-muted" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-5">
          {/* Appointment Summary */}
          <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <User size={14} className="text-accent-light" />
              <span className="text-sm font-bold text-foreground">
                {agendamento.cliente.nome}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-muted" />
              <span className="text-xs text-muted">
                {agendamento.hora_inicio} - {agendamento.hora_fim}
              </span>
              <span className="text-xs text-muted">&middot;</span>
              <div className="flex items-center gap-1">
                <div
                  className={`w-4 h-4 rounded-full bg-gradient-to-br ${agendamento.profissional.cor} flex items-center justify-center`}
                >
                  <span className="text-[6px] font-bold text-white">
                    {agendamento.profissional.iniciais}
                  </span>
                </div>
                <span className="text-xs text-muted">
                  {agendamento.profissional.nome}
                </span>
              </div>
            </div>

            {/* Services List */}
            <div className="space-y-1.5 pt-1 border-t border-border/50">
              <div className="flex items-center gap-1.5 mb-1">
                <Scissors size={12} className="text-muted" />
                <span className="text-[10px] uppercase tracking-widest text-muted font-semibold">
                  Serviços
                </span>
              </div>
              {agendamento.servicos.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between"
                >
                  <span className="text-sm text-foreground">{s.nome}</span>
                  <span className="text-sm font-semibold text-foreground">
                    {formatCurrency(s.preco)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CRÉDITO DISPONÍVEL DA CLIENTE */}
          {saldoCliente > 0 && (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Sparkles size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">
                    Crédito: {formatCurrency(saldoCliente)}
                  </p>
                  <p className="text-[11px] text-muted">
                    {usarCredito
                      ? `Abatendo ${formatCurrency(valorCreditoAbatido)} nesta comanda`
                      : 'Cliente possui saldo em haver acumulado'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUsarCredito(!usarCredito)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  usarCredito
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20 active:scale-95'
                    : 'bg-card border border-border text-foreground hover:bg-card-hover'
                }`}
              >
                {usarCredito ? 'Abatido ✓' : 'Usar Crédito'}
              </button>
            </div>
          )}

          {/* Upsell - Extra Products */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <ShoppingBag size={14} className="text-accent-light" />
              <span className="text-sm font-semibold text-foreground">
                Produtos extras
              </span>
              <span className="text-[10px] text-muted">(opcional)</span>
            </div>

            <div className="grid grid-cols-1 gap-1.5 max-h-[180px] overflow-y-auto">
              {PRODUTOS_EXTRAS.map((produto) => {
                const selected = selectedExtras.get(produto.id);
                const isSelected = !!selected;

                return (
                  <div
                    key={produto.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? 'bg-accent/10 border-accent/30'
                        : 'bg-card border-border hover:bg-card-hover'
                    }`}
                  >
                    <button
                      onClick={() => toggleExtra(produto)}
                      className="flex-1 flex items-center gap-2 text-left min-w-0"
                    >
                      <div
                        className={`w-4 h-4 rounded shrink-0 border-2 flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-accent border-accent'
                            : 'border-border'
                        }`}
                      >
                        {isSelected && (
                          <Check size={10} className="text-white" />
                        )}
                      </div>
                      <span className="text-sm text-foreground truncate">
                        {produto.nome}
                      </span>
                    </button>
                    <span className="text-xs font-semibold text-foreground shrink-0">
                      {formatCurrency(produto.preco)}
                    </span>

                    {isSelected && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => updateQuantidade(produto.id, -1)}
                          className="w-6 h-6 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-card-hover active:scale-90"
                        >
                          <Minus size={10} className="text-muted" />
                        </button>
                        <span className="text-xs font-bold text-foreground w-5 text-center">
                          {selected.quantidade}
                        </span>
                        <button
                          onClick={() => updateQuantidade(produto.id, 1)}
                          className="w-6 h-6 rounded-lg bg-card border border-border flex items-center justify-center hover:bg-card-hover active:scale-90"
                        >
                          <Plus size={10} className="text-muted" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Method */}
          {valorRestanteAPagar === 0 && valorCreditoAbatido > 0 ? (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center">
                <Check size={18} />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  Pago Integralmente com Saldo / Crédito
                </p>
                <p className="text-xs text-muted">
                  Nenhum valor adicional precisa ser cobrado.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-foreground">
                  Forma de Pagamento {valorCreditoAbatido > 0 && `(Restante: ${formatCurrency(valorRestanteAPagar)})`}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {FORMAS_PAGAMENTO.map((fp) => {
                  const isSelected = formaPagamento === fp.id;
                  return (
                    <button
                      key={fp.id}
                      onClick={() => setFormaPagamento(fp.id)}
                      className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-accent/10 border-accent/30'
                          : 'bg-card border-border hover:bg-card-hover'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-white bg-gradient-to-br ${fp.color}`}
                      >
                        {fp.icon}
                      </div>
                      <span
                        className={`text-xs font-semibold ${
                          isSelected ? 'text-accent-light' : 'text-foreground'
                        }`}
                      >
                        {fp.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Se pagando em Dinheiro: Cálculo de Troco & Deixar como Crédito */}
              {formaPagamento === 'dinheiro' && (
                <div className="p-3.5 rounded-2xl bg-card border border-border space-y-3 animate-fade-in-up">
                  <div>
                    <label className="block text-xs font-semibold text-muted mb-1">
                      Valor em Dinheiro Entregue (R$)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder={`Ex: ${(valorRestanteAPagar / 100).toFixed(2)}`}
                      value={valorDinheiroEntregueInput}
                      onChange={(e) => setValorDinheiroEntregueInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-accent"
                    />
                  </div>

                  {trocoCentavos > 0 && (
                    <div className="p-3 rounded-xl bg-accent/10 border border-accent/25 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-foreground">Troco Calculado:</span>
                        <span className="text-sm font-bold text-accent">
                          {formatCurrency(trocoCentavos)}
                        </span>
                      </div>

                      <label className="flex items-center gap-2.5 pt-1 border-t border-accent/20 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={deixarTrocoComoCredito}
                          onChange={(e) => setDeixarTrocoComoCredito(e.target.checked)}
                          className="w-4 h-4 rounded accent-accent cursor-pointer"
                        />
                        <div className="text-xs">
                          <p className="font-bold text-foreground flex items-center gap-1">
                            <Sparkles size={12} className="text-accent" />
                            Deixar troco como Crédito da cliente
                          </p>
                          <p className="text-[11px] text-muted">
                            Adiciona {formatCurrency(trocoCentavos)} ao saldo para o próximo serviço
                          </p>
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Financial Summary */}
          <div className="rounded-2xl bg-gradient-to-br from-accent/5 to-indigo-500/5 border border-accent/15 p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Serviços</span>
              <span className="text-foreground font-medium">
                {formatCurrency(valorServicos)}
              </span>
            </div>
            {valorProdutos > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">Produtos</span>
                <span className="text-foreground font-medium">
                  {formatCurrency(valorProdutos)}
                </span>
              </div>
            )}
            {valorCreditoAbatido > 0 && (
              <div className="flex items-center justify-between text-sm text-emerald-400 font-medium">
                <span>Crédito Abatido</span>
                <span>- {formatCurrency(valorCreditoAbatido)}</span>
              </div>
            )}
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Desconto (R$)</span>
              <div className="flex items-center bg-background border border-border px-2 py-0.5 rounded-md focus-within:border-accent w-24">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={valorDescontoInput}
                  onChange={(e) => setValorDescontoInput(e.target.value)}
                  className="w-full text-right text-sm font-medium bg-transparent text-foreground focus:outline-none placeholder:text-muted/50"
                  placeholder="0,00"
                />
              </div>
            </div>

            <div className="h-px bg-border/50" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">Total {valorCreditoAbatido > 0 ? 'a Pagar' : ''}</span>
              <span className="text-lg font-bold text-foreground">
                {formatCurrency(valorRestanteAPagar)}
              </span>
            </div>
            {creditoGerado > 0 && (
              <div className="flex items-center justify-between text-xs text-accent font-semibold pt-0.5">
                <span>Novo Crédito Gerado (Troco)</span>
                <span>+ {formatCurrency(creditoGerado)}</span>
              </div>
            )}
            <div className="h-px bg-border/50" />
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Percent size={12} className="text-muted" />
                <span className="text-muted">Comissão ({comissaoPct}%):</span>
                <div className="flex items-center bg-card border border-border px-1.5 py-0.5 rounded-md focus-within:border-accent">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={comissaoPct}
                    onChange={(e) => setComissaoPct(Math.max(0, Math.min(100, Number(e.target.value) || 0)))}
                    className="w-7 text-center text-xs font-bold bg-transparent text-foreground focus:outline-none"
                    title="Ajustar % de comissão para este atendimento"
                  />
                  <span className="text-[10px] text-muted font-semibold">%</span>
                </div>
              </div>
              <span className="text-warning font-semibold">
                {formatCurrency(comissao)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">Líquido Salão</span>
              <span className="text-success font-semibold">
                {formatCurrency(liquido)}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-2 border-t border-border/50">
          <button
            onClick={handleSubmit}
            disabled={!formaPagamento || isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check size={18} />
                {agendamento?.status === 'concluido'
                  ? 'Reconcluir / Atualizar Atendimento'
                  : 'Concluir e Registrar Pagamento'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
