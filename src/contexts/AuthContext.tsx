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
  logo_url?: string;
  plano?: string;
  status_assinatura?: string;
  modulos_ativos?: ModulosSalao;
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
        .single();

      let targetSalaoId = currentUser.user_metadata?.salao_id;

      if (userProfile && !profileErr) {
        setProfile(userProfile);
        targetSalaoId = userProfile.salao_id;
      } else {
        // Fallback profile from user metadata if table missing or record not found
        setProfile({
          id: currentUser.id,
          salao_id: targetSalaoId || DEFAULT_SALAO.id,
          nome: currentUser.user_metadata?.nome || currentUser.email || 'Usuário',
          email: currentUser.email || '',
          cargo: 'dona',
        });
      }

      if (targetSalaoId) {
        // 2. Fetch associated salao from 'saloes' table
        const { data: salaoData, error: salaoErr } = await supabase
          .from('saloes')
          .select('*')
          .eq('id', targetSalaoId)
          .single();

        if (salaoData && !salaoErr) {
          setSalao(salaoData);
        } else {
          setSalao({
            id: targetSalaoId,
            nome: currentUser.user_metadata?.salao_nome || 'Meu Salão',
            slug: currentUser.user_metadata?.slug || 'meu-salao',
          });
        }
      } else {
        setSalao(DEFAULT_SALAO);
      }
    } catch (err) {
      console.warn('Erro ao carregar dados do salão do usuário:', err);
      const fallbackId = currentUser.user_metadata?.salao_id || DEFAULT_SALAO.id;
      setSalao({
        id: fallbackId,
        nome: currentUser.user_metadata?.salao_nome || DEFAULT_SALAO.nome,
        slug: currentUser.user_metadata?.slug || DEFAULT_SALAO.slug,
      });
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
      setProfile(null);
      setSalao(DEFAULT_SALAO);
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
        setProfile(null);
        setSalao(DEFAULT_SALAO);
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
