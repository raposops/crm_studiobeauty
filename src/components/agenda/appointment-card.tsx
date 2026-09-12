'use client';

import type { Agendamento } from '@/types';
import { STATUS_CONFIG } from '@/types';
import { formatCurrency } from '@/data/mock';
import { Clock, User, Zap } from 'lucide-react';

interface AppointmentCardProps {
  agendamento: Agendamento;
  onClick?: (agendamento: Agendamento) => void;
}

export default function AppointmentCard({ agendamento, onClick }: AppointmentCardProps) {
  const config = STATUS_CONFIG[agendamento.status] || STATUS_CONFIG.agendado;
  const isEncaixe =
    agendamento.is_encaixe ||
    Boolean(agendamento.observacoes && agendamento.observacoes.includes('[ENCAIXE]'));

  const cleanObs = agendamento.observacoes
    ? agendamento.observacoes.replace('[ENCAIXE]', '').trim()
    : '';

  return (
    <div
      onClick={() => onClick?.(agendamento)}
      className={`rounded-xl border-l-[6px] px-4 py-3 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 mb-3 bg-white border-y border-r border-slate-200/90 ${config.bg} ${
        isEncaixe ? '!border-l-amber-500 ring-1 ring-amber-500/20' : config.border
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Client Name */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <User size={14} className="text-slate-700 shrink-0" />
            <p className="text-sm font-bold truncate text-slate-900 tracking-tight">
              {agendamento.cliente?.nome || 'Cliente'}
            </p>
            {isEncaixe && (
              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 shadow-2xs">
                <Zap size={10} className="fill-amber-500 text-amber-600 shrink-0" />
                Encaixe
              </span>
            )}
          </div>

          {/* Services */}
          <p className="text-xs mt-1 truncate text-slate-600 font-medium">
            {agendamento.servicos && agendamento.servicos.length > 0
              ? agendamento.servicos.map((s) => s.nome).join(' + ')
              : 'Serviço'}
          </p>

          {/* Optional Clean Notes */}
          {cleanObs && cleanObs !== 'Atendimento simultâneo / Encaixe' && cleanObs !== 'Atendimento de encaixe simultâneo' && (
            <p className="text-[11px] text-slate-500 italic truncate mt-0.5">
              "{cleanObs}"
            </p>
          )}

          {/* Time & Professional */}
          <div className="flex items-center gap-4 mt-2.5">
            <div className="flex items-center gap-1">
              <Clock size={12} className="text-slate-500 shrink-0" />
              <span className="text-xs font-mono font-semibold text-slate-700">
                {agendamento.hora_inicio} - {agendamento.hora_fim}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div
                className={`w-4 h-4 rounded-full bg-gradient-to-br ${agendamento.profissional?.cor || 'from-purple-500 to-indigo-500'} flex items-center justify-center shadow-sm`}
              >
                <span className="text-[7px] font-bold text-white uppercase">
                  {agendamento.profissional?.iniciais || 'P'}
                </span>
              </div>
              <span className="text-xs text-slate-700 font-semibold">
                {agendamento.profissional?.nome?.split(' ')[0] || 'Profissional'}
              </span>
            </div>
          </div>
        </div>

        {/* Price & Status Badge */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className="text-sm font-extrabold text-slate-900">
            {formatCurrency(agendamento.valor_total)}
          </span>
          <span
            className={`text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full border shadow-2xs ${config.badgeBg}`}
          >
            {config.label}
          </span>
        </div>
      </div>
    </div>
  );
}
