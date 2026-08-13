'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarDays, Wallet, TrendingUp, Users, Settings } from 'lucide-react';

const navItems = [
  { href: '/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/caixa', label: 'Caixa', icon: Wallet },
  { href: '/fluxo-de-caixa', label: 'Fluxo', icon: TrendingUp },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/ajustes', label: 'Ajustes', icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-[var(--nav-bg)] backdrop-blur-xl">
      <div className="mx-auto max-w-md md:max-w-4xl lg:max-w-6xl transition-all">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all duration-200 ${
                  isActive
                    ? 'text-accent scale-105'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                <div className="relative">
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 1.8}
                    className="transition-all duration-200"
                  />
                  {isActive && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent animate-pulse-glow" />
                  )}
                </div>
                <span
                  className={`text-[10px] font-medium tracking-wide transition-all duration-200 ${
                    isActive ? 'text-accent-light' : ''
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
        {/* Safe area for iOS notch */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </nav>
  );
}
