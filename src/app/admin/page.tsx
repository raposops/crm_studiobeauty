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
  Copy,
  Clock,
  BellRing,
  MessageSquare,
  Globe,
  Key,
  Terminal,
  ExternalLink,
  Eye,
  EyeOff,
  Code2,
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
  trial_ate?: string | null;
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
  const [copiedTrialLink, setCopiedTrialLink] = useState(false);
  
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

  function handleCopyTrialLink() {
    if (typeof window !== 'undefined' && navigator?.clipboard?.writeText) {
      const trialUrl = `${window.location.origin}/cadastrar?plano=trial`;
      navigator.clipboard.writeText(trialUrl);
      setCopiedTrialLink(true);
      setTimeout(() => setCopiedTrialLink(false), 2500);
    }
  }

  // Fidus Connect API Integration state & handlers
  const [showFidusModal, setShowFidusModal] = useState(false);
  const [copiedFidusKey, setCopiedFidusKey] = useState(false);
  const [copiedFidusEndpoint, setCopiedFidusEndpoint] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [testingFidusApi, setTestingFidusApi] = useState(false);
  const [fidusTestResponse, setFidusTestResponse] = useState<any>(null);

  const fidusApiKey = 'fidus_sec_studiobeauty_2026_x9k2';

  function getFidusEndpoint() {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/api/integracao/fidus-connect/saloes`;
    }
    return 'https://crmstudio.fidustecnologia.com.br/api/integracao/fidus-connect/saloes';
  }

  function handleCopyFidusEndpoint() {
    if (typeof window !== 'undefined' && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(getFidusEndpoint());
      setCopiedFidusEndpoint(true);
      setTimeout(() => setCopiedFidusEndpoint(false), 2500);
    }
  }

  function handleCopyFidusKey() {
    if (typeof window !== 'undefined' && navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(fidusApiKey);
      setCopiedFidusKey(true);
      setTimeout(() => setCopiedFidusKey(false), 2500);
    }
  }

  async function handleTestFidusConnection() {
    setTestingFidusApi(true);
    setFidusTestResponse(null);
    try {
      const res = await fetch('/api/integracao/fidus-connect/saloes', {
        headers: {
          'x-api-key': fidusApiKey,
        },
      });
      const data = await res.json();
      setFidusTestResponse({
        status: res.status,
        ok: res.ok,
        data,
      });
    } catch (err: any) {
      setFidusTestResponse({
        status: 0,
        ok: false,
        error: err?.message || 'Erro de conexão',
      });
    } finally {
      setTestingFidusApi(false);
    }
  }

  // Renewal alerts state & handlers
  const [isSendingRenewalAlerts, setIsSendingRenewalAlerts] = useState(false);
  const [sendingSalaoId, setSendingSalaoId] = useState<string | null>(null);

  function getRenewalInfo(salao: SalaoRow) {
    const status = salao.status_assinatura || 'ativo';
    const today = new Date();
    today.setHours(12, 0, 0, 0);

    if (status === 'trial' && salao.trial_ate) {
      const trialDate = new Date(salao.trial_ate);
      trialDate.setHours(12, 0, 0, 0);
      const diffDays = Math.round((trialDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const dateFormatted = `${String(trialDate.getDate()).padStart(2, '0')}/${String(trialDate.getMonth() + 1).padStart(2, '0')}`;
      return {
        label: diffDays < 0 ? `Trial Expirado (${Math.abs(diffDays)}d)` : `Trial (${diffDays}d - ${dateFormatted})`,
        isExpired: diffDays < 0,
        diffDays,
        dateFormatted,
      };
    }

    const baseDate = salao.criado_em ? new Date(salao.criado_em) : new Date();
    const day = Math.min(Math.max(baseDate.getDate(), 1), 28);
    let nextDate = new Date(today.getFullYear(), today.getMonth(), day, 12, 0, 0, 0);
    if (Math.round((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) < 0) {
      nextDate = new Date(today.getFullYear(), today.getMonth() + 1, day, 12, 0, 0, 0);
    }
    const diffDays = Math.round((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const dateFormatted = `${String(nextDate.getDate()).padStart(2, '0')}/${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
    return {
      label: `Renova em ${diffDays}d (${dateFormatted})`,
      isExpired: false,
      diffDays,
      dateFormatted,
    };
  }

  async function handleSendAllRenewalAlerts() {
    const confirmSend = window.confirm(
      'Deseja verificar e disparar agora as notificações no WhatsApp para todos os salões com vencimento em 3 dias ou hoje?'
    );
    if (!confirmSend) return;

    setIsSendingRenewalAlerts(true);
    try {
      const res = await fetch('/api/cron/renovacao-planos', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        alert(`✅ ${data.message}`);
      } else {
        alert(`❌ Erro: ${data.error || 'Falha ao processar avisos.'}`);
      }
    } catch (err: any) {
      alert(`❌ Erro de conexão: ${err?.message}`);
    } finally {
      setIsSendingRenewalAlerts(false);
    }
  }

  async function handleSendSingleRenewalAlert(salao: SalaoRow) {
    const confirmSend = window.confirm(
      `Deseja enviar agora a mensagem de lembrete de renovação no WhatsApp do salão "${salao.nome}"?`
    );
    if (!confirmSend) return;

    setSendingSalaoId(salao.id);
    try {
      const res = await fetch(`/api/cron/renovacao-planos?salaoId=${salao.id}&force=true`, { method: 'POST' });
      const data = await res.json();
      if (data.success && data.totalEnviados > 0) {
        alert(`✅ Notificação enviada com sucesso no WhatsApp do salão "${salao.nome}"!`);
      } else if (data.falhas && data.falhas.length > 0) {
        alert(`⚠️ Não foi possível enviar: ${data.falhas[0].motivo}`);
      } else {
        alert(`❌ Erro: ${data.error || data.message || 'Falha ao enviar.'}`);
      }
    } catch (err: any) {
      alert(`❌ Erro de conexão: ${err?.message}`);
    } finally {
      setSendingSalaoId(null);
    }
  }


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
      const isTrial = editStatus === 'trial';
      const calculatedTrialAte = isTrial
        ? selectedSalao.trial_ate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const payload: any = {
        plano: editPlano,
        status_assinatura: editStatus,
        modulos_ativos: editModulos,
        email: editEmail.trim(),
      };

      if (isTrial) {
        payload.trial_ate = calculatedTrialAte;
      }

      await supabaseService.atualizarStatusESalao(selectedSalao.id, payload);

      // Update local state
      setSaloes((prev) =>
        prev.map((s) =>
          s.id === selectedSalao.id
            ? {
                ...s,
                plano: editPlano,
                status_assinatura: editStatus,
                trial_ate: isTrial ? calculatedTrialAte : s.trial_ate,
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

      {/* Marketing Trial Link Section */}
      <div className="rounded-3xl bg-gradient-to-r from-purple-950/60 via-indigo-950/60 to-slate-900/80 border border-purple-500/30 p-5 backdrop-blur-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Sparkles size={24} className="animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white">Link de Campanha: Trial 14 Dias Grátis</h2>
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Oculto no Cadastro Normal
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Use este link exclusivo em campanhas de marketing para oferecer 14 dias de teste grátis com liberação imediata da plataforma.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <div className="px-3 py-2 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-purple-300 truncate max-w-xs select-all">
            {typeof window !== 'undefined' ? `${window.location.origin}/cadastrar?plano=trial` : '/cadastrar?plano=trial'}
          </div>
          <button
            onClick={handleCopyTrialLink}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-purple-600/30 transition-all active:scale-95 cursor-pointer shrink-0"
          >
            {copiedTrialLink ? (
              <>
                <Check size={14} className="text-emerald-300" />
                <span>Copiado!</span>
              </>
            ) : (
              <>
                <Copy size={14} />
                <span>Copiar Link Trial</span>
              </>
            )}
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

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleSendAllRenewalAlerts}
              disabled={isSendingRenewalAlerts}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
              title="Dispara avisos no WhatsApp para todos os salões com vencimento em 3 dias ou hoje"
            >
              <BellRing size={15} />
              <span>{isSendingRenewalAlerts ? 'Enviando avisos...' : 'Lembretes de Vencimento'}</span>
            </button>

            <button
              onClick={() => setShowFidusModal(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all active:scale-95 shrink-0 cursor-pointer"
              title="Configurar e testar a sincronização online com o Fidus Connect via API REST"
            >
              <Globe size={15} />
              <span>Integração Fidus Connect</span>
            </button>

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
                  <th className="py-3 px-4">Status / Vencimento</th>
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
                          <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                            {salao.nome ? salao.nome.slice(0, 2).toUpperCase() : 'SB'}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white text-sm truncate max-w-[200px]" title={salao.nome}>
                              {salao.nome}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono truncate max-w-[200px]" title={salao.id}>
                              ID: {salao.id.slice(0, 8)}...
                            </p>
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
                        {(() => {
                          const status = salao.status_assinatura || 'ativo';
                          const renewal = getRenewalInfo(salao);

                          if (status === 'trial') {
                            return renewal.isExpired ? (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20" title="14 dias de teste expirados">
                                  <Clock size={13} className="text-amber-400" />
                                  Trial Expirado
                                </span>
                                <p className="text-[10px] text-amber-500/80 font-medium">Expirou em {renewal.dateFormatted}</p>
                              </div>
                            ) : (
                              <div className="space-y-1">
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20" title="Em período de teste de 14 dias">
                                  <Sparkles size={13} className="text-purple-400" />
                                  Trial 14 Dias
                                </span>
                                <p className="text-[10px] text-purple-300 font-medium">Vence em {renewal.diffDays}d ({renewal.dateFormatted})</p>
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-1">
                              <button
                                onClick={() => handleToggleStatusSalao(salao)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                  status === 'ativo'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 active:scale-95'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 active:scale-95'
                                }`}
                                title={status === 'ativo' ? 'Clique para bloquear/desativar acesso' : 'Clique para ativamento/liberar acesso'}
                              >
                                {status === 'ativo' ? (
                                  <Power size={13} className="text-emerald-400" />
                                ) : (
                                  <PowerOff size={13} className="text-rose-400" />
                                )}
                                {status === 'ativo' ? 'Ativo (Liberado)' : 'Bloqueado / Inativo'}
                              </button>
                              {status === 'ativo' && (
                                <p className="text-[10px] text-slate-400 font-medium">Renova em {renewal.diffDays}d ({renewal.dateFormatted})</p>
                              )}
                            </div>
                          );
                        })()}
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
                            onClick={() => handleSendSingleRenewalAlert(salao)}
                            disabled={sendingSalaoId === salao.id}
                            className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 transition-all active:scale-90 disabled:opacity-50 cursor-pointer"
                            title="Enviar lembrete de renovação no WhatsApp deste salão"
                          >
                            {sendingSalaoId === salao.id ? (
                              <RefreshCw size={15} className="animate-spin text-emerald-300" />
                            ) : (
                              <MessageSquare size={15} />
                            )}
                          </button>
                          <button
                            onClick={() => handleOpenManageModal(salao)}
                            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
                            title="Gerenciar módulos e plano"
                          >
                            <SlidersHorizontal size={14} />
                            Módulos
                          </button>
                          <button
                            onClick={() => setDeletingSalao(salao)}
                            className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all active:scale-90 cursor-pointer"
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
                        cobranca_sinal: false,
                        encaixe_agenda: false,
                        fluxo_de_caixa: false,
                        fluxo_caixa_avancado: false,
                        estoque: false,
                      });
                    } else if (newPlan === 'pro') {
                      setEditModulos({
                        comissao_customizada: true,
                        whatsapp_automatico: true,
                        relatorios_avancados: true,
                        cobranca_sinal: true,
                        encaixe_agenda: true,
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
                  <option value="trial">Trial 14 Dias Grátis</option>
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

      {/* MODAL: INTEGRAÇÃO FIDUS CONNECT */}
      {showFidusModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 md:p-7 space-y-6 shadow-2xl animate-fade-in-up my-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                  <Globe size={24} className="animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white tracking-tight">
                      Integração REST API — Fidus Connect
                    </h3>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      Online 24/7
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Sincronização em tempo real de salões, planos, renovações e follow-ups de WhatsApp
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowFidusModal(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Info Box */}
            <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/20 text-xs text-indigo-200/90 space-y-1.5">
              <p className="font-semibold text-white flex items-center gap-1.5">
                <Sparkles size={14} className="text-indigo-400" />
                O que esta API compartilha com seu CRM Fidus Connect?
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
                <li><strong>Salões Cadastrados:</strong> Dados completos (Nome, CNPJ/CPF, WhatsApp, Cidade, Status e Data de Criação).</li>
                <li><strong>Planos e Assinatura:</strong> Identificação de Plano Básico ou PRO, status (ativo, trial, inadimplente).</li>
                <li><strong>Previsão de Renovação:</strong> Data exata do próximo ciclo mensal ou fim do trial, e dias restantes.</li>
                <li><strong>Follow-ups Enviados:</strong> Histórico de avisos disparados no WhatsApp (3 dias antes e no dia do vencimento).</li>
                <li><strong>Métricas de Uso:</strong> Total de profissionais cadastrados e volume de agendamentos.</li>
              </ul>
            </div>

            {/* Endpoint Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Terminal size={14} className="text-indigo-400" />
                  URL do Endpoint Oficial (GET)
                </label>
                <span className="text-[10px] text-slate-500 font-mono">CORS Habilitado (*)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300 truncate select-all">
                  {getFidusEndpoint()}
                </div>
                <button
                  type="button"
                  onClick={handleCopyFidusEndpoint}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  {copiedFidusEndpoint ? (
                    <>
                      <Check size={14} className="text-emerald-400" />
                      <span className="text-emerald-400">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copiar URL</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* API Key Box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Key size={14} className="text-amber-400" />
                  Chave Secreta de API (API Key / API Secret)
                </label>
                <span className="text-[10px] text-amber-400/80 font-medium">Header: X-API-KEY, X-API-SECRET ou Bearer</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <input
                    type={showSecretKey ? 'text' : 'password'}
                    readOnly
                    value={fidusApiKey}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-amber-300 select-all focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                    title={showSecretKey ? 'Ocultar chave' : 'Mostrar chave'}
                  >
                    {showSecretKey ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleCopyFidusKey}
                  className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  {copiedFidusKey ? (
                    <>
                      <Check size={14} className="text-emerald-400" />
                      <span className="text-emerald-400">Copiada!</span>
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      <span>Copiar Chave</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Live Test Button & Box */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    Diagnóstico e Teste em Tempo Real
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Dispara uma chamada autenticada ao endpoint para validar a resposta
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTestFidusConnection}
                  disabled={testingFidusApi}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition-all active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
                >
                  <RefreshCw size={13} className={testingFidusApi ? 'animate-spin' : ''} />
                  <span>{testingFidusApi ? 'Testando...' : 'Testar Conexão Agora'}</span>
                </button>
              </div>

              {fidusTestResponse && (
                <div
                  className={`p-3.5 rounded-xl border text-xs space-y-2 animate-fade-in ${
                    fidusTestResponse.ok
                      ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                      : 'bg-rose-950/30 border-rose-500/30 text-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          fidusTestResponse.ok ? 'bg-emerald-400' : 'bg-rose-400'
                        }`}
                      />
                      <span>
                        Status: HTTP {fidusTestResponse.status}{' '}
                        {fidusTestResponse.ok ? '(OK - Conectado com Sucesso)' : '(Falha na Conexão)'}
                      </span>
                    </div>
                    {fidusTestResponse.data?.total_saloes !== undefined && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        {fidusTestResponse.data.total_saloes} salão(ões) retornados
                      </span>
                    )}
                  </div>

                  {fidusTestResponse.data?.resumo && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
                      <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block">Ativos:</span>
                        <strong className="text-emerald-400 text-sm">{fidusTestResponse.data.resumo.ativos}</strong>
                      </div>
                      <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block">Trial:</span>
                        <strong className="text-purple-400 text-sm">{fidusTestResponse.data.resumo.trial}</strong>
                      </div>
                      <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block">A Vencer (≤3d):</span>
                        <strong className="text-amber-400 text-sm">{fidusTestResponse.data.resumo.a_vencer_em_breve}</strong>
                      </div>
                      <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                        <span className="text-slate-400 block">Vencidos:</span>
                        <strong className="text-rose-400 text-sm">{fidusTestResponse.data.resumo.vencidos}</strong>
                      </div>
                    </div>
                  )}

                  {fidusTestResponse.error && (
                    <p className="text-rose-300 text-[11px]">Erro: {fidusTestResponse.error}</p>
                  )}
                </div>
              )}
            </div>

            {/* Code Snippets Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Code2 size={14} className="text-indigo-400" />
                Exemplo de Requisição no Fidus Connect (JavaScript / Fetch)
              </h4>
              <pre className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto select-all leading-relaxed">
{`// Chamada via fetch (aceita /api/v1/saloes ou /api/integracao/fidus-connect/saloes)
const res = await fetch("https://crmstudio.fidustecnologia.com.br/api/v1/saloes", {
  method: "GET",
  headers: {
    "X-API-KEY": "${fidusApiKey}"
    // Ou se preferir: "X-API-SECRET": "${fidusApiKey}"
  }
});
const data = await res.json();
console.log(data.saloes);`}
              </pre>
            </div>

            {/* Footer */}
            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowFidusModal(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors cursor-pointer"
              >
                Concluído / Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
