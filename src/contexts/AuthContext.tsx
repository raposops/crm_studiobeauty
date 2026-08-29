'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

import type { ModulosSalao } from '@/types';

export interface SalaoInfo {
  id: string;
  nome: string;
  slug: string;
  telefone_whatsapp?: string;
  documento?: string;
  logo_url?: string;
  plano?: string;
  status_assinatura?: string;
  modulos_ativos?: ModulosSalao;
  asaas_customer_id?: string;
  asaas_payment_id?: string;
}

export interface UserProfile {
  id: string;
  salao_id: string;
  nome: string;
  email: string;
  cargo: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  salao: SalaoInfo | null;
  salaoId: string;
  isLoading: boolean;
  isSuperAdmin: boolean;
  hasModule: (moduleKey: string) => boolean;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const DEFAULT_SALAO: SalaoInfo = {
  id: '00000000-0000-0000-0000-000000000000',
  nome: 'Studio Beauty',
  slug: 'studio-beauty',
  plano: 'pro',
  status_assinatura: 'ativo',
  modulos_ativos: {
    fluxo_caixa_avancado: true,
    comissao_customizada: true,
    whatsapp_automatico: true,
    relatorios_avancados: true,
  },
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  salao: DEFAULT_SALAO,
  salaoId: DEFAULT_SALAO.id,
  isLoading: true,
  isSuperAdmin: false,
  hasModule: () => true,
  logout: async () => {},
  refreshAuth: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [salao, setSalao] = useState<SalaoInfo | null>(DEFAULT_SALAO);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserProfileAndSalao = async (currentUser: User) => {
    try {
      // 1. Fetch user profile from 'usuarios' table
      const { data: userProfile, error: profileErr } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', currentUser.id)
        .maybeSingle();

      const targetSalaoId =
        userProfile?.salao_id ||
        currentUser.user_metadata?.salao_id ||
        DEFAULT_SALAO.id;

      if (userProfile && !profileErr) {
        setProfile(userProfile);
      } else {
        // Fallback profile from user metadata if table missing or record not found
        setProfile({
          id: currentUser.id,
          salao_id: targetSalaoId,
          nome: currentUser.user_metadata?.nome || currentUser.email || 'Usuário',
          email: currentUser.email || '',
          cargo: 'dona',
        });
      }

      // 2. Fetch associated salao from 'saloes' table
      const { data: salaoData, error: salaoErr } = await supabase
        .from('saloes')
        .select('*')
        .eq('id', targetSalaoId)
        .maybeSingle();

      if (salaoData && !salaoErr) {
        setSalao(salaoData);
        if (typeof window !== 'undefined') {
          localStorage.setItem('cached_salao_info', JSON.stringify(salaoData));
          localStorage.setItem('cached_salao_' + targetSalaoId, JSON.stringify(salaoData));
        }
      } else {
        const cached = typeof window !== 'undefined' ? localStorage.getItem('cached_salao_' + targetSalaoId) : null;
        if (cached) {
          try {
            setSalao(JSON.parse(cached));
            return;
          } catch {
            // ignore
          }
        }
        setSalao({
          id: targetSalaoId,
          nome: currentUser.user_metadata?.salao_nome || DEFAULT_SALAO.nome,
          slug: currentUser.user_metadata?.slug || DEFAULT_SALAO.slug,
          telefone_whatsapp: currentUser.user_metadata?.telefone_whatsapp || '',
          plano: 'pro',
          status_assinatura: 'ativo',
          modulos_ativos: DEFAULT_SALAO.modulos_ativos,
        });
      }
    } catch (err) {
      console.warn('Erro ao carregar dados do salão do usuário:', err);
      const fallbackId = currentUser.user_metadata?.salao_id || DEFAULT_SALAO.id;
      const cached = typeof window !== 'undefined' ? localStorage.getItem('cached_salao_' + fallbackId) : null;
      if (cached) {
        try {
          setSalao(JSON.parse(cached));
          return;
        } catch {}
      }
      setSalao({
        id: fallbackId,
        nome: currentUser.user_metadata?.salao_nome || DEFAULT_SALAO.nome,
        slug: currentUser.user_metadata?.slug || DEFAULT_SALAO.slug,
        telefone_whatsapp: currentUser.user_metadata?.telefone_whatsapp || '',
        plano: 'pro',
        status_assinatura: 'ativo',
        modulos_ativos: DEFAULT_SALAO.modulos_ativos,
      });
    }
  };

  const loadGuestSalao = async () => {
    setProfile(null);
    try {
      const { data: defaultSalaoData } = await supabase
        .from('saloes')
        .select('*')
        .eq('id', DEFAULT_SALAO.id)
        .maybeSingle();

      if (defaultSalaoData) {
        setSalao(defaultSalaoData);
        if (typeof window !== 'undefined') {
          localStorage.setItem('cached_salao_info', JSON.stringify(defaultSalaoData));
          localStorage.setItem('cached_salao_' + DEFAULT_SALAO.id, JSON.stringify(defaultSalaoData));
        }
      } else if (typeof window !== 'undefined') {
        const cached = localStorage.getItem('cached_salao_info');
        if (cached) {
          try {
            setSalao(JSON.parse(cached));
          } catch {
            setSalao(DEFAULT_SALAO);
          }
        } else {
          setSalao(DEFAULT_SALAO);
        }
      } else {
        setSalao(DEFAULT_SALAO);
      }
    } catch {
      setSalao(DEFAULT_SALAO);
    }
  };

  const refreshAuth = async () => {
    setIsLoading(true);
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    setSession(currentSession);
    setUser(currentSession?.user || null);

    if (currentSession?.user) {
      await fetchUserProfileAndSalao(currentSession.user);
    } else {
      await loadGuestSalao();
    }
    setIsLoading(false);
  };

  useEffect(() => {
    refreshAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user || null);

      if (currentSession?.user) {
        await fetchUserProfileAndSalao(currentSession.user);
      } else {
        await loadGuestSalao();
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Erro no signOut:', err);
    }
    setUser(null);
    setSession(null);
    setProfile(null);
    setSalao(DEFAULT_SALAO);
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const salaoId = salao?.id || DEFAULT_SALAO.id;

  const isSuperAdmin = Boolean(
    profile?.cargo === 'superadmin' ||
    user?.email?.toLowerCase().includes('admin') ||
    user?.email?.toLowerCase() === 'contato@studiobeauty.com'
  );

  const hasModule = (moduleKey: string): boolean => {
    if (salao?.modulos_ativos && typeof salao.modulos_ativos[moduleKey] === 'boolean') {
      return salao.modulos_ativos[moduleKey];
    }
    return true;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        salao,
        salaoId,
        isLoading,
        isSuperAdmin,
        hasModule,
        logout,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
