'use client';

import type { Agendamento } from '@/types';
import { STATUS_CONFIG } from '@/types';
import { formatCurrency } from '@/data/mock';
import { Clock, User } from 'lucide-react';

interface AppointmentCardProps {
  agendamento: Agendamento;
}

export default function AppointmentCard({ agendamento }: AppointmentCardProps) {
  const config = STATUS_CONFIG[agendamento.status];

  return (
    <div
      className={`rounded-xl border-l-4 px-3 py-2.5 cursor-pointer transition-all duration-200 hover:shadow-md active:scale-[0.98] ${config.bg} ${config.border}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Client Name */}
          <div className="flex items-center gap-1.5">
            <User size={12} className={config.text} />
            <p className={`text-sm font-bold truncate ${config.text}`}>
              {agendamento.cliente.nome}
            </p>
          </div>

          {/* Services */}
          <p className={`text-[11px] mt-0.5 truncate ${config.text} opacity-75`}>
            {agendamento.servicos.map((s) => s.nome).join(' + ')}
          </p>

          {/* Time & Professional */}
          <div className="flex items-center gap-3 mt-1.5">
            <div className="flex items-center gap-1">
              <Clock size={10} className={`${config.text} opacity-60`} />
              <span className={`text-[10px] font-mono font-semibold ${config.text} opacity-80`}>
                {agendamento.hora_inicio} - {agendamento.hora_fim}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <div
                className={`w-4 h-4 rounded-full bg-gradient-to-br ${agendamento.profissional.cor} flex items-center justify-center`}
              >
                <span className="text-[6px] font-bold text-white">
                  {agendamento.profissional.iniciais}
                </span>
              </div>
              <span className={`text-[10px] ${config.text} opacity-70`}>
                {agendamento.profissional.nome.split(' ')[0]}
              </span>
            </div>
          </div>
        </div>

        {/* Price & Status Badge */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-xs font-bold ${config.text}`}>
            {formatCurrency(agendamento.valor_total)}
          </span>
          <span
            className={`text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-md ${config.text} opacity-70`}
            style={{ backgroundColor: 'rgba(0,0,0,0.06)' }}
          >
            {config.label}
          </span>
        </div>
      </div>
    </div>
  );
}
