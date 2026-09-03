'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  CalendarX,
  User,
  Clock,
  Check,
  AlertCircle,
  Sparkles,
  Calendar as CalendarIcon,
  ShieldAlert,
} from 'lucide-react';
import type { Profissional } from '@/types';

interface BloqueioModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedDate?: string;
  preselectedProfId?: string | null;
  profissionais: Profissional[];
  onSave: (payload: {
    profissional_id: string;
    data: string;
    motivo: string;
    dia_inteiro: boolean;
    hora_inicio?: string;
    hora_fim?: string;
    profissional?: Profissional;
  }) => Promise<void>;
}

const MOTIVOS_RAPIDOS = [
  'Folga',
  'Férias',
  'Consulta Médica',
  'Compromisso Pessoal',
  'Curso / Treinamento',
  'Salão Fechado / Feriado',
];

export default function BloqueioModal({
  isOpen,
  onClose,
  preselectedDate,
  preselectedProfId,
  profissionais,
  onSave,
}: BloqueioModalProps) {
  const [selectedProfId, setSelectedProfId] = useState<string>('');
  const [data, setData] = useState<string>('');
  const [motivo, setMotivo] = useState<string>('Folga');
  const [outroMotivo, setOutroMotivo] = useState<string>('');
  const [diaInteiro, setDiaInteiro] = useState<boolean>(true);
  const [horaInicio, setHoraInicio] = useState<string>('08:00');
  const [horaFim, setHoraFim] = useState<string>('19:00');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setData(preselectedDate || new Date().toISOString().split('T')[0]);
      if (preselectedProfId && profissionais.some((p) => p.id === preselectedProfId)) {
        setSelectedProfId(preselectedProfId);
      } else if (profissionais.length > 0) {
        setSelectedProfId(profissionais[0].id);
      }
      setMotivo('Folga');
      setOutroMotivo('');
      setDiaInteiro(true);
      setHoraInicio('08:00');
      setHoraFim('19:00');
      setIsSubmitting(false);
    }
  }, [isOpen, preselectedDate, preselectedProfId, profissionais]);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedProfId || !data) {
      alert('Selecione a profissional e a data do fechamento.');
      return;
    }

    const motivoFinal = motivo === 'Outro' ? outroMotivo.trim() || 'Folga' : motivo;
    const profObj = profissionais.find((p) => p.id === selectedProfId);

    setIsSubmitting(true);
    try {
      if (selectedProfId === 'TODAS') {
        // Bloqueia para todas as profissionais
        for (const prof of profissionais) {
          await onSave({
            profissional_id: prof.id,
            data,
            motivo: motivoFinal,
            dia_inteiro: diaInteiro,
            hora_inicio: diaInteiro ? undefined : horaInicio,
            hora_fim: diaInteiro ? undefined : horaFim,
            profissional: prof,
          });
        }
      } else {
        await onSave({
          profissional_id: selectedProfId,
          data,
          motivo: motivoFinal,
          dia_inteiro: diaInteiro,
          hora_inicio: diaInteiro ? undefined : horaInicio,
          hora_fim: diaInteiro ? undefined : horaFim,
          profissional: profObj,
        });
      }
      onClose();
    } catch (err: any) {
      alert(`Erro ao fechar agenda: ${err?.message || 'Erro inesperado'}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-card border border-border rounded-3xl shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-gradient-to-r from-card to-card-hover">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 border border-amber-500/30 flex items-center justify-center shadow-xs">
              <CalendarX size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">
                Fechar Agenda / Bloquear Dia
              </h2>
              <p className="text-xs text-muted">
                Impede agendamentos de clientes no link online
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-card hover:bg-card-hover border border-border flex items-center justify-center text-muted hover:text-foreground transition-all active:scale-95"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Profissional */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <User size={14} className="text-accent" />
              Profissional
            </label>
            <select
              value={selectedProfId}
              onChange={(e) => setSelectedProfId(e.target.value)}
              className="w-full p-3 rounded-2xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-accent"
              required
            >
              {profissionais.map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {prof.nome}
                </option>
              ))}
              {profissionais.length > 1 && (
                <option value="TODAS">
                  ⭐ Todas as profissionais (Fechar salão no dia)
                </option>
              )}
            </select>
          </div>

          {/* Data */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <CalendarIcon size={14} className="text-accent" />
              Data do Fechamento / Folga
            </label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full p-3 rounded-2xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-accent"
              required
            />
          </div>

          {/* Motivo Rápido */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              Motivo do Fechamento
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {MOTIVOS_RAPIDOS.map((item) => {
                const isSelected = motivo === item;
                return (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setMotivo(item)}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-left flex items-center justify-between ${
                      isSelected
                        ? 'border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold'
                        : 'border-border bg-background hover:bg-card-hover text-muted hover:text-foreground'
                    }`}
                  >
                    <span className="truncate">{item}</span>
                    {isSelected && <Check size={14} className="shrink-0 text-amber-500" />}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setMotivo('Outro')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all text-left flex items-center justify-between ${
                  motivo === 'Outro'
                    ? 'border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold'
                    : 'border-border bg-background hover:bg-card-hover text-muted hover:text-foreground'
                }`}
              >
                <span>Outro motivo...</span>
                {motivo === 'Outro' && <Check size={14} className="shrink-0 text-amber-500" />}
              </button>
            </div>

            {motivo === 'Outro' && (
              <input
                type="text"
                value={outroMotivo}
                onChange={(e) => setOutroMotivo(e.target.value)}
                placeholder="Descreva o motivo da indisponibilidade..."
                className="w-full mt-2 p-3 rounded-2xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-accent placeholder:text-muted"
                autoFocus
              />
            )}
          </div>

          {/* Tipo de Bloqueio: Dia Inteiro vs Parcial */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-background border border-border">
              <div>
                <p className="text-xs font-bold text-foreground">
                  Bloquear o dia inteiro
                </p>
                <p className="text-[11px] text-muted">
                  Nenhum horário ficará disponível nesta data
                </p>
              </div>
              <input
                type="checkbox"
                checked={diaInteiro}
                onChange={(e) => setDiaInteiro(e.target.checked)}
                className="w-5 h-5 rounded-md accent-amber-500 cursor-pointer"
              />
            </div>

            {!diaInteiro && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-background border border-border animate-fade-in">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted flex items-center gap-1">
                    <Clock size={12} />
                    Início do bloqueio
                  </label>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-card border border-border text-xs text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-muted flex items-center gap-1">
                    <Clock size={12} />
                    Fim do bloqueio
                  </label>
                  <input
                    type="time"
                    value={horaFim}
                    onChange={(e) => setHoraFim(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-card border border-border text-xs text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Info Banner */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2.5">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-500" />
            <p className="leading-relaxed">
              Ao fechar a agenda, os clientes que acessarem o link público de agendamento serão avisados que esta data está indisponível e não poderão marcar horários.
            </p>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-2xl border border-border bg-background hover:bg-card-hover text-sm font-semibold text-foreground transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-white text-sm font-bold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 hover:opacity-95 transition-all disabled:opacity-50 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <span>Fechando agenda...</span>
              ) : (
                <>
                  <CalendarX size={16} />
                  <span>Confirmar Fechamento</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
