import { supabase } from '@/lib/supabase';
import { generateUUID } from '@/lib/uuid';
import type { Agendamento, LancamentoFinanceiro, NovoAgendamentoForm, FormaPagamento, ModulosSalao, MovimentacaoFluxoCaixa, ProdutoExtra } from '@/types';
import { PRODUTOS_EXTRAS } from '@/data/mock';

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

  async fetchLancamentos(
    salaoId: string, 
    filterStr: string, 
    modo: 'dia' | 'mes' = 'dia'
  ): Promise<LancamentoFinanceiro[]> {
    let startIso: string;
    let endIso: string;

    if (modo === 'mes') {
      const [yearStr, monthStr] = filterStr.split('-');
      const year = parseInt(yearStr, 10);
      const month = parseInt(monthStr, 10);
      const lastDay = new Date(year, month, 0).getDate();
      startIso = `${filterStr}-01T00:00:00.000Z`;
      endIso = `${filterStr}-${String(lastDay).padStart(2, '0')}T23:59:59.999Z`;
    } else {
      startIso = `${filterStr}T00:00:00.000Z`;
      endIso = `${filterStr}T23:59:59.999Z`;
    }

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

    if (error) {
      console.error('Erro ao buscar lançamentos financeiros:', error.message);
      throw error;
    }

    return (result || []).map((l: any) => {
      const ag = l.agendamento || {};
      const clienteNome = ag.cliente?.nome || l.cliente_nome || 'Cliente Avulso';
      
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

  async criarLancamentoManual(payload: {
    salaoId: string;
    clienteNome: string;
    profissionalId: string;
    servicoNome: string;
    valorTotal: number;
    formaPagamento: FormaPagamento;
    dataFechamento: string;
    comissaoPct: number;
  }) {
    const comissaoVal = Math.round((payload.valorTotal * payload.comissaoPct) / 100);
    const liquidoVal = payload.valorTotal - comissaoVal;

    const { data, error } = await supabase
      .from('lancamentos_financeiros')
      .insert({
        salao_id: payload.salaoId,
        cliente_nome: payload.clienteNome.trim() || 'Cliente Avulso',
        profissional_id: payload.profissionalId,
        valor_total: payload.valorTotal,
        forma_pagamento: payload.formaPagamento,
        comissao_pct: payload.comissaoPct,
        valor_comissao_profissional: comissaoVal,
        valor_liquido_salao: liquidoVal,
        status_pago_profissional: false,
        data_fechamento: payload.dataFechamento,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
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
        origem: payload.origem || 'presencial',
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
    servicosNomes: string[],
    opcoesCredito?: {
      clienteId?: string;
      creditoUtilizado?: number;
      creditoGerado?: number;
    }
  ) {
    // 1. Processar crédito utilizado da cliente se houver
    if (opcoesCredito?.creditoUtilizado && opcoesCredito.creditoUtilizado > 0 && opcoesCredito.clienteId) {
      try {
        await this.usarCreditoCliente(
          salaoId,
          opcoesCredito.clienteId,
          opcoesCredito.creditoUtilizado,
          `Uso de crédito no atendimento (${servicosNomes.join(', ') || 'Serviço'})`,
          agendamentoId
        );
      } catch (err: any) {
        console.warn('Erro ao abater crédito da cliente:', err?.message);
      }
    }

    // 2. Processar crédito gerado (ex: troco em dinheiro) se houver
    if (opcoesCredito?.creditoGerado && opcoesCredito.creditoGerado > 0 && opcoesCredito.clienteId) {
      try {
        await this.adicionarCreditoCliente(
          salaoId,
          opcoesCredito.clienteId,
          opcoesCredito.creditoGerado,
          `Troco/Crédito gerado no atendimento (${servicosNomes.join(', ') || 'Serviço'})`,
          agendamentoId
        );
      } catch (err: any) {
        console.warn('Erro ao adicionar crédito da cliente:', err?.message);
      }
    }

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

    // 1. Update agendamento status to 'concluido' and sync final valor_total
    const { error: agErr } = await supabase
      .from('agendamentos')
      .update({ status: 'concluido', valor_total: valorTotal })
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

  async criarProfissional(salaoId: string, payload: { nome: string; cor: string; avatar_url?: string; comissao_padrao_pct?: number }) {
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
        comissao_padrao_pct: payload.comissao_padrao_pct ?? 40,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async atualizarProfissional(
    id: string,
    payload: {
      nome?: string;
      cor?: string;
      comissao_padrao_pct?: number;
      avatar_url?: string;
    }
  ) {
    const updateData: Record<string, any> = {};
    if (payload.nome !== undefined) {
      const nomeLimpo = payload.nome.trim();
      const partesNome = nomeLimpo.split(' ');
      const iniciais = partesNome.length > 1
        ? `${partesNome[0][0]}${partesNome[1][0]}`.toUpperCase()
        : nomeLimpo.slice(0, 2).toUpperCase();
      updateData.nome = nomeLimpo;
      updateData.iniciais = iniciais;
    }
    if (payload.cor !== undefined) updateData.cor = payload.cor;
    if (payload.comissao_padrao_pct !== undefined) updateData.comissao_padrao_pct = payload.comissao_padrao_pct;
    if (payload.avatar_url !== undefined) updateData.avatar_url = payload.avatar_url;

    const { data, error } = await supabase
      .from('profissionais')
      .update(updateData)
      .eq('id', id)
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

  async atualizarServico(id: string, payload: { nome?: string; preco?: number; duracao_minutos?: number; categoria?: string }) {
    const { data, error } = await supabase
      .from('servicos')
      .update({
        ...(payload.nome ? { nome: payload.nome.trim() } : {}),
        ...(payload.preco !== undefined ? { preco: payload.preco } : {}),
        ...(payload.duracao_minutos !== undefined ? { duracao_minutos: payload.duracao_minutos } : {}),
        ...(payload.categoria ? { categoria: payload.categoria.trim() } : {}),
      })
      .eq('id', id)
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

  // ==========================
  // PRODUTOS EXTRAS (UPSELL)
  // ==========================
  async fetchProdutos(salaoId: string): Promise<ProdutoExtra[]> {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('salao_id', salaoId)
        .order('categoria')
        .order('nome');

      if (!error && data) {
        if (data.length > 0) {
          if (typeof window !== 'undefined') {
            localStorage.setItem(`produtos_cache_${salaoId}`, JSON.stringify(data));
          }
          return data;
        }
      }
    } catch (err) {
      console.warn('Erro ao buscar produtos no Supabase:', err);
    }

    // Fallback para cache local / mock inicial
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`produtos_cache_${salaoId}`);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch (e) {}
      }
    }

    return PRODUTOS_EXTRAS.map((p) => ({ ...p, salao_id: salaoId }));
  },

  async criarProduto(
    salaoId: string,
    payload: { nome: string; preco: number; categoria: string }
  ): Promise<ProdutoExtra> {
    const novoProduto: ProdutoExtra = {
      id: generateUUID(),
      salao_id: salaoId,
      nome: payload.nome.trim(),
      preco: payload.preco,
      categoria: payload.categoria.trim() || 'Geral',
      criado_em: new Date().toISOString(),
    };

    try {
      const { data, error } = await supabase
        .from('produtos')
        .insert({
          id: novoProduto.id,
          salao_id: salaoId,
          nome: novoProduto.nome,
          preco: novoProduto.preco,
          categoria: novoProduto.categoria,
        })
        .select()
        .single();

      if (!error && data) {
        this.atualizarCacheProdutosLocal(salaoId, (list) => [...list, data]);
        return data;
      }
    } catch (err) {
      console.warn('Supabase produtos insert fallback:', err);
    }

    this.atualizarCacheProdutosLocal(salaoId, (list) => [...list, novoProduto]);
    return novoProduto;
  },

  async atualizarProduto(
    id: string,
    payload: { nome?: string; preco?: number; categoria?: string }
  ): Promise<ProdutoExtra> {
    try {
      const { data, error } = await supabase
        .from('produtos')
        .update({
          ...(payload.nome ? { nome: payload.nome.trim() } : {}),
          ...(payload.preco !== undefined ? { preco: payload.preco } : {}),
          ...(payload.categoria ? { categoria: payload.categoria.trim() } : {}),
        })
        .eq('id', id)
        .select()
        .single();

      if (!error && data) {
        if (data.salao_id) {
          this.atualizarCacheProdutosLocal(data.salao_id, (list) =>
            list.map((p) => (p.id === id ? { ...p, ...data } : p))
          );
        }
        return data;
      }
    } catch (err) {
      console.warn('Supabase produtos update fallback:', err);
    }

    let updated: ProdutoExtra | null = null;
    if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('produtos_cache_')) {
          try {
            const list: ProdutoExtra[] = JSON.parse(localStorage.getItem(key) || '[]');
            const idx = list.findIndex((p) => p.id === id);
            if (idx >= 0) {
              list[idx] = {
                ...list[idx],
                ...(payload.nome ? { nome: payload.nome.trim() } : {}),
                ...(payload.preco !== undefined ? { preco: payload.preco } : {}),
                ...(payload.categoria ? { categoria: payload.categoria.trim() } : {}),
              };
              localStorage.setItem(key, JSON.stringify(list));
              updated = list[idx];
            }
          } catch (e) {}
        }
      }
    }

    return (
      updated || {
        id,
        nome: payload.nome || '',
        preco: payload.preco || 0,
        categoria: payload.categoria || 'Geral',
      }
    );
  },

  async deletarProduto(id: string, salaoId?: string) {
    try {
      const { error } = await supabase.from('produtos').delete().eq('id', id);
      if (error) {
        console.warn('Supabase delete produto error:', error.message);
      }
    } catch (err) {
      console.warn('Supabase produtos delete fallback:', err);
    }

    if (salaoId) {
      this.atualizarCacheProdutosLocal(salaoId, (list) => list.filter((p) => p.id !== id));
    } else if (typeof window !== 'undefined') {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('produtos_cache_')) {
          try {
            const list: ProdutoExtra[] = JSON.parse(localStorage.getItem(key) || '[]');
            const filtered = list.filter((p) => p.id !== id);
            localStorage.setItem(key, JSON.stringify(filtered));
          } catch (e) {}
        }
      }
    }
  },

  atualizarCacheProdutosLocal(salaoId: string, updater: (list: ProdutoExtra[]) => ProdutoExtra[]) {
    if (typeof window === 'undefined') return;
    const key = `produtos_cache_${salaoId}`;
    let list: ProdutoExtra[] = [];
    try {
      const raw = localStorage.getItem(key);
      list = raw ? JSON.parse(raw) : PRODUTOS_EXTRAS.map((p) => ({ ...p, salao_id: salaoId }));
    } catch (e) {
      list = PRODUTOS_EXTRAS.map((p) => ({ ...p, salao_id: salaoId }));
    }
    const nextList = updater(list);
    localStorage.setItem(key, JSON.stringify(nextList));
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
      saldo_credito: Number(c.saldo_credito || 0),
    }));
  },

  async criarCliente(salaoId: string, payload: { nome: string; telefone_whatsapp: string; observacoes?: string; data_nascimento?: string; saldo_credito?: number }) {
    const { data, error } = await supabase
      .from('clientes')
      .insert({
        salao_id: salaoId,
        nome: payload.nome.trim(),
        telefone_whatsapp: payload.telefone_whatsapp.trim(),
        observacoes: payload.observacoes?.trim() || null,
        data_nascimento: payload.data_nascimento || null,
        ...(payload.saldo_credito !== undefined ? { saldo_credito: payload.saldo_credito } : {}),
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      whatsapp: data.telefone_whatsapp || '',
      saldo_credito: Number(data.saldo_credito || 0),
    };
  },

  async atualizarCliente(id: string, payload: { nome?: string; telefone_whatsapp?: string; observacoes?: string; data_nascimento?: string; saldo_credito?: number }) {
    const { data, error } = await supabase
      .from('clientes')
      .update({
        ...(payload.nome ? { nome: payload.nome.trim() } : {}),
        ...(payload.telefone_whatsapp ? { telefone_whatsapp: payload.telefone_whatsapp.trim() } : {}),
        ...(payload.observacoes !== undefined ? { observacoes: payload.observacoes?.trim() || null } : {}),
        ...(payload.data_nascimento !== undefined ? { data_nascimento: payload.data_nascimento || null } : {}),
        ...(payload.saldo_credito !== undefined ? { saldo_credito: payload.saldo_credito } : {}),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      whatsapp: data.telefone_whatsapp || '',
      saldo_credito: Number(data.saldo_credito || 0),
    };
  },

  async adicionarCreditoCliente(salaoId: string, clienteId: string, valorCentavos: number, motivo: string, agendamentoId?: string) {
    if (!clienteId || valorCentavos <= 0) return 0;

    // 1. Obter saldo atual do cliente
    const { data: cliente, error: getErr } = await supabase
      .from('clientes')
      .select('saldo_credito')
      .eq('id', clienteId)
      .maybeSingle();

    if (getErr) {
      console.warn('Erro ao buscar saldo_credito do cliente:', getErr.message);
    }

    const currentSaldo = Number(cliente?.saldo_credito || 0);
    const novoSaldo = currentSaldo + valorCentavos;

    // 2. Atualizar saldo_credito em clientes
    const { error: updErr } = await supabase
      .from('clientes')
      .update({ saldo_credito: novoSaldo })
      .eq('id', clienteId);

    if (updErr) {
      console.warn('Aviso ao atualizar saldo_credito no Supabase:', updErr.message);
    }

    // 3. Registrar histórico em movimentacoes_credito
    try {
      await supabase.from('movimentacoes_credito').insert({
        salao_id: salaoId,
        cliente_id: clienteId,
        agendamento_id: agendamentoId || null,
        tipo: 'entrada',
        valor: valorCentavos,
        motivo: motivo || 'Crédito inserido',
      });
    } catch (e: any) {
      console.warn('Aviso: movimentacoes_credito log:', e?.message);
    }

    return novoSaldo;
  },

  async usarCreditoCliente(salaoId: string, clienteId: string, valorCentavos: number, motivo: string, agendamentoId?: string) {
    if (!clienteId || valorCentavos <= 0) return 0;

    // 1. Obter saldo atual do cliente
    const { data: cliente, error: getErr } = await supabase
      .from('clientes')
      .select('saldo_credito')
      .eq('id', clienteId)
      .maybeSingle();

    if (getErr) {
      console.warn('Erro ao buscar saldo_credito do cliente:', getErr.message);
    }

    const currentSaldo = Number(cliente?.saldo_credito || 0);
    const novoSaldo = Math.max(0, currentSaldo - valorCentavos);

    // 2. Atualizar saldo_credito em clientes
    const { error: updErr } = await supabase
      .from('clientes')
      .update({ saldo_credito: novoSaldo })
      .eq('id', clienteId);

    if (updErr) {
      console.warn('Aviso ao atualizar saldo_credito no Supabase:', updErr.message);
    }

    // 3. Registrar histórico em movimentacoes_credito
    try {
      await supabase.from('movimentacoes_credito').insert({
        salao_id: salaoId,
        cliente_id: clienteId,
        agendamento_id: agendamentoId || null,
        tipo: 'saida',
        valor: valorCentavos,
        motivo: motivo || 'Crédito utilizado em atendimento',
      });
    } catch (e: any) {
      console.warn('Aviso: movimentacoes_credito log:', e?.message);
    }

    return novoSaldo;
  },

  async fetchMovimentacoesCredito(salaoId: string, clienteId?: string) {
    let query = supabase
      .from('movimentacoes_credito')
      .select('*')
      .eq('salao_id', salaoId)
      .order('criado_em', { ascending: false });

    if (clienteId) {
      query = query.eq('cliente_id', clienteId);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Aviso ao buscar movimentacoes_credito:', error.message);
      return [];
    }
    return data || [];
  },

  async deletarCliente(id: string) {
    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // ==========================
  // SUPER ADMIN & MÓDULOS SAAS
  // ==========================
  async fetchTodosSaloes() {
    const { data, error } = await supabase
      .from('saloes')
      .select('*')
      .order('criado_em', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async atualizarModulosSalao(salaoId: string, modulos: ModulosSalao) {
    const { data, error } = await supabase
      .from('saloes')
      .update({ modulos_ativos: modulos })
      .eq('id', salaoId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async atualizarStatusESalao(salaoId: string, payload: { status_assinatura?: string; plano?: string; modulos_ativos?: ModulosSalao }) {
    const { data, error } = await supabase
      .from('saloes')
      .update(payload)
      .eq('id', salaoId)
      .select()
      .single();

    if (error) {
      if (error.message?.includes('modulos_ativos')) {
        const { modulos_ativos, ...fallbackPayload } = payload;
        if (Object.keys(fallbackPayload).length > 0) {
          await supabase.from('saloes').update(fallbackPayload).eq('id', salaoId);
        }
        throw new Error(
          "A coluna 'modulos_ativos' ainda não existe na tabela 'saloes' do Supabase. Execute o comando SQL no Supabase para ativar a gravação de módulos."
        );
      }
      throw error;
    }
    return data;
  },

  async alternarStatusSalao(salaoId: string, status: string) {
    const { data, error } = await supabase
      .from('saloes')
      .update({ status_assinatura: status })
      .eq('id', salaoId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deletarSalao(salaoId: string) {
    const { error } = await supabase
      .from('saloes')
      .delete()
      .eq('id', salaoId);

    if (error) throw error;
  },

  // ==========================
  // FLUXO DE CAIXA
  // ==========================
  // LocalStorage Fallbacks para a tabela fluxo_caixa quando não criada no Supabase
  getLocalStorageFluxoCaixa(salaoId: string): MovimentacaoFluxoCaixa[] {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(`fluxo_caixa_${salaoId}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  setLocalStorageFluxoCaixa(salaoId: string, itens: MovimentacaoFluxoCaixa[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(`fluxo_caixa_${salaoId}`, JSON.stringify(itens));
    } catch {}
  },

  async fetchMovimentacoesFluxoCaixa(salaoId: string, dataInicio?: string, dataFim?: string): Promise<MovimentacaoFluxoCaixa[]> {
    let query = supabase
      .from('fluxo_caixa')
      .select('*')
      .eq('salao_id', salaoId)
      .order('data', { ascending: false });

    if (dataInicio) {
      query = query.gte('data', dataInicio);
    }
    if (dataFim) {
      query = query.lte('data', dataFim);
    }

    const { data, error } = await query;
    if (error) {
      // Fallback para localStorage caso a tabela ainda não exista no Supabase
      let localItens = this.getLocalStorageFluxoCaixa(salaoId);
      if (dataInicio) localItens = localItens.filter((m) => m.data >= dataInicio);
      if (dataFim) localItens = localItens.filter((m) => m.data <= dataFim);
      return localItens;
    }
    return data || [];
  },

  async criarMovimentacaoFluxoCaixa(salaoId: string, item: Omit<MovimentacaoFluxoCaixa, 'id' | 'salao_id'>): Promise<MovimentacaoFluxoCaixa> {
    const novoItem: MovimentacaoFluxoCaixa = {
      id: generateUUID(),
      salao_id: salaoId,
      ...item,
    };

    const { data, error } = await supabase
      .from('fluxo_caixa')
      .insert(novoItem)
      .select()
      .single();

    if (error) {
      // Fallback gracioso para localStorage
      console.warn('Salvo no modo local (tabela fluxo_caixa pendente no Supabase):', error.message);
      const localItens = this.getLocalStorageFluxoCaixa(salaoId);
      localItens.unshift(novoItem);
      this.setLocalStorageFluxoCaixa(salaoId, localItens);
      return novoItem;
    }
    return data || novoItem;
  },

  async deletarMovimentacaoFluxoCaixa(id: string): Promise<void> {
    const { error } = await supabase
      .from('fluxo_caixa')
      .delete()
      .eq('id', id);

    if (error) {
      // Fallback local
      const keys = Object.keys(localStorage).filter((k) => k.startsWith('fluxo_caixa_'));
      keys.forEach((key) => {
        try {
          const stored = JSON.parse(localStorage.getItem(key) || '[]');
          const filtered = stored.filter((m: MovimentacaoFluxoCaixa) => m.id !== id);
          localStorage.setItem(key, JSON.stringify(filtered));
        } catch {}
      });
    }
  },

  // Busca as movimentações automáticas individuais (Atendimentos e Comissões) do Caixa no período
  async fetchMovimentacoesCaixaAuto(salaoId: string, dataInicio: string, dataFim: string): Promise<MovimentacaoFluxoCaixa[]> {
    // 1. Tentar buscar lançamentos_financeiros com detalhes de cliente, profissional e serviço
    const { data: lancamentos, error: finErr } = await supabase
      .from('lancamentos_financeiros')
      .select(`
        *,
        agendamento:agendamentos(
          data,
          cliente:clientes(nome),
          profissional:profissionais(nome),
          servico:servicos!agendamentos_servico_id_fkey(nome)
        )
      `)
      .eq('salao_id', salaoId)
      .gte('criado_em', `${dataInicio}T00:00:00`)
      .lte('criado_em', `${dataFim}T23:59:59`);

    if (!finErr && lancamentos && lancamentos.length > 0) {
      const itens: MovimentacaoFluxoCaixa[] = [];
      lancamentos.forEach((l: any) => {
        const clienteNome = l.cliente_nome || l.agendamento?.cliente?.nome || 'Cliente';
        const dataItem = l.data_fechamento?.split('T')[0] || l.agendamento?.data || dataFim;

        // Entrada (Venda / Atendimento + Produtos)
        if (l.valor_total > 0) {
          itens.push({
            id: `auto-ent-${l.id}`,
            salao_id: salaoId,
            tipo: 'entrada',
            categoria: 'caixa_automatico',
            descricao: `Atendimento: ${clienteNome}`,
            valor: l.valor_total,
            data: dataItem,
            origem_caixa_auto: true,
            criado_em: l.data_fechamento || new Date().toISOString(),
          });
        }

        // Saída (Comissão Profissional)
        if (l.valor_comissao_profissional > 0) {
          const profNome = l.profissional?.nome || l.agendamento?.profissional?.nome || 'Profissional';
          itens.push({
            id: `auto-com-${l.id}`,
            salao_id: salaoId,
            tipo: 'saida',
            categoria: 'folha_repasse',
            descricao: `Comissão: ${profNome} (${clienteNome})`,
            valor: l.valor_comissao_profissional,
            data: dataItem,
            origem_caixa_auto: true,
            criado_em: l.data_fechamento || new Date().toISOString(),
          });
        }
      });
      return itens;
    }

    // 2. Fallback: buscar agendamentos concluídos diretamente
    const { data: agendamentos, error } = await supabase
      .from('agendamentos')
      .select(`
        *,
        cliente:clientes(nome),
        profissional:profissionais(nome, comissao_padrao_pct),
        servico:servicos!agendamentos_servico_id_fkey(nome)
      `)
      .eq('salao_id', salaoId)
      .eq('status', 'concluido')
      .gte('data', dataInicio)
      .lte('data', dataFim);

    if (error || !agendamentos || agendamentos.length === 0) return [];

    const itens: MovimentacaoFluxoCaixa[] = [];

    agendamentos.forEach((ag: any) => {
      const clienteNome = ag.cliente?.nome || 'Cliente';
      const profNome = ag.profissional?.nome || 'Profissional';
      const servicoNome = ag.servico?.nome ? ` (${ag.servico.nome})` : '';
      const vTotal = ag.valor_total || 0;
      const vServico = ag.valor_servico || vTotal;
      const pct = ag.profissional?.comissao_padrao_pct ?? 40;
      const comissaoVal = Math.round((vServico * pct) / 100);

      // Entrada do Atendimento
      if (vTotal > 0) {
        itens.push({
          id: `auto-ag-ent-${ag.id}`,
          salao_id: salaoId,
          tipo: 'entrada',
          categoria: 'caixa_automatico',
          descricao: `Atendimento: ${clienteNome}${servicoNome}`,
          valor: vTotal,
          data: ag.data || dataFim,
          origem_caixa_auto: true,
          criado_em: ag.criado_em || new Date().toISOString(),
        });
      }

      // Saída da Comissão
      if (comissaoVal > 0) {
        itens.push({
          id: `auto-ag-com-${ag.id}`,
          salao_id: salaoId,
          tipo: 'saida',
          categoria: 'folha_repasse',
          descricao: `Comissão: ${profNome} (${clienteNome})`,
          valor: comissaoVal,
          data: ag.data || dataFim,
          origem_caixa_auto: true,
          criado_em: ag.criado_em || new Date().toISOString(),
        });
      }
    });

    return itens;
  },

  // Consolida Entradas (Total Pago pelo Cliente) e Saídas Automáticas (Comissão dos Profissionais)
  async obterResumoCaixaAuto(salaoId: string, dataInicio: string, dataFim: string): Promise<{ totalEntradas: number; totalComissoes: number }> {
    // 1. Tentar buscar pelos lançamentos financeiros
    const { data: lancamentos, error: finErr } = await supabase
      .from('lancamentos_financeiros')
      .select('valor_total, valor_comissao_profissional')
      .eq('salao_id', salaoId)
      .gte('criado_em', `${dataInicio}T00:00:00`)
      .lte('criado_em', `${dataFim}T23:59:59`);

    if (!finErr && lancamentos && lancamentos.length > 0) {
      const totalEntradas = lancamentos.reduce((acc, curr) => acc + (curr.valor_total || 0), 0);
      const totalComissoes = lancamentos.reduce((acc, curr) => acc + (curr.valor_comissao_profissional || 0), 0);
      return { totalEntradas, totalComissoes };
    }

    // 2. Fallback: buscar agendamentos concluídos diretamente
    const { data, error } = await supabase
      .from('agendamentos')
      .select(`
        valor_total,
        valor_servico,
        profissional:profissionais(comissao_padrao_pct)
      `)
      .eq('salao_id', salaoId)
      .eq('status', 'concluido')
      .gte('data', dataInicio)
      .lte('data', dataFim);

    if (error || !data || data.length === 0) {
      return { totalEntradas: 0, totalComissoes: 0 };
    }

    let totalEntradas = 0;
    let totalComissoes = 0;

    data.forEach((ag: any) => {
      const vTotal = ag.valor_total || 0;
      const vServico = ag.valor_servico || vTotal;
      const pct = ag.profissional?.comissao_padrao_pct ?? 40;
      const comissaoVal = Math.round((vServico * pct) / 100);

      totalEntradas += vTotal;
      totalComissoes += comissaoVal;
    });

    return { totalEntradas, totalComissoes };
  },

  // Consolida as entradas vindas dos atendimentos concluídos no Caixa para o período
  async obterEntradasCaixaAuto(salaoId: string, dataInicio: string, dataFim: string): Promise<number> {
    const resumo = await this.obterResumoCaixaAuto(salaoId, dataInicio, dataFim);
    return resumo.totalEntradas;
  },

  // ==========================
  // DASHBOARD
  // ==========================
  async fetchDashboardStats(salaoId: string, dataInicio: string, dataFim: string) {
    // Busca Agendamentos
    const { data: agendamentos, error: agErr } = await supabase
      .from('agendamentos')
      .select('*, profissional:profissionais(nome)')
      .eq('salao_id', salaoId)
      .gte('data', dataInicio)
      .lte('data', dataFim);

    // Busca Lançamentos Financeiros (para Receita e Formas de Pagamento)
    const { data: lancamentos, error: lanErr } = await supabase
      .from('lancamentos_financeiros')
      .select('*, agendamento:agendamentos(servico:servicos!agendamentos_servico_id_fkey(nome), servicos:agendamento_servicos(servico:servicos!agendamento_servicos_servico_id_fkey(nome)))')
      .eq('salao_id', salaoId)
      .gte('data_fechamento', `${dataInicio}T00:00:00.000Z`)
      .lte('data_fechamento', `${dataFim}T23:59:59.999Z`);

    if (agErr) console.error(agErr);
    if (lanErr) console.error(lanErr);

    const ag = agendamentos || [];
    const lan = lancamentos || [];

    // 1. Receita Total (Soma dos lançamentos financeiros onde valor_total > 0)
    const receitaTotal = lan.reduce((acc, curr) => acc + (curr.valor_total || 0), 0);

    // 2. Ticket Médio
    const ticketMedio = lan.length > 0 ? Math.round(receitaTotal / lan.length) : 0;

    // 3. Agendamentos Hoje (Count de agendamentos com data = hoje)
    const hoje = new Date().toISOString().split('T')[0];
    const agendamentosHoje = ag.filter(a => a.data === hoje).length;

    // 4. Gráfico: Online vs Presencial
    let onlineCount = 0;
    let presencialCount = 0;
    ag.forEach(a => {
      // Fallback for missing column or explicit value
      if (a.origem === 'online' || (a.observacoes && a.observacoes.includes('Link Público Online'))) {
        onlineCount++;
      } else {
        presencialCount++;
      }
    });

    const chartOrigem = [
      { name: 'Online (Link)', value: onlineCount, fill: '#8b5cf6' }, // violet-500
      { name: 'Presencial', value: presencialCount, fill: '#ec4899' } // pink-500
    ];

    // 5. Gráfico: Formas de Pagamento
    const pagamentosMap: Record<string, number> = {
      pix: 0, credito: 0, debito: 0, dinheiro: 0
    };
    lan.forEach(l => {
      if (l.forma_pagamento && pagamentosMap[l.forma_pagamento] !== undefined) {
        pagamentosMap[l.forma_pagamento]++;
      }
    });
    
    const chartPagamentos = [
      { name: 'PIX', value: pagamentosMap.pix, fill: '#10b981' }, // emerald-500
      { name: 'Crédito', value: pagamentosMap.credito, fill: '#3b82f6' }, // blue-500
      { name: 'Débito', value: pagamentosMap.debito, fill: '#6366f1' }, // indigo-500
      { name: 'Dinheiro', value: pagamentosMap.dinheiro, fill: '#f59e0b' } // amber-500
    ].filter(item => item.value > 0);

    // 6. Gráfico: Atendimentos por Profissional
    const profMap: Record<string, number> = {};
    ag.forEach(a => {
      // Apenas consideramos agendamentos não cancelados para contar volume por profissional
      if (a.status !== 'cancelado') {
        const pName = a.profissional?.nome || 'Sem Profissional';
        profMap[pName] = (profMap[pName] || 0) + 1;
      }
    });

    const chartProfissionais = Object.keys(profMap).map((key, i) => {
      const colors = ['#f43f5e', '#8b5cf6', '#0ea5e9', '#f59e0b', '#10b981'];
      return {
        name: key,
        value: profMap[key],
        fill: colors[i % colors.length]
      };
    }).sort((a, b) => b.value - a.value);

    return {
      receitaTotal,
      ticketMedio,
      agendamentosHoje,
      chartOrigem,
      chartPagamentos,
      chartProfissionais
    };
  }
};
