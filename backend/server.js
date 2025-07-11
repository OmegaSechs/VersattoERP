const fastify = require('fastify')({ logger: true });
const path = require('path');

// Registro do plugin de arquivos estáticos
fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'public'),
});

// Registro das rotas separadas
fastify.register(require('./routes/clientesRoutes'));
fastify.register(require('./routes/pessoasRoutes'));
fastify.register(require('./routes/catalogoRoutes'));
fastify.register(require('./routes/veiculosRoutes'));
// Adicionar outros arquivos de rotas conforme formos fazendo

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    console.log('http://localhost:3000');
  } catch (erro) {
    fastify.log.error(erro);
    process.exit(1);
  }
};

start();