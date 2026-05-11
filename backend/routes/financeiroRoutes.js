// ─────────────────────────────────────────────────────────────
//  financeiroRoutes.js  —  Contas a receber, pagar e relatório
// ─────────────────────────────────────────────────────────────
const pool = require('../database');
const { apenasInteiro, apenasDecimal, sanitizarString, validarData } = require('../validators');

async function financeiroRoutes(fastify, opts) {

  // ── CONTAS A RECEBER ──────────────────────────────────────────

  fastify.get('/financeiro/receber', async (request, reply) => {
    const { status, de, ate, os_id, cliente_id, cliente_nome } = request.query;
    const where = []; const vals = [];
    if (status)       { vals.push(status);                        where.push(`cr.status = $${vals.length}`); }
    if (de)           { vals.push(de);                            where.push(`cr.vencimento >= $${vals.length}`); }
    if (ate)          { vals.push(ate);                           where.push(`cr.vencimento <= $${vals.length}`); }
    if (os_id)        { vals.push(apenasInteiro(os_id));          where.push(`cr.os_id = $${vals.length}`); }
    if (cliente_id)   { vals.push(apenasInteiro(cliente_id));     where.push(`p.pessoa_id = $${vals.length}`); }
    if (cliente_nome) { vals.push(`%${cliente_nome.trim()}%`);   where.push(`p.nome ILIKE $${vals.length}`); }
    const wClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    try {
      const { rows } = await pool.query(`
        SELECT cr.*,
               os.placa, os.veiculo AS os_veiculo,
               p.nome AS cliente_nome
        FROM contas_receber cr
        LEFT JOIN ordem_servico os ON os.os_id = cr.os_id
        LEFT JOIN pessoas p ON p.pessoa_id = os.cliente_id
        ${wClause}
        ORDER BY cr.vencimento ASC, cr.id ASC`, vals);
      reply.send(rows);
    } catch(erro) { reply.code(500).send({ erro: erro.message }); }
  });

  fastify.post('/financeiro/receber', async (request, reply) => {
    const b = request.body || {};
    if (!b.descricao || !b.valor || !b.vencimento)
      return reply.code(400).send({ erro: 'descricao, valor e vencimento são obrigatórios' });
    try {
      const { rows } = await pool.query(`
        INSERT INTO contas_receber (os_id, descricao, valor, vencimento, status, observacoes)
        VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [apenasInteiro(b.os_id), sanitizarString(b.descricao, 200),
         apenasDecimal(b.valor),  validarData(b.vencimento),
         b.status || 'pendente',  sanitizarString(b.observacoes, 500)]);
      reply.code(201).send(rows[0]);
    } catch(erro) { reply.code(500).send({ erro: erro.message }); }
  });

  fastify.put('/financeiro/receber/:id', async (request, reply) => {
    const id = apenasInteiro(request.params.id);
    if (!id) return reply.code(400).send({ erro: 'ID inválido' });
    const b = request.body || {};
    try {
      // COALESCE preserva campos não enviados (permite atualizações parciais)
      await pool.query(`
        UPDATE contas_receber SET
          descricao      = COALESCE($1, descricao),
          valor          = COALESCE($2, valor),
          vencimento     = COALESCE($3, vencimento),
          status         = COALESCE($4, status),
          data_pagamento = COALESCE($5, data_pagamento),
          observacoes    = COALESCE($6, observacoes)
        WHERE id=$7`,
        [sanitizarString(b.descricao, 200), apenasDecimal(b.valor),
         validarData(b.vencimento),          b.status || null,
         validarData(b.data_pagamento),      sanitizarString(b.observacoes, 500), id]);
      reply.send({ message: 'Atualizado com sucesso' });
    } catch(erro) { reply.code(500).send({ erro: erro.message }); }
  });

  fastify.delete('/financeiro/receber/:id', async (request, reply) => {
    const id = apenasInteiro(request.params.id);
    if (!id) return reply.code(400).send({ erro: 'ID inválido' });
    try {
      await pool.query('DELETE FROM contas_receber WHERE id=$1', [id]);
      reply.send({ message: 'Excluído' });
    } catch(erro) { reply.code(500).send({ erro: erro.message }); }
  });

  // ── CONTAS A PAGAR ────────────────────────────────────────────

  fastify.get('/financeiro/pagar', async (request, reply) => {
    const { status, de, ate } = request.query;
    const where = []; const vals = [];
    if (status) { vals.push(status); where.push(`cp.status = $${vals.length}`); }
    if (de)     { vals.push(de);     where.push(`cp.vencimento >= $${vals.length}`); }
    if (ate)    { vals.push(ate);    where.push(`cp.vencimento <= $${vals.length}`); }
    const wClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    try {
      const { rows } = await pool.query(`
        SELECT cp.*, p.nome AS fornecedor_nome
        FROM contas_pagar cp
        LEFT JOIN pessoas p ON p.pessoa_id = cp.fornecedor_id
        ${wClause}
        ORDER BY cp.vencimento ASC, cp.id ASC`, vals);
      reply.send(rows);
    } catch(erro) { reply.code(500).send({ erro: erro.message }); }
  });

  fastify.post('/financeiro/pagar', async (request, reply) => {
    const b = request.body || {};
    if (!b.descricao || !b.valor || !b.vencimento)
      return reply.code(400).send({ erro: 'descricao, valor e vencimento são obrigatórios' });
    try {
      const { rows } = await pool.query(`
        INSERT INTO contas_pagar (fornecedor_id, descricao, categoria, valor, vencimento, status, observacoes)
        VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [apenasInteiro(b.fornecedor_id), sanitizarString(b.descricao, 200),
         sanitizarString(b.categoria, 100), apenasDecimal(b.valor),
         validarData(b.vencimento), b.status || 'pendente',
         sanitizarString(b.observacoes, 500)]);
      reply.code(201).send(rows[0]);
    } catch(erro) { reply.code(500).send({ erro: erro.message }); }
  });

  fastify.put('/financeiro/pagar/:id', async (request, reply) => {
    const id = apenasInteiro(request.params.id);
    if (!id) return reply.code(400).send({ erro: 'ID inválido' });
    const b = request.body || {};
    try {
      await pool.query(`
        UPDATE contas_pagar SET
          fornecedor_id  = COALESCE($1, fornecedor_id),
          descricao      = COALESCE($2, descricao),
          categoria      = COALESCE($3, categoria),
          valor          = COALESCE($4, valor),
          vencimento     = COALESCE($5, vencimento),
          status         = COALESCE($6, status),
          data_pagamento = COALESCE($7, data_pagamento),
          observacoes    = COALESCE($8, observacoes)
        WHERE id=$9`,
        [apenasInteiro(b.fornecedor_id), sanitizarString(b.descricao, 200),
         sanitizarString(b.categoria, 100), apenasDecimal(b.valor),
         validarData(b.vencimento), b.status || null,
         validarData(b.data_pagamento), sanitizarString(b.observacoes, 500), id]);
      reply.send({ message: 'Atualizado com sucesso' });
    } catch(erro) { reply.code(500).send({ erro: erro.message }); }
  });

  fastify.delete('/financeiro/pagar/:id', async (request, reply) => {
    const id = apenasInteiro(request.params.id);
    if (!id) return reply.code(400).send({ erro: 'ID inválido' });
    try {
      await pool.query('DELETE FROM contas_pagar WHERE id=$1', [id]);
      reply.send({ message: 'Excluído' });
    } catch(erro) { reply.code(500).send({ erro: erro.message }); }
  });

  // ── RELATÓRIO FINANCEIRO ──────────────────────────────────────

  fastify.get('/financeiro/relatorio', async (request, reply) => {
    const { de, ate } = request.query;
    const wR = []; const vR = [];
    const wP = []; const vP = [];
    if (de)  {
      vR.push(de);  wR.push(`vencimento >= $${vR.length}`);
      vP.push(de);  wP.push(`vencimento >= $${vP.length}`);
    }
    if (ate) {
      vR.push(ate); wR.push(`vencimento <= $${vR.length}`);
      vP.push(ate); wP.push(`vencimento <= $${vP.length}`);
    }
    const crW = wR.length ? `WHERE ${wR.join(' AND ')}` : '';
    const cpW = wP.length ? `WHERE ${wP.join(' AND ')}` : '';
    try {
      const { rows: receber } = await pool.query(`
        SELECT status, COUNT(*) AS qty, COALESCE(SUM(valor),0) AS total
        FROM contas_receber ${crW} GROUP BY status`, vR);

      const { rows: pagar } = await pool.query(`
        SELECT status, COUNT(*) AS qty, COALESCE(SUM(valor),0) AS total
        FROM contas_pagar ${cpW} GROUP BY status`, vP);

      const { rows: vencR } = await pool.query(`
        SELECT COUNT(*) AS qty, COALESCE(SUM(valor),0) AS total
        FROM contas_receber
        WHERE status='pendente' AND vencimento < CURRENT_DATE`);

      const { rows: vencP } = await pool.query(`
        SELECT COUNT(*) AS qty, COALESCE(SUM(valor),0) AS total
        FROM contas_pagar
        WHERE status='pendente' AND vencimento < CURRENT_DATE`);

      reply.send({
        receber,
        pagar,
        vencidos_receber: vencR[0],
        vencidos_pagar:   vencP[0],
      });
    } catch(erro) { reply.code(500).send({ erro: erro.message }); }
  });
}

module.exports = financeiroRoutes;
