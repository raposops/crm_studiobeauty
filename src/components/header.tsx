'use client';

import { Scissors, Shield, Store, Mail } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function Header() {
  const { salao, user, profile, isSuperAdmin } = useAuth();
  const displayName = salao?.nome || 'Studio Beauty';
  const userEmail = user?.email || profile?.email || '';

  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-[var(--nav-bg)] backdrop-blur-xl">
      <div className="mx-auto max-w-md md:max-w-4xl lg:max-w-6xl flex items-center justify-between px-4 py-2.5 transition-all">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-br from-accent to-indigo-500 shadow-md shadow-accent/20 shrink-0">
            <Scissors size={18} className="text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <Store size={14} className="text-accent-light shrink-0" />
              <h1 className="text-sm font-bold tracking-tight text-foreground line-clamp-1">
                {displayName}
              </h1>
            </div>
            {userEmail ? (
              <p className="text-[10px] text-muted font-medium flex items-center gap-1 truncate max-w-[200px] sm:max-w-xs">
                <Mail size={10} className="text-muted/70 shrink-0" />
                <span className="truncate">{userEmail}</span>
              </p>
            ) : (
              <p className="text-[10px] text-muted font-medium">
                Gerenciamento de Agendamentos
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isSuperAdmin && (
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 text-xs font-bold hover:bg-purple-500/25 transition-all"
              title="Painel Mestre Super Admin"
            >
              <Shield size={14} />
              <span className="hidden sm:inline">Painel Admin</span>
            </Link>
          )}

          <div
            className="flex items-center gap-2 px-2 py-1 rounded-xl bg-card/60 border border-border"
            title={`Conectado como: ${displayName} (${userEmail})`}
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-accent/20 to-indigo-500/20 border border-accent/30 flex items-center justify-center">
              <span className="text-xs font-bold text-accent-light">{initials}</span>
            </div>
            {userEmail && (
              <span className="text-[11px] font-semibold text-foreground hidden md:inline truncate max-w-[150px]">
                {userEmail.split('@')[0]}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
