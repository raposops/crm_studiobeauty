'use client';

import React, { useState, useEffect, useMemo, use } from 'react';
import {
  Scissors,
  Clock,
  User,
  Calendar as CalendarIcon,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Phone,
  Check,
  Building2,
  CalendarX,
  AlertCircle,
  Lock,
} from 'lucide-react';
import { useServicos } from '@/hooks/useServicos';
import { useProfissionais } from '@/hooks/useProfissionais';
import { useAgenda } from '@/hooks/useAgenda';
import { useBloqueiosAgenda } from '@/hooks/useBloqueiosAgenda';
import { supabase } from '@/lib/supabase';
import { generateUUID as uuidv4 } from '@/lib/uuid';
import { triggerWhatsAppNotification } from '@/lib/whatsapp';

const NOMES_DIAS_SEMANA = [
  'Domingos',
  'Segundas-feiras',
  'Terças-feiras',
  'Quartas-feiras',
  'Quintas-feiras',
  'Sextas-feiras',
  'Sábados',
];

const DIAS_SEMANA_MAP = [
  { dia: 1, label: 'Seg' },
  { dia: 2, label: 'Ter' },
  { dia: 3, label: 'Qua' },
  { dia: 4, label: 'Qui' },
  { dia: 5, label: 'Sex' },
  { dia: 6, label: 'Sáb' },
  { dia: 0, label: 'Dom' },
];

function formatDiasProfissional(dias?: number[]): string {
  if (!dias || dias.length === 0) return 'Atendimento regular';
  if (dias.length === 7) return 'Atende todos os dias';
  if (dias.length === 6 && !dias.includes(0)) return 'Atende de Seg a Sáb';
  if (dias.length === 5 && !dias.includes(0) && !dias.includes(6)) return 'Atende de Seg a Sex';

  const ordem = [1, 2, 3, 4, 5, 6, 0];
  const ordenados = ordem.filter((d) => dias.includes(d));
  return `Atende ${ordenados.map((d) => DIAS_SEMANA_MAP.find((item) => item.dia === d)?.label).join(', ')}`;
}

const TIME_SLOTS = [
  '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30',
];

