const pool = require('../database');

async function pessoasRoutes(fastify, opts) {
  // GET - Lista pessoas
  fastify.get('/pessoas', async (request, reply) => {
    try {
      const { pessoa_id, nome, cpf_cnpj } = request.query;
      const whereClauses = [];
      const values = [];

      if (pessoa_id) {
        values.push(pessoa_id);
        whereClauses.push(`pessoa_id = $${values.length}`);
      }
      if (nome) {
        values.push(`%${nome}%`);
        whereClauses.push(`nome ILIKE $${values.length}`);
      }
      if (cpf_cnpj) {
        values.push(cpf_cnpj);
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

  // POST - Cria pessoa
  fastify.post('/pessoas', async (request, reply) => {
    const {
      nome,
      cpf_cnpj,
      email,
      telefone,
      is_cliente,
      is_fornecedor,
      is_pessoa_fisica,
      nome_fantasia,
      is_pessoa_juridica,
      rua,
      bairro,
      numero,
      celular,
      cidade,
      estado,
      cep,
      inscricao_estadual
    } = request.body;

    try {
      await pool.query(`
        INSERT INTO pessoas
        (nome, cpf_cnpj, email, telefone, is_cliente, is_fornecedor, is_pessoa_fisica, criado_em, atualizado_em, nome_fantasia, is_pessoa_juridica, rua, bairro, numero, celular, cidade, estado, cep, inscricao_estadual)
        VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `, [
        nome, cpf_cnpj, email, telefone, is_cliente, is_fornecedor, is_pessoa_fisica,
        nome_fantasia, is_pessoa_juridica, rua, bairro, numero, celular, cidade,
        estado, cep, inscricao_estadual
      ]);
      reply.send({ message: 'Pessoa cadastrada' });
    } catch (erro) {
      reply.code(500).send({ erro: erro.message });
    }
  });

  // PUT - Atualiza pessoa
  fastify.put('/pessoas/:pessoa_id', async (request, reply) => {
    const { pessoa_id } = request.params;
    const {
      nome,
      cpf_cnpj,
      email,
      telefone,
      is_cliente,
      is_fornecedor,
      is_pessoa_fisica,
      nome_fantasia,
      is_pessoa_juridica,
      rua,
      bairro,
      numero,
      celular,
      cidade,
      estado,
      cep,
      inscricao_estadual
    } = request.body;

    try {
      await pool.query(`
        UPDATE pessoas SET
          nome = $1,
          cpf_cnpj = $2,
          email = $3,
          telefone = $4,
          is_cliente = $5,
          is_fornecedor = $6,
          is_pessoa_fisica = $7,
          nome_fantasia = $8,
          is_pessoa_juridica = $9,
          rua = $10,
          bairro = $11,
          numero = $12,
          celular = $13,
          cidade = $14,
          estado = $15,
          cep = $16,
          inscricao_estadual = $17,
          atualizado_em = NOW()
        WHERE pessoa_id = $18
      `, [
        nome, cpf_cnpj, email, telefone, is_cliente, is_fornecedor, is_pessoa_fisica,
        nome_fantasia, is_pessoa_juridica, rua, bairro, numero, celular, cidade,
        estado, cep, inscricao_estadual, pessoa_id
      ]);
      reply.send({ message: 'Pessoa atualizada' });
    } catch (erro) {
      reply.code(500).send({ erro: erro.message });
    }
  });

  // DELETE - Remove pessoa
  fastify.delete('/pessoas/:pessoa_id', async (request, reply) => {
    const { pessoa_id } = request.params;
    try {
      await pool.query('DELETE FROM pessoas WHERE pessoa_id = $1', [pessoa_id]);
      reply.send({ message: 'Pessoa removida' });
    } catch (erro) {
      reply.code(500).send({ erro: erro.message });
    }
  });
}

module.exports = pessoasRoutes;