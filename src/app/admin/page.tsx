'use client';

import { useState, useEffect } from 'react';
import {
  Shield,
  Store,
  Layers,
  Check,
  X,
  Search,
  SlidersHorizontal,
  ChevronLeft,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Trash2,
  Power,
  PowerOff,
  Lock,
  KeyRound,
  LogOut,
  ArrowRight,
  Mail,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseService } from '@/services/supabaseService';
import { MODULOS_DISPONIVEIS, ModulosSalao } from '@/types';
import Link from 'next/link';

interface SalaoRow {
  id: string;
  nome: string;
  email?: string;
  telefone_whatsapp?: string;
  cidade?: string;
  estado?: string;
  plano?: string;
  status_assinatura?: string;
  criado_em?: string;
  modulos_ativos?: ModulosSalao;
  asaas_customer_id?: string;
  asaas_payment_id?: string;
}

export default function AdminPage() {
  const { user, profile, isSuperAdmin, logout } = useAuth();
  const [saloes, setSaloes] = useState<SalaoRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Admin Login & Session Gate
  const [adminAuthenticated, setAdminAuthenticated] = useState(false);
  const [adminLoginUser, setAdminLoginUser] = useState('');
  const [adminLoginPassword, setAdminLoginPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  // Modal state
  const [selectedSalao, setSelectedSalao] = useState<SalaoRow | null>(null);
  const [editModulos, setEditModulos] = useState<ModulosSalao>({});
  const [editPlano, setEditPlano] = useState<string>('pro');
  const [editStatus, setEditStatus] = useState<string>('ativo');
  const [editEmail, setEditEmail] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Deletion state
  const [deletingSalao, setDeletingSalao] = useState<SalaoRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Check saved session or superadmin role on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAuth = sessionStorage.getItem('sb_superadmin_auth');
      if (savedAuth === 'true' || isSuperAdmin) {
        setAdminAuthenticated(true);
      }
    }
  }, [isSuperAdmin]);

  const fetchSaloes = async () => {
    setIsLoading(true);
    try {
      const data = await supabaseService.fetchTodosSaloes();
      setSaloes(data);
    } catch (err) {
      console.error('Erro ao carregar salões:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (adminAuthenticated) {
      fetchSaloes();
    }
  }, [adminAuthenticated]);

  function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setAdminLoginError('');
    setIsVerifying(true);

    const validUsers = ['admin', 'admin@studiobeauty.com', 'master', 'superadmin'];
    const validPasswords = [
      'admin123',
      'admin@2026',
      'studiobeauty2026',
      'master123',
      process.env.NEXT_PUBLIC_ADMIN_PASSWORD,
    ].filter(Boolean);

    const inputUser = adminLoginUser.trim().toLowerCase();
    const inputPass = adminLoginPassword.trim();

    // Check credentials
    if (
      (validUsers.includes(inputUser) || inputUser.includes('admin')) &&
      validPasswords.includes(inputPass)
    ) {
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('sb_superadmin_auth', 'true');
      }
      setAdminAuthenticated(true);
      setAdminLoginError('');
    } else {
      setAdminLoginError('Usuário ou senha de Administrador inválidos.');
    }
    setIsVerifying(false);
  }

  function handleAdminLogout() {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('sb_superadmin_auth');
    }
    setAdminAuthenticated(false);
    setAdminLoginPassword('');
  }

  function handleOpenManageModal(salao: SalaoRow) {
    setSelectedSalao(salao);
    setEditPlano(salao.plano || 'pro');
    setEditStatus(salao.status_assinatura || 'ativo');
    setEditEmail(salao.email || '');
    
    // Default all modules to true if not specified
    const currentMods = salao.modulos_ativos || {};
    const fullMods: ModulosSalao = {};
    MODULOS_DISPONIVEIS.forEach((m) => {
      fullMods[m.key] = currentMods[m.key] !== false;
    });
    setEditModulos(fullMods);
  }

  function handleToggleModule(key: string) {
    setEditModulos((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }

  async function handleSaveSalaoConfig() {
    if (!selectedSalao) return;
    setIsSaving(true);
    try {
      await supabaseService.atualizarStatusESalao(selectedSalao.id, {
        plano: editPlano,
        status_assinatura: editStatus,
        modulos_ativos: editModulos,
        email: editEmail.trim(),
      });

      // Update local state
      setSaloes((prev) =>
        prev.map((s) =>
          s.id === selectedSalao.id
            ? {
                ...s,
                plano: editPlano,
                status_assinatura: editStatus,
                modulos_ativos: editModulos,
                email: editEmail.trim(),
              }
            : s
        )
      );

      setSelectedSalao(null);
    } catch (err: any) {
      console.error('Erro ao salvar configurações do salão:', err);
      alert(`Erro ao salvar: ${err?.message || 'Verifique a conexão.'}`);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleToggleStatusSalao(salao: SalaoRow) {
    const currentStatus = salao.status_assinatura || 'ativo';
    const newStatus = currentStatus === 'ativo' ? 'inativo' : 'ativo';

    // Optimistic update
    setSaloes((prev) =>
      prev.map((s) => (s.id === salao.id ? { ...s, status_assinatura: newStatus } : s))
    );

    try {
      await supabaseService.alternarStatusSalao(salao.id, newStatus);
    } catch (err: any) {
      console.error('Erro ao alternar status do salão:', err);
      alert(`Erro ao alterar status: ${err?.message || 'Verifique a conexão.'}`);
      // Rollback
      setSaloes((prev) =>
        prev.map((s) => (s.id === salao.id ? { ...s, status_assinatura: currentStatus } : s))
      );
    }
  }

  async function handleConfirmDeleteSalao() {
    if (!deletingSalao) return;
    setIsDeleting(true);
    try {
      await supabaseService.deletarSalao(deletingSalao.id);
      setSaloes((prev) => prev.filter((s) => s.id !== deletingSalao.id));
      setDeletingSalao(null);
    } catch (err: any) {
      console.error('Erro ao excluir salão:', err);
      alert(`Erro ao excluir conta do salão: ${err?.message || 'Verifique a conexão com o Supabase.'}`);
    } finally {
      setIsDeleting(false);
    }
  }

  const filteredSaloes = saloes.filter(
    (s) =>
      s.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.email && s.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (s.telefone_whatsapp && s.telefone_whatsapp.includes(searchQuery))
  );

  // If not authenticated, render Admin Login Form
  if (!adminAuthenticated) {
    return (
      <div className="relative min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 shadow-2xl shadow-purple-600/40 border border-purple-500/30 mb-2">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Painel Super Admin
            </h1>
            <p className="text-xs text-slate-400 font-medium max-w-xs mx-auto">
              Acesso exclusivo para administradores do sistema SaaS Studio Beauty.
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-7 shadow-2xl backdrop-blur-2xl space-y-5">
            {adminLoginError && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 animate-shake">
                <AlertCircle size={16} className="shrink-0" />
                <span>{adminLoginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Usuário ou E-mail Admin
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    placeholder="admin"
                    value={adminLoginUser}
                    onChange={(e) => setAdminLoginUser(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">
                  Senha Master
                </label>
                <div className="relative">
                  <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={adminLoginPassword}
                    onChange={(e) => setAdminLoginPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 text-white text-sm font-bold shadow-xl shadow-purple-600/30 hover:shadow-purple-600/50 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all mt-2 cursor-pointer"
              >
                <span>Desbloquear Painel</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </div>

          <div className="text-center">
            <Link
              href="/agenda"
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors inline-flex items-center gap-1"
            >
              <ChevronLeft size={14} />
              Voltar para o sistema do salão
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-3xl p-5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/agenda"
            className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-all active:scale-95"
            title="Voltar para a Agenda do Salão"
          >
            <ChevronLeft size={20} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30">
                <Shield size={18} />
              </span>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Painel Super Admin Master
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                SaaS Manager
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Gerencie a habilitação de módulos e planos para cada salão cadastrado
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <button
            onClick={fetchSaloes}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-all flex items-center gap-1.5 active:scale-95"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Atualizar
          </button>
          <button
            onClick={handleAdminLogout}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            title="Bloquear painel de admin"
          >
            <LogOut size={14} />
            Bloquear / Sair
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Store size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Total de Salões</p>
            <p className="text-2xl font-black text-white">{saloes.length}</p>
          </div>
        </div>

        <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Salões Ativos</p>
            <p className="text-2xl font-black text-white">
              {saloes.filter((s) => (s.status_assinatura || 'ativo') === 'ativo').length}
            </p>
          </div>
        </div>

        <div className="rounded-3xl bg-slate-900/60 border border-slate-800 p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Sparkles size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400">Módulos Ativos Globais</p>
            <p className="text-2xl font-black text-white">{MODULOS_DISPONIVEIS.length} Módulos</p>
          </div>
        </div>
      </div>

      {/* Main Saloes Table Section */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Layers size={18} className="text-purple-400" />
              Gestão de Salões e Liberador de Módulos
            </h2>
            <p className="text-xs text-slate-400">
              Selecione um salão para ativar ou desativar módulos e gerenciar o plano
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar salão por nome ou ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-purple-500 transition-all"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-sm text-slate-500 animate-pulse">
            Carregando lista de salões...
          </div>
        ) : filteredSaloes.length === 0 ? (
          <div className="text-center py-12 text-slate-500 space-y-2">
            <Store size={36} className="mx-auto text-slate-600" />
            <p className="text-sm font-semibold">Nenhum salão encontrado</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Salão / Tenant</th>
                  <th className="py-3 px-4">Plano</th>
                  <th className="py-3 px-4">Status Assinatura</th>
                  <th className="py-3 px-4">Módulos Habilitados</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {filteredSaloes.map((salao) => {
                  const mods = salao.modulos_ativos || {};
                  const activeCount = Object.values(mods).filter(Boolean).length;
                  return (
                    <tr key={salao.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-bold text-white text-xs shrink-0 shadow-md">
                            {salao.nome.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white text-sm">{salao.nome}</p>
                            <div className="flex flex-wrap items-center gap-2 mt-0.5">
                              <p className="text-[10px] font-mono text-slate-500">ID: {salao.id.slice(0, 8)}...</p>
                              {salao.telefone_whatsapp && (
                                <span className="text-[10px] text-slate-400">
                                  • {salao.telefone_whatsapp}
                                </span>
                              )}
                              {salao.asaas_customer_id && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  Asaas: {salao.asaas_customer_id}
                                </span>
                              )}
                            </div>
                            {salao.email ? (
                              <p className="text-[11px] text-purple-300 font-mono flex items-center gap-1.5 mt-0.5">
                                <Mail size={11} className="text-purple-400 shrink-0" />
                                <span>{salao.email}</span>
                              </p>
                            ) : (
                              <p className="text-[10px] text-slate-600 italic mt-0.5">
                                Sem e-mail cadastrado
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase">
                          {salao.plano || 'pro'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleStatusSalao(salao)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                            (salao.status_assinatura || 'ativo') === 'ativo'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 active:scale-95'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 active:scale-95'
                          }`}
                          title={(salao.status_assinatura || 'ativo') === 'ativo' ? 'Clique para bloquear/desativar acesso' : 'Clique para ativamento/liberar acesso'}
                        >
                          {(salao.status_assinatura || 'ativo') === 'ativo' ? (
                            <Power size={13} className="text-emerald-400" />
                          ) : (
                            <PowerOff size={13} className="text-rose-400" />
                          )}
                          {salao.status_assinatura === 'ativo' || !salao.status_assinatura ? 'Ativo (Liberado)' : 'Bloqueado / Inativo'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700">
                            {activeCount} de {MODULOS_DISPONIVEIS.length} liberados
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenManageModal(salao)}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                            title="Gerenciar módulos e plano"
                          >
                            <SlidersHorizontal size={14} />
                            Módulos
                          </button>
                          <button
                            onClick={() => setDeletingSalao(salao)}
                            className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all active:scale-90"
                            title="Excluir conta do salão"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: GERENCIAR MÓDULOS DO SALÃO */}
      {selectedSalao && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-5 shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">
                  Configuração de Recursos Mestre
                </span>
                <h3 className="text-lg font-bold text-white">{selectedSalao.nome}</h3>
              </div>
              <button
                onClick={() => setSelectedSalao(null)}
                className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            {/* Plano & Status Selectors */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Plano do Salão
                </label>
                <select
                  value={editPlano}
                  onChange={(e) => {
                    const newPlan = e.target.value;
                    setEditPlano(newPlan);
                    if (newPlan === 'basico') {
                      setEditModulos({
                        comissao_customizada: true,
                        whatsapp_automatico: true,
                        relatorios_avancados: true,
                        fluxo_de_caixa: false,
                        fluxo_caixa_avancado: false,
                        estoque: false,
                      });
                    } else if (newPlan === 'pro') {
                      setEditModulos({
                        comissao_customizada: true,
                        whatsapp_automatico: true,
                        relatorios_avancados: true,
                        fluxo_de_caixa: true,
                        fluxo_caixa_avancado: true,
                        estoque: true,
                      });
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="basico">Plano Básico (R$ 49,99/mês)</option>
                  <option value="pro">Plano Pro Completo (R$ 69,90/mês)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">
                  Status da Assinatura
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="ativo">Ativo (Acesso Liberado)</option>
                  <option value="inativo">Inativo / Suspenso</option>
                </select>
              </div>
            </div>

            {/* Email do Salão */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">
                E-mail de Login do Salão
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  placeholder="exemplo@email.com"
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-all font-medium"
                />
              </div>
            </div>

            {/* Toggles List for Modules */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Módulos & Funcionalidades Liberadas
              </label>

              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {MODULOS_DISPONIVEIS.map((m) => {
                  const isEnabled = editModulos[m.key] !== false;
                  return (
                    <div
                      key={m.key}
                      onClick={() => handleToggleModule(m.key)}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                        isEnabled
                          ? 'bg-purple-950/30 border-purple-500/40 text-white'
                          : 'bg-slate-950/50 border-slate-800/80 text-slate-400'
                      }`}
                    >
                      <div className="pr-3">
                        <p className="text-xs font-bold text-slate-100">{m.nome}</p>
                        <p className="text-[11px] text-slate-400">{m.descricao}</p>
                      </div>

                      {/* Custom Switch Component */}
                      <div
                        className={`w-11 h-6 rounded-full transition-colors relative shrink-0 p-0.5 ${
                          isEnabled ? 'bg-purple-600' : 'bg-slate-700'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white transition-transform ${
                            isEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedSalao(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveSalaoConfig}
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 text-xs font-bold text-white hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/30 disabled:opacity-50"
              >
                {isSaving ? 'Salvação...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMAR EXCLUSÃO DO SALÃO */}
      {deletingSalao && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border border-rose-500/30 rounded-3xl p-6 space-y-4 shadow-2xl animate-fade-in-up text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/20 shadow-lg">
              <Trash2 size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-white">Excluir Conta do Salão</h3>
              <p className="text-xs font-semibold text-rose-400">
                {deletingSalao.nome}
              </p>
            </div>
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-300 text-left space-y-1">
              <p className="font-bold flex items-center gap-1">
                <AlertCircle size={14} className="shrink-0" />
                Atenção: Ação Irreversível!
              </p>
              <p className="text-[11px] opacity-90">
                Isso excluirá permanentemente a conta deste salão e todos os seus dados do sistema.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingSalao(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSalao}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-xs font-bold text-white hover:bg-rose-500 transition-all shadow-lg shadow-rose-600/30 disabled:opacity-50"
              >
                {isDeleting ? 'Excluindo...' : 'Sim, Excluir Salão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
