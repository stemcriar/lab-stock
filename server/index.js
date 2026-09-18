import http from 'node:http';
import { URL } from 'node:url';
import { db, initDatabase } from './db.js';

initDatabase();

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

function parseItemRow(row) {
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

function generateNextItemId() {
  const rows = db.prepare("SELECT id FROM items WHERE id LIKE 'ITEM-%'").all();
  let maxNumber = 0;
  for (const row of rows) {
    const num = parseInt(row.id.replace('ITEM-', ''), 10);
    if (!isNaN(num) && num > maxNumber) {
      maxNumber = num;
    }
  }
  return `ITEM-${(maxNumber + 1).toString().padStart(3, '0')}`;
}

function generateMovementId() {
  const timestamp = Date.now().toString().slice(-4);
  const random = Math.floor(Math.random() * 900 + 100);
  return `MOV-${timestamp}${random}`;
}

function sendJson(res, statusCode, data) {
  const json = JSON.stringify(data);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(json);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk.toString();
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('JSON inválido no corpo da requisição.'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname.replace(/\/+$/, '') || '/';
  const method = req.method;

  try {
    // 1. Health
    if (pathname === '/api/health' && method === 'GET') {
      return sendJson(res, 200, {
        status: 'online',
        serverTime: new Date().toISOString(),
        lab: 'Laboratório de Prototipagem - STEM CRIAR',
        database: 'SQLite',
      });
    }

    // 2. ITENS
    if (pathname === '/api/itens' && method === 'GET') {
      const rows = db.prepare('SELECT * FROM items ORDER BY dataCadastro DESC').all();
      return sendJson(res, 200, rows.map(parseItemRow));
    }

    if (pathname.startsWith('/api/itens/') && method === 'GET') {
      const id = decodeURIComponent(pathname.replace('/api/itens/', ''));
      const row = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
      if (!row) return sendJson(res, 404, { error: `Item ${id} não encontrado.` });
      return sendJson(res, 200, parseItemRow(row));
    }

    if (pathname === '/api/itens' && method === 'POST') {
      const body = await readBody(req);
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
      } = body;

      if (!nome || !categoria || !unidadeMedida) {
        return sendJson(res, 400, { error: 'Nome, categoria e unidade de medida são obrigatórios.' });
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

      if (Number(quantidadeAtual) > 0) {
        const movId = generateMovementId();
        db.prepare(`
          INSERT INTO movements (
            id, itemId, itemNome, itemCategoria, tipo,
            quantidade, quantidadeAnterior, quantidadeApos,
            motivo, responsavel, data
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
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

      const created = db.prepare('SELECT * FROM items WHERE id = ?').get(finalId);
      return sendJson(res, 201, parseItemRow(created));
    }

    if (pathname.startsWith('/api/itens/') && method === 'PUT') {
      const id = decodeURIComponent(pathname.replace('/api/itens/', ''));
      const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
      if (!existing) return sendJson(res, 404, { error: 'Item não encontrado para atualização.' });

      const body = await readBody(req);
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
      } = body;

      const now = new Date().toISOString();
      const tagsJson = tags !== undefined ? (Array.isArray(tags) ? JSON.stringify(tags) : JSON.stringify([])) : existing.tags;
      const locJson = localizacao !== undefined ? (typeof localizacao === 'object' ? JSON.stringify(localizacao) : JSON.stringify(localizacao)) : existing.localizacao;

      db.prepare(`
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
      `).run(
        nome !== undefined ? nome.trim() : null,
        categoria !== undefined ? categoria.trim() : null,
        subcategoria !== undefined ? (subcategoria ? subcategoria.trim() : null) : existing.subcategoria,
        tagsJson,
        locJson,
        unidadeMedida !== undefined ? unidadeMedida.trim() : null,
        quantidadeMinima !== undefined ? Number(quantidadeMinima) : null,
        quantidadeIdeal !== undefined ? Number(quantidadeIdeal) : null,
        fornecedor !== undefined ? (fornecedor ? fornecedor.trim() : null) : existing.fornecedor,
        precoUnitario !== undefined && precoUnitario !== null && !isNaN(Number(precoUnitario)) ? Number(precoUnitario) : existing.precoUnitario,
        fotoUrl !== undefined ? (fotoUrl ? fotoUrl.trim() : null) : existing.fotoUrl,
        observacoes !== undefined ? (observacoes ? observacoes.trim() : null) : existing.observacoes,
        now,
        id
      );

      const updated = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
      return sendJson(res, 200, parseItemRow(updated));
    }

    if (pathname.startsWith('/api/itens/') && method === 'DELETE') {
      const id = decodeURIComponent(pathname.replace('/api/itens/', ''));
      const existing = db.prepare('SELECT * FROM items WHERE id = ?').get(id);
      if (!existing) return sendJson(res, 404, { error: 'Item não encontrado.' });

      db.prepare('DELETE FROM items WHERE id = ?').run(id);
      return sendJson(res, 200, { success: true, message: `Item ${id} removido com sucesso.` });
    }

    // 3. MOVIMENTAÇÕES
    if (pathname === '/api/movimentacoes' && method === 'GET') {
      const rows = db.prepare('SELECT * FROM movements ORDER BY data DESC').all();
      return sendJson(res, 200, rows);
    }

    if (pathname === '/api/movimentacoes' && method === 'POST') {
      const body = await readBody(req);
      const { itemId, tipo, quantidade, motivo, responsavel } = body;

      if (!itemId || !tipo || quantidade === undefined || quantidade === null) {
        return sendJson(res, 400, { error: 'itemId, tipo e quantidade são obrigatórios.' });
      }

      const itemRow = db.prepare('SELECT * FROM items WHERE id = ?').get(itemId);
      if (!itemRow) return sendJson(res, 404, { error: `Item com código ${itemId} não encontrado.` });

      const numQty = Number(quantidade);
      if (isNaN(numQty) || (numQty <= 0 && tipo !== 'ajuste')) {
        return sendJson(res, 400, { error: 'A quantidade deve ser um número maior que zero.' });
      }

      const saldoAnterior = Number(itemRow.quantidadeAtual);
      let novoSaldo = saldoAnterior;

      if (tipo === 'entrada') {
        novoSaldo = saldoAnterior + numQty;
      } else if (tipo === 'saida') {
        if (numQty > saldoAnterior) {
          return sendJson(res, 400, {
            error: `Estoque insuficiente! Saldo atual é de ${saldoAnterior} ${itemRow.unidadeMedida}, mas foi solicitada a saída de ${numQty} ${itemRow.unidadeMedida}.`,
          });
        }
        novoSaldo = saldoAnterior - numQty;
      } else if (tipo === 'ajuste') {
        novoSaldo = numQty;
      } else {
        return sendJson(res, 400, { error: 'Tipo de movimentação inválido. Deve ser entrada, saida ou ajuste.' });
      }

      const now = new Date().toISOString();
      const movId = generateMovementId();

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

      return sendJson(res, 201, {
        success: true,
        message: `Movimentação registrada com sucesso! Novo saldo: ${novoSaldo} ${itemRow.unidadeMedida}.`,
        movement: createdMov,
        item: parseItemRow(updatedItem),
      });
    }

    // 4. CATEGORIAS
    if (pathname === '/api/categorias' && method === 'GET') {
      const rows = db.prepare('SELECT * FROM categories ORDER BY nome ASC').all();
      return sendJson(res, 200, rows.map((r) => ({
        ...r,
        subcategorias: r.subcategorias ? JSON.parse(r.subcategorias) : [],
      })));
    }

    if (pathname === '/api/categorias' && method === 'POST') {
      const body = await readBody(req);
      const { nome, descricao, subcategorias = [], icone = 'FolderTree', cor = '#7c3aed' } = body;
      if (!nome) return sendJson(res, 400, { error: 'Nome da categoria é obrigatório.' });

      const id = `cat-${Date.now()}`;
      const subJson = JSON.stringify(Array.isArray(subcategorias) ? subcategorias : []);

      db.prepare(`
        INSERT INTO categories (id, nome, descricao, subcategorias, icone, cor)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, nome.trim(), descricao ? descricao.trim() : null, subJson, icone, cor);

      const created = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
      return sendJson(res, 201, {
        ...created,
        subcategorias: JSON.parse(created.subcategorias),
      });
    }

    if (pathname.startsWith('/api/categorias/') && method === 'PUT') {
      const id = decodeURIComponent(pathname.replace('/api/categorias/', ''));
      const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
      if (!existing) return sendJson(res, 404, { error: 'Categoria não encontrada.' });

      const body = await readBody(req);
      const { nome, descricao, subcategorias, icone, cor } = body;
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

      const updated = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
      return sendJson(res, 200, {
        ...updated,
        subcategorias: JSON.parse(updated.subcategorias),
      });
    }

    if (pathname.startsWith('/api/categorias/') && method === 'DELETE') {
      const id = decodeURIComponent(pathname.replace('/api/categorias/', ''));
      const cat = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
      if (!cat) return sendJson(res, 404, { error: 'Categoria não encontrada.' });

      const itemsCount = db.prepare('SELECT COUNT(*) as count FROM items WHERE categoria = ?').get(cat.nome);
      if (itemsCount.count > 0) {
        return sendJson(res, 400, {
          error: `Não é possível excluir a categoria "${cat.nome}" pois existem ${itemsCount.count} itens cadastrados vinculados a ela.`,
        });
      }

      db.prepare('DELETE FROM categories WHERE id = ?').run(id);
      return sendJson(res, 200, { success: true, message: `Categoria "${cat.nome}" excluída.` });
    }

    // 5. LOCALIZAÇÕES
    if (pathname === '/api/localizacoes' && method === 'GET') {
      const rows = db.prepare('SELECT * FROM locations ORDER BY sala ASC').all();
      return sendJson(res, 200, rows.map((r) => ({
        ...r,
        armarios: r.armarios ? JSON.parse(r.armarios) : [],
      })));
    }

    if (pathname === '/api/localizacoes' && method === 'POST') {
      const body = await readBody(req);
      const { sala, armarios = [] } = body;
      if (!sala) return sendJson(res, 400, { error: 'Nome da sala é obrigatório.' });

      const id = `loc-${Date.now()}`;
      const armariosJson = JSON.stringify(Array.isArray(armarios) ? armarios : []);

      db.prepare(`
        INSERT INTO locations (id, sala, armarios)
        VALUES (?, ?, ?)
      `).run(id, sala.trim(), armariosJson);

      const created = db.prepare('SELECT * FROM locations WHERE id = ?').get(id);
      return sendJson(res, 201, {
        ...created,
        armarios: JSON.parse(created.armarios),
      });
    }

    if (pathname.startsWith('/api/localizacoes/') && method === 'PUT') {
      const id = decodeURIComponent(pathname.replace('/api/localizacoes/', ''));
      const existing = db.prepare('SELECT * FROM locations WHERE id = ?').get(id);
      if (!existing) return sendJson(res, 404, { error: 'Localização não encontrada.' });

      const body = await readBody(req);
      const { sala, armarios } = body;
      const armariosJson = armarios !== undefined ? JSON.stringify(Array.isArray(armarios) ? armarios : []) : existing.armarios;

      db.prepare(`
        UPDATE locations SET
          sala = COALESCE(?, sala),
          armarios = ?
        WHERE id = ?
      `).run(sala ? sala.trim() : null, armariosJson, id);

      const updated = db.prepare('SELECT * FROM locations WHERE id = ?').get(id);
      return sendJson(res, 200, {
        ...updated,
        armarios: JSON.parse(updated.armarios),
      });
    }

    if (pathname.startsWith('/api/localizacoes/') && method === 'DELETE') {
      const id = decodeURIComponent(pathname.replace('/api/localizacoes/', ''));
      db.prepare('DELETE FROM locations WHERE id = ?').run(id);
      return sendJson(res, 200, { success: true, message: 'Localização removida.' });
    }

    // 6. ADMIN / CLEAN
    if (pathname === '/api/admin/zerar' && method === 'POST') {
      db.exec(`
        DELETE FROM items;
        DELETE FROM movements;
      `);
      return sendJson(res, 200, {
        success: true,
        message: 'Todos os itens e movimentações foram apagados do banco de dados SQLite.',
      });
    }

    // 404 Not Found
    return sendJson(res, 404, { error: `Rota não encontrada: ${method} ${pathname}` });
  } catch (error) {
    console.error(`[API Error] ${method} ${pathname}:`, error);
    return sendJson(res, 500, { error: error.message || 'Erro interno no servidor.' });
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`=======================================================`);
  console.log(`🚀 LabStock REST API rodando em http://localhost:${PORT}`);
  console.log(`🌐 Acesso na rede local: http://0.0.0.0:${PORT}/api`);
  console.log(`📦 Banco de dados: SQLite ativo`);
  console.log(`=======================================================`);
});
