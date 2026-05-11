// ─────────────────────────────────────────────────────────────
//  auth.js  —  Middleware de autenticação JWT para Fastify 5
// ─────────────────────────────────────────────────────────────
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'versatto_secret_mude_em_producao';

// Rotas que NÃO precisam de token
const PUBLIC_ROUTES = [
  { method: 'POST', url: '/auth/login'  },
  { method: 'POST', url: '/auth/logout' },
  { method: 'GET',  url: '/'            },
];

function isPublic(method, url) {
  // arquivos estáticos (.html, .css, .js, .ico, .svg, .png)
  if (/\.(html|css|js|ico|svg|png|jpg|jpeg|woff2?)(\?.*)?$/.test(url)) return true;
  return PUBLIC_ROUTES.some(r => r.method === method && r.url === url);
}

// Hook que roda em toda requisição
async function verificarToken(request, reply) {
  const { method, url } = request;
  if (isPublic(method, url)) return;           // rota pública — passa direto

  // Lê o token do header Authorization (Bearer) ou do cookie httpOnly
  const authHeader = request.headers.authorization;
  const token = (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null)
    || request.cookies?.versatto_jwt
    || null;

  if (!token) {
    return reply.code(401).send({ erro: 'Token não informado' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    request.usuario = payload;   // disponível em request.usuario nas rotas
  } catch (err) {
    return reply.code(401).send({ erro: 'Token inválido ou expirado' });
  }
}

// Valida que o usuário tem perfil de admin
async function requerAdmin(request, reply) {
  if (request.usuario?.perfil !== 'admin') {
    return reply.code(403).send({ erro: 'Acesso restrito a administradores' });
  }
}

module.exports = { verificarToken, requerAdmin, JWT_SECRET };
