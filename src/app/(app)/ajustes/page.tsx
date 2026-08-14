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
} from 'lucide-react';
import { useProfissionais } from '@/hooks/useProfissionais';
import { useServicos } from '@/hooks/useServicos';
import { formatCurrency } from '@/data/mock';
import { useAuth } from '@/contexts/AuthContext';
import AssinaturaModal from '@/components/ajustes/assinatura-modal';
import type { Profissional } from '@/types';

type ViewMode = 'menu' | 'profissionais' | 'servicos';

const COLOR_OPTIONS = [
  { label: 'Roxo / Indigo', class: 'from-purple-500 to-indigo-500' },
  { label: 'Rosa / Violeta', class: 'from-pink-500 to-rose-500' },
  { label: 'Azul / Ciano', class: 'from-blue-500 to-cyan-500' },
  { label: 'Verde / Esmeralda', class: 'from-emerald-500 to-teal-500' },
  { label: 'Laranja / Âmbar', class: 'from-orange-500 to-amber-500' },
];

export default function AjustesPage() {
  const { salao, salaoId, logout, user } = useAuth();
  const salaoSlug = salao?.slug || 'studio-beauty';
  const publicBookingUrl = typeof window !== 'undefined' ? `${window.location.origin}/agendar/${salaoSlug}` : `http://localhost:3000/agendar/${salaoSlug}`;

  const [view, setView] = useState<ViewMode>('menu');
  const [copiedLink, setCopiedLink] = useState(false);

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
    deletarServico,
  } = useServicos(salaoId);

  // Modals state
  const [isProfModalOpen, setIsProfModalOpen] = useState(false);
  const [editingProf, setEditingProf] = useState<Profissional | null>(null);
  const [profNome, setProfNome] = useState('');
  const [profCor, setProfCor] = useState(COLOR_OPTIONS[0].class);
  const [profComissao, setProfComissao] = useState('40');

  const [isAssinaturaModalOpen, setIsAssinaturaModalOpen] = useState(false);

  const [isServModalOpen, setIsServModalOpen] = useState(false);
  const [servNome, setServNome] = useState('');
  const [servPreco, setServPreco] = useState('');
  const [servDuracao, setServDuracao] = useState('30');
  const [servCategoria, setServCategoria] = useState('Cabelo');

  // Handlers for Profissional Modal
  function handleOpenNewProfModal() {
    setEditingProf(null);
    setProfNome('');
    setProfCor(COLOR_OPTIONS[0].class);
    setProfComissao('40');
    setIsProfModalOpen(true);
  }

  function handleEditProfissional(prof: Profissional) {
    setEditingProf(prof);
    setProfNome(prof.nome);
    setProfCor(prof.cor || COLOR_OPTIONS[0].class);
    setProfComissao(String(prof.comissao_padrao_pct ?? 40));
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
          },
        },
        {
          onSuccess: () => {
            setEditingProf(null);
            setProfNome('');
            setProfComissao('40');
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
        },
        {
          onSuccess: () => {
            setProfNome('');
            setProfComissao('40');
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

  function handleAddServico(e: React.FormEvent) {
    e.preventDefault();
    if (!servNome.trim() || !servPreco) return;

    const priceFloat = parseFloat(servPreco.replace(',', '.'));
    if (isNaN(priceFloat)) {
      alert('Informe um valor de preço válido.');
      return;
    }
    const precoCentavos = Math.round(priceFloat * 100);

    criarServico.mutate(
      {
        nome: servNome,
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
          </h2>
          <p className="text-xs text-muted">
            {view === 'menu' && 'Gerencie as configurações do salão'}
            {view === 'profissionais' && 'Cadastre e gerencie a equipe'}
            {view === 'servicos' && 'Defina os preços e horários dos serviços'}
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
                      R$ 97,00/mês &middot; Status: <strong className="text-emerald-500">{salao?.status_assinatura === 'inadimplente' ? 'Pendente' : 'Ativo'}</strong>
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
            onClick={() => setIsServModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-accent text-white text-sm font-bold shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all active:scale-95"
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

                  <button
                    onClick={() => deletarServico.mutate(serv.id)}
                    className="w-8 h-8 rounded-xl bg-danger/10 text-danger flex items-center justify-center hover:bg-danger/20 active:scale-90 transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
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
                className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center"
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

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsProfModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted hover:bg-card"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={criarProfissional.isPending || atualizarProfissional.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-accent text-xs font-bold text-white hover:bg-accent/90 disabled:opacity-50"
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

      {/* MODAL: NOVO SERVIÇO */}
      {isServModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-background border border-border rounded-3xl p-5 space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">
                Cadastrar Serviço
              </h3>
              <button
                onClick={() => setIsServModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center"
              >
                <X size={16} className="text-muted" />
              </button>
            </div>

            <form onSubmit={handleAddServico} className="space-y-3">
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
                  <option value="Outros">Outros</option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsServModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted hover:bg-card"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={criarServico.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-accent text-xs font-bold text-white hover:bg-accent/90 disabled:opacity-50"
                >
                  {criarServico.isPending ? 'Salvando...' : 'Salvar'}
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
