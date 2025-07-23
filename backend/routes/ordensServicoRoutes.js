const pool = require('../database');

async function ordensServicoRoutes(fastify, opts) {
  // GET - Lista todas as ordens de serviço
  fastify.get('/ordens-servico', async (request, reply) => {
    try {
      const { rows } = await pool.query('SELECT * FROM ordem_servico ORDER BY os_id DESC');
      reply.send(rows);
    } catch (erro) {
      reply.code(500).send({ erro: erro.message });
    }
  });

  // GET - Ordem de serviço por ID
  fastify.get('/ordens-servico/:id', async (request, reply) => {
    const { id } = request.params;
    try {
      const { rows } = await pool.query('SELECT * FROM ordem_servico WHERE os_id = $1', [id]);
      if (rows.length === 0) {
        reply.code(404).send({ erro: 'Ordem de serviço não encontrada' });
      } else {
        reply.send(rows[0]);
      }
    } catch (erro) {
      reply.code(500).send({ erro: erro.message });
    }
  });

  // POST - Cria uma nova ordem de serviço
  fastify.post('/ordens-servico', async (request, reply) => {
    const {
      cliente_id,
      veiculo,
      placa,
      os_dt_entrada,
      os_dt_saida,
      os_hr_entrada,
      os_hr_saida,
      tipo,
      status,
      veiculo_id
    } = request.body;

    try {
      await pool.query(`
        INSERT INTO ordem_servico
        (cliente_id, veiculo, placa, os_dt_entrada, os_dt_saida, os_hr_entrada, os_hr_saida, tipo, status, veiculo_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        cliente_id, veiculo, placa, os_dt_entrada, os_dt_saida, os_hr_entrada, os_hr_saida, tipo, status, veiculo_id
      ]);
      reply.send({ message: 'Ordem de serviço cadastrada com sucesso' });
    } catch (erro) {
      reply.code(500).send({ erro: erro.message });
    }
  });

  // PUT - Atualiza uma ordem de serviço
  fastify.put('/ordens-servico/:id', async (request, reply) => {
    const { id } = request.params;
    const {
      cliente_id,
      veiculo,
      placa,
      os_dt_entrada,
      os_dt_saida,
      os_hr_entrada,
      os_hr_saida,
      tipo,
      status,
      veiculo_id
    } = request.body;

    try {
      await pool.query(`
        UPDATE ordem_servico SET
          cliente_id = $1,
          veiculo = $2,
          placa = $3,
          os_dt_entrada = $4,
          os_dt_saida = $5,
          os_hr_entrada = $6,
          os_hr_saida = $7,
          tipo = $8,
          status = $9,
          veiculo_id = $10
        WHERE os_id = $11
      `, [
        cliente_id, veiculo, placa, os_dt_entrada, os_dt_saida, os_hr_entrada, os_hr_saida, tipo, status, veiculo_id, id
      ]);
      reply.send({ message: 'Ordem de serviço atualizada com sucesso' });
    } catch (erro) {
      reply.code(500).send({ erro: erro.message });
    }
  });

  // DELETE - Remove uma ordem de serviço
  fastify.delete('/ordens-servico/:id', async (request, reply) => {
    const { id } = request.params;
    try {
      await pool.query('DELETE FROM ordem_servico WHERE os_id = $1', [id]);
      reply.send({ message: 'Ordem de serviço removida com sucesso' });
    } catch (erro) {
      reply.code(500).send({ erro: erro.message });
    }
  });
}

module.exports = ordensServicoRoutes;