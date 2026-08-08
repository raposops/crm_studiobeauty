'use client';

import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import DateSelector from '@/components/agenda/date-selector';
import ProfessionalFilter from '@/components/agenda/professional-filter';
import TimeGrid from '@/components/agenda/time-grid';
import NewAppointmentModal from '@/components/agenda/new-appointment-modal';
import { PROFISSIONAIS, AGENDAMENTOS_MOCK } from '@/data/mock';

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedProfId, setSelectedProfId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const dateStr = selectedDate.toISOString().split('T')[0];

  // Filter appointments by date and professional
  const filteredAgendamentos = useMemo(() => {
    let filtered = AGENDAMENTOS_MOCK.filter((ag) => ag.data === dateStr);
    if (selectedProfId) {
      filtered = filtered.filter(
        (ag) => ag.profissional.id === selectedProfId
      );
    }
    return filtered;
  }, [dateStr, selectedProfId]);

  // Stats
  const totalAgendamentos = filteredAgendamentos.filter(
    (ag) => ag.status !== 'cancelado'
  ).length;

  return (
    <>
      <div className="animate-fade-in-up space-y-4">
        {/* Date Selector */}
        <DateSelector
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />

        {/* Stats Strip */}
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="font-semibold text-foreground">
            {totalAgendamentos}
          </span>
          <span>agendamento{totalAgendamentos !== 1 ? 's' : ''} no dia</span>
          {selectedProfId && (
            <>
              <span>&middot;</span>
              <span className="text-accent-light font-medium">
                Filtrado por profissional
              </span>
            </>
          )}
        </div>

        {/* Professional Filter */}
        <ProfessionalFilter
          profissionais={PROFISSIONAIS}
          selectedId={selectedProfId}
          onSelect={setSelectedProfId}
        />

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Time Grid */}
        <TimeGrid agendamentos={filteredAgendamentos} />
      </div>

      {/* FAB - New Appointment */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-20 right-4 sm:right-auto sm:left-1/2 sm:translate-x-[calc(14rem)] w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-indigo-500 text-white shadow-xl shadow-accent/30 flex items-center justify-center hover:shadow-accent/50 active:scale-90 transition-all duration-200 z-50"
        aria-label="Novo agendamento"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>

      {/* New Appointment Modal */}
      <NewAppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        preselectedDate={dateStr}
      />
    </>
  );
}
