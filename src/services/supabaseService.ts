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
        servico:servicos!agendamentos_servico_id_fkey(*),
        servicos:agendamento_servicos(servico:servicos!agendamento_servicos_servico_id_fkey(*))
      `)
      .eq('salao_id', salaoId)
      .eq('data', data);

    if (profissionalId) {
      query = query.eq('profissional_id', profissionalId);
    }

    const { data: result, error } = await query;
    
    if (error) throw error;

    // Map junction table 'agendamento_servicos' or fallback to direct column 'servico_id'
    return (result || []).map((ag: any) => {
      let mappedServicos = ag.servicos?.map((s: any) => s.servico).filter(Boolean) || [];
      if (mappedServicos.length === 0 && ag.servico) {
        mappedServicos = [ag.servico];
      }
      return {
        ...ag,
        servicos: mappedServicos,
        cliente: ag.cliente ? {
          ...ag.cliente,
          whatsapp: ag.cliente.telefone_whatsapp || ag.cliente.whatsapp,
        } : null,
      };
    });
  },

  async fetchLancamentos(salaoId: string, dataStr: string): Promise<LancamentoFinanceiro[]> {
    const startIso = `${dataStr}T00:00:00.000Z`;
    const endIso = `${dataStr}T23:59:59.999Z`;

    const { data: result, error } = await supabase
      .from('lancamentos_financeiros')
      .select(`
        *,
        profissional:profissionais(*),
        agendamento:agendamentos(
          *,
          cliente:clientes(*),
          servico:servicos!agendamentos_servico_id_fkey(*),
          servicos:agendamento_servicos(servico:servicos!agendamento_servicos_servico_id_fkey(*))
        )
      `)
      .eq('salao_id', salaoId)
      .gte('data_fechamento', startIso)
      .lte('data_fechamento', endIso)
      .order('data_fechamento', { ascending: false });

    let finalData = result;

    if (error || !result) {
      console.warn('Filtro por data_fechamento em intervalo falhou, buscando lançamentos do salão:', error?.message);
      const { data: fallback, error: fbErr } = await supabase
        .from('lancamentos_financeiros')
        .select(`
          *,
          profissional:profissionais(*),
          agendamento:agendamentos(
            *,
            cliente:clientes(*),
            servico:servicos!agendamentos_servico_id_fkey(*),
            servicos:agendamento_servicos(servico:servicos!agendamento_servicos_servico_id_fkey(*))
          )
        `)
        .eq('salao_id', salaoId)
        .order('data_fechamento', { ascending: false });

      if (fbErr) throw fbErr;
      finalData = fallback;
    }

    return (finalData || []).map((l: any) => {
      const ag = l.agendamento || {};
      const clienteNome = ag.cliente?.nome || l.cliente_nome || 'Cliente';
      
      let mappedServicos = ag.servicos?.map((s: any) => s.servico?.nome).filter(Boolean) || [];
      if (mappedServicos.length === 0 && ag.servico?.nome) {
        mappedServicos = [ag.servico.nome];
      }
      if (mappedServicos.length === 0) {
        mappedServicos = ['Atendimento'];
      }

      const timeDate = l.data_fechamento ? new Date(l.data_fechamento) : new Date();
      const timeStr = `${String(timeDate.getHours()).padStart(2, '0')}:${String(timeDate.getMinutes()).padStart(2, '0')}`;
      const dateOnlyStr = l.data_fechamento ? l.data_fechamento.split('T')[0] : new Date().toISOString().split('T')[0];

      return {
        id: l.id,
        agendamento_id: l.agendamento_id || '',
        cliente_nome: clienteNome,
        profissional: {
          id: l.profissional?.id || '',
          nome: l.profissional?.nome || 'Profissional',
          iniciais: l.profissional?.iniciais || (l.profissional?.nome ? l.profissional.nome.slice(0, 2).toUpperCase() : 'P'),
          cor: l.profissional?.cor || 'from-purple-500 to-indigo-500',
        },
        servicos: mappedServicos,
        produtos_extras: [],
        forma_pagamento: l.forma_pagamento || 'pix',
        valor_servicos: l.valor_total || 0,
        valor_produtos: 0,
        valor_total: l.valor_total || 0,
        comissao_profissional: l.valor_comissao_profissional || 0,
        valor_liquido_salao: l.valor_liquido_salao || 0,
        data: dateOnlyStr,
        hora: timeStr,
        status_pago_profissional: !!l.status_pago_profissional,
      };
    });
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
        .eq('telefone_whatsapp', payload.cliente_nome); // Fallback
         
      const { data: newClient, error: clientError } = await supabase
        .from('clientes')
        .insert({
          salao_id: salaoId,
          nome: payload.cliente_nome,
          telefone_whatsapp: '00000000000' // Placeholder if not provided in form
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
    // Try RPC first
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

    if (!error) return data;

    console.warn('RPC concluir_atendimento error/missing, using direct table fallback:', error.message);

    // 1. Update agendamento status to 'concluido'
    const { error: agErr } = await supabase
      .from('agendamentos')
      .update({ status: 'concluido' })
      .eq('id', agendamentoId);

    if (agErr) throw agErr;

    // 2. Insert/Upsert into lancamentos_financeiros
    const nowIso = new Date().toISOString();
    const comissaoPctCalculada = valorTotal > 0 ? Math.round((comissaoProfissional / valorTotal) * 100) : 50;

    const { data: lancamento, error: finErr } = await supabase
      .from('lancamentos_financeiros')
      .upsert(
        {
          salao_id: salaoId,
          agendamento_id: agendamentoId,
          profissional_id: profissionalId,
          valor_total: valorTotal,
          forma_pagamento: formaPagamento,
          comissao_pct: comissaoPctCalculada,
          valor_comissao_profissional: comissaoProfissional,
          valor_liquido_salao: valorLiquidoSalao,
          status_pago_profissional: false,
          data_fechamento: nowIso,
        },
        { onConflict: 'agendamento_id' }
      )
      .select()
      .maybeSingle();

    if (finErr) console.error('Erro ao inserir/atualizar lancamentos_financeiros no fallback:', finErr.message);

    return agendamentoId;
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
  },

  async fetchClientes(salaoId: string) {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('salao_id', salaoId)
      .order('nome');

    if (error) throw error;
    return (data || []).map((c: any) => ({
      ...c,
      whatsapp: c.telefone_whatsapp || c.whatsapp || '',
    }));
  },

  async criarCliente(salaoId: string, payload: { nome: string; telefone_whatsapp: string; observacoes?: string; data_nascimento?: string }) {
    const { data, error } = await supabase
      .from('clientes')
      .insert({
        salao_id: salaoId,
        nome: payload.nome.trim(),
        telefone_whatsapp: payload.telefone_whatsapp.trim(),
        observacoes: payload.observacoes?.trim() || null,
        data_nascimento: payload.data_nascimento || null,
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      whatsapp: data.telefone_whatsapp || '',
    };
  },

  async atualizarCliente(id: string, payload: { nome?: string; telefone_whatsapp?: string; observacoes?: string; data_nascimento?: string }) {
    const { data, error } = await supabase
      .from('clientes')
      .update({
        ...(payload.nome ? { nome: payload.nome.trim() } : {}),
        ...(payload.telefone_whatsapp ? { telefone_whatsapp: payload.telefone_whatsapp.trim() } : {}),
        ...(payload.observacoes !== undefined ? { observacoes: payload.observacoes?.trim() || null } : {}),
        ...(payload.data_nascimento !== undefined ? { data_nascimento: payload.data_nascimento || null } : {}),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      whatsapp: data.telefone_whatsapp || '',
    };
  },

  async deletarCliente(id: string) {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
