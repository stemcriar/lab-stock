import express, { Request, Response } from 'express';
import cors from 'cors';
import { db, initDatabase } from './db.js';

initDatabase();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

app.use(cors());
app.use(express.json());

// Helper function to format items from SQLite rows
function parseItemRow(row: any) {
  if (!row) return null;
  return {
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : [],
    localizacao: row.localizacao ? JSON.parse(row.localizacao) : { sala: '', armario: '', prateleira: '' },
    quantidadeAtual: Number(row.quantidadeAtual),
    quantidadeMinima: Number(row.quantidadeMinima),
    quantidadeIdeal: Number(row.quantidadeIdeal),
    precoUnitario: row.precoUnitario !== null && row.precoUnitario !== undefined ? Number(row.precoUnitario) : undefined,
  };
}

// Helper to generate IDs
function generateNextItemId(): string {
  const rows = db.prepare("SELECT id FROM items WHERE id LIKE 'ITEM-%'").all() as { id: string }[];
  let maxNumber = 0;
  for (const row of rows) {
    const num = parseInt(row.id.replace('ITEM-', ''), 10);
    if (!isNaN(num) && num > maxNumber) {
      maxNumber = num;
    }
  }
  return `ITEM-${(maxNumber + 1).toString().padStart(3, '0')}`;
}

function generateMovementId(): string {
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(Math.random() * 900 + 100);
  return `MOV-${timestamp}${random}`;
}

// ==========================================
// 1. HEALTH CHECK & INFO
// ==========================================
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    serverTime: new Date().toISOString(),
    lab: 'Laboratório de Prototipagem - STEM CRIAR',
    database: 'SQLite',
  });
});

// ==========================================
// 2. ITENS (ITEMS) ROUTES
// ==========================================

// GET /api/itens - List all items
app.get('/api/itens', (req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT * FROM items ORDER BY dataCadastro DESC').all();
    const items = rows.map(parseItemRow);
    res.json(items);
  } catch (error: any) {
    console.error('Error fetching items:', error);
    res.status(500).json({ error: 'Erro ao buscar itens do estoque.', details: error.message });
  }
});

// GET /api/itens/:id - Get single item
app.get('/api/itens/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const row = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    if (!row) {
      return res.status(404).json({ error: `Item com código ${id} não encontrado.` });
    }
    res.json(parseItemRow(row));
  } catch (error: any) {
    console.error('Error fetching item:', error);
    res.status(500).json({ error: 'Erro ao buscar item.', details: error.message });
  }
});

