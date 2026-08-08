import { CalendarDays, Plus, Clock } from 'lucide-react';

export default function AgendaPage() {
  const today = new Date();
  const dayName = today.toLocaleDateString('pt-BR', { weekday: 'long' });
  const dateStr = today.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Agenda</h2>
          <p className="text-sm text-muted capitalize">
            {dayName}, {dateStr}
          </p>
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-accent to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-all duration-200 active:scale-95">
          <Plus size={16} />
          Novo
        </button>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-card border border-border flex items-center justify-center">
            <CalendarDays size={36} className="text-muted" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
            <Clock size={10} className="text-accent-light" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-foreground">
            Nenhum agendamento hoje
          </p>
          <p className="text-xs text-muted max-w-[200px]">
            Toque em &quot;Novo&quot; para agendar um atendimento
          </p>
        </div>
      </div>

      {/* Placeholder time slots */}
      <div className="space-y-2">
        {['08:00', '09:00', '10:00', '11:00', '14:00', '15:00', '16:00'].map(
          (time) => (
            <div
              key={time}
              className="flex items-center gap-3 px-3 py-3 rounded-xl border border-border/50 hover:border-border hover:bg-card/50 transition-all duration-200 cursor-pointer group"
            >
              <span className="text-xs font-mono text-muted w-10">{time}</span>
              <div className="flex-1 h-[1px] bg-border/50 group-hover:bg-border transition-colors" />
              <Plus
                size={14}
                className="text-muted/40 group-hover:text-accent transition-colors"
              />
            </div>
          )
        )}
      </div>
    </div>
  );
}
