'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface SalaoInfo {
  id: string;
  nome: string;
  slug: string;
  telefone_whatsapp?: string;
  logo_url?: string;
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
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const DEFAULT_SALAO: SalaoInfo = {
  id: '00000000-0000-0000-0000-000000000000',
  nome: 'Studio Beauty',
  slug: 'studio-beauty',
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  salao: DEFAULT_SALAO,
  salaoId: DEFAULT_SALAO.id,
  isLoading: true,
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

      if (userProfile && !profileErr) {
        setProfile(userProfile);

        // 2. Fetch associated salao from 'saloes' table
        const { data: salaoData, error: salaoErr } = await supabase
          .from('saloes')
          .select('*')
          .eq('id', userProfile.salao_id)
          .single();

        if (salaoData && !salaoErr) {
          setSalao(salaoData);
        } else {
          setSalao(DEFAULT_SALAO);
        }
      } else {
        // Fallback for default admin
        setProfile(null);
        setSalao(DEFAULT_SALAO);
      }
    } catch (err) {
      console.warn('Erro ao carregar dados do salão do usuário:', err);
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
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setSalao(DEFAULT_SALAO);
  };

  const salaoId = salao?.id || DEFAULT_SALAO.id;

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        salao,
        salaoId,
        isLoading,
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
