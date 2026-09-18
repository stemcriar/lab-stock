import { Item, Category, LabLocation, Movement } from '../types/inventory';

export const DEFAULT_CATEGORIES: Category[] = [
  {
    id: 'cat-1',
    nome: 'Componentes eletrônicos',
    descricao: 'Microcontroladores, sensores, circuitos integrados, semicondutores e passivos.',
    subcategorias: ['Microcontroladores', 'Sensores', 'Displays', 'Passivos', 'Módulos de Comunicação', 'Atuadores'],
    icone: 'Cpu',
    cor: '#3b82f6',
  },
  {
    id: 'cat-2',
    nome: 'Instrumentos de medição',
    descricao: 'Aparelhos de precisão, multímetros, osciloscópios e analisadores.',
    subcategorias: ['Multímetros', 'Osciloscópios', 'Fontes de Bancada', 'Geradores de Funções', 'Instrumentos Mecânicos'],
    icone: 'Gauge',
    cor: '#06b6d4',
  },
  {
    id: 'cat-3',
    nome: 'Materiais de impressão 3D / prototipagem',
    descricao: 'Filamentos FDM, resinas SLA, placas virgens e insumos para fabricação rápida.',
    subcategorias: ['Filamentos PLA', 'Filamentos PETG / ABS', 'Resinas 3D', 'Placas Fenolite / Fibra', 'Bicos e Peças de Impressora'],
    icone: 'Layers',
    cor: '#8b5cf6',
  },
  {
    id: 'cat-4',
    nome: 'Materiais elétricos/mecânicos',
    descricao: 'Fios, cabos, bornes, conectores, parafusos, porcas e fixadores.',
    subcategorias: ['Parafusos e Porcas', 'Cabos e Fios', 'Conectores', 'Chaves e Relés', 'Dissipadores'],
    icone: 'Nut',
    cor: '#f59e0b',
  },
  {
    id: 'cat-5',
    nome: 'Ferramentas',
    descricao: 'Equipamentos manuais e estações de bancada.',
    subcategorias: ['Ferramentas de Solda', 'Alicates e Chaves', 'Equipamentos de Corte', 'Furadeiras e Retíficas'],
    icone: 'Wrench',
    cor: '#10b981',
  },
  {
    id: 'cat-6',
    nome: 'Consumíveis/descartáveis',
    descricao: 'Fitas, pastas térmicas, tubos termoretráteis, soldas e EPIs descartáveis.',
    subcategorias: ['Fitas e Adesivos', 'Soldas e Fluxos', 'EPIs Descartáveis', 'Termoretráteis'],
    icone: 'Package',
    cor: '#ec4899',
  },
  {
    id: 'cat-7',
    nome: 'Produtos de limpeza',
    descricao: 'Solventes técnicos, panos antiestáticos e itens de sanitização.',
    subcategorias: ['Solventes Químicos', 'Panos e Papéis', 'Desengraxantes', 'Sabões Neutros'],
    icone: 'Sparkles',
    cor: '#14b8a6',
  },
  {
    id: 'cat-8',
    nome: 'Materiais administrativos',
    descricao: 'Etiquetas térmicas, organizadores, canetas de bancada e papéis.',
    subcategorias: ['Etiquetagem', 'Organizadores', 'Escrita e Papelaria'],
    icone: 'FolderCheck',
    cor: '#64748b',
  },
];

export const DEFAULT_LOCATIONS: LabLocation[] = [
  {
    id: 'loc-1',
    sala: 'Sala de Estudos',
    armarios: [
      { nome: 'Armário A', prateleiras: ['01', '02', '03', '04', '05', '06', '07', '08'] },
      { nome: 'Armário B', prateleiras: ['01', '02', '03', '04', '05', '06', '07', '08'] },
      { nome: 'Armário C', prateleiras: ['01', '02', '03', '04', '05', '06', '07', '08'] }
    ]
  },
  {
    id: 'loc-2',
    sala: 'Sala de Máquinas',
    armarios: [
      { nome: 'Armário D', prateleiras: ['01', '02', '03', '04', '05', '06', '07', '08'] },
      { nome: 'Armário E', prateleiras: ['01', '02', '03', '04', '05', '06', '07', '08'] }
    ]
  },
  {
    id: 'loc-3',
    sala: 'Estúdio',
    armarios: [
      { nome: 'Armário F', prateleiras: ['01', '02', '03', '04', '05', '06', '07', '08'] },
      { nome: 'Armário G', prateleiras: ['01', '02', '03', '04', '05', '06', '07', '08'] }
    ]
  }
];

// Base limpa sem itens ou movimentações mockadas para início de cadastro real do laboratório
export const DEFAULT_ITEMS: Item[] = [];

export const DEFAULT_MOVEMENTS: Movement[] = [];
