'use client';

import { useState, useMemo } from 'react';
import {
  Users,
  Search,
  UserPlus,
  Phone,
  MessageCircle,
  Calendar,
  FileText,
  Trash2,
  X,
  Check,
  ChevronRight,
  User,
  Pencil,
  Sparkles,
} from 'lucide-react';
import { useClientes } from '@/hooks/useClientes';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/data/mock';
import type { Cliente } from '@/types';

export default function ClientesPage() {
  const { salaoId } = useAuth();
  const { clientes, isLoading, criarCliente, atualizarCliente, deletarCliente } = useClientes(salaoId);

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [clienteParaDeletar, setClienteParaDeletar] = useState<string | null>(null);

  // Form State
  const [nome, setNome] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [observacoes, setObservacoes] = useState('');
  const [saldoCredito, setSaldoCredito] = useState('0.00');
  const [formError, setFormError] = useState('');

  // Filtered Clientes
  const filteredClientes = useMemo(() => {
    return clientes.filter((c) => {
      const search = searchTerm.toLowerCase();
      const matchName = c.nome.toLowerCase().includes(search);
      const matchPhone = (c.telefone_whatsapp || c.whatsapp || '').includes(search);
      return matchName || matchPhone;
    });
  }, [clientes, searchTerm]);

  const handleOpenNovoCliente = () => {
    setEditingCliente(null);
    setNome('');
    setWhatsapp('');
    setDataNascimento('');
    setObservacoes('');
    setSaldoCredito('0.00');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditarCliente = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setNome(cliente.nome || '');
    setWhatsapp(cliente.telefone_whatsapp || cliente.whatsapp || '');
    setDataNascimento(cliente.data_nascimento || '');
    setObservacoes(cliente.observacoes || '');
    setSaldoCredito(((cliente.saldo_credito || 0) / 100).toFixed(2));
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setFormError('Informe o nome do cliente');
      return;
    }
    if (!whatsapp.trim()) {
      setFormError('Informe o telefone / WhatsApp');
      return;
    }

    setFormError('');
    const saldoCentavos = Math.max(0, Math.round((parseFloat(saldoCredito.replace(',', '.')) || 0) * 100));

    try {
      if (editingCliente) {
        await atualizarCliente.mutateAsync({
          id: editingCliente.id,
          payload: {
            nome: nome.trim(),
            telefone_whatsapp: whatsapp.trim(),
            data_nascimento: dataNascimento || undefined,
            observacoes: observacoes || undefined,
            saldo_credito: saldoCentavos,
          },
        });
      } else {
        await criarCliente.mutateAsync({
          nome: nome.trim(),
          telefone_whatsapp: whatsapp.trim(),
          data_nascimento: dataNascimento || undefined,
          observacoes: observacoes || undefined,
          saldo_credito: saldoCentavos,
        });
      }

      // Reset & close
      setNome('');
      setWhatsapp('');
      setDataNascimento('');
      setObservacoes('');
      setSaldoCredito('0.00');
      setEditingCliente(null);
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Erro ao salvar cliente no Supabase');
    }
  };

  const handleDeletar = async (id: string) => {
    try {
      await deletarCliente.mutateAsync(id);
      setClienteParaDeletar(null);
    } catch (err: any) {
      alert(`Erro ao excluir cliente: ${err?.message || 'Erro desconhecido'}`);
    }
  };

  // Helper function to format whatsapp number for wa.me link
  const getWhatsAppLink = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (!cleaned) return '#';
    // Add country code 55 if missing (assuming Brazil)
    const withDDI = cleaned.length <= 11 ? `55${cleaned}` : cleaned;
    return `https://wa.me/${withDDI}`;
  };

  // Helper for initials
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="animate-fade-in-up space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground tracking-tight">Clientes</h2>
          <p className="text-sm text-muted">
            {clientes.length} {clientes.length === 1 ? 'cliente cadastrado' : 'clientes cadastrados'}
          </p>
        </div>
        <button
          onClick={handleOpenNovoCliente}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent to-accent-light text-white text-sm font-semibold shadow-md shadow-accent/20 hover:shadow-accent/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
        >
          <UserPlus size={18} />
          Novo Cliente
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar por nome ou WhatsApp..."
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all shadow-xs"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground text-xs cursor-pointer"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 rounded-full border-2 border-accent border-t-transparent animate-spin" />
        </div>
      ) : filteredClientes.length > 0 ? (
        /* Clientes List Cards Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredClientes.map((cliente) => {
            const phone = cliente.telefone_whatsapp || cliente.whatsapp || '';
            const waLink = getWhatsAppLink(phone);

            return (
              <div
                key={cliente.id}
                className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-3 min-w-0"
              >
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-accent/20 to-accent/40 border border-accent/30 flex items-center justify-center text-accent font-bold text-sm shrink-0 shadow-xs">
                      {getInitials(cliente.nome)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-bold text-foreground text-sm sm:text-base truncate leading-tight" title={cliente.nome}>
                        {cliente.nome}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-muted mt-1">
                        <Phone size={12} className="shrink-0" />
                        <span className="truncate block font-mono">{phone || 'Sem telefone'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Header Actions: Edit & Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEditarCliente(cliente)}
                      className="p-1.5 rounded-lg text-muted hover:text-accent hover:bg-accent/10 transition-colors cursor-pointer"
                      title="Editar cliente"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => setClienteParaDeletar(cliente.id)}
                      className="p-1.5 rounded-lg text-muted hover:text-red-600 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="Excluir cliente"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Additional Info & Crédito */}
                <div className="space-y-2 pt-2 border-t border-border/40 text-xs">
                  {cliente.saldo_credito !== undefined && cliente.saldo_credito > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-bold w-fit">
                      <Sparkles size={13} className="text-emerald-500" />
                      <span>Crédito: {formatCurrency(cliente.saldo_credito)}</span>
                    </div>
                  )}

                  {(cliente.data_nascimento || cliente.observacoes) && (
                    <div className="space-y-1 text-muted">
                      {cliente.data_nascimento && (
                        <div className="flex items-center gap-1.5">
                          <Calendar size={12} className="shrink-0" />
                          <span>Nascimento: {cliente.data_nascimento}</span>
                        </div>
                      )}
                      {cliente.observacoes && (
                        <div className="flex items-start gap-1.5">
                          <FileText size={12} className="shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{cliente.observacoes}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="pt-2 border-t border-border/40 flex items-center justify-between gap-2">
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20 text-xs font-bold transition-all border border-emerald-500/20 cursor-pointer"
                  >
                    <MessageCircle size={14} />
                    WhatsApp
                  </a>

                  <button
                    onClick={() => handleOpenEditarCliente(cliente)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-muted hover:text-foreground hover:bg-card-hover text-xs font-semibold transition-all cursor-pointer"
                  >
                    <Pencil size={13} />
                    Editar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 space-y-4 bg-card border border-border/60 rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
            <Users size={32} />
          </div>
          <div className="text-center space-y-1 px-4">
            <p className="text-base font-bold text-foreground">
              {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
            </p>
            <p className="text-xs text-muted max-w-xs mx-auto">
              {searchTerm
                ? 'Tente buscar por outro nome ou número de telefone.'
                : 'Cadastre seus clientes para acompanhar histórico de atendimentos e contato.'}
            </p>
          </div>
          {!searchTerm && (
            <button
              onClick={handleOpenNovoCliente}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-accent text-white text-xs font-semibold shadow-md hover:bg-accent/90 transition-all cursor-pointer"
            >
              <UserPlus size={16} />
              Cadastrar Primeiro Cliente
            </button>
          )}
        </div>
      )}

      {/* Modal Cadastro / Edição de Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-5 animate-scale-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                  {editingCliente ? <Pencil size={18} /> : <UserPlus size={20} />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {editingCliente ? 'Editar Cliente' : 'Novo Cliente'}
                  </h3>
                  <p className="text-[11px] text-muted">
                    {editingCliente
                      ? 'Atualize os dados e informações do cliente'
                      : 'Cadastre um novo cliente no seu salão'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingCliente(null);
                }}
                className="p-1 rounded-lg text-muted hover:text-foreground hover:bg-card-hover transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-semibold">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Maria Oliveira"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                  Telefone / WhatsApp *
                </label>
                <input
                  type="text"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="Ex: (51) 99999-8888"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                    Nascimento
                  </label>
                  <input
                    type="date"
                    value={dataNascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Crédito (R$)</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={saldoCredito}
                    onChange={(e) => setSaldoCredito(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-muted uppercase tracking-wider mb-1">
                  Observações (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Preferências, alergias ou notas de atendimento..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingCliente(null);
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-muted hover:text-foreground hover:bg-card-hover transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={criarCliente.isPending || atualizarCliente.isPending}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-accent text-white text-sm font-bold shadow-md shadow-accent/20 hover:bg-accent-light transition-all disabled:opacity-50 cursor-pointer"
                >
                  {criarCliente.isPending || atualizarCliente.isPending ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <Check size={16} />
                  )}
                  {editingCliente ? 'Salvar Alterações' : 'Salvar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog to Delete Client */}
      {clienteParaDeletar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground">Excluir Cliente</h3>
            <p className="text-xs text-muted leading-relaxed">
              Tem certeza que deseja excluir este cliente do sistema? Esta ação não pode ser desfeita.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setClienteParaDeletar(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-muted hover:text-foreground hover:bg-card-hover transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeletar(clienteParaDeletar)}
                disabled={deletarCliente.isPending}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold shadow-md hover:bg-red-700 transition-all disabled:opacity-50 cursor-pointer"
              >
                {deletarCliente.isPending ? 'Excluindo...' : 'Sim, Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

