'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseService } from '@/services/supabaseService';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';
import type { BloqueioAgenda, Profissional } from '@/types';

export function useBloqueiosAgenda(salaoId: string, data?: string, profissionalId?: string) {
  const queryClient = useQueryClient();
  const queryKey = ['bloqueios_agenda', salaoId, data || 'all', profissionalId || 'all'];

  const query = useQuery({
    queryKey,
    queryFn: () => supabaseService.fetchBloqueiosAgenda(salaoId, data, profissionalId),
    enabled: !!salaoId,
  });

  // Realtime subscription for bloqueios_agenda
  useEffect(() => {
    if (!salaoId) return;

    const channel = supabase
      .channel(`bloqueios_changes_${Math.random().toString(36).substring(2, 9)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bloqueios_agenda',
          filter: `salao_id=eq.${salaoId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['bloqueios_agenda', salaoId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [salaoId, queryClient]);

  const criarBloqueio = useMutation({
    mutationFn: (payload: {
      profissional_id: string;
      data: string;
      motivo?: string;
      dia_inteiro?: boolean;
      hora_inicio?: string;
      hora_fim?: string;
      profissional?: Profissional;
    }) => supabaseService.criarBloqueioAgenda(salaoId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloqueios_agenda', salaoId] });
    },
  });

  const deletarBloqueio = useMutation({
    mutationFn: (id: string) => supabaseService.deletarBloqueioAgenda(id, salaoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bloqueios_agenda', salaoId] });
    },
  });

  return {
    bloqueios: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    criarBloqueio,
    deletarBloqueio,
  };
}
