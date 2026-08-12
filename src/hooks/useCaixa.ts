import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseService } from '@/services/supabaseService';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';
import type { LancamentoFinanceiro, FormaPagamento } from '@/types';

export function useCaixa(salaoId: string, data: string) {
  const queryClient = useQueryClient();
  const queryKey = ['lancamentos', salaoId, data];

  const query = useQuery({
    queryKey,
    queryFn: () => supabaseService.fetchLancamentos(salaoId, data),
    enabled: !!salaoId && !!data,
  });

  // Setup Realtime Subscription
  useEffect(() => {
    if (!salaoId) return;

    const channel = supabase
      .channel(`lancamentos_changes_${Math.random().toString(36).substring(2, 9)}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'lancamentos_financeiros',
          filter: `salao_id=eq.${salaoId}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['lancamentos', salaoId, data] });
          // Also invalidate agenda since status changed to concluido
          queryClient.invalidateQueries({ queryKey: ['agendamentos', salaoId, data] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [salaoId, data, queryClient]);

  const concluirAtendimento = useMutation({
    mutationFn: (args: {
      agendamentoId: string;
      formaPagamento: FormaPagamento;
      valorTotal: number;
      comissaoProfissional: number;
      valorLiquidoSalao: number;
      produtosExtrasNomes: string[];
      valorServicos: number;
      valorProdutos: number;
      clienteNome: string;
      profissionalId: string;
      servicosNomes: string[];
    }) => supabaseService.concluirAtendimento(
      args.agendamentoId,
      salaoId,
      args.formaPagamento,
      args.valorTotal,
      args.comissaoProfissional,
      args.valorLiquidoSalao,
      args.produtosExtrasNomes,
      args.valorServicos,
      args.valorProdutos,
      args.clienteNome,
      args.profissionalId,
      args.servicosNomes
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
    },
  });

  const marcarLancamentoComoPago = useMutation({
    mutationFn: (lancamentoId: string) => supabaseService.marcarLancamentoComoPago(lancamentoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos', salaoId, data] });
    },
  });

  return {
    lancamentos: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    concluirAtendimento,
    marcarLancamentoComoPago,
  };
}