function calculateEndTime(startTime: string, durationMinutes: number): string {
  if (!startTime) return '';
  const [h, m] = startTime.split(':').map(Number);
  const total = h * 60 + m + durationMinutes;
  const endH = Math.floor(total / 60) % 24;
  const endM = total % 60;
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
}

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function getLocalDateStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatPhoneInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function AgendarPublicSlugPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const targetSlug = resolvedParams.slug;

  const [salao, setSalao] = useState<{ id: string; nome: string; slug: string; telefone_whatsapp?: string } | null>(null);
  const [loadingSalao, setLoadingSalao] = useState(true);

  useEffect(() => {
    async function loadSalao() {
      setLoadingSalao(true);
      const { data } = await supabase
        .from('saloes')
        .select('*')
        .eq('slug', targetSlug)
        .maybeSingle();

      if (data) {
        setSalao(data);
      } else {
        // Fallback default
        setSalao({
          id: '00000000-0000-0000-0000-000000000000',
          nome: 'Studio Beauty',
          slug: 'studio-beauty',
        });
      }
      setLoadingSalao(false);
    }
    loadSalao();
  }, [targetSlug]);

  const salaoId = salao?.id || '00000000-0000-0000-0000-000000000000';
  const salaoNome = salao?.nome || 'Studio Beauty';

  useEffect(() => {
    if (salaoNome && typeof document !== 'undefined') {
      document.title = `${salaoNome} | Agendamento Online`;
    }
  }, [salaoNome]);

  const { servicos, isLoading: loadingServicos } = useServicos(salaoId);
  const { profissionais, isLoading: loadingProfs } = useProfissionais(salaoId);

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedProfId, setSelectedProfId] = useState<string>(''); // empty = qualquer profissional
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateStr());
  const [selectedTime, setSelectedTime] = useState<string>('');

  const [clientNome, setClientNome] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [observacoes, setObservacoes] = useState('');

  const { agendamentos } = useAgenda(salaoId, selectedDate, selectedProfId || undefined);
  const { bloqueios } = useBloqueiosAgenda(salaoId, selectedDate, selectedProfId || undefined);

  // Calculate totals
  const selectedServices = useMemo(() => {
    return servicos.filter((s) => selectedServiceIds.includes(s.id));
  }, [servicos, selectedServiceIds]);

  const totalPrice = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.preco, 0);
  }, [selectedServices]);

  const totalDuration = useMemo(() => {
    return selectedServices.reduce((sum, s) => sum + s.duracao_minutos, 0);
  }, [selectedServices]);

  const endTime = useMemo(() => {
    return calculateEndTime(selectedTime, totalDuration);
  }, [selectedTime, totalDuration]);

  // Check availability based on weekly working days (dias_trabalho) and closed agenda (bloqueios_agenda)
  const availabilityStatus = useMemo(() => {
    if (!selectedDate) {
      return { isAvailable: true, reason: '', suggestion: '', availableProfs: profissionais };
    }

    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeek = dateObj.getDay(); // 0 = Domingo, 1 = Segunda, etc.

    if (selectedProfId) {
      const prof = profissionais.find((p) => p.id === selectedProfId);
      const profNome = prof?.nome || 'A profissional';

      // 1. Checa se atende no dia da semana fixo
      const diasTrabalho = Array.isArray(prof?.dias_trabalho) ? prof.dias_trabalho : [1, 2, 3, 4, 5, 6];
      if (!diasTrabalho.includes(dayOfWeek)) {
        return {
          isAvailable: false,
          reason: `${profNome} não realiza atendimentos às ${NOMES_DIAS_SEMANA[dayOfWeek]}.`,
          suggestion: 'Por favor, escolha outro dia da semana ou selecione outra profissional da equipe.',
          availableProfs: [],
        };
      }

      // 2. Checa se a profissional fechou a agenda / folga nesta data específica
      const bloqueio = (bloqueios || []).find(
        (b) => b.profissional_id === selectedProfId && (b.dia_inteiro || (!b.hora_inicio && !b.hora_fim))
      );
      if (bloqueio) {
        return {
          isAvailable: false,
          reason: `A agenda de ${profNome} está fechada nesta data (${bloqueio.motivo || 'Folga'}).`,
          suggestion: 'Por favor, escolha outra data ou selecione outra profissional da equipe.',
          availableProfs: [],
        };
      }

      return { isAvailable: true, reason: '', suggestion: '', availableProfs: prof ? [prof] : [] };
    } else {
      // Opção "Qualquer Profissional"
      const availableProfs = (profissionais || []).filter((prof) => {
        const diasTrabalho = Array.isArray(prof.dias_trabalho) ? prof.dias_trabalho : [1, 2, 3, 4, 5, 6];
        if (!diasTrabalho.includes(dayOfWeek)) return false;
        const temBloqueio = (bloqueios || []).some(
          (b) => b.profissional_id === prof.id && (b.dia_inteiro || (!b.hora_inicio && !b.hora_fim))
        );
        return !temBloqueio;
      });

      if (availableProfs.length === 0) {
        return {
          isAvailable: false,
          reason: `Nenhum membro da equipe está disponível para atendimento no dia ${selectedDate.split('-').reverse().join('/')}.`,
          suggestion: 'Por favor, selecione outra data para realizar seu agendamento.',
          availableProfs: [],
        };
      }

      return { isAvailable: true, reason: '', suggestion: '', availableProfs };
    }
  }, [selectedDate, selectedProfId, profissionais, bloqueios]);

  // Occupied time slots for selected professional and date
  const occupiedSlots = useMemo(() => {
    const occupied = new Set<string>();

    // 1. Bloqueios com horários específicos (parciais)
    (bloqueios || []).forEach((b) => {
      if (!b.dia_inteiro && b.hora_inicio && b.hora_fim) {
        if (!selectedProfId || b.profissional_id === selectedProfId) {
          const bStart = timeToMinutes(b.hora_inicio);
          const bEnd = timeToMinutes(b.hora_fim);
          TIME_SLOTS.forEach((slot) => {
            const slotStart = timeToMinutes(slot);
            const slotEnd = slotStart + (totalDuration || 30);
            if (slotStart < bEnd && slotEnd > bStart) {
              occupied.add(slot);
            }
          });
        }
      }
    });

    // 2. Agendamentos existentes
    (agendamentos || []).forEach((ag) => {
      if (ag.status === 'cancelado') return;
      const agStart = timeToMinutes(ag.hora_inicio);
      const agEnd = timeToMinutes(ag.hora_fim);

      TIME_SLOTS.forEach((slot) => {
        const slotStart = timeToMinutes(slot);
        const slotEnd = slotStart + (totalDuration || 30);
        if (slotStart < agEnd && slotEnd > agStart) {
          occupied.add(slot);
        }
      });
    });
    return occupied;
  }, [agendamentos, bloqueios, selectedProfId, totalDuration]);

  function toggleService(id: string) {
    setSelectedServiceIds((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  }

  async function handleSubmit() {
    if (!clientNome.trim() || !clientPhone.trim() || !selectedTime) return;

    if (!availabilityStatus.isAvailable) {
      alert(availabilityStatus.reason);
      return;
    }

    if (occupiedSlots.has(selectedTime)) {
      alert('Este horário acabou de ficar indisponível. Por favor, escolha outro horário.');
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
        .select('id, nome, telefone_whatsapp')
        .eq('salao_id', salaoId);

      const foundClient = (existingClients || []).find((c) => {
        const p = (c.telefone_whatsapp || '').replace(/\D/g, '');
        return p.slice(-8) === cleanPhoneDigits.slice(-8);
      });

      if (foundClient) {
        clienteId = foundClient.id;
        if (clientNome.trim() && foundClient.nome !== clientNome.trim()) {
          await supabase
            .from('clientes')
            .update({ nome: clientNome.trim() })
            .eq('id', clienteId);
        }
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
          clienteId = newClientId;
        } else {
          clienteId = createdClient.id;
        }
      }

      // 2. Determine Professional ID among available ones
      let finalProfId = selectedProfId;
      if (!finalProfId) {
        const candidatas = availabilityStatus.availableProfs;
        if (candidatas.length > 0) {
          finalProfId = candidatas[0].id;
        } else if (profissionais.length > 0) {
          finalProfId = profissionais[0].id;
        }
      }

      const agendamentoId = uuidv4();
      const firstServiceId = selectedServiceIds[0] || null;
      const calculatedEndTime = endTime || selectedTime;
      const dataHoraInicio = `${selectedDate}T${selectedTime}:00`;
      const dataHoraFim = `${selectedDate}T${calculatedEndTime}:00`;

      const agendamentoPayload = {
        id: agendamentoId,
        salao_id: salaoId,
        cliente_id: clienteId,
        profissional_id: finalProfId,
        servico_id: firstServiceId,
        data: selectedDate,
        hora_inicio: selectedTime,
        hora_fim: calculatedEndTime,
        data_hora_inicio: dataHoraInicio,
        data_hora_fim: dataHoraFim,
        duracao_total: totalDuration,
        valor_total: totalPrice,
        valor_servico: totalPrice,
        status: 'agendado',
        origem: 'online',
        observacoes: observacoes.trim() || 'Agendamento feito via Link Público Online',
      };

      let { error: agErr } = await supabase
        .from('agendamentos')
        .insert(agendamentoPayload);

      // Fallback: se a coluna 'origem' ainda não existir no banco, tenta inserir sem ela
      if (agErr && agErr.message && agErr.message.includes('origem')) {
        const { origem, ...payloadSemOrigem } = agendamentoPayload;
        const retry = await supabase
          .from('agendamentos')
          .insert(payloadSemOrigem);
        agErr = retry.error;
      }

      if (agErr) {
        alert(`Erro ao realizar agendamento: ${agErr.message}`);
        setIsSubmitting(false);
        return;
      }

      // Save secondary services in junction table if multiple
      if (selectedServiceIds.length > 1) {
        const agServicosPayload = selectedServiceIds.map((sid) => ({
          agendamento_id: agendamentoId,
          servico_id: sid,
        }));
        await supabase.from('agendamento_servicos').insert(agServicosPayload);
      }

      // Trigger automatic WhatsApp notification
      try {
        const profObj = profissionais.find((p) => p.id === finalProfId);
        await triggerWhatsAppNotification({
          agendamentoId: agendamentoId,
          clienteNome: clientNome.trim(),
          whatsapp: formattedPhone,
          data: selectedDate,
          hora: selectedTime,
          servicos: selectedServices.map((s) => s.nome),
          profissionalNome: profObj?.nome || 'Equipe',
          salaoNome: salaoNome || 'Studio Beauty',
          donoTelefone: salao?.telefone_whatsapp || '',
          status: 'agendado',
          tipoEvento: 'novo_agendamento',
        });
      } catch (err) {
        console.warn('Erro ao disparar notificação WhatsApp:', err);
      }

      setIsSubmitting(false);
      setStep(5); // Success step
    } catch (err: any) {
      alert(`Erro inesperado: ${err?.message || 'Erro de conexão'}`);
      setIsSubmitting(false);
    }
  }

  if (loadingSalao || loadingServicos || loadingProfs) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin" />
          <p className="text-xs text-muted font-medium animate-pulse">
            Carregando agenda do salão...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-gradient-to-b from-background via-card/30 to-background text-foreground pb-12">
      {/* Header Banner */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-indigo-600 flex items-center justify-center text-white shadow-md shadow-accent/20">
              <Scissors size={18} />
            </div>
            <div>
              <h1 className="font-bold text-sm text-foreground tracking-tight">
                {salaoNome}
              </h1>
              <p className="text-[10px] text-muted font-medium flex items-center gap-1">
                <Sparkles size={10} className="text-accent" />
                Agendamento Online
              </p>
            </div>
          </div>
          {step > 1 && step < 5 && (
            <button
              onClick={() => setStep((s) => (s - 1) as any)}
              className="text-xs text-muted hover:text-foreground flex items-center gap-1 py-1 px-2.5 rounded-lg border border-border bg-card/50 transition-all"
            >
              <ArrowLeft size={14} />
              Voltar
            </button>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 py-6 space-y-6">
        {/* Progress Bar */}
        {step < 5 && (
          <div className="flex items-center justify-between gap-1.5 px-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  i <= step
                    ? 'bg-accent shadow-xs shadow-accent/50'
                    : 'bg-border/60'
                }`}
              />
            ))}
          </div>
        )}

        {/* STEP 1: Selecionar Serviços */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in-up">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                1. Escolha os Serviços
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Selecione um ou mais serviços desejados
              </p>
            </div>

            <div className="space-y-2.5">
              {servicos.map((servico) => {
                const isSelected = selectedServiceIds.includes(servico.id);
                return (
                  <div
                    key={servico.id}
                    onClick={() => toggleService(servico.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-accent bg-accent/10 shadow-md shadow-accent/10 scale-[1.01]'
                        : 'border-border bg-card hover:bg-card-hover'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-foreground">
                          {servico.nome}
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-border/60 text-muted font-medium">
                          {servico.categoria}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {servico.duracao_minutos} min
                        </span>
                      </div>
                    </div>

                    <div className="text-right flex items-center gap-3">
                      <span className="font-bold text-sm text-accent">
                        R$ {(servico.preco / 100).toFixed(2).replace('.', ',')}
                      </span>
                      <div
                        className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-accent border-accent text-white'
                            : 'border-border bg-background'
                        }`}
                      >
                        {isSelected && <Check size={14} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedServiceIds.length > 0 && (
              <div className="pt-4 sticky bottom-4 z-30">
                <button
                  onClick={() => setStep(2)}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-accent to-accent-light text-white text-sm font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 flex items-center justify-between transition-all"
                >
                  <span>
                    Continuar ({selectedServiceIds.length}{' '}
                    {selectedServiceIds.length === 1 ? 'serviço' : 'serviços'})
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">
                      R$ {(totalPrice / 100).toFixed(2).replace('.', ',')}
                    </span>
                    <ChevronRight size={18} />
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Selecionar Profissional */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in-up">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                2. Escolha o Profissional
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Quem você prefere que realize seu atendimento?
              </p>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {/* Option: Qualquer Profissional */}
              <div
                onClick={() => setSelectedProfId('')}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  selectedProfId === ''
                    ? 'border-accent bg-accent/10 shadow-md shadow-accent/10'
                    : 'border-border bg-card hover:bg-card-hover'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                    <User size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">
                      Qualquer Profissional
                    </h3>
                    <p className="text-xs text-muted">
                      Primeiro horário disponível com a equipe
                    </p>
                  </div>
                </div>
                <div
                  className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                    selectedProfId === ''
                      ? 'bg-accent border-accent text-white'
                      : 'border-border bg-background'
                  }`}
                >
                  {selectedProfId === '' && <Check size={14} />}
                </div>
              </div>

              {profissionais.map((prof) => {
                const isSelected = selectedProfId === prof.id;
                return (
                  <div
                    key={prof.id}
                    onClick={() => setSelectedProfId(prof.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'border-accent bg-accent/10 shadow-md shadow-accent/10'
                        : 'border-border bg-card hover:bg-card-hover'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-xs"
                        style={{ backgroundColor: prof.cor || '#8B5CF6' }}
                      >
                        {prof.iniciais}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-foreground">
                          {prof.nome}
                        </h3>
                        <p className="text-[11px] text-muted">
                          {formatDiasProfissional(prof.dias_trabalho)}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-accent border-accent text-white'
                          : 'border-border bg-background'
                      }`}
                    >
                      {isSelected && <Check size={14} />}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4">
              <button
                onClick={() => setStep(3)}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-accent to-accent-light text-white text-sm font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 flex items-center justify-center gap-2 transition-all"
              >
                <span>Avançar para Data e Horário</span>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Data e Horário */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in-up">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                3. Escolha o Dia e Horário
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Selecione a data de sua preferência
              </p>
            </div>

            {/* Date Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted flex items-center gap-1.5">
                <CalendarIcon size={14} className="text-accent" />
                Data do Atendimento
              </label>
              <input
                type="date"
                min={getLocalDateStr()}
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedTime(''); // Reset selected time on date change
                }}
                className="w-full p-3 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            {/* Availability Check: Se a agenda estiver fechada ou profissional não atender no dia */}
            {!availabilityStatus.isAvailable ? (
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center space-y-3 shadow-xs animate-fade-in my-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center justify-center mx-auto shadow-xs">
                  <CalendarX size={24} />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-amber-700 dark:text-amber-300">
                    Dia Indisponível para Atendimento
                  </h3>
                  <p className="text-xs text-foreground font-medium max-w-xs mx-auto">
                    {availabilityStatus.reason}
                  </p>
                  <p className="text-[11px] text-muted max-w-xs mx-auto pt-0.5">
                    {availabilityStatus.suggestion}
                  </p>
                </div>
                {selectedProfId && (
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setSelectedProfId('');
                        setSelectedTime('');
                      }}
                      className="py-2 px-3.5 rounded-xl bg-card border border-border hover:bg-card-hover text-xs font-semibold text-foreground transition-all active:scale-95 cursor-pointer shadow-xs"
                    >
                      Buscar horário com Qualquer Profissional
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* Time Grid */
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted flex items-center gap-1.5">
                  <Clock size={14} className="text-accent" />
                  Horários Disponíveis ({totalDuration} min de atendimento)
                </label>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto pr-1">
                  {TIME_SLOTS.map((slot) => {
                    const isOccupied = occupiedSlots.has(slot);
                    const isSelected = selectedTime === slot;

                    return (
                      <button
                        key={slot}
                        disabled={isOccupied}
                        onClick={() => setSelectedTime(slot)}
                        className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all border ${
                          isOccupied
                            ? 'border-border/40 bg-card/30 text-muted/40 line-through cursor-not-allowed'
                            : isSelected
                            ? 'border-accent bg-accent text-white shadow-md shadow-accent/20 scale-[1.02]'
                            : 'border-border bg-card hover:bg-card-hover text-foreground'
                        }`}
                      >
                        {slot}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedTime && availabilityStatus.isAvailable && (
              <div className="pt-4">
                <button
                  onClick={() => setStep(4)}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-accent to-accent-light text-white text-sm font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 flex items-center justify-between transition-all"
                >
                  <span>Confirmar Horário: {selectedTime}</span>
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Dados do Cliente */}
        {step === 4 && (
          <div className="space-y-4 animate-fade-in-up">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                4. Seus Dados
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Informe seu nome e WhatsApp para confirmar
              </p>
            </div>

            {/* Summary Card */}
            <div className="p-4 rounded-2xl bg-card border border-border space-y-2.5 text-xs">
              <div className="flex justify-between font-bold text-sm text-foreground border-b border-border/60 pb-2">
                <span>{salaoNome}</span>
                <span className="text-accent">
                  R$ {(totalPrice / 100).toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="space-y-1 text-muted">
                <p>
                  <strong className="text-foreground">Serviço(s):</strong>{' '}
                  {selectedServices.map((s) => s.nome).join(', ')}
                </p>
                <p>
                  <strong className="text-foreground">Data e Hora:</strong>{' '}
                  {selectedDate.split('-').reverse().join('/')} às {selectedTime}{' '}
                  (término aprox. {endTime})
                </p>
              </div>
            </div>

            {/* Client Inputs */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Seu Nome Completo *
                </label>
                <input
                  type="text"
                  value={clientNome}
                  onChange={(e) => setClientNome(e.target.value)}
                  placeholder="Ex: Maria Silva"
                  required
                  className="w-full p-3 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  WhatsApp (com DDD) *
                </label>
                <input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(formatPhoneInput(e.target.value))}
                  placeholder="(51) 99999-9999"
                  required
                  className="w-full p-3 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent"
                />
                <p className="text-[11px] text-muted">
                  Enviaremos a confirmação direta no seu WhatsApp
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Observações (Opcional)
                </label>
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Ex: Prefiro tom de tinta mais claro, etc."
                  rows={2}
                  className="w-full p-3 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent resize-none"
                />
              </div>
            </div>

            <div className="pt-4 flex gap-2">
              <button
                onClick={() => setStep(3)}
                className="py-3.5 px-4 rounded-xl border border-border bg-card text-foreground text-sm font-semibold hover:bg-card-hover transition-all"
              >
                Voltar
              </button>
              <button
                disabled={!clientNome.trim() || !clientPhone.trim() || isSubmitting}
                onClick={handleSubmit}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-accent to-accent-light text-white text-sm font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Confirmando...</span>
                ) : (
                  <>
                    <span>Confirmar Agendamento</span>
                    <CheckCircle2 size={18} />
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: Sucesso / Conclusão */}
        {step === 5 && (
          <div className="py-8 text-center space-y-5 animate-fade-in-up">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 size={36} />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground tracking-tight">
                Agendamento Confirmado! 🎉
              </h2>
              <p className="text-xs text-muted max-w-xs mx-auto">
                Obrigado, <strong className="text-foreground">{clientNome}</strong>! Seu horário no <strong className="text-foreground">{salaoNome}</strong> foi reservado com sucesso.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border text-xs text-left space-y-2 max-w-sm mx-auto shadow-sm">
              <div className="flex items-center gap-2 text-emerald-500 font-bold border-b border-border/60 pb-2">
                <CalendarIcon size={16} />
                <span>
                  {selectedDate.split('-').reverse().join('/')} às {selectedTime}
                </span>
              </div>
              <p className="text-muted">
                <strong className="text-foreground">Serviço:</strong>{' '}
                {selectedServices.map((s) => s.nome).join(', ')}
              </p>
              <p className="text-muted">
                <strong className="text-foreground">Valor:</strong> R${' '}
                {(totalPrice / 100).toFixed(2).replace('.', ',')}
              </p>
            </div>

            <p className="text-xs text-muted flex items-center justify-center gap-1.5 pt-2">
              <Phone size={14} className="text-emerald-500" />
              Uma mensagem de confirmação foi enviada para seu WhatsApp!
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
