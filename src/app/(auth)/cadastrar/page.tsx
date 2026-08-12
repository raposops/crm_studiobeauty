'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Scissors, Building2, User, Mail, Lock, Phone, Globe, ArrowRight, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { generateUUID as uuidv4 } from '@/lib/uuid';

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

export default function CadastrarSalaoPage() {
  const router = useRouter();

  // Form States
  const [salaoNome, setSalaoNome] = useState('');
  const [slug, setSlug] = useState('');
  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const [phone, setPhone] = useState('');

  const [ownerNome, setOwnerNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

      // 2. Sign up user in Supabase Auth
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            nome: ownerNome.trim(),
            salao_nome: salaoNome.trim(),
          },
        },
      });

      if (authErr || !authData.user) {
        setErrorMessage(authErr?.message || 'Erro ao registrar usuário no sistema.');
        setIsLoading(false);
        return;
      }

      const newUserId = authData.user.id;
      const newSalaoId = uuidv4();
      const cleanPhoneDigits = phone.replace(/\D/g, '');
      const formattedPhone = cleanPhoneDigits ? `55${cleanPhoneDigits}` : '';

      // 3. Create Salon Row in 'saloes' table
      const { error: salaoErr } = await supabase.from('saloes').insert({
        id: newSalaoId,
        nome: salaoNome.trim(),
        slug: cleanSlug,
        telefone_whatsapp: formattedPhone,
        plano: 'pro',
        status: 'ativo',
      });

      if (salaoErr) {
        console.warn('Aviso ao criar salao (tabela saloes):', salaoErr.message);
      }

      // 4. Create User Profile Row in 'usuarios' table
      const { error: userErr } = await supabase.from('usuarios').insert({
        id: newUserId,
        salao_id: newSalaoId,
        nome: ownerNome.trim(),
        email: email.trim(),
        cargo: 'dona',
      });

      if (userErr) {
        console.warn('Aviso ao criar perfil de usuario:', userErr.message);
      }

      // 5. Seed default starter service and professional so the salon starts ready
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

      // Success -> Redirect to agenda
      router.push('/agenda');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Erro inesperado ao cadastrar salão.');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col justify-center items-center px-4 py-8 bg-gradient-to-b from-background via-card/50 to-background">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-accent to-indigo-600 shadow-lg shadow-accent/20 mb-2">
            <Scissors className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Cadastrar Novo Salão SaaS
          </h1>
          <p className="text-sm text-muted">
            Crie a conta da sua empresa em menos de 1 minuto
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-card border border-border/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Salon Info Section */}
            <div className="space-y-3 pb-3 border-b border-border/60">
              <h3 className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                <Building2 size={14} />
                Dados do Salão / Empresa
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Nome do Salão ou Barbearia *
                </label>
                <div className="relative">
                  <Building2 size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    value={salaoNome}
                    onChange={(e) => handleNomeChange(e.target.value)}
                    placeholder="Ex: Studio Beauty Vip"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Link Público Personalizado (/agendar/...)
                </label>
                <div className="relative">
                  <Globe size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => {
                      setIsCustomSlug(true);
                      setSlug(generateSlug(e.target.value));
                    }}
                    placeholder="ex: studio-beauty-vip"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                  />
                </div>
                {slug && (
                  <p className="text-[11px] text-muted flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-emerald-500" />
                    Seu link será: <strong className="text-foreground">agendar/{slug}</strong>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  WhatsApp do Salão
                </label>
                <div className="relative">
                  <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                    placeholder="(51) 99999-9999"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Owner Info Section */}
            <div className="space-y-3 pt-1">
              <h3 className="text-xs font-bold text-accent uppercase tracking-wider flex items-center gap-1.5">
                <User size={14} />
                Dados do Responsável / Gestor
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Seu Nome Completo *
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    value={ownerNome}
                    onChange={(e) => setOwnerNome(e.target.value)}
                    placeholder="Ex: Maria Aparecida"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  E-mail de Acesso *
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="maria@studiobeauty.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Senha *
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">
                    Confirmar Senha *
                  </label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-accent to-accent-light text-white text-sm font-semibold shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 transition-all mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Criando seu Salão SaaS...</span>
                </>
              ) : (
                <>
                  <span>Criar Meu Salão SaaS</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer Link */}
        <div className="text-center text-xs text-muted space-y-2">
          <p>
            Já possui uma conta?{' '}
            <Link
              href="/login"
              className="font-bold text-accent hover:underline transition-all"
            >
              Fazer Login no CRM
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