// POST /api/itens - Create new item
app.post('/api/itens', (req: Request, res: Response) => {
  try {
    const {
      id,
      nome,
      categoria,
      subcategoria,
      tags,
      localizacao,
      quantidadeAtual = 0,
      unidadeMedida,
      quantidadeMinima = 0,
      quantidadeIdeal = 0,
      fornecedor,
      precoUnitario,
      fotoUrl,
      observacoes,
    } = req.body;

    if (!nome || !categoria || !unidadeMedida) {
      return res.status(400).json({ error: 'Nome, categoria e unidade de medida são campos obrigatórios.' });
    }

    const now = new Date().toISOString();
    const finalId = id && id.trim() ? id.trim() : generateNextItemId();

    const tagsJson = Array.isArray(tags) ? JSON.stringify(tags) : JSON.stringify([]);
    const locJson = typeof localizacao === 'object' ? JSON.stringify(localizacao) : JSON.stringify({ sala: '', armario: '', prateleira: '' });

    const insertStmt = db.prepare(`
      INSERT INTO items (
        id, nome, categoria, subcategoria, tags, localizacao,
        quantidadeAtual, unidadeMedida, quantidadeMinima, quantidadeIdeal,
        fornecedor, precoUnitario, fotoUrl, observacoes,
        dataCadastro, dataUltimaAtualizacao
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      finalId,
      nome.trim(),
      categoria.trim(),
      subcategoria ? subcategoria.trim() : null,
      tagsJson,
      locJson,
      Number(quantidadeAtual) || 0,
      unidadeMedida.trim(),
      Number(quantidadeMinima) || 0,
      Number(quantidadeIdeal) || 0,
      fornecedor ? fornecedor.trim() : null,
      precoUnitario !== undefined && precoUnitario !== null && !isNaN(Number(precoUnitario)) ? Number(precoUnitario) : null,
      fotoUrl ? fotoUrl.trim() : null,
      observacoes ? observacoes.trim() : null,
      now,
      now
    );

    // If initial quantity > 0, register initial entry movement automatically
    if (Number(quantidadeAtual) > 0) {
      const movId = generateMovementId();
      const insertMov = db.prepare(`
        INSERT INTO movements (
          id, itemId, itemNome, itemCategoria, tipo,
          quantidade, quantidadeAnterior, quantidadeApos,
          motivo, responsavel, data
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      insertMov.run(
        movId,
        finalId,
        nome.trim(),
        categoria.trim(),
        'entrada',
        Number(quantidadeAtual),
        0,
        Number(quantidadeAtual),
        'Cadastro inicial de item no estoque',
        'Sistema',
        now
      );
    }

    const createdRow = db.prepare('SELECT * FROM items WHERE id = ?').get(finalId);
    res.status(201).json(parseItemRow(createdRow));
  } catch (error: any) {
    console.error('Error creating item:', error);
    res.status(500).json({ error: 'Erro ao cadastrar item no SQLite.', details: error.message });
  }
});

// PUT /api/itens/:id - Update item
app.put('/api/itens/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Item não encontrado para atualização.' });
    }

    const {
      nome,
      categoria,
      subcategoria,
      tags,
      localizacao,
      unidadeMedida,
      quantidadeMinima,
      quantidadeIdeal,
      fornecedor,
      precoUnitario,
      fotoUrl,
      observacoes,
    } = req.body;

    const now = new Date().toISOString();
    const tagsJson = tags !== undefined ? (Array.isArray(tags) ? JSON.stringify(tags) : JSON.stringify([])) : (existing as any).tags;
    const locJson = localizacao !== undefined ? (typeof localizacao === 'object' ? JSON.stringify(localizacao) : JSON.stringify(localizacao)) : (existing as any).localizacao;

    const updateStmt = db.prepare(`
      UPDATE items SET
        nome = COALESCE(?, nome),
        categoria = COALESCE(?, categoria),
        subcategoria = ?,
        tags = ?,
        localizacao = ?,
        unidadeMedida = COALESCE(?, unidadeMedida),
        quantidadeMinima = COALESCE(?, quantidadeMinima),
        quantidadeIdeal = COALESCE(?, quantidadeIdeal),
        fornecedor = ?,
        precoUnitario = ?,
        fotoUrl = ?,
        observacoes = ?,
        dataUltimaAtualizacao = ?
      WHERE id = ?
    `);

    updateStmt.run(
      nome !== undefined ? nome.trim() : null,
      categoria !== undefined ? categoria.trim() : null,
      subcategoria !== undefined ? (subcategoria ? subcategoria.trim() : null) : (existing as any).subcategoria,
      tagsJson,
      locJson,
      unidadeMedida !== undefined ? unidadeMedida.trim() : null,
      quantidadeMinima !== undefined ? Number(quantidadeMinima) : null,
      quantidadeIdeal !== undefined ? Number(quantidadeIdeal) : null,
      fornecedor !== undefined ? (fornecedor ? fornecedor.trim() : null) : (existing as any).fornecedor,
      precoUnitario !== undefined && precoUnitario !== null && !isNaN(Number(precoUnitario)) ? Number(precoUnitario) : (existing as any).precoUnitario,
      fotoUrl !== undefined ? (fotoUrl ? fotoUrl.trim() : null) : (existing as any).fotoUrl,
      observacoes !== undefined ? (observacoes ? observacoes.trim() : null) : (existing as any).observacoes,
      now,
      id
    );

    const updatedRow = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    res.json(parseItemRow(updatedRow));
  } catch (error: any) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Erro ao atualizar item.', details: error.message });
  }
});

// DELETE /api/itens/:id - Delete item
app.delete('/api/itens/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Item não encontrado.' });
    }

    db.prepare('DELETE FROM items WHERE id = ?').run(id);
    res.json({ success: true, message: `Item ${id} removido com sucesso.` });
  } catch (error: any) {
    console.error('Error deleting item:', error);
    res.status(500).json({ error: 'Erro ao excluir item.', details: error.message });
  }
});

// ==========================================
// 3. MOVIMENTAÇÕES (MOVEMENTS) ROUTES
// ==========================================

// GET /api/movimentacoes - List all movements
app.get('/api/movimentacoes', (req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT * FROM movements ORDER BY data DESC').all();
    res.json(rows);
  } catch (error: any) {
    console.error('Error fetching movements:', error);
    res.status(500).json({ error: 'Erro ao buscar movimentações.', details: error.message });
  }
});

