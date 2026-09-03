'use client';

import { useState } from 'react';
import {
  Users,
  Scissors,
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
  ChevronLeft,
  Store,
  Bell,
  Palette,
  LogOut,
  ChevronRight,
  Clock,
  DollarSign,
  Share2,
  Copy,
  ExternalLink,
  CreditCard,
  Sparkles,
  Headphones,
  Globe,
  ShoppingBag,
  Building2,
  Package,
} from 'lucide-react';
import Link from 'next/link';
import { useProfissionais } from '@/hooks/useProfissionais';
import { useServicos } from '@/hooks/useServicos';
import { useProdutos } from '@/hooks/useProdutos';
import { formatCurrency } from '@/data/mock';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseService } from '@/services/supabaseService';
import AssinaturaModal from '@/components/ajustes/assinatura-modal';
import type { Profissional, Servico, ProdutoExtra } from '@/types';

type ViewMode = 'menu' | 'profissionais' | 'servicos' | 'produtos';

const COLOR_OPTIONS = [
  { label: 'Roxo / Indigo', class: 'from-purple-500 to-indigo-500' },
  { label: 'Rosa / Violeta', class: 'from-pink-500 to-rose-500' },
  { label: 'Azul / Ciano', class: 'from-blue-500 to-cyan-500' },
  { label: 'Verde / Esmeralda', class: 'from-emerald-500 to-teal-500' },
  { label: 'Laranja / Âmbar', class: 'from-orange-500 to-amber-500' },
];

const DIAS_SEMANA_LIST = [
  { dia: 1, label: 'Seg', full: 'Segunda-feira' },
  { dia: 2, label: 'Ter', full: 'Terça-feira' },
  { dia: 3, label: 'Qua', full: 'Quarta-feira' },
  { dia: 4, label: 'Qui', full: 'Quinta-feira' },
  { dia: 5, label: 'Sex', full: 'Sexta-feira' },
  { dia: 6, label: 'Sáb', full: 'Sábado' },
  { dia: 0, label: 'Dom', full: 'Domingo' },
];

function formatDiasTrabalho(dias?: number[]): string {
  if (!dias || dias.length === 0) return 'Sem escala definida';
  if (dias.length === 7) return 'Todos os dias';
  if (dias.length === 6 && !dias.includes(0)) return 'Seg a Sáb';
  if (dias.length === 5 && !dias.includes(0) && !dias.includes(6)) return 'Seg a Sex';

  const ordem = [1, 2, 3, 4, 5, 6, 0];
  const ordenados = ordem.filter((d) => dias.includes(d));
  return ordenados.map((d) => DIAS_SEMANA_LIST.find((item) => item.dia === d)?.label).join(', ');
}

