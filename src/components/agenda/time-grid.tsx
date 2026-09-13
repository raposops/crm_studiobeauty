'use client';

import type { Agendamento } from '@/types';
import { HORARIOS } from '@/data/mock';
import { Zap, Clock } from 'lucide-react';
import AppointmentCard from './appointment-card';
import { getTodayDateString } from '@/lib/dateUtils';

interface TimeGridProps {
  agendamentos: Agendamento[];
  selectedDateStr?: string;
  onAppointmentClick?: (agendamento: Agendamento) => void;
}

function getAgendamentosForHour(
  agendamentos: Agendamento[],
  hora: string
): Agendamento[] {
  const horaNum = parseInt(hora.split(':')[0], 10);
  return agendamentos.filter((ag) => {
    const startHour = parseInt(ag.hora_inicio.split(':')[0], 10);
    return startHour === horaNum;
  });
}

function getOngoingAgendamentosForHour(
  agendamentos: Agendamento[],
  hora: string
): Agendamento[] {
  const horaNum = parseInt(hora.split(':')[0], 10);
  const slotStartMinutes = horaNum * 60;

  return agendamentos.filter((ag) => {
    if (ag.status === 'cancelado') return false;
    const [sh, sm] = ag.hora_inicio.split(':').map((n) => parseInt(n, 10) || 0);
    const startMinutes = sh * 60 + sm;
    const [eh, em] = ag.hora_fim.split(':').map((n) => parseInt(n, 10) || 0);
    const endMinutes = eh * 60 + em;

    // Started in an earlier hour, but still ongoing into this hour
    return startMinutes < slotStartMinutes && endMinutes > slotStartMinutes;
  });
}

export default function TimeGrid({ agendamentos, selectedDateStr, onAppointmentClick }: TimeGridProps) {
  const todayStr = getTodayDateString();
  const isViewingToday = (selectedDateStr || todayStr) === todayStr;
  const isFutureDate = selectedDateStr ? selectedDateStr > todayStr : false;

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  return (
    <div className="relative space-y-0">
      {HORARIOS.map((hora) => {
        const horaNum = parseInt(hora.split(':')[0], 10);
        const horaAgendamentos = getAgendamentosForHour(agendamentos, hora);
        const ongoingAgendamentos = getOngoingAgendamentosForHour(agendamentos, hora);
        const isCurrentHour = isViewingToday && horaNum === currentHour;
        const isPast = isViewingToday ? horaNum < currentHour : !isFutureDate;

        const hasSimultaneous =
          horaAgendamentos.length > 1 ||
          (horaAgendamentos.length > 0 && ongoingAgendamentos.length > 0);

        return (
          <div
            key={hora}
            className={`relative flex gap-3 min-h-[64px] ${
              isPast ? 'opacity-50' : ''
            }`}
          >
            {/* Hour Label */}
            <div className="w-12 shrink-0 pt-0.5 relative">
              <span
                className={`text-[11px] font-mono font-semibold ${
                  isCurrentHour ? 'text-accent-light' : 'text-muted'
                }`}
              >
                {hora}
              </span>
            </div>

            {/* Slot Content */}
            <div className="flex-1 border-t border-border/40 pt-2 pb-3 space-y-2">
              {/* Simultaneous / Encaixe notice chip */}
              {hasSimultaneous && (
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl w-fit">
                  <Zap size={11} className="text-amber-500 fill-amber-500" />
                  <span>Atendimento Simultâneo / Encaixe neste horário</span>
                </div>
              )}

              {/* Ongoing procedures from earlier hours (e.g. chemical reaction/pause) */}
              {ongoingAgendamentos.length > 0 && (
                <div className="space-y-1">
                  {ongoingAgendamentos.map((ag) => (
                    <div
                      key={`ongoing-${ag.id}`}
                      onClick={() => onAppointmentClick?.(ag)}
                      className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/25 text-xs text-amber-800 dark:text-amber-200 transition-all cursor-pointer group"
                      title="Clique para ver detalhes do atendimento em andamento"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                        <span className="truncate">
                          Em andamento:{' '}
                          <strong className="group-hover:underline">
                            {ag.cliente?.nome || 'Cliente'}
                          </strong>{' '}
                          <span className="text-[11px] text-amber-700/80 dark:text-amber-300/80">
                            ({ag.hora_inicio} às {ag.hora_fim})
                          </span>
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 shrink-0 ml-2">
                        Pausa / Química
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Appointments starting at this hour */}
              {horaAgendamentos.length > 0 ? (
                horaAgendamentos.map((ag) => (
                  <AppointmentCard key={ag.id} agendamento={ag} onClick={onAppointmentClick} />
                ))
              ) : ongoingAgendamentos.length === 0 ? (
                <div className="h-8" /> /* empty space */
              ) : null}
            </div>

            {/* Current Time Indicator */}
            {isCurrentHour && (
              <div
                className="absolute left-12 right-0 flex items-center z-10 pointer-events-none"
                style={{
                  top: `${(currentMinute / 60) * 100}%`,
                }}
              >
                <div className="w-2 h-2 rounded-full bg-accent shadow-lg shadow-accent/40" />
                <div className="flex-1 h-[2px] bg-accent/60" />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
