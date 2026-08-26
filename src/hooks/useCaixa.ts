import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseService } from '@/services/supabaseService';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';
import type { LancamentoFinanceiro, FormaPagamento } from '@/types';

export function useCaixa(salaoId: string, filterStr: string, modo: 'dia' | 'mes' = 'dia') {
  const queryClient = useQueryClient();
  const queryKey = ['lancamentos', salaoId, modo, filterStr];

  const query = useQuery({
    queryKey,
    queryFn: () => supabaseService.fetchLancamentos(salaoId, filterStr, modo),
    enabled: !!salaoId && !!filterStr,
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
          queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
          queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [salaoId, queryClient]);

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
      opcoesCredito?: {
        clienteId?: string;
        creditoUtilizado?: number;
        creditoGerado?: number;
      };
      servicosAdicionaisIds?: string[];
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
      args.servicosNomes,
      args.opcoesCredito,
      args.servicosAdicionaisIds
    ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
      queryClient.invalidateQueries({ queryKey: ['clientes'] });
      queryClient.invalidateQueries({ queryKey: ['movimentacoes_credito'] });
    },
  });

  const criarLancamentoManual = useMutation({
    mutationFn: (args: {
      clienteNome: string;
      profissionalId: string;
      servicoNome: string;
      valorTotal: number;
      formaPagamento: FormaPagamento;
      dataFechamento: string;
      comissaoPct: number;
    }) => supabaseService.criarLancamentoManual({
      salaoId,
      ...args,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
      queryClient.invalidateQueries({ queryKey: ['agendamentos'] });
    },
  });

  const marcarLancamentoComoPago = useMutation({
    mutationFn: (lancamentoId: string) => supabaseService.marcarLancamentoComoPago(lancamentoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lancamentos'] });
    },
  });

  return {
    lancamentos: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    concluirAtendimento,
    criarLancamentoManual,
    marcarLancamentoComoPago,
  };
}
