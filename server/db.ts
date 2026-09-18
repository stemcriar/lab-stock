import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure server directory exists
const dbDir = __dirname;
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'database.sqlite');
export const db = new DatabaseSync(dbPath);

// Initialize schema
export function initDatabase() {
  db.exec('PRAGMA foreign_keys = ON;');

  // Items Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      categoria TEXT NOT NULL,
      subcategoria TEXT,
      tags TEXT,
      localizacao TEXT NOT NULL,
      quantidadeAtual INTEGER NOT NULL DEFAULT 0,
      unidadeMedida TEXT NOT NULL,
      quantidadeMinima INTEGER NOT NULL DEFAULT 0,
      quantidadeIdeal INTEGER NOT NULL DEFAULT 0,
      fornecedor TEXT,
      precoUnitario REAL,
      fotoUrl TEXT,
      observacoes TEXT,
      dataCadastro TEXT NOT NULL,
      dataUltimaAtualizacao TEXT NOT NULL
    );
  `);

  // Movements Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS movements (
      id TEXT PRIMARY KEY,
      itemId TEXT NOT NULL,
      itemNome TEXT,
      itemCategoria TEXT,
      tipo TEXT NOT NULL,
      quantidade INTEGER NOT NULL,
      quantidadeAnterior INTEGER,
      quantidadeApos INTEGER,
      motivo TEXT NOT NULL,
      responsavel TEXT,
      data TEXT NOT NULL
    );
  `);

  // Categories Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL UNIQUE,
      descricao TEXT,
      subcategorias TEXT,
      icone TEXT,
      cor TEXT
    );
  `);

  // Locations Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      sala TEXT NOT NULL UNIQUE,
      armarios TEXT
    );
  `);

  // Seed default categories if table is empty
  const catCountResult = db.prepare('SELECT COUNT(*) as count FROM categories').get() as { count: number };
  if (catCountResult.count === 0) {
    const defaultCategories = [
      {
        id: 'cat-1',
        nome: 'Componentes eletrônicos',
        descricao: 'Microcontroladores, sensores, circuitos integrados, semicondutores e passivos.',
        subcategorias: JSON.stringify(['Microcontroladores', 'Sensores', 'Displays', 'Passivos', 'Módulos de Comunicação', 'Atuadores']),
        icone: 'Cpu',
        cor: '#7c3aed',
      },
      {
        id: 'cat-2',
        nome: 'Instrumentos de medição',
        descricao: 'Aparelhos de precisão, multímetros, osciloscópios e analisadores.',
        subcategorias: JSON.stringify(['Multímetros', 'Osciloscópios', 'Fontes de Bancada', 'Geradores de Funções', 'Instrumentos Mecânicos']),
        icone: 'Gauge',
        cor: '#9333ea',
      },
      {
        id: 'cat-3',
        nome: 'Materiais de impressão 3D / prototipagem',
        descricao: 'Filamentos FDM, resinas SLA, placas virgens e insumos para fabricação rápida.',
        subcategorias: JSON.stringify(['Filamentos PLA', 'Filamentos PETG / ABS', 'Resinas 3D', 'Placas Fenolite / Fibra', 'Bicos e Peças de Impressora']),
        icone: 'Layers',
        cor: '#f59e0b',
      },
      {
        id: 'cat-4',
        nome: 'Materiais elétricos/mecânicos',
        descricao: 'Fios, cabos, bornes, conectores, parafusos, porcas e fixadores.',
        subcategorias: JSON.stringify(['Parafusos e Porcas', 'Cabos e Fios', 'Conectores', 'Chaves e Relés', 'Dissipadores']),
        icone: 'Nut',
        cor: '#d97706',
      },
      {
        id: 'cat-5',
        nome: 'Ferramentas',
        descricao: 'Equipamentos manuais e estações de bancada.',
        subcategorias: JSON.stringify(['Ferramentas de Solda', 'Alicates e Chaves', 'Equipamentos de Corte', 'Furadeiras e Retíficas']),
        icone: 'Wrench',
        cor: '#10b981',
      },
      {
        id: 'cat-6',
        nome: 'Consumíveis/descartáveis',
        descricao: 'Fitas, pastas térmicas, tubos termoretráteis, soldas e EPIs descartáveis.',
        subcategorias: JSON.stringify(['Fitas e Adesivos', 'Soldas e Fluxos', 'EPIs Descartáveis', 'Termoretráteis']),
        icone: 'Package',
        cor: '#ec4899',
      },
      {
        id: 'cat-7',
        nome: 'Produtos de limpeza',
        descricao: 'Solventes técnicos, panos antiestáticos e itens de sanitização.',
        subcategorias: JSON.stringify(['Solventes Químicos', 'Panos e Papéis', 'Desengraxantes', 'Sabões Neutros']),
        icone: 'Sparkles',
        cor: '#14b8a6',
      },
      {
        id: 'cat-8',
        nome: 'Materiais administrativos',
        descricao: 'Etiquetas térmicas, organizadores, canetas de bancada e papéis.',
        subcategorias: JSON.stringify(['Etiquetagem', 'Organizadores', 'Escrita e Papelaria']),
        icone: 'FolderCheck',
        cor: '#64748b',
      },
    ];

    const insertCat = db.prepare(`
      INSERT INTO categories (id, nome, descricao, subcategorias, icone, cor)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    for (const c of defaultCategories) {
      insertCat.run(c.id, c.nome, c.descricao, c.subcategorias, c.icone, c.cor);
    }
  }

  // Seed default locations if empty
  const locCountResult = db.prepare('SELECT COUNT(*) as count FROM locations').get() as { count: number };
  if (locCountResult.count === 0) {
    const defaultLocations = [
      {
        id: 'loc-1',
        sala: 'Lab Principal 101',
        armarios: JSON.stringify([
          { nome: 'Armário A (Eletrônica)', prateleiras: ['Prateleira 1 (Topo)', 'Prateleira 2', 'Prateleira 3', 'Prateleira 4 (Base)', 'Gaveteiro Componentes'] },
          { nome: 'Armário B (Instrumentos)', prateleiras: ['Prateleira 1', 'Prateleira 2', 'Prateleira 3', 'Nicho Superior'] },
          { nome: 'Bancada 01', prateleiras: ['Prateleira Suspensa', 'Gaveta Superior', 'Gaveta Inferior'] }
        ]),
      },
      {
        id: 'loc-2',
        sala: 'Lab Prototipagem 102',
        armarios: JSON.stringify([
          { nome: 'Armário C (Filamentos e 3D)', prateleiras: ['Prateleira 1 (Estufa)', 'Prateleira 2 (Insumos)', 'Prateleira 3 (Peças)'] },
          { nome: 'Armário D (Mecânica e Parafusos)', prateleiras: ['Gaveteiro M3', 'Gaveteiro M4/M5', 'Prateleira Ferramentas'] }
        ]),
      },
      {
        id: 'loc-3',
        sala: 'Almoxarifado Central',
        armarios: JSON.stringify([
          { nome: 'Armário E (Estoque Geral)', prateleiras: ['Nível 1', 'Nível 2', 'Nível 3', 'Nível 4'] },
          { nome: 'Armário Q (Químicos & Limpeza)', prateleiras: ['Armário Corta-Fogo', 'Prateleira Inferior'] }
        ]),
      }
    ];

    const insertLoc = db.prepare(`
      INSERT INTO locations (id, sala, armarios)
      VALUES (?, ?, ?)
    `);

    for (const l of defaultLocations) {
      insertLoc.run(l.id, l.sala, l.armarios);
    }
  }

  console.log(`[SQLite] Banco de dados inicializado em ${dbPath}`);
}
