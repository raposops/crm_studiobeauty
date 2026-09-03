'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseService } from '@/services/supabaseService';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';
import type { Agendamento, NovoAgendamentoForm } from '@/types';

export function useAgenda(salaoId: string, data: string, profissionalId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ['agendamentos', salaoId, data, profissionalId];

  const query = useQuery({
    queryKey,
    queryFn: () => supabaseService.fetchAgendamentos(salaoId, data, profissionalId),
    enabled: !!salaoId && !!data,
  });

  // Setup Realtime Subscription
  useEffect(() => {
    if (!salaoId) return;

    const channel = supabase
      .channel(`agendamentos_changes_${Math.random().toString(36).substring(2, 9)}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'agendamentos',
          filter: `salao_id=eq.${salaoId}`
        },
        () => {
          // Invalidate cache to refetch when something changes anywhere
          queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [salaoId, data, queryClient]);

  const criarAgendamento = useMutation({
    mutationFn: (payload: NovoAgendamentoForm) => supabaseService.criarAgendamento(payload, salaoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
    },
  });

  const deletarAgendamento = useMutation({
    mutationFn: (agendamentoId: string) => supabaseService.deletarAgendamento(agendamentoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return {
    agendamentos: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    criarAgendamento,
    deletarAgendamento,
  };
}
