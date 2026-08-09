import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseService } from '@/services/supabaseService';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

export function useServicos(salaoId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['servicos', salaoId];

  const query = useQuery({
    queryKey,
    queryFn: () => supabaseService.fetchServicos(salaoId),
    enabled: !!salaoId,
  });

  // Realtime subscription for servicos
  useEffect(() => {
    if (!salaoId) return;

    const channel = supabase
      .channel(`servicos_changes_${Math.random().toString(36).substring(2, 9)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'servicos',
          filter: `salao_id=eq.${salaoId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [salaoId, queryClient, queryKey]);

  const criarServico = useMutation({
    mutationFn: (payload: { nome: string; preco: number; duracao_minutos: number; categoria: string }) =>
      supabaseService.criarServico(salaoId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deletarServico = useMutation({
    mutationFn: (id: string) => supabaseService.deletarServico(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    servicos: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    criarServico,
    deletarServico,
  };
}
