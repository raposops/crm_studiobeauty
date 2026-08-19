import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabaseService } from '@/services/supabaseService';
import { supabase } from '@/lib/supabase';
import { useEffect } from 'react';

export function useClientes(salaoId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['clientes', salaoId];

  const query = useQuery({
    queryKey,
    queryFn: () => supabaseService.fetchClientes(salaoId),
    enabled: !!salaoId,
  });

  // Realtime subscription for clientes
  useEffect(() => {
    if (!salaoId) return;

    const channel = supabase
      .channel(`clientes_changes_${Math.random().toString(36).substring(2, 9)}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'clientes',
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

  const criarCliente = useMutation({
    mutationFn: (payload: { nome: string; telefone_whatsapp: string; observacoes?: string; data_nascimento?: string; saldo_credito?: number }) =>
      supabaseService.criarCliente(salaoId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const atualizarCliente = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: { nome?: string; telefone_whatsapp?: string; observacoes?: string; data_nascimento?: string; saldo_credito?: number } }) =>
      supabaseService.atualizarCliente(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deletarCliente = useMutation({
    mutationFn: (id: string) => supabaseService.deletarCliente(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const adicionarCredito = useMutation({
    mutationFn: ({ clienteId, valorCentavos, motivo, agendamentoId }: { clienteId: string; valorCentavos: number; motivo: string; agendamentoId?: string }) =>
      supabaseService.adicionarCreditoCliente(salaoId, clienteId, valorCentavos, motivo, agendamentoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const usarCredito = useMutation({
    mutationFn: ({ clienteId, valorCentavos, motivo, agendamentoId }: { clienteId: string; valorCentavos: number; motivo: string; agendamentoId?: string }) =>
      supabaseService.usarCreditoCliente(salaoId, clienteId, valorCentavos, motivo, agendamentoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    clientes: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    criarCliente,
    atualizarCliente,
    deletarCliente,
    adicionarCredito,
    usarCredito,
  };
}
