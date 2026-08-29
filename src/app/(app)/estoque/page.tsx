'use client';

import { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Pencil,
  Trash2,
  Lock,
  Sparkles,
  Check,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  Layers,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  X,
  PlusCircle,
  MinusCircle,
  RefreshCw,
  Boxes,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useProdutos } from '@/hooks/useProdutos';
import { formatCurrency } from '@/data/mock';
import type { ProdutoExtra } from '@/types';
import AssinaturaModal from '@/components/ajustes/assinatura-modal';
import Link from 'next/link';

export default function EstoquePage() {
  const { salao, salaoId, hasModule } = useAuth();
  const temModuloEstoque = hasModule('estoque');

  const {
    produtos,
    isLoading,
    criarProduto,
    atualizarProduto,
    ajustarEstoque,
    deletarProduto,
    refetch,
  } = useProdutos(salaoId);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategoria, setSelectedCategoria] = useState<string>('todas');
  const [apenasEstoqueBaixo, setApenasEstoqueBaixo] = useState(false);

  // Modal Novo / Editar Produto state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProd, setEditingProd] = useState<ProdutoExtra | null>(null);
  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [custo, setCusto] = useState('');
  const [categoria, setCategoria] = useState('Cabelo');
  const [quantidade, setQuantidade] = useState('10');
  const [estoqueMinimo, setEstoqueMinimo] = useState('3');

  // Modal Ajuste Rápido de Estoque state
  const [isAjusteModalOpen, setIsAjusteModalOpen] = useState(false);
  const [ajustandoProd, setAjustandoProd] = useState<ProdutoExtra | null>(null);
  const [tipoAjuste, setTipoAjuste] = useState<'entrada' | 'definir'>('entrada');
  const [valorAjuste, setValorAjuste] = useState('1');

  // Upgrade Modal
  const [isAssinaturaModalOpen, setIsAssinaturaModalOpen] = useState(false);

  // Categorias únicas
  const categoriasDisponiveis = useMemo(() => {
    const set = new Set<string>();
    produtos.forEach((p) => {
      if (p.categoria) set.add(p.categoria);
    });
    return Array.from(set);
  }, [produtos]);

  // Estatísticas do Estoque
  const stats = useMemo(() => {
    let totalUnidades = 0;
    let valorTotalVenda = 0;
    let valorTotalCusto = 0;
    let produtosEstoqueBaixo = 0;
    let produtosZerados = 0;

    produtos.forEach((p) => {
      const qtd = p.quantidade ?? 0;
      const min = p.estoque_minimo ?? 2;
      const precoVenda = p.preco ?? 0;
      const precoCusto = p.custo ?? 0;

      totalUnidades += qtd;
      valorTotalVenda += qtd * precoVenda;
      valorTotalCusto += qtd * precoCusto;

      if (qtd === 0) {
        produtosZerados++;
      }
      if (qtd <= min) {
        produtosEstoqueBaixo++;
      }
    });

    return {
      totalItens: produtos.length,
      totalUnidades,
      valorTotalVenda,
      valorTotalCusto,
      produtosEstoqueBaixo,
      produtosZerados,
    };
  }, [produtos]);

  // Produtos Filtrados
  const produtosFiltrados = useMemo(() => {
    return produtos.filter((p) => {
      const matchesSearch =
        p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.categoria && p.categoria.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCat =
        selectedCategoria === 'todas' || p.categoria === selectedCategoria;

      const qtd = p.quantidade ?? 0;
      const min = p.estoque_minimo ?? 2;
      const matchesBaixo = !apenasEstoqueBaixo || qtd <= min;

      return matchesSearch && matchesCat && matchesBaixo;
    });
  }, [produtos, searchTerm, selectedCategoria, apenasEstoqueBaixo]);

  // Handlers para Produto (Criar / Editar)
  function handleOpenNovoProduto() {
    setEditingProd(null);
    setNome('');
    setPreco('');
    setCusto('');
    setCategoria('Cabelo');
    setQuantidade('10');
    setEstoqueMinimo('3');
    setIsModalOpen(true);
  }

  function handleEditProduto(prod: ProdutoExtra) {
    setEditingProd(prod);
    setNome(prod.nome);
    setPreco((prod.preco / 100).toFixed(2));
    setCusto(prod.custo ? (prod.custo / 100).toFixed(2) : '');
    setCategoria(prod.categoria || 'Geral');
    setQuantidade((prod.quantidade ?? 0).toString());
    setEstoqueMinimo((prod.estoque_minimo ?? 2).toString());
    setIsModalOpen(true);
  }

  function handleSubmitProduto(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim() || !preco) return;

    const priceFloat = parseFloat(preco.replace(',', '.'));
    if (isNaN(priceFloat) || priceFloat < 0) {
      alert('Informe um preço de venda válido.');
      return;
    }
    const precoCentavos = Math.round(priceFloat * 100);

    const custoFloat = custo ? parseFloat(custo.replace(',', '.')) : 0;
    const custoCentavos = !isNaN(custoFloat) ? Math.round(custoFloat * 100) : 0;

    const qtdNum = parseInt(quantidade) || 0;
    const minNum = parseInt(estoqueMinimo) || 0;

    if (editingProd) {
      atualizarProduto.mutate(
        {
          id: editingProd.id,
          payload: {
            nome: nome.trim(),
            preco: precoCentavos,
            custo: custoCentavos,
            categoria: categoria.trim(),
            quantidade: qtdNum,
            estoque_minimo: minNum,
            controlar_estoque: true,
          },
        },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            setEditingProd(null);
          },
          onError: (err: any) => {
            alert(`Erro ao atualizar produto: ${err?.message || 'Tente novamente.'}`);
          },
        }
      );
    } else {
      criarProduto.mutate(
        {
          nome: nome.trim(),
          preco: precoCentavos,
          custo: custoCentavos,
          categoria: categoria.trim(),
          quantidade: qtdNum,
          estoque_minimo: minNum,
          controlar_estoque: true,
        },
        {
          onSuccess: () => {
            setIsModalOpen(false);
          },
          onError: (err: any) => {
            alert(`Erro ao criar produto: ${err?.message || 'Tente novamente.'}`);
          },
        }
      );
    }
  }

  // Handlers para Ajuste Rápido
  function handleOpenAjusteModal(prod: ProdutoExtra) {
    setAjustandoProd(prod);
    setTipoAjuste('entrada');
    setValorAjuste('5');
    setIsAjusteModalOpen(true);
  }

  function handleSalvarAjuste(e: React.FormEvent) {
    e.preventDefault();
    if (!ajustandoProd) return;

    const val = parseInt(valorAjuste) || 0;
    const qtdAtual = ajustandoProd.quantidade ?? 0;
    let novaQtd = qtdAtual;

    if (tipoAjuste === 'entrada') {
      novaQtd = Math.max(0, qtdAtual + val);
    } else {
      novaQtd = Math.max(0, val);
    }

    ajustarEstoque.mutate(
      { id: ajustandoProd.id, quantidade: novaQtd },
      {
        onSuccess: () => {
          setIsAjusteModalOpen(false);
          setAjustandoProd(null);
        },
        onError: (err: any) => {
          alert(`Erro ao ajustar estoque: ${err?.message || 'Tente novamente.'}`);
        },
      }
    );
  }

  function handleIncrementarRapido(prod: ProdutoExtra, delta: number) {
    const atual = prod.quantidade ?? 0;
    const novaQtd = Math.max(0, atual + delta);
    ajustarEstoque.mutate({ id: prod.id, quantidade: novaQtd });
  }

  // SE O SALÃO NÃO POSSUI O MÓDULO ESTOQUE ATIVO (Plano Básico / Desativado)
  if (!temModuloEstoque) {
    return (
      <div className="animate-fade-in-up space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between p-4 rounded-3xl bg-card border border-border shadow-xs">
          <div>
            <h1 className="text-base font-bold text-foreground flex items-center gap-2">
              <Package size={20} className="text-accent-light" />
              Controle de Estoque
            </h1>
            <p className="text-xs text-muted">
              Gestão de inventário e baixa automática no fechamento de comandas
            </p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
            <Lock size={12} />
            Módulo PRO
          </span>
        </div>

        {/* Lock Banner Card */}
        <div className="rounded-3xl bg-gradient-to-br from-card via-card/90 to-background border border-border p-6 sm:p-8 text-center space-y-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center mx-auto text-white shadow-lg shadow-purple-500/30">
            <Package size={32} />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-xl font-extrabold text-foreground">
              Controle de Estoque Inteligente
            </h2>
            <p className="text-xs sm:text-sm text-muted leading-relaxed">
              No Plano Básico, seus produtos extras são cadastrados na aba{' '}
              <strong className="text-foreground">Ajustes</strong>. Ao assinar o{' '}
              <strong className="text-purple-400">Plano PRO</strong>, você ganha controle em tempo real de unidades, alertas de estoque baixo e baixa automática na comanda.
            </p>
          </div>

          {/* Vantagens PRO */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left max-w-lg mx-auto">
            <div className="p-3.5 rounded-2xl bg-card border border-border/80 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-accent">
                <Check size={14} />
                <span>Baixa Automática</span>
              </div>
              <p className="text-[11px] text-muted">
                Cada produto extra vendido no checkout reduz o estoque na hora.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-card border border-border/80 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                <Check size={14} />
                <span>Alerta de Reposição</span>
              </div>
              <p className="text-[11px] text-muted">
                Avisos automáticos quando itens estiverem perto do fim ou esgotados.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-card border border-border/80 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400">
                <Check size={14} />
                <span>Lucro & Custo</span>
              </div>
              <p className="text-[11px] text-muted">
                Acompanhe o custo de compra vs valor de venda de cada cosmético.
              </p>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setIsAssinaturaModalOpen(true)}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-accent to-purple-600 text-white text-xs font-bold shadow-lg shadow-purple-500/25 hover:opacity-95 transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles size={16} />
              Assinar Plano PRO com Estoque
            </button>

            <Link
              href="/ajustes"
              className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-card border border-border text-xs font-semibold text-foreground hover:bg-card-hover transition-all text-center"
            >
              Continuar com Produtos Extras em Ajustes
            </Link>
          </div>
        </div>

        <AssinaturaModal
          isOpen={isAssinaturaModalOpen}
          onClose={() => setIsAssinaturaModalOpen(false)}
        />
      </div>
    );
  }

  // TELA DO MÓDULO ESTOQUE ATIVO (Plano PRO)
  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl bg-card border border-border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shrink-0">
              <Package size={18} />
            </div>
            <div>
              <h1 className="text-base font-bold text-foreground">
                Controle de Estoque
              </h1>
              <p className="text-xs text-muted">
                Inventário de produtos, cosméticos e controle de reposição
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            className="p-2.5 rounded-2xl bg-card border border-border text-muted hover:text-foreground transition-colors cursor-pointer"
            title="Atualizar estoque"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>

          <button
            onClick={handleOpenNovoProduto}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-accent text-white text-xs font-bold shadow-lg shadow-accent/20 hover:bg-accent/90 transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={16} />
            Novo Produto
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total de Itens */}
        <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted">Total de Produtos</span>
            <Boxes size={16} className="text-purple-400" />
          </div>
          <p className="text-2xl font-extrabold text-foreground">{stats.totalItens}</p>
          <p className="text-[10px] text-muted">itens cadastrados</p>
        </div>

        {/* Unidades em Estoque */}
        <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted">Unidades Físicas</span>
            <Layers size={16} className="text-sky-400" />
          </div>
          <p className="text-2xl font-extrabold text-foreground">{stats.totalUnidades}</p>
          <p className="text-[10px] text-muted">unidades no salão</p>
        </div>

        {/* Valor em Estoque */}
        <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted">Valor em Venda</span>
            <DollarSign size={16} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-extrabold text-foreground">
            {formatCurrency(stats.valorTotalVenda)}
          </p>
          <p className="text-[10px] text-muted">potencial de faturamento</p>
        </div>

        {/* Alerta de Estoque Baixo */}
        <div className={`p-4 rounded-2xl border space-y-1 ${
          stats.produtosEstoqueBaixo > 0
            ? 'bg-amber-500/10 border-amber-500/30'
            : 'bg-card border-border'
        }`}>
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-semibold ${
              stats.produtosEstoqueBaixo > 0 ? 'text-amber-400' : 'text-muted'
            }`}>
              Estoque Baixo
            </span>
            <AlertTriangle size={16} className={stats.produtosEstoqueBaixo > 0 ? 'text-amber-400' : 'text-muted'} />
          </div>
          <p className={`text-2xl font-extrabold ${
            stats.produtosEstoqueBaixo > 0 ? 'text-amber-400' : 'text-foreground'
          }`}>
            {stats.produtosEstoqueBaixo}
          </p>
          <p className="text-[10px] text-muted">
            {stats.produtosZerados > 0 ? `${stats.produtosZerados} esgotado(s)` : 'precisam de reposição'}
          </p>
        </div>
      </div>

      {/* FILTROS & BUSCA */}
      <div className="p-4 rounded-3xl bg-card border border-border space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Buscar por nome do produto ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-background border border-border text-xs text-foreground focus:outline-none focus:border-accent"
            />
          </div>

          <button
            onClick={() => setApenasEstoqueBaixo(!apenasEstoqueBaixo)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              apenasEstoqueBaixo
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'bg-background border border-border text-muted hover:text-foreground'
            }`}
          >
            <AlertTriangle size={14} />
            <span>Apenas Estoque Baixo</span>
          </button>
        </div>

        {/* Categorias Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategoria('todas')}
            className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-colors cursor-pointer ${
              selectedCategoria === 'todas'
                ? 'bg-accent text-white'
                : 'bg-background border border-border text-muted hover:text-foreground'
            }`}
          >
            Todas ({produtos.length})
          </button>
          {categoriasDisponiveis.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategoria(cat)}
              className={`px-3 py-1.5 rounded-xl font-semibold shrink-0 transition-colors cursor-pointer ${
                selectedCategoria === cat
                  ? 'bg-accent text-white'
                  : 'bg-background border border-border text-muted hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* LISTAGEM DE PRODUTOS */}
      {isLoading ? (
        <div className="text-center py-12 text-sm text-muted animate-pulse">
          Carregando produtos do estoque...
        </div>
      ) : produtosFiltrados.length === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-3xl p-6 space-y-3">
          <ShoppingBag size={36} className="text-muted mx-auto" />
          <h3 className="text-sm font-bold text-foreground">Nenhum produto encontrado</h3>
          <p className="text-xs text-muted max-w-sm mx-auto">
            {searchTerm || apenasEstoqueBaixo || selectedCategoria !== 'todas'
              ? 'Nenhum item corresponde aos filtros selecionados. Tente limpar a busca.'
              : 'Cadastre produtos cosméticos, itens de revenda ou insumos para controlar a quantidade.'}
          </p>
          <button
            onClick={handleOpenNovoProduto}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-accent text-white text-xs font-bold hover:bg-accent/90 transition-all cursor-pointer"
          >
            <Plus size={14} />
            Adicionar Primeiro Produto
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {produtosFiltrados.map((prod) => {
            const qtd = prod.quantidade ?? 0;
            const min = prod.estoque_minimo ?? 2;
            const isZerado = qtd <= 0;
            const isBaixo = qtd <= min && !isZerado;

            const margemPct =
              prod.custo && prod.custo > 0 && prod.preco > prod.custo
                ? Math.round(((prod.preco - prod.custo) / prod.preco) * 100)
                : null;

            return (
              <div
                key={prod.id}
                className="p-4 rounded-2xl bg-card border border-border flex flex-col justify-between gap-3 hover:border-accent/30 transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-accent/10 text-accent">
                        {prod.categoria || 'Geral'}
                      </span>
                      <h3 className="font-bold text-sm text-foreground mt-1 line-clamp-1">
                        {prod.nome}
                      </h3>
                    </div>

                    {/* Stock Status Badge */}
                    <span
                      className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 ${
                        isZerado
                          ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          : isBaixo
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isZerado ? (
                        <>
                          <AlertTriangle size={10} />
                          Esgotado
                        </>
                      ) : isBaixo ? (
                        <>
                          <AlertTriangle size={10} />
                          {qtd} un (Baixo)
                        </>
                      ) : (
                        <>
                          <Check size={10} />
                          {qtd} un em estoque
                        </>
                      )}
                    </span>
                  </div>

                  {/* Preços e Valores */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded-xl bg-background border border-border/60">
                      <p className="text-[10px] text-muted">Preço de Venda</p>
                      <p className="font-extrabold text-foreground">{formatCurrency(prod.preco)}</p>
                    </div>

                    <div className="p-2 rounded-xl bg-background border border-border/60">
                      <p className="text-[10px] text-muted">
                        Custo Unit. {margemPct !== null && <span className="text-emerald-400">({margemPct}% margem)</span>}
                      </p>
                      <p className="font-semibold text-muted">
                        {prod.custo ? formatCurrency(prod.custo) : 'Não informado'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Controls: Quick Stock Adjustment & Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50 gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold text-muted mr-1">Qtd:</span>
                    <button
                      onClick={() => handleIncrementarRapido(prod, -1)}
                      disabled={qtd <= 0}
                      className="w-7 h-7 rounded-lg bg-background border border-border text-foreground hover:bg-card-hover flex items-center justify-center disabled:opacity-40 transition-all active:scale-90 cursor-pointer"
                      title="Diminuir 1 unidade"
                    >
                      -
                    </button>
                    <span className="text-xs font-bold text-foreground w-6 text-center">
                      {qtd}
                    </span>
                    <button
                      onClick={() => handleIncrementarRapido(prod, 1)}
                      className="w-7 h-7 rounded-lg bg-background border border-border text-foreground hover:bg-card-hover flex items-center justify-center transition-all active:scale-90 cursor-pointer"
                      title="Adicionar 1 unidade"
                    >
                      +
                    </button>
                    <button
                      onClick={() => handleOpenAjusteModal(prod)}
                      className="text-[10px] font-bold text-accent hover:underline ml-1 cursor-pointer"
                    >
                      Entrada / Ajuste
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleEditProduto(prod)}
                      className="w-7 h-7 rounded-lg bg-background border border-border text-muted hover:text-foreground flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                      title="Editar dados do produto"
                    >
                      <Pencil size={13} />
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Deseja realmente excluir o produto "${prod.nome}"?`)) {
                          deletarProduto.mutate(prod.id);
                        }
                      }}
                      className="w-7 h-7 rounded-lg bg-danger/10 text-danger hover:bg-danger/20 flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                      title="Excluir produto"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: CRIAR / EDITAR PRODUTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-md bg-card border border-border rounded-3xl p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent-light flex items-center justify-center">
                  <Package size={16} />
                </div>
                <h3 className="font-bold text-base text-foreground">
                  {editingProd ? 'Editar Produto' : 'Novo Produto para Estoque'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center text-muted hover:text-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmitProduto} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-muted mb-1">
                  Nome do Produto / Cosmético <span className="text-accent">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Máscara Nutritiva 500g"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">
                    Preço de Venda (R$) <span className="text-accent">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="45.00"
                    value={preco}
                    onChange={(e) => setPreco(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">
                    Preço de Custo (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="20.00"
                    value={custo}
                    onChange={(e) => setCusto(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1">
                  Categoria
                </label>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-accent"
                >
                  <option value="Cabelo">Cabelo</option>
                  <option value="Barba">Barba</option>
                  <option value="Tratamento">Tratamento</option>
                  <option value="Unhas">Unhas</option>
                  <option value="Estética">Estética</option>
                  <option value="Bebidas">Bebidas</option>
                  <option value="Insumos">Insumos de Uso Interno</option>
                  <option value="Outros">Outros / Geral</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-background border border-border/80">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Qtd em Estoque
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="10"
                    value={quantidade}
                    onChange={(e) => setQuantidade(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs text-foreground focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Estoque Mínimo (Alerta)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="3"
                    value={estoqueMinimo}
                    onChange={(e) => setEstoqueMinimo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-card border border-border text-xs text-foreground focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted hover:bg-card-hover cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={criarProduto.isPending || atualizarProduto.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-accent text-xs font-bold text-white hover:bg-accent/90 disabled:opacity-50 cursor-pointer shadow-md shadow-accent/20"
                >
                  {editingProd
                    ? (atualizarProduto.isPending ? 'Atualizando...' : 'Atualizar Produto')
                    : (criarProduto.isPending ? 'Salvando...' : 'Cadastrar Produto')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AJUSTE RÁPIDO / ENTRADA DE MERCADORIA */}
      {isAjusteModalOpen && ajustandoProd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-card border border-border rounded-3xl p-6 space-y-4 shadow-2xl animate-scale-up">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-foreground">
                  Ajuste de Estoque
                </h3>
                <p className="text-xs text-muted line-clamp-1">{ajustandoProd.nome}</p>
              </div>
              <button
                onClick={() => setIsAjusteModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-card border border-border flex items-center justify-center text-muted hover:text-foreground cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-background border border-border/80 flex items-center justify-between">
              <span className="text-xs text-muted">Estoque atual:</span>
              <span className="text-sm font-extrabold text-foreground">
                {ajustandoProd.quantidade ?? 0} unidades
              </span>
            </div>

            <form onSubmit={handleSalvarAjuste} className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTipoAjuste('entrada')}
                  className={`py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    tipoAjuste === 'entrada'
                      ? 'bg-purple-600 text-white'
                      : 'bg-background border border-border text-muted'
                  }`}
                >
                  + Entrada (Adicionar)
                </button>
                <button
                  type="button"
                  onClick={() => setTipoAjuste('definir')}
                  className={`py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    tipoAjuste === 'definir'
                      ? 'bg-purple-600 text-white'
                      : 'bg-background border border-border text-muted'
                  }`}
                >
                  = Definir Novo Total
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted mb-1">
                  {tipoAjuste === 'entrada'
                    ? 'Quantidade recebida (Entrada)'
                    : 'Nova quantidade total em estoque'}
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="5"
                  value={valorAjuste}
                  onChange={(e) => setValorAjuste(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAjusteModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-border text-xs font-semibold text-muted hover:bg-card-hover cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={ajustarEstoque.isPending}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-50 cursor-pointer shadow-md shadow-purple-600/20"
                >
                  {ajustarEstoque.isPending ? 'Salvando...' : 'Confirmar Ajuste'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
