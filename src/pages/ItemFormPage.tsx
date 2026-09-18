import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useInventory } from '../context/InventoryContext';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import {
  Save,
  ArrowLeft,
  Package,
  MapPin,
  Tag,
  DollarSign,
  Info,
  Image as ImageIcon,
  X,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

const COMMON_UNITS = [
  'un',
  'caixa',
  'rolo',
  'pacote',
  'm',
  'cm',
  'kg',
  'g',
  'L',
  'ml',
  'par',
  'kit',
];

const PRESET_IMAGES = [
  { label: 'Eletrônicos / CI', url: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=500&auto=format&fit=crop&q=60' },
  { label: 'Arduino / Placa', url: 'https://images.unsplash.com/photo-1553406830-ef2513450d76?w=500&auto=format&fit=crop&q=60' },
  { label: 'Multímetro / Medição', url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=500&auto=format&fit=crop&q=60' },
  { label: 'Solda / Bancada', url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=60' },
  { label: 'Filamento 3D', url: 'https://images.unsplash.com/photo-1612815154858-60aa4c59eaa6?w=500&auto=format&fit=crop&q=60' },
  { label: 'Parafusos / Mecânica', url: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=500&auto=format&fit=crop&q=60' },
  { label: 'Química / Limpeza', url: 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=500&auto=format&fit=crop&q=60' },
  { label: 'EPIs / Luvas', url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=500&auto=format&fit=crop&q=60' },
];

export const ItemFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const { showToast } = useToast();
  const { items, categories, locations, addItem, updateItem, getItem } = useInventory();

  // Form State
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [subcategoria, setSubcategoria] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  
  // Location
  const [sala, setSala] = useState('');
  const [armario, setArmario] = useState('');
  const [prateleira, setPrateleira] = useState('');
  const [posicao, setPosicao] = useState('');

  // Stock Quantities
  const [quantidadeAtual, setQuantidadeAtual] = useState<number>(10);
  const [unidadeMedida, setUnidadeMedida] = useState('un');
  const [quantidadeMinima, setQuantidadeMinima] = useState<number>(5);
  const [quantidadeIdeal, setQuantidadeIdeal] = useState<number>(20);

  // Financial & Details
  const [fornecedor, setFornecedor] = useState('');
  const [precoUnitario, setPrecoUnitario] = useState<string>('');
  const [fotoUrl, setFotoUrl] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Errors state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If editing, load item data
  useEffect(() => {
    if (isEditing && id) {
      const existing = getItem(id);
      if (existing) {
        setNome(existing.nome);
        setCategoria(existing.categoria);
        setSubcategoria(existing.subcategoria || '');
        setTags(existing.tags || []);
        setSala(existing.localizacao.sala);
        setArmario(existing.localizacao.armario);
        setPrateleira(existing.localizacao.prateleira);
        setPosicao(existing.localizacao.posicao || '');
        setQuantidadeAtual(existing.quantidadeAtual);
        setUnidadeMedida(existing.unidadeMedida);
        setQuantidadeMinima(existing.quantidadeMinima);
        setQuantidadeIdeal(existing.quantidadeIdeal);
        setFornecedor(existing.fornecedor || '');
        setPrecoUnitario(existing.precoUnitario !== undefined ? existing.precoUnitario.toString() : '');
        setFotoUrl(existing.fotoUrl || '');
        setObservacoes(existing.observacoes || '');
      } else {
        showToast('Item não encontrado', 'O item solicitado para edição não foi encontrado.', 'error');
        navigate('/estoque');
      }
    } else {
      if (categories.length > 0 && !categoria) {
        setCategoria(categories[0].nome);
      }
      if (locations.length > 0 && !sala) {
        setSala(locations[0].sala);
        if (locations[0].armarios.length > 0) {
          setArmario(locations[0].armarios[0].nome);
          if (locations[0].armarios[0].prateleiras.length > 0) {
            setPrateleira(locations[0].armarios[0].prateleiras[0]);
          }
        }
      }
    }
  }, [isEditing, id, categories, locations]);

  const currentSubcategories = categories.find((c) => c.nome === categoria)?.subcategorias || [];
  const currentCabinets = locations.find((l) => l.sala === sala)?.armarios || [];
  const currentShelves = currentCabinets.find((a) => a.nome === armario)?.prateleiras || [];

  const handleAddTag = () => {
    if (tagInput.trim()) {
      const clean = tagInput.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
        setTagInput('');
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!nome.trim()) newErrors.nome = 'O nome do item é obrigatório.';
    if (!categoria) newErrors.categoria = 'Selecione uma categoria.';
    if (!sala.trim()) newErrors.sala = 'Informe a sala do laboratório.';
    if (!armario.trim()) newErrors.armario = 'Informe o armário ou bancada.';
    if (!prateleira.trim()) newErrors.prateleira = 'Informe a prateleira ou nicho.';
    if (!unidadeMedida.trim()) newErrors.unidadeMedida = 'Informe a unidade de medida.';
    if (quantidadeMinima < 0) newErrors.quantidadeMinima = 'A quantidade mínima não pode ser negativa.';
    if (quantidadeIdeal < quantidadeMinima) {
      newErrors.quantidadeIdeal = 'A quantidade ideal deve ser maior ou igual à quantidade mínima.';
    }
    if (!isEditing && quantidadeAtual < 0) {
      newErrors.quantidadeAtual = 'A quantidade inicial não pode ser negativa.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Campos pendentes', 'Verifique os campos obrigatórios destacados em vermelho.', 'warning');
      return;
    }

    setIsSubmitting(true);

    const parsedPrice = precoUnitario ? parseFloat(precoUnitario.replace(',', '.')) : undefined;

    const itemData = {
      nome: nome.trim(),
      categoria,
      subcategoria: subcategoria.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
      localizacao: {
        sala: sala.trim(),
        armario: armario.trim(),
        prateleira: prateleira.trim(),
        posicao: posicao.trim() || undefined,
      },
      quantidadeAtual: Number(quantidadeAtual),
      unidadeMedida: unidadeMedida.trim(),
      quantidadeMinima: Number(quantidadeMinima),
      quantidadeIdeal: Number(quantidadeIdeal),
      fornecedor: fornecedor.trim() || undefined,
      precoUnitario: !isNaN(Number(parsedPrice)) ? Number(parsedPrice) : undefined,
      fotoUrl: fotoUrl.trim() || undefined,
      observacoes: observacoes.trim() || undefined,
    };

    try {
      if (isEditing && id) {
        const { quantidadeAtual: _, ...updateData } = itemData;
        const success = await updateItem(id, updateData);
        setIsSubmitting(false);

        if (success) {
          showToast('Cadastro atualizado!', `O item ${nome} foi atualizado com sucesso no servidor.`, 'success');
          navigate('/estoque');
        } else {
          showToast('Erro ao atualizar', 'Não foi possível salvar as alterações.', 'error');
        }
      } else {
        const newItem = await addItem(itemData);
        setIsSubmitting(false);
        showToast('Item cadastrado!', `O item ${newItem.nome} foi salvo no servidor sob o código ${newItem.id}.`, 'success');
        navigate('/estoque');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      showToast('Erro ao salvar item', err.message || 'Falha na comunicação com o servidor SQLite.', 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/estoque')}
            className="p-2 rounded-xl text-slate-500 hover:text-purple-700 hover:bg-purple-50 transition-colors"
            title="Voltar ao estoque"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              {isEditing ? `Editar Item: ${nome || id}` : 'Cadastrar Novo Item'}{' '}
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                STEM CRIAR
              </span>
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {isEditing
                ? `Código do item: ${id} (ajustes de saldo físico devem ser feitos via Movimentações)`
                : 'Preencha os dados do material ou componente para inclusão no estoque'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Identification */}
        <Card
          title="1. Identificação do Material"
          subtitle="Dados principais de catálogo e categorização"
          icon={<Package className="w-5 h-5 text-purple-600" />}
        >
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Nome Completo do Item / Componente *
              </label>
              <input
                type="text"
                placeholder="Ex: Microcontrolador ESP32 NodeMCU Wi-Fi 30 Pinos"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.nome ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                }`}
              />
              {errors.nome && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.nome}</p>}
            </div>

            {/* Category & Subcategory */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Categoria *
                </label>
                <select
                  value={categoria}
                  onChange={(e) => {
                    setCategoria(e.target.value);
                    setSubcategoria('');
                  }}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm bg-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    errors.categoria ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                  }`}
                >
                  <option value="">Selecione uma categoria...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.nome}>
                      {c.nome}
                    </option>
                  ))}
                </select>
                {errors.categoria && (
                  <p className="text-xs text-rose-600 mt-1 font-medium">{errors.categoria}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Subcategoria (Opcional)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="subcategories-list"
                    placeholder="Selecione ou digite..."
                    value={subcategoria}
                    onChange={(e) => setSubcategoria(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <datalist id="subcategories-list">
                    {currentSubcategories.map((sub) => (
                      <option key={sub} value={sub} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            {/* Tags Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Tags para Busca Rápida (Pressione Enter ou clique em Adicionar)
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: arduino, sensor, 5v, smd, i2c..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
                <Button type="button" variant="secondary" size="md" onClick={handleAddTag}>
                  Adicionar Tag
                </Button>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-semibold border border-purple-200"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Section 2: Physical Location */}
        <Card
          title="2. Localização Física no Laboratório"
          subtitle="Onde o operador ou aluno encontrará o item nas bancadas STEM CRIAR"
          icon={<MapPin className="w-5 h-5 text-purple-600" />}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* Sala */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Sala / Laboratório *
              </label>
              <input
                type="text"
                list="salas-list"
                placeholder="Ex: Lab Principal 101"
                value={sala}
                onChange={(e) => {
                  setSala(e.target.value);
                  setArmario('');
                  setPrateleira('');
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.sala ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                }`}
              />
              <datalist id="salas-list">
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.sala} />
                ))}
              </datalist>
              {errors.sala && <p className="text-xs text-rose-600 mt-1 font-medium">{errors.sala}</p>}
            </div>

            {/* Armário */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Armário / Bancada *
              </label>
              <input
                type="text"
                list="armarios-list"
                placeholder="Ex: Armário A (Eletrônica)"
                value={armario}
                onChange={(e) => {
                  setArmario(e.target.value);
                  setPrateleira('');
                }}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.armario ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                }`}
              />
              <datalist id="armarios-list">
                {currentCabinets.map((arm) => (
                  <option key={arm.nome} value={arm.nome} />
                ))}
              </datalist>
              {errors.armario && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{errors.armario}</p>
              )}
            </div>

            {/* Prateleira */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Prateleira / Nível *
              </label>
              <input
                type="text"
                list="prateleiras-list"
                placeholder="Ex: Prateleira 2"
                value={prateleira}
                onChange={(e) => setPrateleira(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  errors.prateleira ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                }`}
              />
              <datalist id="prateleiras-list">
                {currentShelves.map((p) => (
                  <option key={p} value={p} />
                ))}
              </datalist>
              {errors.prateleira && (
                <p className="text-xs text-rose-600 mt-1 font-medium">{errors.prateleira}</p>
              )}
            </div>

            {/* Posição / Gaveta */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Posição / Gaveta (Opcional)
              </label>
              <input
                type="text"
                placeholder="Ex: Gaveta A2-03, Caixa 4"
                value={posicao}
                onChange={(e) => setPosicao(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
        </Card>

        {/* Section 3: Stock Control & Levels */}
        <Card
          title="3. Níveis de Estoque e Unidade"
          subtitle="Parâmetros para cálculo automático de alertas de reposição"
          icon={<Tag className="w-5 h-5 text-amber-500" />}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {/* Quantidade Atual */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {isEditing ? 'Quantidade Atual' : 'Quantidade Inicial *'}
                </label>
                <input
                  type="number"
                  min="0"
                  disabled={isEditing}
                  value={quantidadeAtual}
                  onChange={(e) => setQuantidadeAtual(parseInt(e.target.value) || 0)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-bold ${
                    isEditing
                      ? 'bg-slate-100 text-slate-600 cursor-not-allowed border-slate-200'
                      : 'border-slate-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'
                  }`}
                />
                {isEditing ? (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Bloqueado para edição. Use <strong>Movimentações</strong> para alterar o saldo.
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1">Estoque físico presente.</p>
                )}
              </div>

              {/* Unidade de Medida */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Unidade de Medida *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    list="units-list"
                    placeholder="Ex: un, rolo, caixa..."
                    value={unidadeMedida}
                    onChange={(e) => setUnidadeMedida(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <datalist id="units-list">
                    {COMMON_UNITS.map((u) => (
                      <option key={u} value={u} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Quantidade Mínima (Trigger de Alerta) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Quantidade Mínima (Alerta) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={quantidadeMinima}
                  onChange={(e) => setQuantidadeMinima(parseInt(e.target.value) || 0)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    errors.quantidadeMinima ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                  }`}
                />
                <p className="text-[11px] text-rose-600 mt-1">Gera alerta quando o saldo atingir o valor.</p>
              </div>

              {/* Quantidade Ideal */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Quantidade Ideal (Capacidade) *
                </label>
                <input
                  type="number"
                  min="0"
                  value={quantidadeIdeal}
                  onChange={(e) => setQuantidadeIdeal(parseInt(e.target.value) || 0)}
                  className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                    errors.quantidadeIdeal ? 'border-rose-500 bg-rose-50/20' : 'border-slate-300'
                  }`}
                />
                <p className="text-[11px] text-slate-500 mt-1">Volume recomendado após compras.</p>
              </div>
            </div>

            {errors.quantidadeIdeal && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errors.quantidadeIdeal}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Section 4: Supplier, Cost & Media */}
        <Card
          title="4. Dados Financeiros & Mídia"
          subtitle="Fornecedor de referência, custo unitário e foto do item"
          icon={<DollarSign className="w-5 h-5 text-amber-500" />}
        >
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Fornecedor / Fabricante
                </label>
                <input
                  type="text"
                  placeholder="Ex: Smart Kits, RoboCore, Minipa, 3M..."
                  value={fornecedor}
                  onChange={(e) => setFornecedor(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Preço Unitário Estimado (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">
                    R$
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={precoUnitario}
                    onChange={(e) => setPrecoUnitario(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            {/* Image URL & Preset Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                URL da Imagem / Foto do Produto
              </label>
              <div className="flex flex-col sm:flex-row gap-4 items-start">
                <div className="flex-1 w-full space-y-2">
                  <input
                    type="url"
                    placeholder="https://exemplo.com/foto-do-componente.jpg"
                    value={fotoUrl}
                    onChange={(e) => setFotoUrl(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  />
                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500 font-semibold">Ou escolha uma imagem de exemplo:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {PRESET_IMAGES.map((preset, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setFotoUrl(preset.url)}
                          className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-[11px] text-slate-600 border border-slate-200 transition-colors"
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Preview Box */}
                <div className="w-24 h-24 rounded-2xl border border-slate-200 bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center relative">
                  {fotoUrl ? (
                    <img
                      src={fotoUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-purple-300" />
                  )}
                </div>
              </div>
            </div>

            {/* Observations */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Observações Técnicas / Instruções de Uso
              </label>
              <textarea
                rows={3}
                placeholder="Ex: Armazenar em estufa, manter em embalagem antiestática, testar antes do empréstimo..."
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>
        </Card>

        {/* Submit Actions Bar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button variant="outline" size="md" type="button" onClick={() => navigate('/estoque')}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            size="md"
            type="submit"
            icon={<Save className="w-4 h-4" />}
            isLoading={isSubmitting}
          >
            {isEditing ? 'Salvar Alterações' : 'Cadastrar Item no Estoque'}
          </Button>
        </div>
      </form>
    </div>
  );
};
