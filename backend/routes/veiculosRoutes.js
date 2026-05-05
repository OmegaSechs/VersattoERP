const pool = require('../database');
const { apenasInteiro, apenasDecimal, sanitizarString } = require('../validators');

async function veiculosRoutes(fastify, opts) {
  fastify.get('/veiculos', async (request, reply) => {
    try {
      const { id, cliente_id, placa, modelo } = request.query;
      const where = []; const vals = [];
      if (id)         { vals.push(apenasInteiro(id));         where.push(`v.id = $${vals.length}`); }
      if (cliente_id) { vals.push(apenasInteiro(cliente_id)); where.push(`v.cliente_id = $${vals.length}`); }
      if (placa)      { vals.push(placa.toUpperCase());        where.push(`v.placa = $${vals.length}`); }
      if (modelo)     { vals.push(`%${modelo}%`);             where.push(`v.modelo ILIKE $${vals.length}`); }
      const { rows } = await pool.query(
        `SELECT v.*, p.nome AS cliente_nome FROM veiculos v
         LEFT JOIN pessoas p ON p.pessoa_id = v.cliente_id
         ${where.length?'WHERE '+where.join(' AND '):''}  ORDER BY v.id DESC`, vals);
      reply.send(rows);
    } catch(e) { reply.code(500).send({ erro: e.message }); }
  });

  fastify.post('/veiculos', async (request, reply) => {
    const b = request.body || {};
    if (!b.placa) return reply.code(400).send({ erro: 'Placa é obrigatória' });
    try {
      await pool.query(`
        INSERT INTO veiculos
          (cliente_id, marca, modelo, ano, placa, cor, quilometragem, observacoes, criado_em, atualizado_em)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())`,
        [apenasInteiro(b.cliente_id), sanitizarString(b.marca,100),
         sanitizarString(b.modelo,100), apenasInteiro(b.ano),
         sanitizarString(b.placa,10)?.toUpperCase(),
         sanitizarString(b.cor,50), apenasDecimal(b.quilometragem),
         sanitizarString(b.observacoes,500)]);
      reply.code(201).send({ message: 'Veículo cadastrado' });
    } catch(e) {
      if (e.code==='23505') return reply.code(409).send({ erro: 'Placa já cadastrada' });
      reply.code(500).send({ erro: e.message });
    }
  });

  fastify.put('/veiculos/:id', async (request, reply) => {
    const id = apenasInteiro(request.params.id);
    if (!id) return reply.code(400).send({ erro: 'ID inválido' });
    const b = request.body || {};
    try {
      await pool.query(`
        UPDATE veiculos SET
          cliente_id=$1, marca=$2, modelo=$3, ano=$4, placa=$5,
          cor=$6, quilometragem=$7, observacoes=$8, atualizado_em=NOW()
        WHERE id=$9`,
        [apenasInteiro(b.cliente_id), sanitizarString(b.marca,100),
         sanitizarString(b.modelo,100), apenasInteiro(b.ano),
         sanitizarString(b.placa,10)?.toUpperCase(),
         sanitizarString(b.cor,50), apenasDecimal(b.quilometragem),
         sanitizarString(b.observacoes,500), id]);
      reply.send({ message: 'Veículo atualizado' });
    } catch(e) { reply.code(500).send({ erro: e.message }); }
  });

  fastify.delete('/veiculos/:id', async (request, reply) => {
    const id = apenasInteiro(request.params.id);
    if (!id) return reply.code(400).send({ erro: 'ID inválido' });
    try {
      await pool.query('DELETE FROM veiculos WHERE id=$1', [id]);
      reply.send({ message: 'Veículo removido' });
    } catch(e) { reply.code(500).send({ erro: e.message }); }
  });
}

module.exports = veiculosRoutes;
