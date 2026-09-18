export type MovementType = 'entrada' | 'saida' | 'ajuste';

export type StockStatus = 'ok' | 'baixo' | 'critico' | 'zerado';

export interface LocationDetail {
  sala: string;
  armario: string;
  prateleira: string;
  posicao?: string;
}

export interface Item {
  id: string;
  nome: string;
  categoria: string;
  subcategoria?: string;
  tags?: string[];
  localizacao: LocationDetail;
  quantidadeAtual: number;
  unidadeMedida: string;
  quantidadeMinima: number;
  quantidadeIdeal: number;
  fornecedor?: string;
  precoUnitario?: number;
  fotoUrl?: string;
  observacoes?: string;
  dataCadastro: string; // ISO format string
  dataUltimaAtualizacao: string; // ISO format string
}

export interface Movement {
  id: string;
  itemId: string;
  itemNome?: string;
  itemCategoria?: string;
  tipo: MovementType;
  quantidade: number;
  quantidadeAnterior?: number;
  quantidadeApos?: number;
  motivo: string;
  responsavel?: string;
  data: string; // ISO format string
}

export interface Category {
  id: string;
  nome: string;
  descricao?: string;
  subcategorias: string[];
  icone?: string;
  cor?: string;
}

export interface LabLocation {
  id: string;
  sala: string;
  armarios: {
    nome: string;
    prateleiras: string[];
  }[];
}

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
}
