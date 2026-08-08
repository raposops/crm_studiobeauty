import { Users, Search, UserPlus } from 'lucide-react';

export default function ClientesPage() {
  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Clientes</h2>
          <p className="text-sm text-muted">Gerenciar clientes</p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-accent to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-all duration-200 active:scale-95">
          <UserPlus size={16} />
          Novo
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search
          size={16}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          type="text"
          placeholder="Buscar cliente..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
        />
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="w-20 h-20 rounded-2xl bg-card border border-border flex items-center justify-center">
          <Users size={36} className="text-muted" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-foreground">
            Nenhum cliente cadastrado
          </p>
          <p className="text-xs text-muted max-w-[220px]">
            Adicione seus clientes para ter um histórico completo de atendimentos
          </p>
        </div>
      </div>
    </div>
  );
}
