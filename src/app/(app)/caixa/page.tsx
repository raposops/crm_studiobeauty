import { Wallet, TrendingUp, TrendingDown, ArrowUpRight } from 'lucide-react';

export default function CaixaPage() {
  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Caixa</h2>
        <p className="text-sm text-muted">Resumo financeiro do dia</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card border border-border p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
              <TrendingUp size={16} className="text-success" />
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted font-medium">
              Entradas
            </p>
            <p className="text-lg font-bold text-success">R$ 0,00</p>
          </div>
        </div>

        <div className="rounded-2xl bg-card border border-border p-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-danger/10 flex items-center justify-center">
              <TrendingDown size={16} className="text-danger" />
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted font-medium">
              Saídas
            </p>
            <p className="text-lg font-bold text-danger">R$ 0,00</p>
          </div>
        </div>
      </div>

      {/* Balance Card */}
      <div className="rounded-2xl bg-gradient-to-br from-accent/10 to-indigo-500/10 border border-accent/20 p-5 space-y-1">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-wider text-muted font-medium">
            Saldo do dia
          </p>
          <ArrowUpRight size={16} className="text-accent-light" />
        </div>
        <p className="text-2xl font-bold text-foreground">R$ 0,00</p>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-12 space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center">
          <Wallet size={28} className="text-muted" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-foreground">
            Sem movimentações
          </p>
          <p className="text-xs text-muted max-w-[220px]">
            As transações do dia aparecerão aqui automaticamente
          </p>
        </div>
      </div>
    </div>
  );
}
