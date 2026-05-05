const pool = require('../database');
const { apenasInteiro, apenasDecimal, sanitizarString, exigir } = require('../validators');

async function catalogoRoutes(fastify, opts) {
  fastify.get('/catalogo', async (request, reply) => {
    try {
      const { id, nome, tipo } = request.query;
      const where = []; const vals = [];
      if (id)   { vals.push(apenasInteiro(id));   where.push(`id = $${vals.length}`); }
      if (nome) { vals.push(`%${nome}%`);          where.push(`nome ILIKE $${vals.length}`); }
      if (tipo) { vals.push(apenasInteiro(tipo));  where.push(`tipo = $${vals.length}`); }
      const sql = `SELECT * FROM catalogo_itens ${where.length?'WHERE '+where.join(' AND '):''}  ORDER BY nome`;
      const { rows } = await pool.query(sql, vals);
      reply.send(rows);
    } catch(e) { reply.code(500).send({ erro: e.message }); }
  });

  fastify.post('/catalogo', async (request, reply) => {
    const b = request.body || {};
    if (!exigir(['nome'], b, reply)) return;
    try {
      await pool.query(`
        INSERT INTO catalogo_itens
          (nome, tipo, preco_padrao, preco_custo, unidade_medida, descricao,
           criado_em, atualizado_em, quantidade_minima, quantidade_maxima, quantidade_estoque)
        VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW(),$7,$8,$9)`,
        [sanitizarString(b.nome), apenasInteiro(b.tipo),
         apenasDecimal(b.preco_padrao), apenasDecimal(b.preco_custo),
         sanitizarString(b.unidade_medida,20), sanitizarString(b.descricao,500),
         apenasInteiro(b.quantidade_minima)||0, apenasInteiro(b.quantidade_maxima)||0,
         apenasInteiro(b.quantidade_estoque)||0]);
      reply.code(201).send({ message: 'Item cadastrado no catálogo' });
    } catch(e) { reply.code(500).send({ erro: e.message }); }
  });

  fastify.put('/catalogo/:id', async (request, reply) => {
    const id = apenasInteiro(request.params.id);
    if (!id) return reply.code(400).send({ erro: 'ID inválido' });
    const b = request.body || {};
    try {
      await pool.query(`
        UPDATE catalogo_itens SET
          nome=$1, tipo=$2, preco_padrao=$3, preco_custo=$4,
          unidade_medida=$5, descricao=$6, atualizado_em=NOW(),
          quantidade_minima=$7, quantidade_maxima=$8, quantidade_estoque=$9
        WHERE id=$10`,
        [sanitizarString(b.nome), apenasInteiro(b.tipo),
         apenasDecimal(b.preco_padrao), apenasDecimal(b.preco_custo),
         sanitizarString(b.unidade_medida,20), sanitizarString(b.descricao,500),
         apenasInteiro(b.quantidade_minima)||0, apenasInteiro(b.quantidade_maxima)||0,
         apenasInteiro(b.quantidade_estoque)??0, id]);
      reply.send({ message: 'Item do catálogo atualizado' });
    } catch(e) { reply.code(500).send({ erro: e.message }); }
  });

  fastify.delete('/catalogo/:id', async (request, reply) => {
    const id = apenasInteiro(request.params.id);
    if (!id) return reply.code(400).send({ erro: 'ID inválido' });
    try {
      await pool.query('DELETE FROM catalogo_itens WHERE id=$1', [id]);
      reply.send({ message: 'Item removido' });
    } catch(e) { reply.code(500).send({ erro: e.message }); }
  });
}

module.exports = catalogoRoutes;