// POST /api/movimentacoes - Register new movement
app.post('/api/movimentacoes', (req: Request, res: Response) => {
  try {
    const { itemId, tipo, quantidade, motivo, responsavel } = req.body;

    if (!itemId || !tipo || quantidade === undefined || quantidade === null) {
      return res.status(400).json({ error: 'itemId, tipo e quantidade são obrigatórios.' });
    }

    const itemRow = db.prepare('SELECT * FROM items WHERE id = ?').get(itemId) as any;
    if (!itemRow) {
      return res.status(404).json({ error: `Item com código ${itemId} não encontrado.` });
    }

    const numQty = Number(quantidade);
    if (isNaN(numQty) || (numQty <= 0 && tipo !== 'ajuste')) {
      return res.status(400).json({ error: 'A quantidade deve ser um número maior que zero.' });
    }

    const saldoAnterior = Number(itemRow.quantidadeAtual);
    let novoSaldo = saldoAnterior;

    if (tipo === 'entrada') {
      novoSaldo = saldoAnterior + numQty;
    } else if (tipo === 'saida') {
      if (numQty > saldoAnterior) {
        return res.status(400).json({
          error: `Estoque insuficiente! Saldo atual é de ${saldoAnterior} ${itemRow.unidadeMedida}, mas foi solicitada a saída de ${numQty} ${itemRow.unidadeMedida}.`,
        });
      }
      novoSaldo = saldoAnterior - numQty;
    } else if (tipo === 'ajuste') {
      novoSaldo = numQty;
    } else {
      return res.status(400).json({ error: 'Tipo de movimentação inválido. Deve ser entrada, saida ou ajuste.' });
    }

    const now = new Date().toISOString();
    const movId = generateMovementId();

    // Execute atomic update in SQLite
    db.exec('BEGIN TRANSACTION;');

    db.prepare(`
      UPDATE items SET
        quantidadeAtual = ?,
        dataUltimaAtualizacao = ?
      WHERE id = ?
    `).run(novoSaldo, now, itemId);

    db.prepare(`
      INSERT INTO movements (
        id, itemId, itemNome, itemCategoria, tipo,
        quantidade, quantidadeAnterior, quantidadeApos,
        motivo, responsavel, data
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      movId,
      itemId,
      itemRow.nome,
      itemRow.categoria,
      tipo,
      numQty,
      saldoAnterior,
      novoSaldo,
      motivo ? motivo.trim() : 'Movimentação de rotina',
      responsavel ? responsavel.trim() : 'Usuário Lab',
      now
    );

    db.exec('COMMIT;');

    const updatedItem = db.prepare('SELECT * FROM items WHERE id = ?').get(itemId);
    const createdMov = db.prepare('SELECT * FROM movements WHERE id = ?').get(movId);

    res.status(201).json({
      success: true,
      message: `Movimentação registrada com sucesso! Novo saldo: ${novoSaldo} ${itemRow.unidadeMedida}.`,
      movement: createdMov,
      item: parseItemRow(updatedItem),
    });
  } catch (error: any) {
    try {
      db.exec('ROLLBACK;');
    } catch {}
    console.error('Error registering movement:', error);
    res.status(500).json({ error: 'Erro ao registrar movimentação.', details: error.message });
  }
});

// ==========================================
// 4. CATEGORIAS (CATEGORIES) ROUTES
// ==========================================

app.get('/api/categorias', (req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT * FROM categories ORDER BY nome ASC').all() as any[];
    const categories = rows.map((r) => ({
      ...r,
      subcategorias: r.subcategorias ? JSON.parse(r.subcategorias) : [],
    }));
    res.json(categories);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar categorias.', details: error.message });
  }
});

app.post('/api/categorias', (req: Request, res: Response) => {
  try {
    const { nome, descricao, subcategorias = [], icone = 'FolderTree', cor = '#7c3aed' } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome da categoria é obrigatório.' });

    const id = `cat-${Date.now()}`;
    const subJson = JSON.stringify(Array.isArray(subcategorias) ? subcategorias : []);

    db.prepare(`
      INSERT INTO categories (id, nome, descricao, subcategorias, icone, cor)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, nome.trim(), descricao ? descricao.trim() : null, subJson, icone, cor);

    const created = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as any;
    res.status(201).json({
      ...created,
      subcategorias: JSON.parse(created.subcategorias),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao criar categoria.', details: error.message });
  }
});

app.put('/api/categorias/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { nome, descricao, subcategorias, icone, cor } = req.body;

    const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as any;
    if (!existing) return res.status(404).json({ error: 'Categoria não encontrada.' });

    const subJson = subcategorias !== undefined ? JSON.stringify(Array.isArray(subcategorias) ? subcategorias : []) : existing.subcategorias;

    db.prepare(`
      UPDATE categories SET
        nome = COALESCE(?, nome),
        descricao = ?,
        subcategorias = ?,
        icone = COALESCE(?, icone),
        cor = COALESCE(?, cor)
      WHERE id = ?
    `).run(
      nome ? nome.trim() : null,
      descricao !== undefined ? (descricao ? descricao.trim() : null) : existing.descricao,
      subJson,
      icone,
      cor,
      id
    );

    const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as any;
    res.json({
      ...updated,
      subcategorias: JSON.parse(updated.subcategorias),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao atualizar categoria.', details: error.message });
  }
});

app.delete('/api/categorias/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as any;
    if (!cat) return res.status(404).json({ error: 'Categoria não encontrada.' });

    // Check if items are attached
    const itemsCount = db.prepare('SELECT COUNT(*) as count FROM items WHERE categoria = ?').get(cat.nome) as { count: number };
    if (itemsCount.count > 0) {
      return res.status(400).json({
        error: `Não é possível excluir a categoria "${cat.nome}" pois existem ${itemsCount.count} itens cadastrados vinculados a ela.`,
      });
    }

    db.prepare('DELETE FROM categories WHERE id = ?').run(id);
    res.json({ success: true, message: `Categoria "${cat.nome}" excluída.` });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao excluir categoria.', details: error.message });
  }
});

