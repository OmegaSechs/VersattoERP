const pool = require('../database');

async function veiculosRoutes(fastify, opts) {
  // GET - Lista veículos
  fastify.get('/veiculos', async (request, reply) => {
    try {
      const { id, cliente_id, placa, modelo } = request.query;
      const whereClauses = [];
      const values = [];

      if (id) {
        values.push(id);
        whereClauses.push(`id = $${values.length}`);
      }
      if (cliente_id) {
        values.push(cliente_id);
        whereClauses.push(`cliente_id = $${values.length}`);
      }
      if (placa) {
        values.push(placa);
        whereClauses.push(`placa = $${values.length}`);
      }
      if (modelo) {
        values.push(`%${modelo}%`);
        whereClauses.push(`modelo ILIKE $${values.length}`);
      }

      const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';
      const query = `SELECT * FROM veiculos ${whereSQL}`;
      const { rows } = await pool.query(query, values);

      reply.send(rows);
    } catch (erro) {
      reply.code(500).send({ erro: erro.message });
    }
  });

  // POST - Cria veículo
  fastify.post('/veiculos', async (request, reply) => {
    const {
      cliente_id,
      marca,
      modelo,
      ano,
      placa,
      cor,
      quilometragem,
      observacoes
    } = request.body;

    try {
      await pool.query(`
        INSERT INTO veiculos
        (cliente_id, marca, modelo, ano, placa, cor, quilometragem, observacoes, criado_em, atualizado_em)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
      `, [
        cliente_id, marca, modelo, ano, placa, cor, quilometragem, observacoes
      ]);
      reply.send({ message: 'Veículo cadastrado' });
    } catch (erro) {
      reply.code(500).send({ erro: erro.message });
    }
  });

  // PUT - Atualiza veículo
  fastify.put('/veiculos/:id', async (request, reply) => {
    const { id } = request.params;
    const {
      cliente_id,
      marca,
      modelo,
      ano,
      placa,
      cor,
      quilometragem,
      observacoes
    } = request.body;

    try {
      await pool.query(`
        UPDATE veiculos SET
          cliente_id = $1,
          marca = $2,
          modelo = $3,
          ano = $4,
          placa = $5,
          cor = $6,
          quilometragem = $7,
          observacoes = $8,
          atualizado_em = NOW()
        WHERE id = $9
      `, [
        cliente_id, marca, modelo, ano, placa, cor, quilometragem, observacoes, id
      ]);
      reply.send({ message: 'Veículo atualizado' });
    } catch (erro) {
      reply.code(500).send({ erro: erro.message });
    }
  });

  // DELETE - Remove veículo
  fastify.delete('/veiculos/:id', async (request, reply) => {
    const { id } = request.params;
    try {
      await pool.query('DELETE FROM veiculos WHERE id = $1', [id]);
      reply.send({ message: 'Veículo removido' });
    } catch (erro) {
      reply.code(500).send({ erro: erro.message });
    }
  });
}

module.exports = veiculosRoutes;