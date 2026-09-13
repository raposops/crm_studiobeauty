'use client';

import { useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { getLocalDateString, parseLocalDateString, getTodayDateString } from '@/lib/dateUtils';

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export default function DateSelector({
  selectedDate,
  onDateChange,
}: DateSelectorProps) {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const todayStr = getTodayDateString();
  const currentSelectedStr = getLocalDateString(selectedDate);
  const isToday = currentSelectedStr === todayStr;

  const dayName = selectedDate.toLocaleDateString('pt-BR', {
    weekday: 'short',
  });
  const dateFormatted = selectedDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
  });

  function goToPrev() {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    prev.setHours(12, 0, 0, 0);
    onDateChange(prev);
  }

  function goToNext() {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    next.setHours(12, 0, 0, 0);
    onDateChange(next);
  }

  function goToToday() {
    onDateChange(parseLocalDateString(todayStr));
  }

  function handleDatePick(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.value) {
      onDateChange(parseLocalDateString(e.target.value));
    }
  }

  return (
    <div className="flex items-center justify-between gap-2">
      <button
        type="button"
        onClick={goToPrev}
        className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-card-hover active:scale-95 transition-all cursor-pointer"
        title="Dia anterior"
      >
        <ChevronLeft size={18} className="text-foreground" />
      </button>

      <div className="relative flex-1 flex items-center">
        {/* Hidden Date input for opening native datepicker */}
        <input
          ref={dateInputRef}
          type="date"
          value={currentSelectedStr}
          onChange={handleDatePick}
          className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
          tabIndex={-1}
        />

        <button
          type="button"
          onClick={goToToday}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl border transition-all active:scale-[0.98] cursor-pointer ${
            isToday
              ? 'bg-accent/10 border-accent/30 text-accent-light'
              : 'bg-card border-border text-foreground hover:bg-card-hover'
          }`}
        >
          <span className="text-sm font-bold capitalize">{dayName}</span>
          <span className="text-xs text-muted">&middot;</span>
          <span className="text-sm font-semibold">{dateFormatted}</span>
          {isToday ? (
            <span className="ml-1 text-[9px] uppercase tracking-widest font-bold bg-accent/20 text-accent-light px-1.5 py-0.5 rounded-md">
              Hoje
            </span>
          ) : (
            <span
              onClick={(e) => {
                e.stopPropagation();
                goToToday();
              }}
              className="ml-1 text-[9px] uppercase font-bold text-muted hover:text-foreground bg-muted/20 hover:bg-muted/30 px-1.5 py-0.5 rounded-md transition-colors"
              title="Voltar para Hoje"
            >
              Ir p/ Hoje
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            if (dateInputRef.current) {
              if (typeof dateInputRef.current.showPicker === 'function') {
                dateInputRef.current.showPicker();
              } else {
                dateInputRef.current.focus();
              }
            }
          }}
          className="ml-1.5 w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-card-hover active:scale-95 transition-all text-muted hover:text-foreground cursor-pointer shrink-0"
          title="Escolher data específica no calendário"
        >
          <CalendarIcon size={16} />
        </button>
      </div>

      <button
        type="button"
        onClick={goToNext}
        className="w-9 h-9 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-card-hover active:scale-95 transition-all cursor-pointer"
        title="Próximo dia"
      >
        <ChevronRight size={18} className="text-foreground" />
      </button>
    </div>
  );
}

