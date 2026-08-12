'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Scissors, Mail, Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
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
        router.push('/agenda');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro inesperado ao realizar login.');
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh flex items-center justify-center px-4 py-12 overflow-hidden">
      {/* Background Salon Image with Dark Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 filter brightness-75 transition-all duration-700"
        style={{ backgroundImage: `url('/images/salon_bg_login.png')` }}
      />
      
      {/* Modern Gradient Backdrop & Vignette Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/90 via-slate-900/80 to-slate-950/90 backdrop-blur-[2px]" />

      {/* Main Glassmorphism Card */}
      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent via-indigo-600 to-purple-600 shadow-2xl shadow-accent/40 mb-2 border border-white/20">
            <Scissors className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
            Studio Beauty CRM
          </h1>
          <p className="text-xs font-medium text-slate-300">
            Gestão Inteligente & Agendamento Online para o seu Salão
          </p>
        </div>

        {/* Login Form Container */}
        <div className="bg-slate-900/70 border border-white/15 rounded-3xl p-7 shadow-2xl backdrop-blur-2xl space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-red-500/20 border border-red-500/30 text-red-200 text-xs flex items-center gap-2.5">
              <AlertCircle size={18} className="shrink-0 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-200">
                E-mail de acesso
              </label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seuemail@salao.com"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/60 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-200">
                  Senha
                </label>
              </div>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/60 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-accent via-indigo-600 to-purple-600 text-white text-sm font-bold shadow-xl shadow-accent/30 hover:shadow-accent/50 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 transition-all mt-3 cursor-pointer"
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
        </div>

        {/* Footer Link to Registration */}
        <div className="text-center text-xs text-slate-300 space-y-2 font-medium">
          <p>
            Ainda não cadastrou seu salão?{' '}
            <Link
              href="/cadastrar"
              className="font-bold text-accent-light hover:underline transition-all"
            >
              Cadastrar Salão como SaaS
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
