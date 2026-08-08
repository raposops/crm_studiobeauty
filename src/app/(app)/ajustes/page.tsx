import {
  Settings,
  Store,
  Users,
  Scissors,
  Bell,
  Palette,
  LogOut,
  ChevronRight,
} from 'lucide-react';

const menuSections = [
  {
    title: 'Salão',
    items: [
      {
        icon: Store,
        label: 'Dados do Salão',
        description: 'Nome, endereço, horários',
      },
      {
        icon: Users,
        label: 'Profissionais',
        description: 'Equipe e comissões',
      },
      {
        icon: Scissors,
        label: 'Serviços',
        description: 'Cadastro e preços',
      },
    ],
  },
  {
    title: 'Preferências',
    items: [
      {
        icon: Bell,
        label: 'Notificações',
        description: 'Lembretes e alertas',
      },
      {
        icon: Palette,
        label: 'Aparência',
        description: 'Tema e personalização',
      },
    ],
  },
];

export default function AjustesPage() {
  return (
    <div className="animate-fade-in-up space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-foreground">Ajustes</h2>
        <p className="text-sm text-muted">Configurações do sistema</p>
      </div>

      {/* Menu Sections */}
      {menuSections.map((section) => (
        <div key={section.title} className="space-y-2">
          <h3 className="text-[10px] uppercase tracking-widest text-muted font-semibold px-1">
            {section.title}
          </h3>
          <div className="rounded-2xl bg-card border border-border overflow-hidden divide-y divide-border/50">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-card-hover transition-colors text-left group"
                >
                  <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <Icon size={18} className="text-accent-light" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {item.label}
                    </p>
                    <p className="text-[11px] text-muted">{item.description}</p>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-muted/40 group-hover:text-muted transition-colors shrink-0"
                  />
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Logout */}
      <button className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl border border-danger/20 text-danger hover:bg-danger/5 transition-all duration-200">
        <LogOut size={16} />
        <span className="text-sm font-semibold">Sair da conta</span>
      </button>

      {/* Version */}
      <p className="text-center text-[10px] text-muted/50 pb-4">
        Studio Beauty CRM v0.1.0
      </p>
    </div>
  );
}