export default function AjustesPage() {
  const { salao, salaoId, logout, user, refreshAuth, hasModule } = useAuth();
  const temModuloEstoque = hasModule('estoque');
  const salaoSlug = salao?.slug || 'studio-beauty';
  const publicBookingUrl = typeof window !== 'undefined' ? `${window.location.origin}/agendar/${salaoSlug}` : `http://localhost:3000/agendar/${salaoSlug}`;

  const [view, setView] = useState<ViewMode>('menu');
  const [copiedLink, setCopiedLink] = useState(false);

  // Modal Perfil do Salão state
  const [isSalaoModalOpen, setIsSalaoModalOpen] = useState(false);
  const [salaoNomeInput, setSalaoNomeInput] = useState('');
  const [salaoSlugInput, setSalaoSlugInput] = useState('');
  const [salaoPhoneInput, setSalaoPhoneInput] = useState('');
  const [isSavingSalao, setIsSavingSalao] = useState(false);

  // Hooks
  const {
    profissionais,
    isLoading: loadingProfs,
    criarProfissional,
    atualizarProfissional,
    deletarProfissional,
  } = useProfissionais(salaoId);

  const {
    servicos,
    isLoading: loadingServs,
    criarServico,
    atualizarServico,
    deletarServico,
  } = useServicos(salaoId);

  const {
    produtos,
    isLoading: loadingProds,
    criarProduto,
    atualizarProduto,
    deletarProduto,
  } = useProdutos(salaoId);

  // Modals state
  const [isProfModalOpen, setIsProfModalOpen] = useState(false);
  const [editingProf, setEditingProf] = useState<Profissional | null>(null);
  const [profNome, setProfNome] = useState('');
  const [profCor, setProfCor] = useState(COLOR_OPTIONS[0].class);
  const [profComissao, setProfComissao] = useState('40');
  const [profDiasTrabalho, setProfDiasTrabalho] = useState<number[]>([1, 2, 3, 4, 5, 6]);

  const [isAssinaturaModalOpen, setIsAssinaturaModalOpen] = useState(false);

  const [isServModalOpen, setIsServModalOpen] = useState(false);
  const [editingServ, setEditingServ] = useState<Servico | null>(null);
  const [servNome, setServNome] = useState('');
  const [servPreco, setServPreco] = useState('');
  const [servDuracao, setServDuracao] = useState('30');
  const [servCategoria, setServCategoria] = useState('Cabelo');

  // Modal Produto Extra state
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [editingProd, setEditingProd] = useState<ProdutoExtra | null>(null);
  const [prodNome, setProdNome] = useState('');
  const [prodPreco, setProdPreco] = useState('');
  const [prodCategoria, setProdCategoria] = useState('Cabelo');
  const [prodQuantidade, setProdQuantidade] = useState('10');
  const [prodEstoqueMinimo, setProdEstoqueMinimo] = useState('2');
  const [prodCusto, setProdCusto] = useState('');

  // Handlers for Salão Modal
  function handleOpenSalaoModal() {
    setSalaoNomeInput(salao?.nome || '');
    setSalaoSlugInput(salao?.slug || '');
    setSalaoPhoneInput(salao?.telefone_whatsapp || '');
    setIsSalaoModalOpen(true);
  }

  async function handleSaveSalao(e: React.FormEvent) {
    e.preventDefault();
    if (!salaoNomeInput.trim()) {
      alert('Informe o nome do seu salão.');
      return;
    }
    setIsSavingSalao(true);
    try {
      await supabaseService.atualizarDadosSalao(salaoId, {
        nome: salaoNomeInput.trim(),
        slug: salaoSlugInput.trim() || undefined,
        telefone_whatsapp: salaoPhoneInput.trim() || '',
      });
      await refreshAuth();
      setIsSalaoModalOpen(false);
      alert('Dados do salão atualizados com sucesso!');
    } catch (err: any) {
      alert(`Erro ao salvar dados do salão: ${err?.message || 'Erro inesperado'}`);
    } finally {
      setIsSavingSalao(false);
    }
  }

  // Handlers for Profissional Modal
  function handleOpenNewProfModal() {
    setEditingProf(null);
    setProfNome('');
    setProfCor(COLOR_OPTIONS[0].class);
    setProfComissao('40');
    setProfDiasTrabalho([1, 2, 3, 4, 5, 6]);
    setIsProfModalOpen(true);
  }

  function handleEditProfissional(prof: Profissional) {
    setEditingProf(prof);
    setProfNome(prof.nome);
    setProfCor(prof.cor || COLOR_OPTIONS[0].class);
    setProfComissao(String(prof.comissao_padrao_pct ?? 40));
    setProfDiasTrabalho(Array.isArray(prof.dias_trabalho) ? prof.dias_trabalho : [1, 2, 3, 4, 5, 6]);
    setIsProfModalOpen(true);
  }

  function handleSubmitProfissional(e: React.FormEvent) {
    e.preventDefault();
    if (!profNome.trim()) return;

    const comissaoNum = Math.max(0, Math.min(100, parseFloat(profComissao) || 0));

    if (editingProf) {
      atualizarProfissional.mutate(
        {
          id: editingProf.id,
          payload: {
            nome: profNome,
            cor: profCor,
            comissao_padrao_pct: comissaoNum,
            dias_trabalho: profDiasTrabalho,
          },
        },
        {
          onSuccess: () => {
            setEditingProf(null);
            setProfNome('');
            setProfComissao('40');
            setProfDiasTrabalho([1, 2, 3, 4, 5, 6]);
            setIsProfModalOpen(false);
          },
          onError: (err: any) => {
            console.error('Erro ao atualizar profissional:', err);
            alert(`Erro ao atualizar profissional: ${err?.message || 'Verifique sua conexão com o banco.'}`);
          },
        }
      );
    } else {
      criarProfissional.mutate(
        {
          nome: profNome,
          cor: profCor,
          comissao_padrao_pct: comissaoNum,
          dias_trabalho: profDiasTrabalho,
        },
        {
          onSuccess: () => {
            setProfNome('');
            setProfComissao('40');
            setProfDiasTrabalho([1, 2, 3, 4, 5, 6]);
            setIsProfModalOpen(false);
          },
          onError: (err: any) => {
            console.error('Erro ao criar profissional:', err);
            alert(`Erro ao salvar profissional: ${err?.message || 'Verifique sua conexão com o banco.'}`);
          },
        }
      );
    }
  }

  // Handlers for Serviço Modal
  function handleOpenNewServModal() {
    setEditingServ(null);
    setServNome('');
    setServPreco('');
    setServDuracao('30');
    setServCategoria('Cabelo');
    setIsServModalOpen(true);
  }

  function handleEditServico(serv: Servico) {
    setEditingServ(serv);
    setServNome(serv.nome);
    setServPreco((serv.preco / 100).toFixed(2));
    setServDuracao(String(serv.duracao_minutos));
    setServCategoria(serv.categoria || 'Cabelo');
    setIsServModalOpen(true);
  }

  function handleSubmitServico(e: React.FormEvent) {
    e.preventDefault();
    if (!servNome.trim() || !servPreco) return;

    const priceFloat = parseFloat(servPreco.replace(',', '.'));
    if (isNaN(priceFloat)) {
      alert('Informe um valor de preço válido.');
      return;
    }
    const precoCentavos = Math.round(priceFloat * 100);

    if (editingServ) {
      atualizarServico.mutate(
        {
          id: editingServ.id,
          payload: {
            nome: servNome.trim(),
            preco: precoCentavos,
            duracao_minutos: parseInt(servDuracao) || 30,
            categoria: servCategoria,
          },
        },
        {
          onSuccess: () => {
            setEditingServ(null);
            setServNome('');
            setServPreco('');
            setServDuracao('30');
            setIsServModalOpen(false);
          },
          onError: (err: any) => {
            console.error('Erro ao atualizar serviço:', err);
            alert(`Erro ao atualizar serviço: ${err?.message || 'Verifique sua conexão com o banco.'}`);
          },
        }
      );
    } else {
      criarServico.mutate(
        {
          nome: servNome.trim(),
          preco: precoCentavos,
          duracao_minutos: parseInt(servDuracao) || 30,
          categoria: servCategoria,
        },
        {
          onSuccess: () => {
            setServNome('');
            setServPreco('');
            setServDuracao('30');
            setIsServModalOpen(false);
          },
          onError: (err: any) => {
            console.error('Erro ao criar serviço:', err);
            alert(`Erro ao salvar serviço: ${err?.message || 'Verifique sua conexão com o banco.'}`);
          },
        }
      );
    }
  }

  // Handlers for Produto Extra Modal
  function handleOpenNewProdModal() {
    setEditingProd(null);
    setProdNome('');
    setProdPreco('');
    setProdCategoria('Cabelo');
    setProdQuantidade('10');
    setProdEstoqueMinimo('2');
    setProdCusto('');
    setIsProdModalOpen(true);
  }

  function handleEditProduto(prod: ProdutoExtra) {
    setEditingProd(prod);
    setProdNome(prod.nome);
    setProdPreco((prod.preco / 100).toFixed(2));
    setProdCategoria(prod.categoria || 'Geral');
    setProdQuantidade(prod.quantidade?.toString() || '0');
    setProdEstoqueMinimo(prod.estoque_minimo?.toString() || '0');
    setProdCusto(prod.custo ? (prod.custo / 100).toFixed(2) : '');
    setIsProdModalOpen(true);
  }

  function handleSubmitProduto(e: React.FormEvent) {
    e.preventDefault();
    if (!prodNome.trim() || !prodPreco) return;

    const priceFloat = parseFloat(prodPreco.replace(',', '.'));
    if (isNaN(priceFloat) || priceFloat < 0) {
      alert('Informe um valor de preço válido.');
      return;
    }
    const precoCentavos = Math.round(priceFloat * 100);
    const custoCentavos = prodCusto ? Math.round(parseFloat(prodCusto.replace(',', '.')) * 100) : 0;
    const qtdNum = parseInt(prodQuantidade) || 0;
    const minNum = parseInt(prodEstoqueMinimo) || 0;

    if (editingProd) {
      atualizarProduto.mutate(
        {
          id: editingProd.id,
          payload: {
            nome: prodNome.trim(),
            preco: precoCentavos,
            categoria: prodCategoria,
            quantidade: qtdNum,
            estoque_minimo: minNum,
            custo: custoCentavos,
          },
        },
        {
          onSuccess: () => {
            setEditingProd(null);
            setProdNome('');
            setProdPreco('');
            setProdCategoria('Cabelo');
            setProdQuantidade('10');
            setProdEstoqueMinimo('2');
            setProdCusto('');
            setIsProdModalOpen(false);
          },
          onError: (err: any) => {
            console.error('Erro ao atualizar produto:', err);
            alert(`Erro ao atualizar produto: ${err?.message || 'Verifique sua conexão.'}`);
          },
        }
      );
    } else {
      criarProduto.mutate(
        {
          nome: prodNome.trim(),
          preco: precoCentavos,
          categoria: prodCategoria,
          quantidade: qtdNum,
          estoque_minimo: minNum,
          custo: custoCentavos,
          controlar_estoque: true,
        },
        {
          onSuccess: () => {
            setProdNome('');
            setProdPreco('');
            setProdCategoria('Cabelo');
            setProdQuantidade('10');
            setProdEstoqueMinimo('2');
            setProdCusto('');
            setIsProdModalOpen(false);
          },
          onError: (err: any) => {
            console.error('Erro ao criar produto:', err);
            alert(`Erro ao salvar produto: ${err?.message || 'Verifique sua conexão.'}`);
          },
        }
      );
    }
  }

  return (
    <div className="animate-fade-in-up space-y-5">
      {/* Header with Back Button if inside a sub-view */}
      <div className="flex items-center gap-3">
        {view !== 'menu' && (
          <button
            onClick={() => setView('menu')}
            className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center hover:bg-card-hover active:scale-95 transition-all"
          >
            <ChevronLeft size={18} className="text-foreground" />
          </button>
        )}
        <div>
          <h2 className="text-xl font-bold text-foreground">
            {view === 'menu' && 'Ajustes'}
            {view === 'profissionais' && 'Equipe de Profissionais'}
            {view === 'servicos' && 'Catálogo de Serviços'}
            {view === 'produtos' && 'Produtos Extras (Comanda)'}
          </h2>
          <p className="text-xs text-muted">
            {view === 'menu' && 'Gerencie as configurações do salão'}
            {view === 'profissionais' && 'Cadastre e gerencie a equipe'}
            {view === 'servicos' && 'Defina os preços e horários dos serviços'}
            {view === 'produtos' && 'Itens e cosméticos para venda no fechamento da comanda'}
          </p>
        </div>
      </div>

      {/* VIEW: MAIN MENU */}
      {view === 'menu' && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-[10px] uppercase tracking-widest text-muted font-semibold px-1">
              Salão
            </h3>
            <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border/50">
              <button
                onClick={handleOpenSalaoModal}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-card-hover transition-colors text-left group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <Building2 size={18} className="text-accent-light" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      Perfil do Salão
                    </p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-bold truncate max-w-[150px]">
                      {salao?.nome || 'Configurar'}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted">
                    Nome do estabelecimento, link público e WhatsApp
                  </p>
                </div>
                <ChevronRight
                  size={16}
                  className="text-muted/40 group-hover:text-muted transition-colors shrink-0"
                />
              </button>

              <button
                onClick={() => setView('profissionais')}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-card-hover transition-colors text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <Users size={18} className="text-accent-light" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      Profissionais
                    </p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-bold">
                      {profissionais.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted">
                    Cadastrar e gerenciar equipe
                  </p>
                </div>
                <ChevronRight
                  size={16}
                  className="text-muted/40 group-hover:text-muted transition-colors shrink-0"
                />
              </button>

              <button
                onClick={() => setView('servicos')}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-card-hover transition-colors text-left group"
              >
                <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <Scissors size={18} className="text-accent-light" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      Serviços
                    </p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-bold">
                      {servicos.length}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted">
                    Tabela de preços e durações
                  </p>
                </div>
                <ChevronRight
                  size={16}
                  className="text-muted/40 group-hover:text-muted transition-colors shrink-0"
                />
              </button>

              <button
                onClick={() => setView('produtos')}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-card-hover transition-colors text-left group cursor-pointer"
              >
                <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <ShoppingBag size={18} className="text-accent-light" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      Produtos Extras
                    </p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-bold">
                      {produtos.length}
                    </span>
                    {temModuloEstoque && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30 font-bold hidden sm:inline">
                        Estoque PRO
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted">
                    {temModuloEstoque 
                      ? 'Itens integrados com o módulo Controle de Estoque'
                      : 'Itens e cosméticos para venda rápida na comanda'}
                  </p>
                </div>
                <ChevronRight
                  size={16}
                  className="text-muted/40 group-hover:text-muted transition-colors shrink-0"
                />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-[10px] uppercase tracking-widest text-muted font-semibold px-1">
              Agendamento Online dos Clientes
            </h3>
            <div className="rounded-2xl bg-card border border-border p-4 space-y-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                  <Share2 size={18} className="text-accent-light" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Link Público de Agendamento
                  </p>
                  <p className="text-[11px] text-muted">
                    Envie para seus clientes ou coloque na bio do Instagram
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={publicBookingUrl}
                  className="flex-1 bg-card-hover border border-border rounded-xl px-3 py-2 text-xs font-mono text-foreground focus:outline-none select-all"
                />
                <button
                  onClick={() => {
                    if (navigator?.clipboard?.writeText) {
                      navigator.clipboard.writeText(publicBookingUrl);
                    }
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-3 py-2 rounded-xl bg-accent text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm hover:opacity-90 transition-all shrink-0"
                >
                  {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                  {copiedLink ? 'Copiado!' : 'Copiar'}
                </button>
                <a
                  href={publicBookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl border border-border text-foreground hover:bg-card-hover transition-colors shrink-0"
                  title="Abrir página de agendamento"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-[10px] uppercase tracking-widest text-muted font-semibold px-1">
              Plano & Faturamento (Asaas)
            </h3>
            <div className="rounded-2xl bg-card border border-border p-4 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
                    <CreditCard size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground">
                        Minha Assinatura SaaS
                      </p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent/10 text-accent font-bold uppercase">
                        {salao?.plano || 'PRO'}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted">
                      {(salao?.plano === 'basico' ? 'R$ 49,99' : 'R$ 69,90')}/mês &middot; Status: <strong className="text-emerald-500">{salao?.status_assinatura === 'inadimplente' ? 'Pendente' : 'Ativo'}</strong>
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsAssinaturaModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-purple-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm hover:bg-purple-500 active:scale-95 transition-all shrink-0 cursor-pointer"
                >
                  <CreditCard size={14} />
                  <span>Ver Fatura / PIX</span>
                </button>
              </div>
            </div>
          </div>

          {/* Suporte & Fidus Connect */}
          <div className="space-y-2">
            <h3 className="text-[10px] uppercase tracking-widest text-muted font-semibold px-1">
              Suporte & Fidus Connect
            </h3>
            <div className="rounded-2xl bg-card border border-border p-4 space-y-3 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-accent/15 flex items-center justify-center shrink-0">
                  <Headphones size={18} className="text-accent-light" />
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">
                    Canais Oficiais & Suporte
                  </p>
                  <p className="text-[11px] text-muted">
                    Atendimento técnico humanizado e redes oficiais da Fidus Connect
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {/* WhatsApp Suporte */}
                <a
                  href="https://wa.me/5551981108170?text=Ol%C3%A1!%20Preciso%20de%20suporte%20no%20CRM%20Studio%20Beauty."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2.5 px-3.5 py-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 text-xs font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <WhatsAppIcon className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="truncate">
                      <p className="font-bold text-foreground truncate">Suporte WhatsApp</p>
                      <p className="text-[10px] text-muted truncate">(51) 98110-8170</p>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-muted/60 group-hover:text-foreground shrink-0" />
                </a>

                {/* Instagram Fidus Connect */}
                <a
                  href="https://www.instagram.com/fidusconnect/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2.5 px-3.5 py-3 rounded-xl bg-pink-500/10 hover:bg-pink-500/20 text-pink-700 dark:text-pink-300 border border-pink-500/25 text-xs font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <InstagramIcon className="w-4 h-4 text-pink-600 dark:text-pink-400 shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="truncate">
                      <p className="font-bold text-foreground truncate">Instagram</p>
                      <p className="text-[10px] text-muted truncate">@fidusconnect</p>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-muted/60 group-hover:text-foreground shrink-0" />
                </a>

                {/* Site Fidus Tecnologia */}
                <a
                  href="https://www.fidustecnologia.com.br"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-2.5 px-3.5 py-3 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/25 text-xs font-semibold transition-all hover:scale-[1.01] active:scale-[0.99] group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Globe size={16} className="text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-110 transition-transform" />
                    <div className="truncate">
                      <p className="font-bold text-foreground truncate">Site Oficial</p>
                      <p className="text-[10px] text-muted truncate">fidustecnologia.com.br</p>
                    </div>
                  </div>
                  <ExternalLink size={14} className="text-muted/60 group-hover:text-foreground shrink-0" />
                </a>
              </div>
            </div>
          </div>

          <button
            onClick={async () => {
              await logout();
              if (typeof window !== 'undefined') {
                window.location.href = '/login';
              }
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-danger/20 text-danger hover:bg-danger/5 active:scale-[0.99] cursor-pointer transition-all duration-200"
          >
            <LogOut size={16} />
            <span className="text-sm font-semibold">Sair da conta</span>
          </button>
        </div>
      )}

      {/* VIEW: PROFISSIONAIS */}
      {view === 'profissionais' && (
        <div className="space-y-4">
          <button
            onClick={handleOpenNewProfModal}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-accent text-white text-sm font-bold shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all active:scale-95"
          >
            <Plus size={18} />
            Novo Profissional
          </button>

          {loadingProfs ? (
            <div className="text-center py-10 text-sm text-muted animate-pulse">
              Carregando equipe...
            </div>
          ) : profissionais.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-2xl p-6 space-y-2">
              <Users size={32} className="text-muted mx-auto" />
              <p className="text-sm font-medium text-foreground">Nenhum profissional cadastrado</p>
              <p className="text-xs text-muted">Clique no botão acima para adicionar o primeiro membro da equipe.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {profissionais.map((prof) => (
                <div
                  key={prof.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-card border border-border"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full bg-gradient-to-br ${prof.cor} flex items-center justify-center shrink-0 shadow-md`}
                    >
                      <span className="text-xs font-bold text-white">
                        {prof.iniciais}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {prof.nome}
                      </p>
                      <p className="text-[10px] font-mono text-muted">ID: {prof.id.slice(0, 8)}...</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-1 rounded-full font-semibold bg-card border border-border text-muted hidden sm:inline-block">
                      {formatDiasTrabalho(prof.dias_trabalho)}
                    </span>

                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                        (prof.comissao_padrao_pct ?? 40) === 0
                          ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                          : 'bg-accent/10 text-accent border border-accent/20'
                      }`}
                    >
                      {(prof.comissao_padrao_pct ?? 40) === 0
                        ? 'Sem repasse (0%)'
                        : `${prof.comissao_padrao_pct ?? 40}% repasse`}
                    </span>

                    <button
                      onClick={() => handleEditProfissional(prof)}
                      className="w-8 h-8 rounded-xl bg-card border border-border text-foreground hover:bg-card-hover flex items-center justify-center active:scale-90 transition-all"
                      title="Editar profissional"
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      onClick={() => deletarProfissional.mutate(prof.id)}
                      className="w-8 h-8 rounded-xl bg-danger/10 text-danger flex items-center justify-center hover:bg-danger/20 active:scale-90 transition-all"
                      title="Excluir profissional"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: SERVIÇOS */}
      {view === 'servicos' && (
        <div className="space-y-4">
          <button
            onClick={handleOpenNewServModal}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-accent text-white text-sm font-bold shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={18} />
            Novo Serviço
          </button>

          {loadingServs ? (
            <div className="text-center py-10 text-sm text-muted animate-pulse">
              Carregando serviços...
            </div>
          ) : servicos.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-2xl p-6 space-y-2">
              <Scissors size={32} className="text-muted mx-auto" />
              <p className="text-sm font-medium text-foreground">Nenhum serviço cadastrado</p>
              <p className="text-xs text-muted">Adicione serviços e corte/barba para exibir na agenda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {servicos.map((serv) => (
                <div
                  key={serv.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-card border border-border"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-accent/10 text-accent">
                        {serv.categoria}
                      </span>
                      <p className="text-sm font-bold text-foreground">
                        {serv.nome}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted">
                      <span className="flex items-center gap-1 font-semibold text-foreground">
                        {formatCurrency(serv.preco)}
                      </span>
                      <span>&middot;</span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {serv.duracao_minutos} min
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditServico(serv)}
                      className="w-8 h-8 rounded-xl bg-card border border-border text-foreground hover:bg-card-hover flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                      title="Editar serviço"
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      onClick={() => deletarServico.mutate(serv.id)}
                      className="w-8 h-8 rounded-xl bg-danger/10 text-danger flex items-center justify-center hover:bg-danger/20 active:scale-90 transition-all cursor-pointer"
                      title="Excluir serviço"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW: PRODUTOS EXTRAS */}
      {view === 'produtos' && (
        <div className="space-y-4">
          {temModuloEstoque && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-500/15 via-accent/10 to-indigo-500/10 border border-purple-500/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <Package size={18} />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Módulo de Estoque Ativo</p>
                  <p className="text-[11px] text-muted">Você pode gerenciar quantidades, entradas e relatórios detalhados no módulo Estoque.</p>
                </div>
              </div>
              <Link
                href="/estoque"
                className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shrink-0 transition-all shadow-md shadow-purple-600/20 flex items-center gap-1"
              >
                Abrir Estoque &rarr;
              </Link>
            </div>
          )}

          <button
            onClick={handleOpenNewProdModal}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-accent text-white text-sm font-bold shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={18} />
            Novo Produto Extra
          </button>

          {loadingProds ? (
            <div className="text-center py-10 text-sm text-muted animate-pulse">
              Carregando produtos...
            </div>
          ) : produtos.length === 0 ? (
            <div className="text-center py-12 bg-card border border-border rounded-2xl p-6 space-y-2">
              <ShoppingBag size={32} className="text-muted mx-auto" />
              <p className="text-sm font-medium text-foreground">Nenhum produto cadastrado</p>
              <p className="text-xs text-muted">Adicione cosméticos e produtos adicionais para venda rápida na comanda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {produtos.map((prod) => (
                <div
                  key={prod.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-card border border-border"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-accent/10 text-accent">
                        {prod.categoria || 'Geral'}
                      </span>
                      <p className="text-sm font-bold text-foreground">
                        {prod.nome}
                      </p>
                      {temModuloEstoque && prod.quantidade !== undefined && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                          prod.quantidade <= 0
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/20'
                            : prod.quantidade <= (prod.estoque_minimo || 2)
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                            : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                        }`}>
                          Estoque: {prod.quantidade} un
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted">
                      <span className="flex items-center gap-1 font-semibold text-foreground">
                        Venda: {formatCurrency(prod.preco)}
                      </span>
                      {temModuloEstoque && prod.custo ? (
                        <>
                          <span>&middot;</span>
                          <span>Custo: {formatCurrency(prod.custo)}</span>
                        </>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditProduto(prod)}
                      className="w-8 h-8 rounded-xl bg-card border border-border text-foreground hover:bg-card-hover flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                      title="Editar produto"
                    >
                      <Pencil size={14} />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Deseja realmente excluir o produto "${prod.nome}"?`)) {
                          deletarProduto.mutate(prod.id);
                        }
                      }}
                      className="w-8 h-8 rounded-xl bg-danger/10 text-danger flex items-center justify-center hover:bg-danger/20 active:scale-90 transition-all cursor-pointer"
                      title="Excluir produto"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: PROFISSIONAL (CRIAR / EDITAR) */}
      {isProfModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-background border border-border rounded-3xl p-5 space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">
                {editingProf ? 'Editar Profissional' : 'Cadastrar Profissional'}
              </h3>
              <button
                onClick={() => setIsProfModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center cursor-pointer"
              >
                <X size={16} className="text-muted" />
              </button>
            </div>

            <form onSubmit={handleSubmitProfissional} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Silva"
                  value={profNome}
                  onChange={(e) => setProfNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-2">
                  Cor de Identificação
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.class}
                      type="button"
                      onClick={() => setProfCor(c.class)}
                      className={`h-9 rounded-xl bg-gradient-to-br ${c.class} flex items-center justify-center transition-all ${
                        profCor === c.class
                          ? 'ring-2 ring-foreground scale-105'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {profCor === c.class && (
                        <Check size={14} className="text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1">
                  % de Repasse / Comissão
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    required
                    placeholder="Ex: 40"
                    value={profComissao}
                    onChange={(e) => setProfComissao(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:border-accent pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm font-semibold">
                    %
                  </span>
                </div>
                <p className="text-[11px] text-muted/70 mt-1">
                  Digite 0 se o profissional for assalariado ou não receber repasse.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-muted">
                    Dias de Atendimento na Semana
                  </label>
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setProfDiasTrabalho([1, 2, 3, 4, 5])}
                      className="text-accent hover:underline cursor-pointer font-medium"
                    >
                      Seg-Sex
                    </button>
                    <span className="text-muted/50">&middot;</span>
                    <button
                      type="button"
                      onClick={() => setProfDiasTrabalho([1, 2, 3, 4, 5, 6])}
                      className="text-accent hover:underline cursor-pointer font-medium"
                    >
                      Seg-Sáb
                    </button>
                    <span className="text-muted/50">&middot;</span>
                    <button
                      type="button"
                      onClick={() => setProfDiasTrabalho([0, 1, 2, 3, 4, 5, 6])}
                      className="text-accent hover:underline cursor-pointer font-medium"
                    >
                      Todos
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {DIAS_SEMANA_LIST.map((d) => {
                    const isSelected = profDiasTrabalho.includes(d.dia);
                    return (
                      <button
                        key={d.dia}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            if (profDiasTrabalho.length === 1) {
                              alert('O profissional deve atender em pelo menos 1 dia.');
                              return;
                            }
                            setProfDiasTrabalho(profDiasTrabalho.filter((item) => item !== d.dia));
                          } else {
                            setProfDiasTrabalho([...profDiasTrabalho, d.dia]);
                          }
                        }}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-accent bg-accent text-white shadow-xs'
                            : 'border-border bg-card text-muted hover:text-foreground'
                        }`}
                        title={d.full}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-[11px] text-muted/70 mt-1">
                  O link público de agendamento bloqueará automaticamente os dias não marcados.
                </p>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsProfModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted hover:bg-card cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={criarProfissional.isPending || atualizarProfissional.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-accent text-xs font-bold text-white hover:bg-accent/90 disabled:opacity-50 cursor-pointer"
                >
                  {editingProf
                    ? (atualizarProfissional.isPending ? 'Atualizando...' : 'Atualizar')
                    : (criarProfissional.isPending ? 'Salvando...' : 'Salvar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: SERVIÇO (CRIAR / EDITAR) */}
      {isServModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-background border border-border rounded-3xl p-5 space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">
                {editingServ ? 'Editar Serviço' : 'Cadastrar Serviço'}
              </h3>
              <button
                onClick={() => {
                  setIsServModalOpen(false);
                  setEditingServ(null);
                }}
                className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center cursor-pointer"
              >
                <X size={16} className="text-muted" />
              </button>
            </div>

            <form onSubmit={handleSubmitServico} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">
                  Nome do Serviço
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Corte Degradê"
                  value={servNome}
                  onChange={(e) => setServNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">
                    Preço (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="45.00"
                    value={servPreco}
                    onChange={(e) => setServPreco(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">
                    Duração (minutos)
                  </label>
                  <input
                    type="number"
                    required
                    step="5"
                    placeholder="30"
                    value={servDuracao}
                    onChange={(e) => setServDuracao(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1">
                  Categoria
                </label>
                <select
                  value={servCategoria}
                  onChange={(e) => setServCategoria(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:border-accent"
                >
                  <option value="Cabelo">Cabelo</option>
                  <option value="Barba">Barba</option>
                  <option value="Combo">Combo</option>
                  <option value="Tratamento">Tratamento</option>
                  <option value="Unhas">Unhas</option>
                  <option value="Estética">Estética</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsServModalOpen(false);
                    setEditingServ(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted hover:bg-card cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={criarServico.isPending || atualizarServico.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-accent text-xs font-bold text-white hover:bg-accent/90 disabled:opacity-50 cursor-pointer"
                >
                  {editingServ
                    ? (atualizarServico.isPending ? 'Atualizando...' : 'Atualizar')
                    : (criarServico.isPending ? 'Salvando...' : 'Salvar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PRODUTO EXTRA (CRIAR / EDITAR) */}
      {isProdModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-background border border-border rounded-3xl p-5 space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">
                {editingProd ? 'Editar Produto Extra' : 'Cadastrar Produto Extra'}
              </h3>
              <button
                onClick={() => {
                  setIsProdModalOpen(false);
                  setEditingProd(null);
                }}
                className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center cursor-pointer"
              >
                <X size={16} className="text-muted" />
              </button>
            </div>

            <form onSubmit={handleSubmitProduto} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">
                  Nome do Produto
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Shampoo Nutritivo 300ml"
                  value={prodNome}
                  onChange={(e) => setProdNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1">
                  Preço de Venda (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="45.00"
                  value={prodPreco}
                  onChange={(e) => setProdPreco(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1">
                  Categoria
                </label>
                <select
                  value={prodCategoria}
                  onChange={(e) => setProdCategoria(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground focus:outline-none focus:border-accent"
                >
                  <option value="Cabelo">Cabelo</option>
                  <option value="Barba">Barba</option>
                  <option value="Tratamento">Tratamento</option>
                  <option value="Unhas">Unhas</option>
                  <option value="Estética">Estética</option>
                  <option value="Bebidas">Bebidas</option>
                  <option value="Outros">Outros / Geral</option>
                </select>
              </div>

              {temModuloEstoque && (
                <div className="p-3 rounded-2xl bg-card/60 border border-border space-y-3">
                  <div className="flex items-center gap-1.5 text-accent font-bold text-xs">
                    <Package size={14} />
                    <span>Controle de Estoque (Plano PRO)</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-muted mb-1">
                        Qtd em Estoque
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="10"
                        value={prodQuantidade}
                        onChange={(e) => setProdQuantidade(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:border-accent"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-muted mb-1">
                        Estoque Mínimo
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="2"
                        value={prodEstoqueMinimo}
                        onChange={(e) => setProdEstoqueMinimo(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-muted mb-1">
                      Preço de Custo (R$) - Opcional
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="20.00"
                      value={prodCusto}
                      onChange={(e) => setProdCusto(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:border-accent"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsProdModalOpen(false);
                    setEditingProd(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted hover:bg-card cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={criarProduto.isPending || atualizarProduto.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-accent text-xs font-bold text-white hover:bg-accent/90 disabled:opacity-50 cursor-pointer"
                >
                  {editingProd
                    ? (atualizarProduto.isPending ? 'Atualizando...' : 'Atualizar')
                    : (criarProduto.isPending ? 'Salvando...' : 'Salvar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR PERFIL DO SALÃO */}
      {isSalaoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 space-y-5 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">
                    Perfil do Salão
                  </h3>
                  <p className="text-xs text-muted">
                    Personalize sua marca e links públicos
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsSalaoModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center text-muted hover:text-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveSalao} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">
                  Nome do Salão / Estabelecimento <span className="text-accent">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Studio Bella Donna"
                  value={salaoNomeInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSalaoNomeInput(val);
                    // Se o slug ainda for padrão ou vazio, gera sugestão amigável
                    if (!salaoSlugInput || salaoSlugInput === 'studio-beauty') {
                      const autoSlug = val
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^a-z0-9]/g, '-')
                        .replace(/-+/g, '-');
                      setSalaoSlugInput(autoSlug);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">
                  Link Personalizado de Agendamento (Slug)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted font-mono select-none">
                    /agendar/
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="nome-do-salao"
                    value={salaoSlugInput}
                    onChange={(e) => {
                      const slugFormatted = e.target.value
                        .toLowerCase()
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '')
                        .replace(/[^a-z0-9-]/g, '');
                      setSalaoSlugInput(slugFormatted);
                    }}
                    className="w-full pl-20 pr-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground font-mono focus:outline-none focus:border-accent"
                  />
                </div>
                <p className="text-[10px] text-muted mt-1">
                  Seus clientes acessarão: <strong className="text-accent">{typeof window !== 'undefined' ? window.location.origin : ''}/agendar/{salaoSlugInput || 'seu-link'}</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1.5">
                  WhatsApp do Salão (Para Alertas e Contato)
                </label>
                <input
                  type="text"
                  placeholder="Ex: 51981108170 ou (51) 98110-8170"
                  value={salaoPhoneInput}
                  onChange={(e) => setSalaoPhoneInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-accent"
                />
                <p className="text-[10px] text-muted mt-1">
                  Neste número você receberá os alertas automáticos de novos agendamentos feitos pelos clientes.
                </p>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsSalaoModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted hover:bg-card cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingSalao}
                  className="flex-1 py-2.5 rounded-xl bg-accent text-xs font-bold text-white hover:bg-accent/90 disabled:opacity-50 cursor-pointer shadow-md shadow-accent/20"
                >
                  {isSavingSalao ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASSINATURA & PLANO ASAAS */}
      <AssinaturaModal
        isOpen={isAssinaturaModalOpen}
        onClose={() => setIsAssinaturaModalOpen(false)}
      />
    </div>
  );
}

function WhatsAppIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.95.539 1.782.808 2.795.808 3.184 0 5.77-2.586 5.77-5.767.001-3.18-2.585-5.766-5.769-5.766zm3.374 8.163c-.144.405-.837.774-1.17.825-.312.048-.687.087-2.213-.544-1.631-.676-2.753-2.316-2.836-2.428-.083-.111-.664-.883-.664-1.684 0-.802.417-1.196.565-1.358.149-.163.325-.204.434-.204.108 0 .217.001.312.006.1.006.234-.038.366.279.136.326.467 1.137.508 1.22.041.083.069.181.014.29-.055.109-.083.177-.164.272-.082.095-.172.212-.246.284-.082.08-.168.167-.072.332.096.165.428.706.918 1.142.631.562 1.163.736 1.328.818.166.082.263.072.361-.041.099-.114.423-.493.536-.662.113-.169.227-.141.381-.084.154.057.978.461 1.146.545.168.084.281.125.322.195.041.07.041.407-.103.812zM12 2C6.477 2 2 6.477 2 12c0 1.891.526 3.662 1.442 5.177L2 22l4.981-1.306C8.423 21.547 10.154 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z" />
    </svg>
  );
}

function InstagramIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}
