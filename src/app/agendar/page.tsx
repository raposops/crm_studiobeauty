'use client';

import { useState, useMemo } from 'react';
import {
  Sparkles,
  CalendarDays,
  Clock,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  User,
  Phone,
  Check,
  Scissors,
  MapPin,
  Clock3,
  CalendarCheck2,
} from 'lucide-react';
import { useServicos } from '@/hooks/useServicos';
import { useProfissionais } from '@/hooks/useProfissionais';
import { useAgenda } from '@/hooks/useAgenda';
import { supabase } from '@/lib/supabase';
import { triggerWhatsAppNotification } from '@/lib/whatsapp';
import { formatCurrency, addMinutesToTime } from '@/data/mock';

const AVAILABLE_HOURS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
  '20:00',
];

function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map((n) => parseInt(n, 10) || 0);
  return h * 60 + m;
}

function uuidv4() {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function formatPhoneInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function AgendarPublicPage() {
  const salaoId = '00000000-0000-0000-0000-000000000000';
  const { servicos, isLoading: loadingServicos } = useServicos(salaoId);
  const { profissionais, isLoading: loadingProfs } = useProfissionais(salaoId);

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedProfId, setSelectedProfId] = useState<string>(''); // empty = qualquer profissional
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [selectedTime, setSelectedTime] = useState<string>('');

  const [clientNome, setClientNome] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Agenda query to get existing appointments for conflict detection
  const { agendamentos: existingAgendamentos } = useAgenda(
    salaoId,
    selectedDate,
    selectedProfId || undefined
  );

  // Selected Services objects
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

  // Compute occupied slots for selected date & professional
  const occupiedSlots = useMemo(() => {
    if (!existingAgendamentos || existingAgendamentos.length === 0)
      return new Set<string>();

    const reqDuration = totalDuration > 0 ? totalDuration : 30;
    const activeAgendamentos = existingAgendamentos.filter(
      (ag) => ag.status !== 'cancelado'
    );
    const occupied = new Set<string>();

    AVAILABLE_HOURS.forEach((slotTime) => {
      const slotStart = timeToMinutes(slotTime);
      const slotEnd = slotStart + reqDuration;

      const hasConflict = activeAgendamentos.some((ag) => {
        if (selectedProfId && ag.profissional?.id !== selectedProfId)
          return false;

        const agStart = timeToMinutes(ag.hora_inicio);
        const agEnd = ag.hora_fim
          ? timeToMinutes(ag.hora_fim)
          : agStart + (ag.duracao_total || 30);

        return slotStart < agEnd && slotEnd > agStart;
      });

      if (hasConflict) {
        occupied.add(slotTime);
      }
    });

    return occupied;
  }, [existingAgendamentos, selectedProfId, totalDuration]);

  function toggleService(id: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  }

  async function handleSubmit() {
    if (!clientNome.trim() || !clientPhone.trim() || !selectedTime) return;

    if (occupiedSlots.has(selectedTime)) {
      alert(
        'Este horário acabou de ficar indisponível. Por favor, escolha outro horário.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const cleanPhoneDigits = clientPhone.replace(/\D/g, '');
      const formattedPhone =
        cleanPhoneDigits.length === 10 || cleanPhoneDigits.length === 11
          ? `55${cleanPhoneDigits}`
          : cleanPhoneDigits;

      // 1. Check if client exists or create new client in database
      let clienteId = '';
      const { data: existingClients } = await supabase
        .from('clientes')
        .select('id, telefone_whatsapp')
        .eq('salao_id', salaoId);

      const foundClient = (existingClients || []).find((c) => {
        const p = (c.telefone_whatsapp || '').replace(/\D/g, '');
        return p.slice(-8) === cleanPhoneDigits.slice(-8);
      });

      if (foundClient) {
        clienteId = foundClient.id;
      } else {
        const newClientId = uuidv4();
        const { data: createdClient, error: clientErr } = await supabase
          .from('clientes')
          .insert({
            id: newClientId,
            salao_id: salaoId,
            nome: clientNome.trim(),
            telefone_whatsapp: formattedPhone,
          })
          .select()
          .single();

        if (clientErr) {
          console.warn('Erro ao criar cliente público, usando ID fallback:', clientErr.message);
          clienteId = newClientId;
        } else {
          clienteId = createdClient.id;
        }
      }

      // 2. Determine Professional ID
      let finalProfId = selectedProfId;
      if (!finalProfId && profissionais.length > 0) {
        finalProfId = profissionais[0].id;
      }

      const agendamentoId = uuidv4();
      const firstServiceId = selectedServiceIds[0] || null;

      const agendamentoPayload = {
        id: agendamentoId,
        salao_id: salaoId,
        cliente_id: clienteId,
        profissional_id: finalProfId,
        servico_id: firstServiceId,
        data: selectedDate,
        hora_inicio: selectedTime,
        hora_fim: endTime || selectedTime,
        duracao_total: totalDuration,
        valor_total: totalPrice,
        status: 'agendado',
        observacoes: observacoes.trim() || 'Agendamento feito via Link Público Online',
      };

      const { error: agErr } = await supabase
        .from('agendamentos')
        .insert(agendamentoPayload);

      if (agErr) {
        console.error('Erro ao salvar agendamento público:', agErr);
        alert(`Erro ao realizar agendamento: ${agErr.message}`);
        setIsSubmitting(false);
        return;
      }

      // 3. Insert service junction rows
      if (selectedServiceIds.length > 0) {
        const junctionRows = selectedServiceIds.map((sId) => ({
          agendamento_id: agendamentoId,
          servico_id: sId,
        }));
        await supabase.from('agendamento_servicos').insert(junctionRows);
      }

      // 4. Trigger WhatsApp Notification to Client
      const profObj = profissionais.find((p) => p.id === finalProfId);
      await triggerWhatsAppNotification({
        agendamentoId,
        clienteNome: clientNome.trim(),
        whatsapp: formattedPhone,
        data: selectedDate,
        hora: selectedTime,
        servicos: selectedServices.map((s) => s.nome),
        profissionalNome: profObj?.nome || 'Profissional',
        status: 'agendado',
        tipoEvento: 'novo_agendamento',
      });

      setStep(5); // Go to success screen
    } catch (err: any) {
      console.error('Erro ao processar agendamento público:', err);
      alert(`Ocorreu um erro: ${err?.message || 'Tente novamente.'}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Group services by category
  const categories = useMemo(() => {
    const map = new Map<string, typeof servicos>();
    servicos.forEach((s) => {
      const cat = s.categoria || 'Serviços';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(s);
    });
    return Array.from(map.entries());
  }, [servicos]);

  const selectedProfObj = useMemo(
    () => profissionais.find((p) => p.id === selectedProfId),
    [profissionais, selectedProfId]
  );

  return (
    <div className="space-y-4">
      {/* Header Brand Banner */}
      <div className="rounded-3xl bg-card border border-border/80 p-5 shadow-xl shadow-accent/5 space-y-3 text-center relative overflow-hidden">
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-accent/10 rounded-full blur-2xl pointer-events-none" />
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-accent to-pink-500 mx-auto flex items-center justify-center shadow-lg shadow-accent/30 text-white font-bold text-2xl">
          SB
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-foreground tracking-tight">
            Studio Beauty
          </h1>
          <p className="text-xs text-muted mt-0.5 flex items-center justify-center gap-1">
            <MapPin size={12} className="text-accent" />
            Agendamento Online de Horários
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      {step < 5 && (
        <div className="flex items-center justify-between px-2">
          {[1, 2, 3, 4].map((s) => {
            const isActive = step === s;
            const isCompleted = step > s;
            return (
              <div key={s} className="flex items-center gap-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                    isCompleted
                      ? 'bg-accent text-white shadow-sm shadow-accent/40'
                      : isActive
                      ? 'bg-accent/20 border-2 border-accent text-accent-light'
                      : 'bg-card border border-border text-muted'
                  }`}
                >
                  {isCompleted ? <Check size={14} /> : s}
                </div>
                {s < 4 && (
                  <div
                    className={`w-8 sm:w-12 h-0.5 rounded-full transition-all duration-300 ${
                      step > s ? 'bg-accent' : 'bg-border'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ===== STEP 1: Escolha dos Serviços ===== */}
      {step === 1 && (
        <div className="rounded-3xl bg-card border border-border p-5 space-y-4 shadow-lg animate-fade-in-up">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-base font-bold text-foreground">
                1. Selecione os Serviços
              </h2>
              <p className="text-xs text-muted">
                Você pode escolher mais de um serviço
              </p>
            </div>
            <Scissors size={20} className="text-accent" />
          </div>

          {loadingServicos ? (
            <div className="py-8 text-center text-sm text-muted animate-pulse">
              Carregando serviços disponíveis...
            </div>
          ) : (
            <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
              {categories.map(([categoria, items]) => (
                <div key={categoria} className="space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted bg-card-hover px-2 py-0.5 rounded-md inline-block">
                    {categoria}
                  </span>
                  <div className="space-y-2">
                    {items.map((service) => {
                      const isSelected = selectedServiceIds.includes(service.id);
                      return (
                        <button
                          key={service.id}
                          onClick={() => toggleService(service.id)}
                          className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-accent/10 border-accent/40 shadow-sm'
                              : 'bg-card border-border hover:bg-card-hover'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${
                                isSelected
                                  ? 'bg-accent border-accent text-white'
                                  : 'border-border'
                              }`}
                            >
                              {isSelected && <Check size={12} />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground truncate">
                                {service.nome}
                              </p>
                              <p className="text-xs text-muted flex items-center gap-1 mt-0.5">
                                <Clock3 size={11} />
                                {service.duracao_minutos} minutos
                              </p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-accent-light shrink-0">
                            {formatCurrency(service.preco)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2 border-t border-border flex items-center justify-between">
            <div>
              {selectedServiceIds.length > 0 && (
                <p className="text-xs text-muted">
                  Total: <strong className="text-foreground">{formatCurrency(totalPrice)}</strong> ({totalDuration}min)
                </p>
              )}
            </div>
            <button
              disabled={selectedServiceIds.length === 0}
              onClick={() => setStep(2)}
              className="px-5 py-3 rounded-2xl bg-accent text-white font-bold text-sm shadow-lg shadow-accent/25 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              Avançar <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ===== STEP 2: Seleção do Profissional ===== */}
      {step === 2 && (
        <div className="rounded-3xl bg-card border border-border p-5 space-y-4 shadow-lg animate-fade-in-up">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-base font-bold text-foreground">
                2. Escolha o Profissional
              </h2>
              <p className="text-xs text-muted">
                Selecione de quem você quer receber o atendimento
              </p>
            </div>
            <User size={20} className="text-accent" />
          </div>

          <div className="space-y-2 max-h-[350px] overflow-y-auto">
            {/* Option: Qualquer Profissional */}
            <button
              onClick={() => setSelectedProfId('')}
              className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 flex items-center gap-3.5 ${
                selectedProfId === ''
                  ? 'bg-accent/10 border-accent/40 shadow-sm'
                  : 'bg-card border-border hover:bg-card-hover'
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-accent/30 to-purple-500/30 flex items-center justify-center text-accent shrink-0">
                <Sparkles size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground">
                  Sem preferência / Primeiro disponível
                </p>
                <p className="text-xs text-muted">
                  Buscamos o melhor horário para você
                </p>
              </div>
              {selectedProfId === '' && (
                <div className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center">
                  <Check size={12} />
                </div>
              )}
            </button>

            {/* List Specific Professionals */}
            {loadingProfs ? (
              <p className="text-xs text-muted py-4 text-center">Carregando profissionais...</p>
            ) : (
              profissionais.map((prof) => {
                const isSelected = selectedProfId === prof.id;
                return (
                  <button
                    key={prof.id}
                    onClick={() => setSelectedProfId(prof.id)}
                    className={`w-full text-left p-3.5 rounded-2xl border transition-all duration-200 flex items-center gap-3.5 ${
                      isSelected
                        ? 'bg-accent/10 border-accent/40 shadow-sm'
                        : 'bg-card border-border hover:bg-card-hover'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${prof.cor} flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm`}
                    >
                      {prof.iniciais}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">
                        {prof.nome}
                      </p>
                      <p className="text-xs text-muted truncate">
                        {prof.especialidade || 'Especialista em beleza'}
                      </p>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center">
                        <Check size={12} />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-card-hover transition-all flex items-center gap-1"
            >
              <ChevronLeft size={14} /> Voltar
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-5 py-3 rounded-2xl bg-accent text-white font-bold text-sm shadow-lg shadow-accent/25 hover:opacity-90 transition-all flex items-center gap-2"
            >
              Avançar <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ===== STEP 3: Data e Horário ===== */}
      {step === 3 && (
        <div className="rounded-3xl bg-card border border-border p-5 space-y-4 shadow-lg animate-fade-in-up">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-base font-bold text-foreground">
                3. Data e Horário
              </h2>
              <p className="text-xs text-muted">
                {selectedProfObj
                  ? `Atendimento com ${selectedProfObj.nome}`
                  : 'Atendimento com primeiro profissional livre'}
              </p>
            </div>
            <CalendarDays size={20} className="text-accent" />
          </div>

          {/* Select Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-foreground flex items-center gap-1">
              <CalendarCheck2 size={13} className="text-accent" />
              Selecione o Dia
            </label>
            <input
              type="date"
              min={new Date().toISOString().split('T')[0]}
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setSelectedTime('');
              }}
              className="w-full px-3.5 py-3 rounded-2xl bg-card border border-border text-sm text-foreground focus:outline-none focus:border-accent font-medium shadow-sm transition-all"
            />
          </div>

          {/* Select Time Grid */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-foreground flex items-center gap-1">
              <Clock size={13} className="text-accent" />
              Horários Disponíveis
            </label>

            <div className="grid grid-cols-4 gap-2 max-h-[200px] overflow-y-auto pr-1">
              {AVAILABLE_HOURS.map((time) => {
                const isSelected = selectedTime === time;
                const isOccupied = occupiedSlots.has(time);

                return (
                  <button
                    key={time}
                    disabled={isOccupied}
                    onClick={() => setSelectedTime(time)}
                    className={`py-2.5 rounded-xl text-xs font-mono font-bold border transition-all duration-200 relative ${
                      isOccupied
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-700/60 line-through cursor-not-allowed opacity-50'
                        : isSelected
                        ? 'bg-accent border-accent text-white shadow-md shadow-accent/30'
                        : 'bg-card border-border text-foreground hover:bg-card-hover'
                    }`}
                  >
                    {time}
                  </button>
                );
              })}
            </div>

            {selectedTime && endTime && (
              <p className="text-xs text-muted text-center pt-1">
                ⏱ Término estimado: <strong className="text-foreground">{endTime}</strong>
              </p>
            )}
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between">
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-card-hover transition-all flex items-center gap-1"
            >
              <ChevronLeft size={14} /> Voltar
            </button>
            <button
              disabled={!selectedTime}
              onClick={() => setStep(4)}
              className="px-5 py-3 rounded-2xl bg-accent text-white font-bold text-sm shadow-lg shadow-accent/25 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              Avançar <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ===== STEP 4: Dados do Cliente ===== */}
      {step === 4 && (
        <div className="rounded-3xl bg-card border border-border p-5 space-y-4 shadow-lg animate-fade-in-up">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-base font-bold text-foreground">
                4. Seus Dados
              </h2>
              <p className="text-xs text-muted">
                Informe seu nome e WhatsApp para confirmar
              </p>
            </div>
            <User size={20} className="text-accent" />
          </div>

          {/* Order Summary Strip */}
          <div className="rounded-2xl bg-accent/5 border border-accent/20 p-3 space-y-1 text-xs">
            <p className="text-accent-light font-bold">Resumo do Agendamento:</p>
            <p className="text-foreground font-semibold">
              {selectedServices.map((s) => s.nome).join(' + ')}
            </p>
            <p className="text-muted">
              📅 {selectedDate.split('-').reverse().join('/')} às {selectedTime} &middot;{' '}
              <strong className="text-foreground">{formatCurrency(totalPrice)}</strong>
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-bold text-foreground mb-1 block">
                Seu Nome Completo *
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-3.5 text-muted" />
                <input
                  type="text"
                  placeholder="Ex: Maria Luiza Silva"
                  value={clientNome}
                  onChange={(e) => setClientNome(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-card border border-border text-sm text-foreground focus:outline-none focus:border-accent font-medium shadow-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground mb-1 block">
                Seu WhatsApp (com DDD) *
              </label>
              <div className="relative">
                <Phone size={15} className="absolute left-3.5 top-3.5 text-muted" />
                <input
                  type="tel"
                  placeholder="(51) 99999-9999"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(formatPhoneInput(e.target.value))}
                  className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-card border border-border text-sm text-foreground focus:outline-none focus:border-accent font-medium shadow-sm transition-all"
                />
              </div>
              <p className="text-[11px] text-muted mt-1">
                Enviaremos a confirmação direta no seu WhatsApp
              </p>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground mb-1 block">
                Observações (Opcional)
              </label>
              <textarea
                rows={2}
                placeholder="Ex: Prefiro tom de tinta mais claro, etc."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full p-3.5 rounded-2xl bg-card border border-border text-sm text-foreground focus:outline-none focus:border-accent font-medium shadow-sm transition-all"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between">
            <button
              onClick={() => setStep(3)}
              className="px-4 py-2.5 rounded-xl border border-border text-xs font-semibold text-foreground hover:bg-card-hover transition-all flex items-center gap-1"
            >
              <ChevronLeft size={14} /> Voltar
            </button>
            <button
              disabled={isSubmitting || !clientNome.trim() || clientPhone.length < 14}
              onClick={handleSubmit}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-accent to-pink-500 text-white font-bold text-sm shadow-xl shadow-accent/30 hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isSubmitting ? (
                'Confirmando...'
              ) : (
                <>
                  Confirmar Agendamento <CheckCircle2 size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ===== STEP 5: Sucesso / Confirmação ===== */}
      {step === 5 && (
        <div className="rounded-3xl bg-card border border-border p-6 text-center space-y-4 shadow-xl animate-fade-in-up">
          <div className="w-16 h-16 bg-success/15 border-2 border-success text-success rounded-full flex items-center justify-center mx-auto shadow-lg shadow-success/20">
            <CheckCircle2 size={36} />
          </div>

          <div>
            <h2 className="text-xl font-extrabold text-foreground">
              Agendamento Realizado!
            </h2>
            <p className="text-xs text-muted mt-1">
              Olá <strong className="text-foreground">{clientNome}</strong>, seu horário já está reservado com sucesso no Studio Beauty!
            </p>
          </div>

          <div className="rounded-2xl bg-accent/5 border border-accent/20 p-4 text-left space-y-2 text-xs">
            <div className="flex justify-between text-muted">
              <span>Data:</span>
              <strong className="text-foreground">
                {selectedDate.split('-').reverse().join('/')}
              </strong>
            </div>
            <div className="flex justify-between text-muted">
              <span>Horário de Início:</span>
              <strong className="text-foreground">{selectedTime}</strong>
            </div>
            <div className="flex justify-between text-muted">
              <span>Serviço(s):</span>
              <strong className="text-foreground">
                {selectedServices.map((s) => s.nome).join(', ')}
              </strong>
            </div>
            <div className="flex justify-between text-muted">
              <span>Profissional:</span>
              <strong className="text-foreground">
                {selectedProfObj?.nome || 'Profissional do Salão'}
              </strong>
            </div>
            <div className="border-t border-accent/15 pt-2 flex justify-between font-bold text-sm text-accent-light">
              <span>Valor Total:</span>
              <span>{formatCurrency(totalPrice)}</span>
            </div>
          </div>

          <div className="bg-card-hover p-3 rounded-2xl border border-border text-xs text-muted flex items-center gap-2.5">
            <Phone size={18} className="text-success shrink-0" />
            <p className="text-left leading-relaxed">
              Enviamos uma mensagem de confirmação para o seu **WhatsApp**. Por favor, responda com **1** para confirmar presença!
            </p>
          </div>

          <button
            onClick={() => {
              setStep(1);
              setSelectedServiceIds([]);
              setSelectedProfId('');
              setSelectedTime('');
              setClientNome('');
              setClientPhone('');
              setObservacoes('');
            }}
            className="w-full py-3 rounded-2xl bg-card border border-border text-sm font-bold text-foreground hover:bg-card-hover transition-all"
          >
            Fazer Novo Agendamento
          </button>
        </div>
      )}
    </div>
  );
}
