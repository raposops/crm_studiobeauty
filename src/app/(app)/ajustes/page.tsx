'use client';

import { useState } from 'react';
import {
  Users,
  Scissors,
  Plus,
  Trash2,
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
} from 'lucide-react';
import { useProfissionais } from '@/hooks/useProfissionais';
import { useServicos } from '@/hooks/useServicos';
import { formatCurrency } from '@/data/mock';

type ViewMode = 'menu' | 'profissionais' | 'servicos';

const COLOR_OPTIONS = [
  { label: 'Roxo / Indigo', class: 'from-purple-500 to-indigo-500' },
  { label: 'Rosa / Violeta', class: 'from-pink-500 to-rose-500' },
  { label: 'Azul / Ciano', class: 'from-blue-500 to-cyan-500' },
  { label: 'Verde / Esmeralda', class: 'from-emerald-500 to-teal-500' },
  { label: 'Laranja / Âmbar', class: 'from-orange-500 to-amber-500' },
];

export default function AjustesPage() {
  const salaoId = 'default_salao';
  const [view, setView] = useState<ViewMode>('menu');

  // Hooks
  const {
    profissionais,
    isLoading: loadingProfs,
    criarProfissional,
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
  const [profNome, setProfNome] = useState('');
  const [profCor, setProfCor] = useState(COLOR_OPTIONS[0].class);

  const [isServModalOpen, setIsServModalOpen] = useState(false);
  const [servNome, setServNome] = useState('');
  const [servPreco, setServPreco] = useState('');
  const [servDuracao, setServDuracao] = useState('30');
  const [servCategoria, setServCategoria] = useState('Cabelo');

  // Handlers
  async function handleAddProfissional(e: React.FormEvent) {
    e.preventDefault();
    if (!profNome.trim()) return;

    await criarProfissional.mutateAsync({
      nome: profNome,
      cor: profCor,
    });

    setProfNome('');
    setIsProfModalOpen(false);
  }

  async function handleAddServico(e: React.FormEvent) {
    e.preventDefault();
    if (!servNome.trim() || !servPreco) return;

    // Convert price (R$) to centavos
    const priceFloat = parseFloat(servPreco.replace(',', '.'));
    const precoCentavos = Math.round(priceFloat * 100);

    await criarServico.mutateAsync({
      nome: servNome,
      preco: precoCentavos,
      duracao_minutos: parseInt(servDuracao) || 30,
      categoria: servCategoria,
    });

    setServNome('');
    setServPreco('');
    setServDuracao('30');
    setIsServModalOpen(false);
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

          <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-danger/20 text-danger hover:bg-danger/5 transition-all duration-200">
            <LogOut size={16} />
            <span className="text-sm font-semibold">Sair da conta</span>
          </button>
        </div>
      )}

      {/* VIEW: PROFISSIONAIS */}
      {view === 'profissionais' && (
        <div className="space-y-4">
          <button
            onClick={() => setIsProfModalOpen(true)}
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

                  <button
                    onClick={() => deletarProfissional.mutate(prof.id)}
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

      {/* MODAL: NOVO PROFISSIONAL */}
      {isProfModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-background border border-border rounded-3xl p-5 space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-foreground">
                Cadastrar Profissional
              </h3>
              <button
                onClick={() => setIsProfModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-card border border-border flex items-center justify-center"
              >
                <X size={16} className="text-muted" />
              </button>
            </div>

            <form onSubmit={handleAddProfissional} className="space-y-4">
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
                  disabled={criarProfissional.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-accent text-xs font-bold text-white hover:bg-accent/90 disabled:opacity-50"
                >
                  {criarProfissional.isPending ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NOVO SERVIÇO */}
      {isServModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
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
    </div>
  );
}
