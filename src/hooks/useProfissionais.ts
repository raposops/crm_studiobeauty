import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseService } from '@/services/supabaseService';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

export function useProfissionais(salaoId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['profissionais', salaoId];

  const query = useQuery({
    queryKey,
    queryFn: () => supabaseService.fetchProfissionais(salaoId),
    enabled: !!salaoId,
  });

  // Realtime subscription for profissionais
  useEffect(() => {
    if (!salaoId) return;

    const channel = supabase
      .channel('profissionais_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profissionais',
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

  const criarProfissional = useMutation({
    mutationFn: (payload: { nome: string; cor: string; avatar_url?: string }) =>
      supabaseService.criarProfissional(salaoId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deletarProfissional = useMutation({
    mutationFn: (id: string) => supabaseService.deletarProfissional(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    profissionais: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    criarProfissional,
    deletarProfissional,
  };
}
