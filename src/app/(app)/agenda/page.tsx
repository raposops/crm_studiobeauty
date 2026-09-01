'use client';

import { useState, useMemo } from 'react';
import { Plus, Store, Mail, CheckCircle2, Bell, Loader2 } from 'lucide-react';
import DateSelector from '@/components/agenda/date-selector';
import ProfessionalFilter from '@/components/agenda/professional-filter';
import TimeGrid from '@/components/agenda/time-grid';
import NewAppointmentModal from '@/components/agenda/new-appointment-modal';
import CheckoutModal from '@/components/agenda/checkout-modal';
import type { Agendamento } from '@/types';
import { useAgenda } from '@/hooks/useAgenda';
import { useProfissionais } from '@/hooks/useProfissionais';
import { useAuth } from '@/contexts/AuthContext';

export default function AgendaPage() {
  const { salao, salaoId, user, profile } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedProfId, setSelectedProfId] = useState<string | null>(null);
  
  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkoutAgendamento, setCheckoutAgendamento] = useState<Agendamento | null>(null);
  const [isSendingReminders, setIsSendingReminders] = useState(false);

  const dateStr = selectedDate.toISOString().split('T')[0];

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
    setCheckoutAgendamento(agendamento);
  }

  async function handleSendTomorrowReminders() {
    if (!salaoId) return;
    const confirmSend = window.confirm(
      'Deseja disparar agora os lembretes de WhatsApp para todos os clientes agendados para AMANHÃ?'
    );
    if (!confirmSend) return;

    setIsSendingReminders(true);
    try {
      const res = await fetch(`/api/cron/lembretes?salaoId=${salaoId}`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`✅ ${data.message}`);
      } else {
        alert(`❌ Erro ao enviar lembretes: ${data.error || 'Tente novamente.'}`);
      }
    } catch (err: any) {
      alert(`❌ Erro de conexão: ${err?.message}`);
    } finally {
      setIsSendingReminders(false);
    }
  }

  return (
    <>
      <div className="animate-fade-in-up space-y-4">
        {/* Salon Account Indicator Banner */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-card border border-border shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent-light flex items-center justify-center shrink-0">
              <Store size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">
                {salao?.nome || 'Studio Beauty'}
              </p>
              <p className="text-[10px] text-muted truncate">
                {user?.email || profile?.email || 'Conta Conectada'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleSendTomorrowReminders}
              disabled={isSendingReminders}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 text-xs font-bold transition-all active:scale-95 cursor-pointer disabled:opacity-50"
              title="Dispara mensagem de lembrete 24h no WhatsApp para os agendamentos de amanhã"
            >
              {isSendingReminders ? (
                <Loader2 size={13} className="animate-spin text-purple-400" />
              ) : (
                <Bell size={13} className="text-purple-400" />
              )}
              <span>{isSendingReminders ? 'Enviando...' : 'Lembretes de Amanhã'}</span>
            </button>
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold hidden sm:inline-block">
              Conta Ativa
            </span>
          </div>
        </div>

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
