const pool = require('../database');

async function clientesRoutes(fastify, opts) {
  // GET - Lista clientes
  fastify.get('/clientes', async (request, reply) => {
    try {
      const { id, nome, cpfCnpj } = request.query;
      const whereClauses = ['is_cliente = true'];
      const values = [];

      if (id) {
        values.push(id);
        whereClauses.push(`id = $${values.length}`);
      }
      if (nome) {
        values.push(`%${nome}%`);
        whereClauses.push(`nome ILIKE $${values.length}`);
      }
      if (cpfCnpj) {
        values.push(cpfCnpj);
        whereClauses.push(`cpf_cnpj = $${values.length}`);
      }

      const whereSQL = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';
      const query = `SELECT * FROM pessoas ${whereSQL}`;
      const { rows } = await pool.query(query, values);

      reply.send(rows);
    } catch (erro) {
      reply.code(500).send({ erro: erro.message });
    }
  });

  // POST - Cria cliente
  fastify.post('/clientes', async (request, reply) => {
    const {
      nome,
      cpfCnpj,
      inscricaoEstadual,
      nomeFantasia,
      rua,
      bairro,
      numero,
      email,
      telefone,
      celular
    } = request.body;

    try {
      await pool.query(`
        INSERT INTO pessoas
        (nome, cpf_cnpj, inscricao_estadual, nome_fantasia, rua, bairro, numero, email, telefone, celular, is_cliente)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true)
      `, [
        nome, cpfCnpj, inscricaoEstadual, nomeFantasia, rua, bairro, numero,
        email, telefone, celular
      ]);
      reply.send({ message: 'Cliente cadastrado' });
    } catch (erro) {
      reply.code(500).send({ erro: erro.message });
    }
  });

  // PUT - Atualiza cliente
  fastify.put('/clientes/:id', async (request, reply) => {
    const { id } = request.params;
    const {
      nome,
      cpfCnpj,
      inscricaoEstadual,
      nomeFantasia,
      rua,
      bairro,
      numero,
      email,
      telefone,
      celular
    } = request.body;

    try {
      await pool.query(`
        UPDATE pessoas SET
          nome = $1,
          cpf_cnpj = $2,
          inscricao_estadual = $3,
          nome_fantasia = $4,
          rua = $5,
          bairro = $6,
          numero = $7,
          email = $8,
          telefone = $9,
          celular = $10
        WHERE id = $11 AND is_cliente = true
      `, [
        nome, cpfCnpj, inscricaoEstadual, nomeFantasia, rua, bairro, numero,
        email, telefone, celular, id
      ]);
      reply.send({ message: 'Cliente atualizado' });
    } catch (erro) {
      reply.code(500).send({ erro: erro.message });
    }
  });

  // DELETE - Remove cliente
  fastify.delete('/clientes/:id', async (request, reply) => {
    const { id } = request.params;
    try {
      await pool.query('DELETE FROM pessoas WHERE id = $1 AND is_cliente = true', [id]);
      reply.send({ message: 'Cliente removido' });
    } catch (erro) {
      reply.code(500).send({ erro: erro.message });
    }
  });
}

module.exports = clientesRoutes;