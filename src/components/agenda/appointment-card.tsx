'use client';

import type { Agendamento } from '@/types';
import { STATUS_CONFIG } from '@/types';
import { formatCurrency } from '@/data/mock';
import { Clock, User } from 'lucide-react';

interface AppointmentCardProps {
  agendamento: Agendamento;
  onClick?: (agendamento: Agendamento) => void;
}

export default function AppointmentCard({ agendamento, onClick }: AppointmentCardProps) {
  const config = STATUS_CONFIG[agendamento.status];

  return (
    <div
      onClick={() => onClick?.(agendamento)}
      className={`rounded-xl border-l-4 px-3.5 py-3 cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01] active:scale-[0.98] mb-3 bg-card/80 border-t border-r border-b border-border ${config.bg} ${config.border}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {/* Client Name */}
          <div className="flex items-center gap-1.5">
            <User size={13} className={config.text} />
            <p className="text-sm font-bold truncate text-slate-100 tracking-wide">
              {agendamento.cliente.nome}
            </p>
          </div>

          {/* Services */}
          <p className="text-[11px] mt-0.5 truncate text-slate-300 font-medium">
            {agendamento.servicos.map((s) => s.nome).join(' + ')}
          </p>

          {/* Time & Professional */}
          <div className="flex items-center gap-3 mt-2">
            <div className="flex items-center gap-1">
              <Clock size={11} className="text-slate-400" />
              <span className="text-[10px] font-mono font-semibold text-slate-300">
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
              <span className="text-[10px] text-slate-300 font-medium">
                {agendamento.profissional.nome.split(' ')[0]}
              </span>
            </div>
          </div>
        </div>

        {/* Price & Status Badge */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <span className="text-sm font-bold text-slate-100">
            {formatCurrency(agendamento.valor_total)}
          </span>
          <span
            className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md border ${config.text}`}
            style={{ backgroundColor: 'rgba(15,23,42,0.6)' }}
          >
            {config.label}
          </span>
        </div>
      </div>
    </div>
  );
}
