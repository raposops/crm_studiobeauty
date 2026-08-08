'use client';

import type { Agendamento } from '@/types';
import { HORARIOS } from '@/data/mock';
import AppointmentCard from './appointment-card';

interface TimeGridProps {
  agendamentos: Agendamento[];
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

export default function TimeGrid({ agendamentos, onAppointmentClick }: TimeGridProps) {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  return (
    <div className="relative space-y-0">
      {HORARIOS.map((hora) => {
        const horaNum = parseInt(hora.split(':')[0], 10);
        const horaAgendamentos = getAgendamentosForHour(agendamentos, hora);
        const isCurrentHour = horaNum === currentHour;
        const isPast = horaNum < currentHour;

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
              {horaAgendamentos.length > 0 ? (
                horaAgendamentos.map((ag) => (
                  <AppointmentCard key={ag.id} agendamento={ag} onClick={onAppointmentClick} />
                ))
              ) : (
                <div className="h-8" /> /* empty space */
              )}
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
