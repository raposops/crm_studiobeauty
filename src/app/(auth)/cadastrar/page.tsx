'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Scissors, Building2, User, Mail, Lock, Phone, Globe, ArrowRight, AlertCircle, Loader2, CheckCircle2, CreditCard, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { generateUUID as uuidv4 } from '@/lib/uuid';
import { PLANOS_SAAS } from '@/types';
import { sendDirectWhatsAppMessage } from '@/lib/whatsapp';

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

function formatPhoneInput(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function CadastrarSalaoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryPlano = searchParams.get('plano');

  // Form States
  const [salaoNome, setSalaoNome] = useState('');
  const [slug, setSlug] = useState('');
  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const [phone, setPhone] = useState('');

  const [ownerNome, setOwnerNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [planoEscolhido, setPlanoEscolhido] = useState<'basico' | 'pro'>(
    queryPlano === 'basico' ? 'basico' : 'pro'
  );

  useEffect(() => {
    if (queryPlano === 'basico' || queryPlano === 'pro') {
      setPlanoEscolhido(queryPlano);
    }
  }, [queryPlano]);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleNomeChange = (val: string) => {
    setSalaoNome(val);
    if (!isCustomSlug) {
      setSlug(generateSlug(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salaoNome.trim() || !ownerNome.trim() || !email.trim() || !password) {
      setErrorMessage('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('As senhas digitadas não coincidem.');
      return;
    }

    const cleanSlug = generateSlug(slug || salaoNome);
    if (!cleanSlug) {
      setErrorMessage('Por favor, informe um identificador (slug) válido para o salão.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    try {
      // 1. Check if slug is already taken in 'saloes'
      const { data: existingSalao } = await supabase
        .from('saloes')
        .select('id')
        .eq('slug', cleanSlug)
        .maybeSingle();

      if (existingSalao) {
        setErrorMessage('Este identificador de link já está em uso por outro salão. Escolha outro nome.');
        setIsLoading(false);
        return;
      }

      const newSalaoId = uuidv4();
      const cleanPhoneDigits = phone.replace(/\D/g, '');
      const formattedPhone = cleanPhoneDigits ? `55${cleanPhoneDigits}` : '';

      // 2. Sign up user in Supabase Auth (with salao_id in metadata)
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            nome: ownerNome.trim(),
            salao_nome: salaoNome.trim(),
            salao_id: newSalaoId,
            slug: cleanSlug,
          },
        },
      });

      if (authErr || !authData.user) {
        setErrorMessage(authErr?.message || 'Erro ao registrar usuário no sistema.');
        setIsLoading(false);
        return;
      }

      const newUserId = authData.user.id;

      // 3. Create Salon Row in 'saloes' table with pending subscription
      const salaoPayload: any = {
        id: newSalaoId,
        nome: salaoNome.trim(),
        slug: cleanSlug,
        telefone_whatsapp: formattedPhone,
        email: email.trim(),
        plano: planoEscolhido,
        status_assinatura: 'pendente',
      };

      let { error: salaoErr } = await supabase.from('saloes').insert(salaoPayload);
      if (salaoErr && salaoErr.message && salaoErr.message.includes('email')) {
        delete salaoPayload.email;
        const retry = await supabase.from('saloes').insert(salaoPayload);
        salaoErr = retry.error;
      }

      if (salaoErr) {
        console.warn('Aviso ao criar salao (tabela saloes):', salaoErr.message);
      }

      // 4. Create User Profile Row in 'usuarios' table (if table exists)
      try {
        await supabase.from('usuarios').insert({
          id: newUserId,
          salao_id: newSalaoId,
          nome: ownerNome.trim(),
          email: email.trim(),
          cargo: 'dona',
        });
      } catch (e) {
        console.warn('Tabela usuarios não encontrada ou erro de permissão:', e);
      }

      // 5. Seed default starter service and professional for this new salon ID
      await supabase.from('profissionais').insert({
        id: uuidv4(),
        salao_id: newSalaoId,
        nome: ownerNome.trim(),
        iniciais: ownerNome.slice(0, 2).toUpperCase(),
        cor: '#8B5CF6',
      });

      await supabase.from('servicos').insert([
        {
          id: uuidv4(),
          salao_id: newSalaoId,
          nome: 'Corte & Modelagem',
          preco: 5000,
          duracao_minutos: 45,
          categoria: 'Cabelo',
        },
        {
          id: uuidv4(),
          salao_id: newSalaoId,
          nome: 'Manicure Completa',
          preco: 3500,
          duracao_minutos: 40,
          categoria: 'Unhas',
        },
      ]);

      // Notificar Super Admin via WhatsApp
      try {
        const msgAdmin = `🚀 *Novo Salão SaaS Cadastrado!*\n\n🏢 *Salão:* ${salaoNome.trim()}\n👤 *Responsável:* ${ownerNome.trim()}\n📧 *Email:* ${email.trim()}\n📱 *Telefone:* ${phone.trim()}\n📦 *Plano Escolhido:* ${planoEscolhido}\n\n🎉 Uhuuu! Mais um cliente na plataforma!`;
        await sendDirectWhatsAppMessage({
          phone: '5551981108170',
          message: msgAdmin,
        });
      } catch (notifyErr) {
        console.warn('Erro ao notificar super-admin via WhatsApp:', notifyErr);
      }

      // Success -> Redireciona imediatamente para o checkout do plano antes de acessar a plataforma
      router.push(`/assinar?salaoId=${newSalaoId}&plano=${planoEscolhido}`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro inesperado ao cadastrar salão.');
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
      
      {/* Modern Gradient Backdrop Overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/90 via-slate-900/85 to-slate-950/90 backdrop-blur-[2px]" />

      <div className="relative z-10 w-full max-w-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent via-indigo-600 to-purple-600 shadow-2xl shadow-accent/40 mb-2 border border-white/20">
            <Scissors className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
            Cadastrar Novo Salão SaaS
          </h1>
          <p className="text-xs font-medium text-slate-300">
            Crie a conta da sua empresa em menos de 1 minuto
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-slate-900/80 border border-white/15 rounded-3xl p-7 shadow-2xl backdrop-blur-2xl space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Salon Info Section */}
            <div className="space-y-3 pb-3 border-b border-white/10">
              <h3 className="text-xs font-bold text-accent-light uppercase tracking-wider flex items-center gap-1.5">
                <Building2 size={14} />
                Dados do Salão / Empresa
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200">
                  Nome do Salão ou Barbearia *
                </label>
                <div className="relative">
                  <Building2 size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={salaoNome}
                    onChange={(e) => handleNomeChange(e.target.value)}
                    placeholder="Ex: Studio Beauty Vip"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/60 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200">
                  Link Público Personalizado (/agendar/...)
                </label>
                <div className="relative">
                  <Globe size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setIsCustomSlug(true);
                      setSlug(generateSlug(e.target.value));
                    }}
                    placeholder="ex: studio-beauty-vip"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/60 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all"
                  />
                </div>
                {slug && (
                  <p className="text-[11px] text-slate-300 flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-emerald-400" />
                    Seu link será: <strong className="text-white">agendar/{slug}</strong>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200">
                  WhatsApp do Salão
                </label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                    placeholder="(51) 99999-9999"
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/60 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Owner Info Section */}
            <div className="space-y-3 pt-1">
              <h3 className="text-xs font-bold text-accent-light uppercase tracking-wider flex items-center gap-1.5">
                <User size={14} />
                Dados do Responsável / Gestor
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200">
                  Seu Nome Completo *
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={ownerNome}
                    onChange={(e) => setOwnerNome(e.target.value)}
                    placeholder="Ex: Maria Aparecida"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/60 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200">
                  E-mail de Acesso *
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="maria@studiobeauty.com"
                    required
                    className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/60 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200">
                    Senha *
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/60 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-200">
                    Confirmar Senha *
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-950/60 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/30 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Plano de Assinatura Selector */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-200 flex items-center justify-between">
                <span>Escolha seu Plano SaaS</span>
                <span className="text-[10px] text-purple-400 font-medium">Liberação Imediata</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(['basico', 'pro'] as const).map((pKey) => {
                  const p = PLANOS_SAAS[pKey];
                  const isSelected = planoEscolhido === pKey;
                  return (
                    <div
                      key={p.id}
                      onClick={() => setPlanoEscolhido(pKey)}
                      className={`relative p-3.5 rounded-2xl border transition-all cursor-pointer select-none ${
                        isSelected
                          ? 'bg-purple-950/60 border-purple-500 ring-2 ring-purple-500/30 shadow-lg'
                          : 'bg-slate-950/40 border-white/10 hover:border-white/20'
                      }`}
                    >
                      {p.destaque && (
                        <span className="absolute -top-2.5 right-3 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm">
                          Mais Escolhido
                        </span>
                      )}
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-white">{p.nome}</p>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'bg-purple-600 border-purple-500' : 'border-slate-600'}`}>
                          {isSelected && <Check size={10} className="text-white" />}
                        </div>
                      </div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-base font-extrabold text-white">{p.precoFormatado}</span>
                        <span className="text-[10px] text-slate-400">/mês</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {p.descricao}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-accent via-indigo-600 to-purple-600 text-white text-sm font-bold shadow-xl shadow-accent/30 hover:shadow-accent/50 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 transition-all mt-4 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Criando seu Salão SaaS...</span>
                </>
              ) : (
                <>
                  <span>Prosseguir para Ativação ({PLANOS_SAAS[planoEscolhido].precoFormatado})</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <div className="text-center text-xs text-slate-300 space-y-2 font-medium">
          <p>
            Já possui uma conta cadastrada?{' '}
            <Link
              href="/login"
              className="font-bold text-accent-light hover:underline transition-all"
            >
              Fazer Login no Sistema
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CadastrarSalaoPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh flex items-center justify-center bg-slate-950 text-white">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </div>
      }
    >
      <CadastrarSalaoContent />
    </Suspense>
  );
}
