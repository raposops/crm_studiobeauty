'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useDashboard } from '@/hooks/useDashboard';
import { useState, useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts';
import { Loader2, TrendingUp, Calendar as CalendarIcon, DollarSign, RefreshCw } from 'lucide-react';

function getMonthStartEnd(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);

  const startStr = start.toISOString().split('T')[0];
  const endStr = end.toISOString().split('T')[0];
  return { startStr, endStr };
}

export default function DashboardPage() {
  const { salao } = useAuth();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const { startStr, endStr } = useMemo(() => getMonthStartEnd(currentDate), [currentDate]);

  const { stats, isLoading, isError, refetch } = useDashboard(salao?.id || '', startStr, endStr);

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const mesAtualNome = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="text-sm text-muted animate-pulse">Carregando dashboard...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <p className="text-sm text-rose-500">Erro ao carregar dados do dashboard.</p>
        <button onClick={() => refetch()} className="text-accent underline text-sm">
          Tentar novamente
        </button>
      </div>
    );
  }

  const {
    receitaTotal = 0,
    ticketMedio = 0,
    agendamentosHoje = 0,
    chartOrigem = [],
    chartPagamentos = [],
    chartProfissionais = []
  } = stats || {};

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted">Visão geral do seu salão</p>
        </div>
        
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-1 shadow-sm">
          <button onClick={prevMonth} className="px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-background rounded-lg transition-all">
            &larr; Anterior
          </button>
          <span className="text-sm font-bold capitalize text-accent px-2">
            {mesAtualNome}
          </span>
          <button onClick={nextMonth} className="px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-background rounded-lg transition-all">
            Próximo &rarr;
          </button>
        </div>
      </div>

      {/* CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 border border-emerald-500/20 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-emerald-600">
            <DollarSign size={20} />
            <span className="font-bold text-sm">Receita do Mês</span>
          </div>
          <p className="text-3xl font-extrabold text-foreground">
            R$ {(receitaTotal / 100).toFixed(2).replace('.', ',')}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-accent">
            <TrendingUp size={20} />
            <span className="font-bold text-sm">Ticket Médio</span>
          </div>
          <p className="text-3xl font-extrabold text-foreground">
            R$ {(ticketMedio / 100).toFixed(2).replace('.', ',')}
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-br from-sky-500/10 to-sky-500/5 border border-sky-500/20 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sky-600">
            <CalendarIcon size={20} />
            <span className="font-bold text-sm">Agendamentos Hoje</span>
          </div>
          <p className="text-3xl font-extrabold text-foreground">
            {agendamentosHoje}
          </p>
        </div>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Origem */}
        <div className="p-5 rounded-3xl border border-border bg-card shadow-sm space-y-4">
          <h2 className="font-bold text-foreground text-sm">Origem dos Agendamentos</h2>
          <div className="h-64">
            {chartOrigem.reduce((a, b) => a + b.value, 0) > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartOrigem}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartOrigem.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => [`${value} agendamentos`, 'Quantidade']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted">Sem dados para este mês</div>
            )}
          </div>
        </div>

        {/* Pagamentos */}
        <div className="p-5 rounded-3xl border border-border bg-card shadow-sm space-y-4">
          <h2 className="font-bold text-foreground text-sm">Meios de Pagamento (Qtd)</h2>
          <div className="h-64">
            {chartPagamentos.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartPagamentos} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip 
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartPagamentos.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted">Sem dados para este mês</div>
            )}
          </div>
        </div>

        {/* Profissionais */}
        <div className="p-5 rounded-3xl border border-border bg-card shadow-sm space-y-4 lg:col-span-2">
          <h2 className="font-bold text-foreground text-sm">Agendamentos por Profissional</h2>
          <div className="h-72">
            {chartProfissionais.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartProfissionais} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#374151', fontWeight: 600 }} width={100} />
                  <Tooltip 
                    cursor={{ fill: '#f3f4f6' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                    {chartProfissionais.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted">Sem dados para este mês</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
