const pool = require('../database');
const { apenasInteiro, sanitizarString, exigir } = require('../validators');

async function pessoasRoutes(fastify, opts) {
  fastify.get('/pessoas', async (request, reply) => {
    try {
      const { pessoa_id, nome, cpf_cnpj } = request.query;
      const where = []; const vals = [];
      if (pessoa_id) { vals.push(apenasInteiro(pessoa_id)); where.push(`pessoa_id = $${vals.length}`); }
      if (nome)      { vals.push(`%${nome}%`);              where.push(`nome ILIKE $${vals.length}`); }
      if (cpf_cnpj)  { vals.push(cpf_cnpj);                 where.push(`cpf_cnpj = $${vals.length}`); }
      const sql = `SELECT * FROM pessoas ${where.length?'WHERE '+where.join(' AND '):''}  ORDER BY nome`;
      const { rows } = await pool.query(sql, vals);
      reply.send(rows);
    } catch(e) { reply.code(500).send({ erro: e.message }); }
  });

  fastify.post('/pessoas', async (request, reply) => {
    const b = request.body || {};
    if (!exigir(['nome'], b, reply)) return;
    try {
      await pool.query(`
        INSERT INTO pessoas
          (nome, cpf_cnpj, email, telefone, is_cliente, is_fornecedor, is_pessoa_fisica,
           criado_em, atualizado_em, nome_fantasia, is_pessoa_juridica,
           rua, bairro, numero, celular, cidade, estado, cep, inscricao_estadual)
        VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW(),$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
        [sanitizarString(b.nome), sanitizarString(b.cpf_cnpj,20),
         sanitizarString(b.email,150), sanitizarString(b.telefone,20),
         !!b.is_cliente, !!b.is_fornecedor, !!b.is_pessoa_fisica,
         sanitizarString(b.nome_fantasia), !!b.is_pessoa_juridica,
         sanitizarString(b.rua), sanitizarString(b.bairro,100),
         sanitizarString(b.numero,20), sanitizarString(b.celular,20),
         sanitizarString(b.cidade,100), sanitizarString(b.estado,2),
         sanitizarString(b.cep,10), sanitizarString(b.inscricao_estadual,30)]);
      reply.code(201).send({ message: 'Pessoa cadastrada' });
    } catch(e) { reply.code(500).send({ erro: e.message }); }
  });

  fastify.put('/pessoas/:pessoa_id', async (request, reply) => {
    const id = apenasInteiro(request.params.pessoa_id);
    if (!id) return reply.code(400).send({ erro: 'ID inválido' });
    const b = request.body || {};
    try {
      await pool.query(`
        UPDATE pessoas SET
          nome=$1, cpf_cnpj=$2, email=$3, telefone=$4,
          is_cliente=$5, is_fornecedor=$6, is_pessoa_fisica=$7,
          nome_fantasia=$8, is_pessoa_juridica=$9,
          rua=$10, bairro=$11, numero=$12, celular=$13,
          cidade=$14, estado=$15, cep=$16, inscricao_estadual=$17,
          complemento=$18, atualizado_em=NOW()
        WHERE pessoa_id=$19`,
        [sanitizarString(b.nome), sanitizarString(b.cpf_cnpj,20),
         sanitizarString(b.email,150), sanitizarString(b.telefone,20),
         !!b.is_cliente, !!b.is_fornecedor, !!b.is_pessoa_fisica,
         sanitizarString(b.nome_fantasia), !!b.is_pessoa_juridica,
         sanitizarString(b.rua), sanitizarString(b.bairro,100),
         sanitizarString(b.numero,20), sanitizarString(b.celular,20),
         sanitizarString(b.cidade,100), sanitizarString(b.estado,2),
         sanitizarString(b.cep,10), sanitizarString(b.inscricao_estadual,30),
         sanitizarString(b.complemento,100), id]);
      reply.send({ message: 'Pessoa atualizada' });
    } catch(e) { reply.code(500).send({ erro: e.message }); }
  });

  fastify.delete('/pessoas/:pessoa_id', async (request, reply) => {
    const id = apenasInteiro(request.params.pessoa_id);
    if (!id) return reply.code(400).send({ erro: 'ID inválido' });
    try {
      await pool.query('DELETE FROM pessoas WHERE pessoa_id=$1', [id]);
      reply.send({ message: 'Pessoa removida' });
    } catch(e) { reply.code(500).send({ erro: e.message }); }
  });
}

module.exports = pessoasRoutes;
