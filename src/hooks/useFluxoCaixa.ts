'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabaseService } from '@/services/supabaseService';
import type { MovimentacaoFluxoCaixa, CategoriaMovimentacao } from '@/types';

export type PeriodoFiltro = 'hoje' | 'mes' | '30dias';

export function useFluxoCaixa(salaoId: string, periodo: PeriodoFiltro = 'mes') {
  const [movimentacoesManuais, setMovimentacoesManuais] = useState<MovimentacaoFluxoCaixa[]>([]);
  const [movimentacoesAuto, setMovimentacoesAuto] = useState<MovimentacaoFluxoCaixa[]>([]);
  const [caixaEntradasAuto, setCaixaEntradasAuto] = useState<number>(0);
  const [caixaComissoesAuto, setCaixaComissoesAuto] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper date range calculator
  const { dataInicio, dataFim, labelPeriodo } = useMemo(() => {
    const agora = new Date();
    const hojeStr = agora.toISOString().split('T')[0];

    if (periodo === 'hoje') {
      return {
        dataInicio: hojeStr,
        dataFim: hojeStr,
        labelPeriodo: 'Hoje',
      };
    } else if (periodo === '30dias') {
      const inicio = new Date(agora);
      inicio.setDate(agora.getDate() - 30);
      return {
        dataInicio: inicio.toISOString().split('T')[0],
        dataFim: hojeStr,
        labelPeriodo: 'Últimos 30 Dias',
      };
    } else {
      // 'mes'
      const ano = agora.getFullYear();
      const mes = String(agora.getMonth() + 1).padStart(2, '0');
      const ultimoDia = new Date(ano, agora.getMonth() + 1, 0).getDate();
      return {
        dataInicio: `${ano}-${mes}-01`,
        dataFim: `${ano}-${mes}-${String(ultimoDia).padStart(2, '0')}`,
        labelPeriodo: 'Mês Atual',
      };
    }
  }, [periodo]);

  const carregarDados = useCallback(async () => {
    if (!salaoId) return;
    setIsLoading(true);
    try {
      // 1. Fetch manual entries / expenses
      const itensManuais = await supabaseService.fetchMovimentacoesFluxoCaixa(salaoId, dataInicio, dataFim);
      setMovimentacoesManuais(itensManuais);

      // 2. Fetch individual automatic transactions (Entries & Commission Exits)
      const itensAuto = await supabaseService.fetchMovimentacoesCaixaAuto(salaoId, dataInicio, dataFim);
      setMovimentacoesAuto(itensAuto);

      // 3. Totals summary
      const { totalEntradas, totalComissoes } = await supabaseService.obterResumoCaixaAuto(salaoId, dataInicio, dataFim);
      setCaixaEntradasAuto(totalEntradas);
      setCaixaComissoesAuto(totalComissoes);
    } catch (err) {
      console.error('Erro ao carregar fluxo de caixa:', err);
    } finally {
      setIsLoading(false);
    }
  }, [salaoId, dataInicio, dataFim]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Combine individual automatic transactions + manual items sorted by date/time
  const todasMovimentacoes = useMemo(() => {
    const lista = [...movimentacoesAuto, ...movimentacoesManuais];
    return lista.sort((a, b) => {
      const timeA = new Date(a.criado_em || a.data).getTime();
      const timeB = new Date(b.criado_em || b.data).getTime();
      return timeB - timeA;
    });
  }, [movimentacoesManuais, movimentacoesAuto]);

  // Totals calculations
  const totalEntradas = useMemo(() => {
    return todasMovimentacoes
      .filter((m) => m.tipo === 'entrada')
      .reduce((sum, m) => sum + m.valor, 0);
  }, [todasMovimentacoes]);

  const totalSaidas = useMemo(() => {
    return todasMovimentacoes
      .filter((m) => m.tipo === 'saida')
      .reduce((sum, m) => sum + m.valor, 0);
  }, [todasMovimentacoes]);

  const saldoLiquido = totalEntradas - totalSaidas;

  // Add new transaction
  const adicionarMovimentacao = async (novo: {
    tipo: 'entrada' | 'saida';
    categoria: CategoriaMovimentacao;
    descricao: string;
    valor: number;
    data: string;
  }) => {
    const salvo = await supabaseService.criarMovimentacaoFluxoCaixa(salaoId, novo);
    setMovimentacoesManuais((prev) => [salvo, ...prev]);
    return salvo;
  };

  // Delete transaction
  const excluirMovimentacao = async (id: string) => {
    await supabaseService.deletarMovimentacaoFluxoCaixa(id);
    setMovimentacoesManuais((prev) => prev.filter((m) => m.id !== id));
  };

  return {
    movimentacoes: todasMovimentacoes,
    totalEntradas,
    totalSaidas,
    saldoLiquido,
    caixaAutoValor: caixaEntradasAuto,
    caixaComissoesAuto,
    isLoading,
    labelPeriodo,
    adicionarMovimentacao,
    excluirMovimentacao,
    refetch: carregarDados,
  };
}
