const pool = require('../database');

async function fornecedoresRoutes(fastify, opts) {
  // GET - Lista fornecedores
  fastify.get('/fornecedores', async (request, reply) => {
    try {
      const { nome, cpf_cnpj } = request.query;
      const whereClauses = ['is_fornecedor = true'];
      const values = [];

      if (nome) {
        values.push(`%${nome}%`);
        whereClauses.push(`nome ILIKE $${values.length}`);
      }
      if (cpf_cnpj) {
        values.push(cpf_cnpj);
        whereClauses.push(`cpf_cnpj = $${values.length}`);
      }

      const whereSQL = 'WHERE ' + whereClauses.join(' AND ');
      const { rows } = await pool.query(`SELECT * FROM pessoas ${whereSQL}`, values);
      reply.send(rows);
    } catch (erro) {
      reply.code(500).send({ erro: erro.message });
    }
  });
}

module.exports = fornecedoresRoutes;
