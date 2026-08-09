'use client';

import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import type { Agendamento, FormaPagamento, ProdutoExtra } from '@/types';
import {
  PRODUTOS_EXTRAS,
  COMISSAO_PERCENTUAL,
  calcularComissao,
  formatCurrency,
} from '@/data/mock';
import { useCaixa } from '@/hooks/useCaixa';

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

  const salaoId = '00000000-0000-0000-0000-000000000000'; // hardcoded fallback
  // Wait, I need PRODUTOS_EXTRAS and calcularComissao. Let's re-import them correctly.
  const { concluirAtendimento } = useCaixa(salaoId, agendamento?.data || '');

  // Computed
  const valorServicos = agendamento?.valor_total ?? 0;

  const valorProdutos = useMemo(() => {
    let total = 0;
    selectedExtras.forEach(({ produto, quantidade }) => {
      total += produto.preco * quantidade;
    });
    return total;
  }, [selectedExtras]);

  const valorTotal = valorServicos + valorProdutos;
  const { comissao, liquido } = calcularComissao(valorTotal);

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
    setIsSubmitting(false);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit() {
    if (!agendamento || !formaPagamento) return;
    setIsSubmitting(true);

    const produtosExtrasNomes = Array.from(selectedExtras.values()).map(
      ({ produto, quantidade }) =>
        quantidade > 1 ? `${produto.nome} (x${quantidade})` : produto.nome
    );

    concluirAtendimento.mutate(
      {
        agendamentoId: agendamento.id,
        formaPagamento,
        valorTotal,
        comissaoProfissional: comissao,
        valorLiquidoSalao: liquido,
        produtosExtrasNomes,
        valorServicos,
        valorProdutos,
        clienteNome: agendamento.cliente.nome,
        profissionalId: agendamento.profissional.id,
        servicosNomes: agendamento.servicos.map((s) => s.nome),
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
          <div className="space-y-2">
            <span className="text-sm font-semibold text-foreground">
              Forma de Pagamento
            </span>
            <div className="grid grid-cols-2 gap-2">
              {FORMAS_PAGAMENTO.map((fp) => {
                const isSelected = formaPagamento === fp.id;
                return (
                  <button
                    key={fp.id}
                    onClick={() => setFormaPagamento(fp.id)}
                    className={`flex items-center gap-2.5 px-3 py-3 rounded-xl border transition-all duration-200 ${
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
          </div>

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
            <div className="h-px bg-border/50" />
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-foreground">Total</span>
              <span className="text-lg font-bold text-foreground">
                {formatCurrency(valorTotal)}
              </span>
            </div>
            <div className="h-px bg-border/50" />
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Percent size={10} className="text-muted" />
                <span className="text-muted">
                  Comissão ({COMISSAO_PERCENTUAL}%)
                </span>
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
                Concluir e Registrar Pagamento
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
