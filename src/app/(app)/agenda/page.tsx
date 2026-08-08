'use client';

import { useState, useMemo } from 'react';
import { Plus } from 'lucide-react';
import DateSelector from '@/components/agenda/date-selector';
import ProfessionalFilter from '@/components/agenda/professional-filter';
import TimeGrid from '@/components/agenda/time-grid';
import NewAppointmentModal from '@/components/agenda/new-appointment-modal';
import CheckoutModal from '@/components/agenda/checkout-modal';
import type { Agendamento } from '@/types';
import { useAgenda } from '@/hooks/useAgenda';
import { useProfissionais } from '@/hooks/useProfissionais';

export default function AgendaPage() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedProfId, setSelectedProfId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkoutAgendamento, setCheckoutAgendamento] =
    useState<Agendamento | null>(null);

  const dateStr = selectedDate.toISOString().split('T')[0];
  const salaoId = 'default_salao'; // hardcoded para o MVP por enquanto

  const { agendamentos: fetchedAgendamentos, isLoading } = useAgenda(salaoId, dateStr, selectedProfId ?? undefined);
  const { profissionais } = useProfissionais(salaoId);

  // Filter appointments by date and professional (fallback if hook didn't filter fully)
  const filteredAgendamentos = useMemo(() => {
    let filtered = fetchedAgendamentos || [];
    if (selectedProfId) {
      filtered = filtered.filter(
        (ag) => ag.profissional.id === selectedProfId
      );
    }
    return filtered;
  }, [fetchedAgendamentos, selectedProfId]);

  // Stats
  const totalAgendamentos = filteredAgendamentos.filter(
    (ag) => ag.status !== 'cancelado'
  ).length;

  function handleAppointmentClick(agendamento: Agendamento) {
    // Only allow checkout for non-concluded and non-cancelled appointments
    if (
      agendamento.status !== 'concluido' &&
      agendamento.status !== 'cancelado'
    ) {
      setCheckoutAgendamento(agendamento);
    }
  }

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
          profissionais={profissionais}
          selectedId={selectedProfId}
          onSelect={setSelectedProfId}
        />

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Time Grid */}
        {isLoading ? (
          <div className="py-10 text-center text-sm text-muted animate-pulse">
            Carregando agenda...
          </div>
        ) : (
          <TimeGrid
            agendamentos={filteredAgendamentos}
            onAppointmentClick={handleAppointmentClick}
          />
        )}
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

      {/* Checkout Modal */}
      <CheckoutModal
        agendamento={checkoutAgendamento}
        isOpen={checkoutAgendamento !== null}
        onClose={() => setCheckoutAgendamento(null)}
      />
    </>
  );
}
