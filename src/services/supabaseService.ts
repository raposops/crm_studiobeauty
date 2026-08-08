import { supabase } from '@/lib/supabase';
import type { Agendamento, LancamentoFinanceiro, NovoAgendamentoForm, FormaPagamento } from '@/types';

export const supabaseService = {
  async fetchAgendamentos(salaoId: string, data: string, profissionalId?: string): Promise<Agendamento[]> {
    let query = supabase
      .from('agendamentos')
      .select(`
        *,
        cliente:clientes(*),
        profissional:profissionais(*),
        servicos:agendamento_servicos(servico:servicos(*))
      `)
      .eq('salao_id', salaoId)
      .eq('data', data);

    if (profissionalId) {
      query = query.eq('profissional_id', profissionalId);
    }

    const { data: result, error } = await query;
    
    if (error) throw error;

    // Map junction table 'agendamento_servicos' back to 'servicos' array
    return (result || []).map((ag: any) => ({
      ...ag,
      servicos: ag.servicos?.map((s: any) => s.servico) || [],
    }));
  },

  async fetchLancamentos(salaoId: string, data: string): Promise<LancamentoFinanceiro[]> {
    const { data: result, error } = await supabase
      .from('lancamentos_financeiros')
      .select(`
        *,
        profissional:profissionais(*)
      `)
      .eq('salao_id', salaoId)
      .eq('data', data)
      .order('hora', { ascending: false });

    if (error) throw error;
    return result as LancamentoFinanceiro[];
  },

  async criarAgendamento(payload: NovoAgendamentoForm, salaoId: string) {
    // Check if client exists by whatsapp
    let clienteId = payload.cliente_id;
    
    if (!clienteId) {
      // Trying to find client by phone in this salao
      // Note: simplistic approach. A real app might do this securely in an RPC.
      const { data: existingClients } = await supabase
        .from('clientes')
        .select('id')
        .eq('salao_id', salaoId)
        .eq('whatsapp', payload.cliente_nome); // The mock UI didn't have phone input separately, assuming nome was used or etc.
        // Actually the type NovoAgendamentoForm has no phone. 
        // We will just insert the client for now.
        
      const { data: newClient, error: clientError } = await supabase
        .from('clientes')
        .insert({
          salao_id: salaoId,
          nome: payload.cliente_nome,
          whatsapp: '00000000000' // Placeholder if not provided in form
        })
        .select('id')
        .single();
        
      if (clientError) throw clientError;
      clienteId = newClient.id;
    }

    // Prepare agendamento data
    // Needs valor_total and duracao_total based on selected services
    // For simplicity, we'll fetch them here, or expect the UI to pass them.
    // Assuming UI passes only servico_ids, we need to fetch them:
    const { data: servicosDb } = await supabase
      .from('servicos')
      .select('preco, duracao_minutos')
      .in('id', payload.servico_ids);

    let valorTotal = 0;
    let duracaoTotal = 0;
    if (servicosDb) {
      servicosDb.forEach(s => {
        valorTotal += s.preco;
        duracaoTotal += s.duracao_minutos;
      });
    }

    // Calculate end time
    const startHour = parseInt(payload.hora_inicio.split(':')[0]);
    const startMin = parseInt(payload.hora_inicio.split(':')[1]);
    const totalMins = startHour * 60 + startMin + duracaoTotal;
    const endHour = Math.floor(totalMins / 60).toString().padStart(2, '0');
    const endMin = (totalMins % 60).toString().padStart(2, '0');
    const horaFim = `${endHour}:${endMin}`;

    const { data: agendamento, error: agendamentoError } = await supabase
      .from('agendamentos')
      .insert({
        salao_id: salaoId,
        cliente_id: clienteId,
        profissional_id: payload.profissional_id,
        data: payload.data,
        hora_inicio: payload.hora_inicio,
        hora_fim: horaFim,
        status: 'agendado',
        valor_total: valorTotal,
        duracao_total: duracaoTotal,
      })
      .select('id')
      .single();

    if (agendamentoError) throw agendamentoError;

    // Insert relations in agendamento_servicos
    const servicosRelations = payload.servico_ids.map(sId => ({
      agendamento_id: agendamento.id,
      servico_id: sId
    }));
    
    const { error: relError } = await supabase
      .from('agendamento_servicos')
      .insert(servicosRelations);
      
    if (relError) throw relError;
    
    return agendamento.id;
  },

  async concluirAtendimento(
    agendamentoId: string, 
    salaoId: string,
    formaPagamento: FormaPagamento,
    valorTotal: number, // Total paid
    comissaoProfissional: number,
    valorLiquidoSalao: number,
    produtosExtrasNomes: string[],
    valorServicos: number,
    valorProdutos: number,
    clienteNome: string,
    profissionalId: string,
    servicosNomes: string[]
  ) {
    // Calling RPC to execute this in a single transaction
    const { data, error } = await supabase.rpc('concluir_atendimento', {
      p_agendamento_id: agendamentoId,
      p_salao_id: salaoId,
      p_forma_pagamento: formaPagamento,
      p_valor_total: valorTotal,
      p_comissao_profissional: comissaoProfissional,
      p_valor_liquido: valorLiquidoSalao,
      p_produtos_extras: produtosExtrasNomes,
      p_valor_servicos: valorServicos,
      p_valor_produtos: valorProdutos,
      p_cliente_nome: clienteNome,
      p_profissional_id: profissionalId,
      p_servicos_nomes: servicosNomes
    });

    if (error) throw error;
    return data;
  },

  async marcarLancamentoComoPago(lancamentoId: string) {
    // Update a single lancamento status
    const { error } = await supabase
      .from('lancamentos_financeiros')
      .update({ status_pago_profissional: true })
      .eq('id', lancamentoId);

    if (error) throw error;
  },

  // ==========================
  // PROFISSIONAIS
  // ==========================
  async fetchProfissionais(salaoId: string) {
    const { data, error } = await supabase
      .from('profissionais')
      .select('*')
      .eq('salao_id', salaoId)
      .order('nome');

    if (error) throw error;
    return data;
  },

  async criarProfissional(salaoId: string, payload: { nome: string; cor: string; avatar_url?: string }) {
    const nomeLimpo = payload.nome.trim();
    const partesNome = nomeLimpo.split(' ');
    const iniciais = partesNome.length > 1
      ? `${partesNome[0][0]}${partesNome[1][0]}`.toUpperCase()
      : nomeLimpo.slice(0, 2).toUpperCase();

    const { data, error } = await supabase
      .from('profissionais')
      .insert({
        salao_id: salaoId,
        nome: nomeLimpo,
        iniciais,
        cor: payload.cor || 'from-purple-500 to-indigo-500',
        avatar_url: payload.avatar_url,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletarProfissional(id: string) {
    const { error } = await supabase
      .from('profissionais')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ==========================
  // SERVIÇOS
  // ==========================
  async fetchServicos(salaoId: string) {
    const { data, error } = await supabase
      .from('servicos')
      .select('*')
      .eq('salao_id', salaoId)
      .order('categoria')
      .order('nome');

    if (error) throw error;
    return data;
  },

  async criarServico(salaoId: string, payload: { nome: string; preco: number; duracao_minutos: number; categoria: string }) {
    const { data, error } = await supabase
      .from('servicos')
      .insert({
        salao_id: salaoId,
        nome: payload.nome.trim(),
        preco: payload.preco,
        duracao_minutos: payload.duracao_minutos,
        categoria: payload.categoria.trim() || 'Geral',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletarServico(id: string) {
    const { error } = await supabase
      .from('servicos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
