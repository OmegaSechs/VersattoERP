// ─────────────────────────────────────────────────────────────
//  server.js  —  Versatto ERP v2
// ─────────────────────────────────────────────────────────────
require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const path    = require('path');
const { verificarToken } = require('./auth');

// ── Estáticos ────────────────────────────────────────────────
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, '..', 'frontend', 'public'),
});

// ── CORS ──────────────────────────────────────────────────────
fastify.register(require('@fastify/cors'), {
  origin: process.env.ALLOWED_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
});

// ── Hook global de autenticação JWT ──────────────────────────
fastify.addHook('preHandler', verificarToken);

// ── Rotas ─────────────────────────────────────────────────────
fastify.register(require('./routes/authRoutes'));
fastify.register(require('./routes/pessoasRoutes'));
fastify.register(require('./routes/clientesRoutes'));
fastify.register(require('./routes/fornecedoresRoutes'));
fastify.register(require('./routes/veiculosRoutes'));
fastify.register(require('./routes/catalogoRoutes'));
fastify.register(require('./routes/ordensServicoRoutes'));
fastify.register(require('./routes/relatoriosRoutes'));
fastify.register(require('./routes/financeiroRoutes'));

// ── Start ─────────────────────────────────────────────────────
const start = async () => {
  try {
    await fastify.listen({ port: process.env.PORT || 3000, host: '0.0.0.0' });
    console.log(`\n✅  Versatto ERP rodando em http://localhost:${process.env.PORT || 3000}\n`);
  } catch (erro) {
    fastify.log.error(erro);
    process.exit(1);
  }
};

start();
