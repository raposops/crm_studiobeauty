'use client';

import { useQuery } from '@tanstack/react-query';
import { supabaseService } from '@/services/supabaseService';

export function useDashboard(salaoId: string, dataInicio: string, dataFim: string) {
  const query = useQuery({
    queryKey: ['dashboard', salaoId, dataInicio, dataFim],
    queryFn: () => supabaseService.fetchDashboardStats(salaoId, dataInicio, dataFim),
    enabled: !!salaoId && !!dataInicio && !!dataFim,
  });

  return {
    stats: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
