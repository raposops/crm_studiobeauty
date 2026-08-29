import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseService } from '@/services/supabaseService';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';
import type { ProdutoExtra } from '@/types';

export function useProdutos(salaoId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['produtos', salaoId];

  const query = useQuery({
    queryKey,
    queryFn: () => supabaseService.fetchProdutos(salaoId),
    enabled: !!salaoId,
  });

  // Realtime subscription for produtos
  useEffect(() => {
    if (!salaoId) return;

    const channel = supabase
      .channel(`produtos_changes_${Math.random().toString(36).substring(2, 9)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'produtos',
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

  const criarProduto = useMutation({
    mutationFn: (payload: {
      nome: string;
      preco: number;
      categoria: string;
      quantidade?: number;
      estoque_minimo?: number;
      custo?: number;
      controlar_estoque?: boolean;
    }) => supabaseService.criarProduto(salaoId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const atualizarProduto = useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        nome?: string;
        preco?: number;
        categoria?: string;
        quantidade?: number;
        estoque_minimo?: number;
        custo?: number;
        controlar_estoque?: boolean;
      };
    }) => supabaseService.atualizarProduto(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const ajustarEstoque = useMutation({
    mutationFn: ({ id, quantidade }: { id: string; quantidade: number }) =>
      supabaseService.atualizarProduto(id, { quantidade }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deletarProduto = useMutation({
    mutationFn: (id: string) => supabaseService.deletarProduto(id, salaoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    produtos: (query.data || []) as ProdutoExtra[],
    isLoading: query.isLoading,
    isError: query.isError,
    criarProduto,
    atualizarProduto,
    ajustarEstoque,
    deletarProduto,
    refetch: query.refetch,
  };
}
