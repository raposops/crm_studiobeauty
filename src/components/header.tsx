'use client';

import { Scissors } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function Header() {
  const { salao } = useAuth();
  const displayName = salao?.nome || 'Studio Beauty';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-[var(--nav-bg)] backdrop-blur-xl">
      <div className="mx-auto max-w-md md:max-w-4xl lg:max-w-6xl flex items-center justify-between px-4 py-3 transition-all">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-indigo-500">
            <Scissors size={16} className="text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-foreground">
              {displayName}
            </h1>
            <p className="text-[10px] text-muted font-medium">
              Gerenciamento
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent/20 to-indigo-500/20 border border-border flex items-center justify-center">
            <span className="text-xs font-bold text-accent-light">{initials}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
