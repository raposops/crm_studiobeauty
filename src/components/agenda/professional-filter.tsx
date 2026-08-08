'use client';

import { useRef } from 'react';
import type { Profissional } from '@/types';

interface ProfessionalFilterProps {
  profissionais: Profissional[];
  selectedId: string | null; // null = "Ver Todos"
  onSelect: (id: string | null) => void;
}

export default function ProfessionalFilter({
  profissionais,
  selectedId,
  onSelect,
}: ProfessionalFilterProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={scrollRef}
      className="flex items-center gap-3 overflow-x-auto scrollbar-none -mx-4 px-4 py-1"
    >
      {/* "Ver Todos" option */}
      <button
        onClick={() => onSelect(null)}
        className={`flex flex-col items-center gap-1.5 shrink-0 transition-all duration-200 ${
          selectedId === null ? 'scale-105' : 'opacity-60 hover:opacity-100'
        }`}
      >
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
            selectedId === null
              ? 'border-accent bg-accent/20 ring-2 ring-purple-500 shadow-lg shadow-purple-500/20'
              : 'border-border bg-card'
          }`}
        >
          <span
            className={`text-[10px] font-bold ${
              selectedId === null ? 'text-accent-light' : 'text-muted'
            }`}
          >
            ALL
          </span>
        </div>
        <span
          className={`text-[10px] font-medium max-w-[56px] truncate ${
            selectedId === null ? 'text-accent-light' : 'text-muted'
          }`}
        >
          Todos
        </span>
      </button>

      {/* Profissionais */}
      {profissionais.map((prof) => {
        const isActive = selectedId === prof.id;
        return (
          <button
            key={prof.id}
            onClick={() => onSelect(prof.id)}
            className={`flex flex-col items-center gap-1.5 shrink-0 transition-all duration-200 ${
              isActive ? 'scale-105' : 'opacity-60 hover:opacity-100'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-200 ${
                isActive
                  ? 'border-purple-500 ring-2 ring-purple-500 shadow-lg shadow-purple-500/30'
                  : 'border-transparent'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full bg-gradient-to-br ${prof.cor} flex items-center justify-center`}
              >
                <span className="text-xs font-bold text-white">
                  {prof.iniciais}
                </span>
              </div>
            </div>
            <span
              className={`text-[10px] font-medium max-w-[56px] truncate ${
                isActive ? 'text-purple-400 font-bold' : 'text-muted'
              }`}
            >
              {prof.nome.split(' ')[0]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
