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
      .channel(`agendamentos_changes`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'agendamentos',
          filter: `salao_id=eq.${salaoId}`
        },
        () => {
          // Invalidate cache to refetch when something changes
          queryClient.invalidateQueries({ queryKey: ['agendamentos', salaoId, data] });
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
      queryClient.invalidateQueries({ queryKey: ['agendamentos', salaoId, data] });
    },
  });

  return {
    agendamentos: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    criarAgendamento,
  };
}
