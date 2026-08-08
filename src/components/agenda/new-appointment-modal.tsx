'use client';

import { useState, useMemo } from 'react';
import {
  X,
  Search,
  User,
  Phone,
  ChevronRight,
  ChevronLeft,
  Check,
  Clock,
  CalendarDays,
  MessageCircle,
  Sparkles,
} from 'lucide-react';
import type { Cliente, Servico, Profissional, NovoAgendamentoForm } from '@/types';
import {
  CLIENTES,
  SERVICOS,
  PROFISSIONAIS,
  HORARIOS,
  formatCurrency,
  addMinutesToTime,
} from '@/data/mock';
import { supabase } from '@/lib/supabase';
import { triggerWhatsAppNotification } from '@/lib/whatsapp';

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedDate?: string;
}

const AVAILABLE_HOURS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00',
];

export default function NewAppointmentModal({
  isOpen,
  onClose,
  preselectedDate,
}: NewAppointmentModalProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Client
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);

  // Step 2: Services + Professional
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedProfId, setSelectedProfId] = useState<string>('');

  // Step 3: Date/Time
  const [selectedDate, setSelectedDate] = useState(
    preselectedDate || new Date().toISOString().split('T')[0]
  );
  const [selectedTime, setSelectedTime] = useState('');
  const [sendWhatsApp, setSendWhatsApp] = useState(true);

  // Computed values
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return CLIENTES;
    const query = clientSearch.toLowerCase();
    return CLIENTES.filter(
      (c) =>
        c.nome.toLowerCase().includes(query) ||
        c.whatsapp.includes(query)
    );
  }, [clientSearch]);

  const selectedServices = useMemo(
    () => SERVICOS.filter((s) => selectedServiceIds.includes(s.id)),
    [selectedServiceIds]
  );

  const totalPrice = useMemo(
    () => selectedServices.reduce((sum, s) => sum + s.preco, 0),
    [selectedServices]
  );

  const totalDuration = useMemo(
    () => selectedServices.reduce((sum, s) => sum + s.duracao_minutos, 0),
    [selectedServices]
  );

  const endTime = useMemo(() => {
    if (!selectedTime || totalDuration === 0) return '';
    return addMinutesToTime(selectedTime, totalDuration);
  }, [selectedTime, totalDuration]);

  // Validation
  const canGoToStep2 = selectedClient !== null;
  const canGoToStep3 = selectedServiceIds.length > 0 && selectedProfId !== '';
  const canSubmit = selectedTime !== '' && selectedDate !== '';

  function toggleService(id: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  }

  function resetForm() {
    setStep(1);
    setClientSearch('');
    setSelectedClient(null);
    setSelectedServiceIds([]);
    setSelectedProfId('');
    setSelectedDate(preselectedDate || new Date().toISOString().split('T')[0]);
    setSelectedTime('');
    setSendWhatsApp(true);
    setIsSubmitting(false);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit() {
    if (!selectedClient || !canSubmit) return;
    setIsSubmitting(true);

    const payload = {
      cliente_id: selectedClient.id,
      profissional_id: selectedProfId,
      servico_ids: selectedServiceIds,
      data: selectedDate,
      hora_inicio: selectedTime,
      hora_fim: endTime,
      status: 'agendado',
      valor_total: totalPrice,
      duracao_total: totalDuration,
      enviar_whatsapp: sendWhatsApp,
    };

    try {
      const { data: insertedData, error } = await supabase
        .from('agendamentos')
        .insert(payload)
        .select();

      if (error) {
        console.error('Erro ao salvar agendamento:', error);
        alert('Erro ao salvar. Verifique a conexão com o Supabase.');
      } else {
        if (sendWhatsApp && selectedClient) {
          const profObj = PROFISSIONAIS.find((p) => p.id === selectedProfId);
          await triggerWhatsAppNotification({
            agendamentoId: insertedData?.[0]?.id || 'mock-id',
            clienteNome: selectedClient.nome,
            whatsapp: selectedClient.whatsapp,
            data: selectedDate,
            hora: selectedTime,
            servicos: selectedServices.map((s) => s.nome),
            profissionalNome: profObj?.nome || 'Profissional',
            status: 'agendado',
            tipoEvento: 'novo_agendamento',
          });
        }
        handleClose();
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
      alert('Erro inesperado ao salvar.');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Group services by category
  const servicesByCategory = useMemo(() => {
    const map = new Map<string, Servico[]>();
    SERVICOS.forEach((s) => {
      const list = map.get(s.categoria) || [];
      list.push(s);
      map.set(s.categoria, list);
    });
    return map;
  }, []);

  if (!isOpen) return null;

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
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-card-hover transition-all active:scale-95"
              >
                <ChevronLeft size={16} className="text-foreground" />
              </button>
            )}
            <div>
              <h3 className="text-base font-bold text-foreground">
                Novo Agendamento
              </h3>
              <p className="text-[11px] text-muted">
                Passo {step} de 3
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-card-hover transition-all active:scale-95"
          >
            <X size={16} className="text-muted" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-5 pb-4">
          <div className="h-1 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-accent to-indigo-500 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 pb-5 space-y-4">
          {/* ===== STEP 1: Client Search ===== */}
          {step === 1 && (
            <div className="space-y-4 animate-fade-in-up">
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  Selecione o cliente
                </p>
                <p className="text-xs text-muted">
                  Busque por nome ou WhatsApp
                </p>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  type="text"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  placeholder="Nome ou WhatsApp..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted/60 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                  autoFocus
                />
              </div>

              {/* Client List */}
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {filteredClients.map((client) => {
                  const isSelected = selectedClient?.id === client.id;
                  return (
                    <button
                      key={client.id}
                      onClick={() => setSelectedClient(client)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200 text-left ${
                        isSelected
                          ? 'bg-accent/10 border-accent/30'
                          : 'bg-card border-border hover:bg-card-hover'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-accent/20'
                            : 'bg-card-hover'
                        }`}
                      >
                        <User
                          size={18}
                          className={
                            isSelected ? 'text-accent-light' : 'text-muted'
                          }
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`text-sm font-semibold truncate ${
                            isSelected ? 'text-accent-light' : 'text-foreground'
                          }`}
                        >
                          {client.nome}
                        </p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <Phone size={10} className="text-muted" />
                          <span className="text-[11px] text-muted">
                            {client.whatsapp}
                          </span>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center shrink-0">
                          <Check size={14} className="text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}

                {filteredClients.length === 0 && (
                  <div className="text-center py-8 space-y-2">
                    <Search size={24} className="text-muted mx-auto" />
                    <p className="text-sm text-muted">
                      Nenhum cliente encontrado
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== STEP 2: Services + Professional ===== */}
          {step === 2 && (
            <div className="space-y-5 animate-fade-in-up">
              {/* Services */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  Selecione os serviços
                </p>
                <p className="text-xs text-muted">
                  Você pode selecionar mais de um
                </p>
              </div>

              <div className="space-y-4 max-h-[200px] overflow-y-auto">
                {Array.from(servicesByCategory.entries()).map(
                  ([category, services]) => (
                    <div key={category}>
                      <p className="text-[10px] uppercase tracking-widest text-muted font-semibold mb-1.5 px-1">
                        {category}
                      </p>
                      <div className="space-y-1">
                        {services.map((service) => {
                          const isSelected = selectedServiceIds.includes(
                            service.id
                          );
                          return (
                            <button
                              key={service.id}
                              onClick={() => toggleService(service.id)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-200 text-left ${
                                isSelected
                                  ? 'bg-accent/10 border-accent/30'
                                  : 'bg-card border-border hover:bg-card-hover'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                                  isSelected
                                    ? 'bg-accent border-accent'
                                    : 'border-border'
                                }`}
                              >
                                {isSelected && (
                                  <Check size={12} className="text-white" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground">
                                  {service.nome}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-[11px] text-muted">
                                    {service.duracao_minutos}min
                                  </span>
                                </div>
                              </div>
                              <span className="text-sm font-bold text-foreground shrink-0">
                                {formatCurrency(service.preco)}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Summary */}
              {selectedServiceIds.length > 0 && (
                <div className="rounded-xl bg-accent/5 border border-accent/20 px-3 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-accent-light" />
                    <span className="text-xs text-muted">
                      {selectedServiceIds.length} serviço(s) &middot;{' '}
                      {totalDuration}min
                    </span>
                  </div>
                  <span className="text-sm font-bold text-accent-light">
                    {formatCurrency(totalPrice)}
                  </span>
                </div>
              )}

              {/* Professional */}
              <div>
                <p className="text-sm font-semibold text-foreground mb-2">
                  Profissional responsável
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {PROFISSIONAIS.map((prof) => {
                    const isSelected = selectedProfId === prof.id;
                    return (
                      <button
                        key={prof.id}
                        onClick={() => setSelectedProfId(prof.id)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border transition-all duration-200 ${
                          isSelected
                            ? 'bg-accent/10 border-accent/30'
                            : 'bg-card border-border hover:bg-card-hover'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full bg-gradient-to-br ${prof.cor} flex items-center justify-center shrink-0`}
                        >
                          <span className="text-[10px] font-bold text-white">
                            {prof.iniciais}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-foreground truncate">
                          {prof.nome.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ===== STEP 3: Date/Time ===== */}
          {step === 3 && (
            <div className="space-y-5 animate-fade-in-up">
              {/* Summary Strip */}
              <div className="rounded-xl bg-card border border-border px-3 py-2.5 space-y-1">
                <p className="text-xs text-muted">Resumo</p>
                <p className="text-sm font-semibold text-foreground">
                  {selectedClient?.nome}
                </p>
                <p className="text-xs text-muted">
                  {selectedServices.map((s) => s.nome).join(' + ')} &middot;{' '}
                  {totalDuration}min &middot;{' '}
                  <span className="text-accent-light font-bold">
                    {formatCurrency(totalPrice)}
                  </span>
                </p>
              </div>

              {/* Date Input */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-2">
                  <CalendarDays size={14} />
                  Data
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
                />
              </div>

              {/* Time Selection */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground mb-2">
                  <Clock size={14} />
                  Horário de início
                </label>
                <div className="grid grid-cols-4 gap-1.5 max-h-[180px] overflow-y-auto">
                  {AVAILABLE_HOURS.map((time) => {
                    const isSelected = selectedTime === time;
                    return (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`py-2 rounded-xl text-xs font-mono font-semibold border transition-all duration-200 ${
                          isSelected
                            ? 'bg-accent/15 border-accent/40 text-accent-light'
                            : 'bg-card border-border text-foreground hover:bg-card-hover'
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>

                {selectedTime && endTime && (
                  <p className="text-xs text-muted mt-2 text-center">
                    ⏱ Previsão de término:{' '}
                    <span className="font-bold text-foreground">{endTime}</span>
                  </p>
                )}
              </div>

              {/* WhatsApp Checkbox */}
              <button
                onClick={() => setSendWhatsApp(!sendWhatsApp)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl border transition-all duration-200 ${
                  sendWhatsApp
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-card border-border'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                    sendWhatsApp
                      ? 'bg-green-500 border-green-500'
                      : 'border-border'
                  }`}
                >
                  {sendWhatsApp && (
                    <Check size={12} className="text-white" />
                  )}
                </div>
                <MessageCircle
                  size={16}
                  className={sendWhatsApp ? 'text-green-400' : 'text-muted'}
                />
                <span
                  className={`text-sm font-medium ${
                    sendWhatsApp ? 'text-green-300' : 'text-muted'
                  }`}
                >
                  Enviar confirmação no WhatsApp
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 pb-5 pt-2 border-t border-border/50">
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 ? !canGoToStep2 : !canGoToStep3}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-accent to-indigo-500 text-white text-sm font-bold shadow-lg shadow-accent/20 hover:shadow-accent/40 transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Continuar
              <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-bold shadow-lg shadow-green-500/20 hover:shadow-green-500/40 transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check size={16} />
                  Confirmar Agendamento
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
