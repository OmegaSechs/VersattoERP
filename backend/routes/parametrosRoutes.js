// ─────────────────────────────────────────────────────────────
//  parametrosRoutes.js  —  Parâmetros da empresa (singleton)
// ─────────────────────────────────────────────────────────────
const pool = require('../database');
const { requerAdmin } = require('../auth');

async function parametrosRoutes(fastify, opts) {

  // GET /parametros — qualquer usuário autenticado
  fastify.get('/parametros', async (request, reply) => {
    try {
      const { rows } = await pool.query('SELECT * FROM parametros_empresa WHERE id = 1');
      reply.send(rows[0] || {});
    } catch (err) {
      reply.code(500).send({ erro: err.message });
    }
  });

  // PUT /parametros — somente admin
  fastify.put('/parametros', { preHandler: requerAdmin }, async (request, reply) => {
    const { nome_empresa, slogan, cnpj, telefone, email_empresa, endereco, cidade, estado } = request.body || {};
    try {
      const { rows } = await pool.query(`
        UPDATE parametros_empresa SET
          nome_empresa  = COALESCE($1, nome_empresa),
          slogan        = COALESCE($2, slogan),
          cnpj          = COALESCE($3, cnpj),
          telefone      = COALESCE($4, telefone),
          email_empresa = COALESCE($5, email_empresa),
          endereco      = COALESCE($6, endereco),
          cidade        = COALESCE($7, cidade),
          estado        = COALESCE($8, estado),
          atualizado_em = NOW()
        WHERE id = 1
        RETURNING *`,
        [nome_empresa ?? null, slogan ?? null, cnpj ?? null, telefone ?? null,
         email_empresa ?? null, endereco ?? null, cidade ?? null, estado ?? null]
      );
      if (!rows.length) return reply.code(404).send({ erro: 'Registro de parâmetros não encontrado. Execute a migration.' });
      reply.send(rows[0]);
    } catch (err) {
      reply.code(500).send({ erro: err.message });
    }
  });
}

module.exports = parametrosRoutes;
