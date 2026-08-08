'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export default function DateSelector({
  selectedDate,
  onDateChange,
}: DateSelectorProps) {
  const isToday =
    selectedDate.toDateString() === new Date().toDateString();

  const dayName = selectedDate.toLocaleDateString('pt-BR', {
    weekday: 'short',
  });
  const dateStr = selectedDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });

  function goToPrev() {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    onDateChange(prev);
  }

  function goToNext() {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    onDateChange(next);
  }

  function goToToday() {
    onDateChange(new Date());
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <button
        onClick={goToPrev}
        className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-card-hover active:scale-95 transition-all"
      >
        <ChevronLeft size={18} className="text-foreground" />
      </button>

      <button
        onClick={goToToday}
        className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-xl border transition-all active:scale-[0.98] ${
          isToday
            ? 'bg-accent/10 border-accent/30 text-accent-light'
            : 'bg-card border-border text-foreground hover:bg-card-hover'
        }`}
      >
        <span className="text-sm font-bold capitalize">{dayName}</span>
        <span className="text-xs text-muted">&middot;</span>
        <span className="text-sm font-semibold">{dateStr}</span>
        {isToday && (
          <span className="ml-1 text-[9px] uppercase tracking-widest font-bold bg-accent/20 text-accent-light px-1.5 py-0.5 rounded-md">
            Hoje
          </span>
        )}
      </button>

      <button
        onClick={goToNext}
        className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-card-hover active:scale-95 transition-all"
      >
        <ChevronRight size={18} className="text-foreground" />
      </button>
    </div>
  );
}
