'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Scissors, Mail, Lock, ArrowRight, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage('Por favor, informe seu e-mail e senha.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMessage('E-mail ou senha incorretos. Verifique suas credenciais.');
        } else {
          setErrorMessage(error.message);
        }
        setIsLoading(false);
        return;
      }

      if (data.user) {
        router.push('/');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro inesperado ao realizar login.');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Background Salon Image with Warm Dark Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 filter brightness-75 transition-all duration-700"
        style={{ backgroundImage: `url('/images/salon_bg_login.png')` }}
      />

      {/* Rose Gold Ambient Lighting Backdrop */}
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/95 via-rose-950/60 to-slate-950/95 backdrop-blur-[2px]" />

      {/* Subtle Glowing Radial Highlights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-500/15 rounded-full filter blur-[100px] pointer-events-none" />

      {/* Main Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="relative inline-flex items-center justify-center">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-300 rounded-3xl blur-md opacity-70 animate-pulse" />
            <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-500 via-pink-600 to-purple-600 shadow-2xl border border-white/30">
              <Scissors className="w-8 h-8 text-white" />
            </div>
            <Sparkles className="absolute -top-2 -right-2 w-5 h-5 text-amber-300 animate-bounce" />
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md pt-1">
            Studio Beauty <span className="bg-gradient-to-r from-rose-300 via-pink-300 to-amber-200 bg-clip-text text-transparent">CRM</span>
          </h1>
          <p className="text-xs font-medium text-pink-200/90 flex items-center justify-center gap-1.5">
            <span>Gestão Inteligente & Agendamento Online</span>
            <Sparkles size={12} className="text-pink-300 shrink-0" />
          </p>
        </div>

        {/* Login Form Container */}
        <div className="bg-slate-950/75 border border-pink-500/25 rounded-3xl p-7 shadow-2xl shadow-rose-950/40 backdrop-blur-2xl space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-200 text-xs flex items-center gap-2.5">
              <AlertCircle size={18} className="shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-pink-100/90">
                E-mail de acesso
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-300/60" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@salao.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900/80 border border-pink-500/20 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-500/30 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-pink-100/90">
                  Senha
                </label>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-rose-300/60" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900/80 border border-pink-500/20 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-500/30 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 text-white text-sm font-bold shadow-xl shadow-rose-500/35 hover:shadow-rose-500/55 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 transition-all mt-3 cursor-pointer border border-pink-400/30"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Botão de Suporte WhatsApp no Card */}
          <div className="pt-3 border-t border-pink-500/20">
            <a
              href="https://wa.me/5551981108170?text=Ol%C3%A1!%20Preciso%20de%20suporte%20no%20CRM%20Studio%20Beauty."
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-500/30 hover:border-emerald-500/50 text-xs font-semibold shadow-lg shadow-emerald-950/40 hover:scale-[1.01] active:scale-[0.99] transition-all group cursor-pointer"
            >
              <WhatsAppIcon className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform shrink-0" />
              <span>Precisa de ajuda? <strong className="text-emerald-200">Suporte WhatsApp</strong></span>
            </a>
          </div>
        </div>

        {/* Footer Link to Registration */}
        <div className="text-center text-xs text-pink-200/80 space-y-2 font-medium">
          <p>
            Ainda não cadastrou seu salão?{' '}
            <Link
              href="/cadastrar"
              className="font-bold text-rose-300 hover:text-rose-200 hover:underline transition-all"
            >
              Cadastrar Salão como SaaS ✨
            </Link>
          </p>
        </div>
      </div>

      {/* Botão Flutuante de Suporte WhatsApp */}
      <a
        href="https://wa.me/5551981108170?text=Ol%C3%A1!%20Preciso%20de%20suporte%20no%20CRM%20Studio%20Beauty."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-2xl shadow-emerald-950/60 border border-emerald-400/40 hover:scale-105 active:scale-95 transition-all group cursor-pointer"
        title="Falar com Suporte via WhatsApp"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
        </span>
        <WhatsAppIcon className="w-4 h-4 fill-white text-white group-hover:rotate-12 transition-transform" />
        <span>Suporte WhatsApp</span>
      </a>
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
