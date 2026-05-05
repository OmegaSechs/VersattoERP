// ─────────────────────────────────────────────────────────────
//  authRoutes.js  —  Login, logout, gerenciar usuários
// ─────────────────────────────────────────────────────────────
const pool      = require('../database');
const bcrypt    = require('bcrypt');
const jwt       = require('jsonwebtoken');
const { JWT_SECRET, requerAdmin } = require('../auth');

const SALT_ROUNDS = 10;

async function authRoutes(fastify, opts) {

  // POST /auth/login
  fastify.post('/auth/login', async (request, reply) => {
    const { email, senha } = request.body || {};

    if (!email || !senha) {
      return reply.code(400).send({ erro: 'E-mail e senha são obrigatórios' });
    }

    try {
      const { rows } = await pool.query(
        'SELECT * FROM usuarios WHERE email = $1 AND ativo = true',
        [email.toLowerCase().trim()]
      );

      if (rows.length === 0) {
        return reply.code(401).send({ erro: 'Credenciais inválidas' });
      }

      const usuario = rows[0];
      const senhaOk = await bcrypt.compare(senha, usuario.senha_hash);

      if (!senhaOk) {
        return reply.code(401).send({ erro: 'Credenciais inválidas' });
      }

      const token = jwt.sign(
        { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
        JWT_SECRET,
        { expiresIn: '8h' }
      );

      reply.send({
        token,
        usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil }
      });
    } catch (erro) {
      console.error("🚨 ERRO NO BANCO:", erro.message);
      reply.code(500).send({ erro: erro.message });
    }
  });

  // GET /auth/me  —  retorna dados do usuário logado
  fastify.get('/auth/me', async (request, reply) => {
    reply.send({ usuario: request.usuario });
  });

  // PUT /auth/senha  —  altera a própria senha
  fastify.put('/auth/senha', async (request, reply) => {
    const { senha_atual, nova_senha } = request.body || {};
    if (!senha_atual || !nova_senha) {
      return reply.code(400).send({ erro: 'Informe a senha atual e a nova senha' });
    }
    if (nova_senha.length < 6) {
      return reply.code(400).send({ erro: 'A nova senha deve ter ao menos 6 caracteres' });
    }
    try {
      const { rows } = await pool.query('SELECT * FROM usuarios WHERE id = $1', [request.usuario.id]);
      if (!rows.length) return reply.code(404).send({ erro: 'Usuário não encontrado' });

      const ok = await bcrypt.compare(senha_atual, rows[0].senha_hash);
      if (!ok) return reply.code(401).send({ erro: 'Senha atual incorreta' });

      const hash = await bcrypt.hash(nova_senha, SALT_ROUNDS);
      await pool.query('UPDATE usuarios SET senha_hash = $1 WHERE id = $2', [hash, request.usuario.id]);
      reply.send({ message: 'Senha alterada com sucesso' });
    } catch (erro) {
      reply.code(500).send({ erro: erro.message });
    }
  });

  // ── Admin: gerenciar usuários ──────────────────────────────

  // GET /usuarios
  fastify.get('/usuarios', { preHandler: requerAdmin }, async (request, reply) => {
    try {
      const { rows } = await pool.query(
        'SELECT id, nome, email, perfil, ativo, criado_em FROM usuarios ORDER BY id'
      );
      reply.send(rows);
    } catch (erro) {
      reply.code(500).send({ erro: erro.message });
    }
  });

  // POST /usuarios
  fastify.post('/usuarios', { preHandler: requerAdmin }, async (request, reply) => {
    const { nome, email, senha, perfil } = request.body || {};
    if (!nome || !email || !senha) {
      return reply.code(400).send({ erro: 'Nome, e-mail e senha são obrigatórios' });
    }
    try {
      const hash = await bcrypt.hash(senha, SALT_ROUNDS);
      await pool.query(
        'INSERT INTO usuarios (nome, email, senha_hash, perfil) VALUES ($1, $2, $3, $4)',
        [nome, email.toLowerCase().trim(), hash, perfil || 'operador']
      );
      reply.code(201).send({ message: 'Usuário criado com sucesso' });
    } catch (erro) {
      if (erro.code === '23505') return reply.code(409).send({ erro: 'E-mail já cadastrado' });
      reply.code(500).send({ erro: erro.message });
    }
  });

  // PUT /usuarios/:id
  fastify.put('/usuarios/:id', { preHandler: requerAdmin }, async (request, reply) => {
    const { id } = request.params;
    const { nome, perfil, ativo, nova_senha } = request.body || {};
    try {
      if (nova_senha) {
        if (nova_senha.length < 6) return reply.code(400).send({ erro: 'Senha deve ter ao menos 6 caracteres' });
        const hash = await bcrypt.hash(nova_senha, SALT_ROUNDS);
        await pool.query(
          'UPDATE usuarios SET nome=$1, perfil=$2, ativo=$3, senha_hash=$4 WHERE id=$5',
          [nome, perfil, ativo, hash, id]
        );
      } else {
        await pool.query(
          'UPDATE usuarios SET nome=$1, perfil=$2, ativo=$3 WHERE id=$4',
          [nome, perfil, ativo, id]
        );
      }
      reply.send({ message: 'Usuário atualizado' });
    } catch (erro) {
      reply.code(500).send({ erro: erro.message });
    }
  });

  // DELETE /usuarios/:id
  fastify.delete('/usuarios/:id', { preHandler: requerAdmin }, async (request, reply) => {
    const { id } = request.params;
    if (String(id) === String(request.usuario.id)) {
      return reply.code(400).send({ erro: 'Não é possível excluir o próprio usuário' });
    }
    try {
      await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
      reply.send({ message: 'Usuário removido' });
    } catch (erro) {
      reply.code(500).send({ erro: erro.message });
    }
  });
}

module.exports = authRoutes;