// ==========================================
// 5. LOCALIZAÇÕES (LOCATIONS) ROUTES
// ==========================================

app.get('/api/localizacoes', (req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT * FROM locations ORDER BY sala ASC').all() as any[];
    const locations = rows.map((r) => ({
      ...r,
      armarios: r.armarios ? JSON.parse(r.armarios) : [],
    }));
    res.json(locations);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar localizações.', details: error.message });
  }
});

app.post('/api/localizacoes', (req: Request, res: Response) => {
  try {
    const { sala, armarios = [] } = req.body;
    if (!sala) return res.status(400).json({ error: 'Nome da sala é obrigatório.' });

    const id = `loc-${Date.now()}`;
    const armariosJson = JSON.stringify(Array.isArray(armarios) ? armarios : []);

    db.prepare(`
      INSERT INTO locations (id, sala, armarios)
      VALUES (?, ?, ?)
    `).run(id, sala.trim(), armariosJson);

    const created = db.prepare('SELECT * FROM locations WHERE id = ?').get(id) as any;
    res.status(201).json({
      ...created,
      armarios: JSON.parse(created.armarios),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao criar localização.', details: error.message });
  }
});

app.put('/api/localizacoes/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { sala, armarios } = req.body;

    const existing = db.prepare('SELECT * FROM locations WHERE id = ?').get(id) as any;
    if (!existing) return res.status(404).json({ error: 'Localização não encontrada.' });

    const armariosJson = armarios !== undefined ? JSON.stringify(Array.isArray(armarios) ? armarios : []) : existing.armarios;

    db.prepare(`
      UPDATE locations SET
        sala = COALESCE(?, sala),
        armarios = ?
      WHERE id = ?
    `).run(sala ? sala.trim() : null, armariosJson, id);

    const updated = db.prepare('SELECT * FROM locations WHERE id = ?').get(id) as any;
    res.json({
      ...updated,
      armarios: JSON.parse(updated.armarios),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao atualizar localização.', details: error.message });
  }
});

app.delete('/api/localizacoes/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM locations WHERE id = ?').run(id);
    res.json({ success: true, message: 'Localização removida.' });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao excluir localização.', details: error.message });
  }
});

// ==========================================
// 6. ADMIN / CLEAN RESET ROUTE
// ==========================================

app.post('/api/admin/zerar', (req: Request, res: Response) => {
  try {
    db.exec(`
      DELETE FROM items;
      DELETE FROM movements;
    `);
    res.json({
      success: true,
      message: 'Todos os itens e movimentações foram apagados do banco de dados SQLite.',
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao zerar dados.', details: error.message });
  }
});

// Start Server listening on 0.0.0.0 (all network interfaces)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 LabStock REST API rodando em http://localhost:${PORT}`);
  console.log(`🌐 Acesso na rede local: http://0.0.0.0:${PORT}/api`);
  console.log(`📦 Banco de dados: SQLite ativo`);
  console.log(`=======================================================`);
});
