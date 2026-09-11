'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/header';
import BottomNav from '@/components/bottom-nav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, salao, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.replace('/login');
      } else if (salao) {
        const status = salao.status_assinatura;
        if (status === 'trial' && salao.trial_ate) {
          const isExpired = new Date().getTime() > new Date(salao.trial_ate).getTime();
          if (isExpired) {
            router.replace(`/assinar?salaoId=${salao.id}&plano=${salao.plano || 'pro'}&reason=trial_expired`);
          }
        } else if (status && status !== 'ativo' && status !== 'trial') {
          router.replace(`/assinar?salaoId=${salao.id}&plano=${salao.plano || 'pro'}`);
        }
      }
    }
  }, [user, salao, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-muted font-medium animate-pulse">Carregando Studio Beauty...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-dvh">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-md md:max-w-4xl lg:max-w-6xl px-4 py-4 pb-24 transition-all">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
