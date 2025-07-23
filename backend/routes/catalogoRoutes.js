const pool = require('../database');

async function catalogoRoutes(fastify, opts) {
  // GET - Lista itens do catálogo
  fastify.get('/catalogo', async (request, reply) => {
    try {
      const { id, nome, tipo } = request.query;
      const whereClauses = [];
      const values = [];

      if (id) {
        values.push(id);
        whereClauses.push(`id = $${values.length}`);
      }
      if (nome) {
        values.push(`%${nome}%`);
        whereClauses.push(`nome ILIKE $${values.length}`);
      }
      if (tipo) {
        values.push(tipo);
        whereClauses.push(`tipo = $${values.length}`);
      }

      const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';
      const query = `SELECT * FROM catalogo_itens ${whereSQL}`;
      const { rows } = await pool.query(query, values);

      reply.send(rows);
    } catch (erro) {
      reply.code(500).send({ erro: erro.message });
    }
  });

  // POST - Cria item no catálogo
  fastify.post('/catalogo', async (request, reply) => {
    const {
      nome,
      tipo,
      preco_padrao,
      preco_custo,
      unidade_medida,
      descricao,
      quantidade_minima,
      quantidade_maxima
    } = request.body;

    try {
      await pool.query(`
        INSERT INTO catalogo_itens
        (nome, tipo, preco_padrao, preco_custo, unidade_medida, descricao, criado_em, atualizado_em, quantidade_minima, quantidade_maxima)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW(), $7, $8)
      `, [
        nome, tipo, preco_padrao, preco_custo, unidade_medida, descricao, quantidade_minima, quantidade_maxima
      ]);
      reply.send({ message: 'Item cadastrado no catálogo' });
    } catch (erro) {
      reply.code(500).send({ erro: erro.message });
    }
  });

  // PUT - Atualiza item do catálogo
  fastify.put('/catalogo/:id', async (request, reply) => {
    const { id } = request.params;
    const {
      nome,
      tipo,
      preco_padrao,
      preco_custo,
      unidade_medida,
      descricao,
      quantidade_minima,
      quantidade_maxima
    } = request.body;

    try {
      await pool.query(`
        UPDATE catalogo_itens SET
          nome = $1,
          tipo = $2,
          preco_padrao = $3,
          preco_custo = $4,
          unidade_medida = $5,
          descricao = $6,
          atualizado_em = NOW(),
          quantidade_minima = $7,
          quantidade_maxima = $8
        WHERE id = $9
      `, [
        nome, tipo, preco_padrao, preco_custo, unidade_medida, descricao, quantidade_minima, quantidade_maxima, id
      ]);
      reply.send({ message: 'Item do catálogo atualizado' });
    } catch (erro) {
      reply.code(500).send({ erro: erro.message });
    }
  });

  // DELETE - Remove item do catálogo
  fastify.delete('/catalogo/:id', async (request, reply) => {
    const { id } = request.params;
    try {
      await pool.query('DELETE FROM catalogo_itens WHERE id = $1', [id]);
      reply.send({ message: 'Item removido do catálogo' });
    } catch (erro) {
      reply.code(500).send({ erro: erro.message });
    }
  });
}

module.exports = catalogoRoutes;