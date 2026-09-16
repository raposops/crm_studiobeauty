'use client';

import { useState, useMemo, useEffect } from 'react';
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
  Zap,
} from 'lucide-react';
import type { Cliente, Servico, Profissional, NovoAgendamentoForm } from '@/types';
import {
  HORARIOS,
  formatCurrency,
  addMinutesToTime,
} from '@/data/mock';
import { supabase } from '@/lib/supabase';
import { triggerWhatsAppNotification } from '@/lib/whatsapp';
import { useProfissionais } from '@/hooks/useProfissionais';
import { useServicos } from '@/hooks/useServicos';
import { useClientes } from '@/hooks/useClientes';
import { useAgenda } from '@/hooks/useAgenda';
import { useBloqueiosAgenda } from '@/hooks/useBloqueiosAgenda';
import { useAuth } from '@/contexts/AuthContext';
import { getTodayDateString } from '@/lib/dateUtils';

interface NewAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedDate?: string;
}

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map((n) => parseInt(n, 10) || 0);
  return h * 60 + m;
}

function uuidv4() {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
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
  const { salaoId, salao, hasModule } = useAuth();
  const temModuloEncaixe = hasModule('encaixe_agenda');
  const { profissionais } = useProfissionais(salaoId);
  const { servicos } = useServicos(salaoId);
  const { clientes } = useClientes(salaoId);

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
    preselectedDate || getTodayDateString()
  );
  const [selectedTime, setSelectedTime] = useState('');
  const [isEncaixe, setIsEncaixe] = useState(false);
  const [observacaoEncaixe, setObservacaoEncaixe] = useState('');
  const [sendWhatsApp, setSendWhatsApp] = useState(true);

  useEffect(() => {
    if (isOpen && preselectedDate) {
      setSelectedDate(preselectedDate);
    }
  }, [isOpen, preselectedDate]);

  // Fetch existing appointments and blocks for selected date and professional to check availability
  const { agendamentos: existingAgendamentos } = useAgenda(
    salaoId,
    selectedDate,
    selectedProfId || undefined
  );
  const { bloqueios } = useBloqueiosAgenda(
    salaoId,
    selectedDate,
    selectedProfId || undefined
  );

  const allClients = useMemo(() => {
    return clientes || [];
  }, [clientes]);

  // Computed values
  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return allClients;
    const query = clientSearch.toLowerCase();
    return allClients.filter(
      (c) =>
        c.nome.toLowerCase().includes(query) ||
        (c.whatsapp || (c as any).telefone_whatsapp || '').includes(query)
    );
  }, [clientSearch, allClients]);

  const selectedServices = useMemo(
    () => servicos.filter((s) => selectedServiceIds.includes(s.id)),
    [servicos, selectedServiceIds]
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

  // Compute blocked slots (folga/fechamento) and appointment conflicts separately
  const { blockedSlots, conflictingAppointmentsBySlot, occupiedSlots } = useMemo(() => {
    const blocked = new Set<string>();
    const conflicts = new Map<string, any[]>();
    const occupied = new Set<string>();
    const reqDuration = totalDuration > 0 ? totalDuration : 30;
    const activeAgendamentos = (existingAgendamentos || []).filter((ag) => ag.status !== 'cancelado');

    AVAILABLE_HOURS.forEach((slotTime) => {
      const slotStart = timeToMinutes(slotTime);
      const slotEnd = slotStart + reqDuration;

      // 1. Checa conflito com bloqueios de agenda da profissional (Folga / Salão fechado)
      const hasBlockConflict = (bloqueios || []).some((b) => {
        if (selectedProfId && b.profissional_id !== selectedProfId) return false;
        if (b.dia_inteiro || (!b.hora_inicio && !b.hora_fim)) return true;
        const bStart = timeToMinutes(b.hora_inicio!);
        const bEnd = timeToMinutes(b.hora_fim!);
        return slotStart < bEnd && slotEnd > bStart;
      });

      if (hasBlockConflict) {
        blocked.add(slotTime);
        occupied.add(slotTime);
        return;
      }

      // 2. Checa conflito com agendamentos existentes (outras clientes)
      const matchingAgs = activeAgendamentos.filter((ag) => {
        if (selectedProfId && ag.profissional?.id !== selectedProfId) return false;

        const agStart = timeToMinutes(ag.hora_inicio);
        const agDuration =
          ag.duracao_total ||
          (ag.servicos && ag.servicos.length > 0
            ? ag.servicos.reduce((acc: number, s: any) => acc + (s.duracao_minutos || 0), 0)
            : 30);
        const agEnd = ag.hora_fim ? timeToMinutes(ag.hora_fim) : agStart + agDuration;

        // Condição de sobreposição: slotStart < agEnd && slotEnd > agStart
        return slotStart < agEnd && slotEnd > agStart;
      });

      if (matchingAgs.length > 0) {
        conflicts.set(slotTime, matchingAgs);
        occupied.add(slotTime);
      }
    });

    return { blockedSlots: blocked, conflictingAppointmentsBySlot: conflicts, occupiedSlots: occupied };
  }, [existingAgendamentos, bloqueios, selectedProfId, totalDuration]);

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
    setSelectedDate(preselectedDate || getTodayDateString());
    setSelectedTime('');
    setIsEncaixe(false);
    setObservacaoEncaixe('');
    setSendWhatsApp(true);
    setIsSubmitting(false);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit() {
    if (!selectedClient || !canSubmit) return;

    if (blockedSlots.has(selectedTime)) {
      alert('Este horário está bloqueado na agenda da profissional (folga ou agenda fechada).');
      return;
    }

    const hasAppointmentConflict = conflictingAppointmentsBySlot.has(selectedTime);
    if (hasAppointmentConflict) {
      if (!temModuloEncaixe) {
        alert('Este horário já possui outro atendimento agendado e o módulo de Encaixe na Agenda não está ativo.');
        return;
      }
      if (!isEncaixe) {
        const confirmEncaixe = window.confirm(
          'Este horário já possui outro atendimento agendado. Deseja registrar este atendimento como um Encaixe Simultâneo?'
        );
        if (!confirmEncaixe) return;
        setIsEncaixe(true);
      }
    }

    setIsSubmitting(true);

    try {
      // 1. Ensure client exists in Supabase (and ensure valid UUID)
      let clienteId = selectedClient.id;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(clienteId);

      if (!isUuid) {
        const generatedUuid = uuidv4();
        const { data: newClient, error: clientErr } = await supabase
          .from('clientes')
          .insert({
            id: generatedUuid,
            salao_id: salaoId,
            nome: selectedClient.nome,
            telefone_whatsapp: selectedClient.whatsapp || '00000000000',
          })
          .select('id')
          .single();

        clienteId = (newClient && !clientErr) ? newClient.id : generatedUuid;
      }

      // 2. Insert into agendamentos (compatible with both schema variants)
      const isActuallyEncaixe = isEncaixe || conflictingAppointmentsBySlot.has(selectedTime);
      const obsFinal = isActuallyEncaixe
        ? `[ENCAIXE] ${observacaoEncaixe ? observacaoEncaixe.trim() : 'Atendimento de encaixe simultâneo'}`
        : observacaoEncaixe.trim() || null;

      const agendamentoPayload: any = {
        salao_id: salaoId,
        cliente_id: clienteId,
        profissional_id: selectedProfId,
        servico_id: selectedServiceIds[0], // Primary service (schema has single servico_id)
        data: selectedDate,
        hora_inicio: selectedTime,
        hora_fim: endTime,
        data_hora_inicio: `${selectedDate}T${selectedTime}:00`,
        data_hora_fim: `${selectedDate}T${endTime || selectedTime}:00`,
        status: 'agendado',
        valor_total: totalPrice,
        valor_servico: totalPrice,
        duracao_total: totalDuration,
        observacoes: obsFinal,
        is_encaixe: isActuallyEncaixe,
      };

      let { data: insertedData, error } = await supabase
        .from('agendamentos')
        .insert(agendamentoPayload)
        .select();

      if (error && error.message && error.message.includes('is_encaixe')) {
        const { is_encaixe: _, ...fallbackPayload } = agendamentoPayload;
        const retry = await supabase
          .from('agendamentos')
          .insert(fallbackPayload)
          .select();
        insertedData = retry.data;
        error = retry.error;
      }

      if (error) {
        console.error('Erro ao salvar agendamento:', error);
        alert(`Erro ao salvar no Supabase: ${error.message}`);
      } else {
        const agendamentoId = insertedData?.[0]?.id;

        // 3. Insert junction rows into agendamento_servicos
        if (agendamentoId && selectedServiceIds.length > 0) {
          const servicosRows = selectedServiceIds.map((sId) => ({
            agendamento_id: agendamentoId,
            servico_id: sId,
          }));
          await supabase.from('agendamento_servicos').insert(servicosRows);
        }

        // 4. Trigger WhatsApp notification
        if (sendWhatsApp && selectedClient) {
          const profObj = profissionais.find((p) => p.id === selectedProfId);
          const clientPhone = selectedClient.whatsapp || (selectedClient as any).telefone_whatsapp || '';

          await triggerWhatsAppNotification({
            agendamentoId: agendamentoId || '',
            clienteNome: selectedClient.nome,
            whatsapp: clientPhone,
            data: selectedDate,
            hora: selectedTime,
            servicos: selectedServices.map((s) => s.nome),
            profissionalNome: profObj?.nome || 'Profissional',
            salaoNome: salao?.nome || 'Studio Beauty',
            donoTelefone: salao?.telefone_whatsapp || '',
            status: 'agendado',
            tipoEvento: 'novo_agendamento',
          });
        }
        handleClose();
      }
    } catch (err: any) {
      console.error('Erro inesperado:', err);
      alert(`Erro ao salvar: ${err?.message || 'Verifique a conexão.'}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Group services by category
  const servicesByCategory = useMemo(() => {
    const map = new Map<string, Servico[]>();
    servicos.forEach((s) => {
      const list = map.get(s.categoria) || [];
      list.push(s);
      map.set(s.categoria, list);
    });
    return map;
  }, [servicos]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-modal border border-slate-300 shadow-2xl shadow-slate-950/25 ring-1 ring-black/5 rounded-t-3xl sm:rounded-3xl max-h-[90dvh] flex flex-col animate-fade-in-up">
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
                {profissionais.length === 0 ? (
                  <p className="text-xs text-muted">Nenhum profissional cadastrado. Vá em Ajustes &gt; Profissionais.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {profissionais.map((prof) => {
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
                          <div className="min-w-0 text-left">
                            <span className="text-xs font-semibold text-foreground truncate block">
                              {prof.nome.split(' ')[0]}
                            </span>
                            {prof.especialidade && (
                              <span className="text-[9px] text-muted truncate block">
                                {prof.especialidade}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
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

              {/* Encaixe Mode Toggle Banner */}
              {temModuloEncaixe && (
                <div
                  onClick={() => setIsEncaixe((prev) => !prev)}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isEncaixe
                      ? 'bg-amber-500/15 border-amber-500/40 shadow-xs'
                      : 'bg-card border-border hover:bg-card-hover'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isEncaixe
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-500/30'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}
                    >
                      <Zap size={16} className={isEncaixe ? 'fill-white' : ''} />
                    </div>
                    <div className="min-w-0 text-left">
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-foreground">
                          Permitir Encaixe / Atendimento Simultâneo
                        </p>
                        {isEncaixe && (
                          <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded-full bg-amber-500 text-white">
                            Ativo
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted truncate">
                        Atender cliente enquanto um produto químico ou máscara age
                      </p>
                    </div>
                  </div>
                  <div
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      isEncaixe ? 'bg-amber-500' : 'bg-muted/40'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                        isEncaixe ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </div>
              )}

              {/* Time Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <Clock size={14} />
                    Horário de início
                  </label>
                  {isEncaixe && temModuloEncaixe && (
                    <span className="text-[10px] font-bold text-amber-500 flex items-center gap-1">
                      <Zap size={10} /> Encaixes Liberados
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-1.5 max-h-[180px] overflow-y-auto">
                  {AVAILABLE_HOURS.map((time) => {
                    const isSelected = selectedTime === time;
                    const isBlocked = blockedSlots.has(time);
                    const conflicts = conflictingAppointmentsBySlot.get(time);
                    const hasApptConflict = Boolean(conflicts && conflicts.length > 0);

                    // Se for bloqueio real de folga/salão fechado, não permite
                    if (isBlocked) {
                      return (
                        <button
                          key={time}
                          type="button"
                          disabled={true}
                          className="py-2 rounded-xl text-xs font-mono font-semibold border bg-rose-500/10 border-rose-500/20 text-rose-700/60 line-through cursor-not-allowed opacity-50 relative"
                          title="Horário com bloqueio de agenda / folga da profissional"
                        >
                          {time}
                        </button>
                      );
                    }

                    // Se tiver conflito de agendamento (outra cliente no horário)
                    if (hasApptConflict) {
                      const clientName = conflicts?.[0]?.cliente?.nome || 'Cliente';

                      if (!temModuloEncaixe) {
                        return (
                          <button
                            key={time}
                            type="button"
                            disabled={true}
                            className="py-2 rounded-xl text-xs font-mono font-semibold border bg-rose-500/10 border-rose-500/20 text-rose-700/60 line-through cursor-not-allowed opacity-50 relative"
                            title={`Horário já ocupado por ${clientName}`}
                          >
                            {time}
                          </button>
                        );
                      }

                      const isEncaixeSelected = isSelected;

                      return (
                        <button
                          key={time}
                          type="button"
                          onClick={() => {
                            setSelectedTime(time);
                            setIsEncaixe(true);
                          }}
                          className={`py-1.5 px-1 rounded-xl text-xs font-mono font-semibold border transition-all duration-200 relative flex flex-col items-center justify-center gap-0.5 cursor-pointer ${
                            isEncaixeSelected
                              ? 'bg-amber-500 text-white border-amber-500 ring-2 ring-amber-500/30 shadow-md shadow-amber-500/20'
                              : isEncaixe
                              ? 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/25'
                              : 'bg-rose-500/10 border-rose-500/20 text-rose-600/80 hover:bg-amber-500/15 hover:border-amber-500/30 hover:text-amber-500'
                          }`}
                          title={`Horário ocupado por ${clientName}. Clique para agendar encaixe.`}
                        >
                          <span>{time}</span>
                          <span
                            className={`text-[8px] font-sans font-bold flex items-center gap-0.5 ${
                              isEncaixeSelected ? 'text-white' : 'text-amber-500'
                            }`}
                          >
                            <Zap size={8} />
                            Encaixe
                          </span>
                        </button>
                      );
                    }

                    // Horário livre normal
                    return (
                      <button
                        key={time}
                        type="button"
                        onClick={() => setSelectedTime(time)}
                        className={`py-2 rounded-xl text-xs font-mono font-semibold border transition-all duration-200 relative cursor-pointer ${
                          isSelected
                            ? 'bg-accent/15 border-accent/40 text-accent-light ring-2 ring-accent/30 font-bold'
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

              {/* Contextual Encaixe Alert Banner */}
              {selectedTime && conflictingAppointmentsBySlot.has(selectedTime) && (
                <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-amber-500/15 border border-amber-500/30 text-xs space-y-1.5 animate-fade-in">
                  <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
                    <Zap size={14} className="text-amber-500 fill-amber-500 shrink-0" />
                    <span>Atendimento em Encaixe Simultâneo</span>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">
                    A profissional já possui atendimento com{' '}
                    <strong>
                      {conflictingAppointmentsBySlot.get(selectedTime)?.[0]?.cliente?.nome || 'outra cliente'}
                    </strong>{' '}
                    ({conflictingAppointmentsBySlot.get(selectedTime)?.[0]?.hora_inicio} às{' '}
                    {conflictingAppointmentsBySlot.get(selectedTime)?.[0]?.hora_fim}).
                    Este agendamento será registrado como <strong>Encaixe</strong> na grade.
                  </p>
                </div>
              )}

              {/* Optional Encaixe Note */}
              <div>
                <label className="text-xs font-semibold text-muted block mb-1">
                  Observações do agendamento (opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Cliente aguardando química agir / corte rápido"
                  value={observacaoEncaixe}
                  onChange={(e) => setObservacaoEncaixe(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs text-foreground focus:outline-none focus:border-accent/50 transition-all placeholder:text-muted/60"
                />
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
