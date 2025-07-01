const fastify = require('fastify')({ logger: true });
const path = require('path');
const pool = require('./database');

fastify.register(require('@fastify/static'), {
  root: path.join(__dirname, 'public'),
});

fastify.post('/pessoas', {
  schema: {
    body: {
      type: 'object',
      required: ['nome', 'cpfCnpj', 'tipoPessoa'],
      properties: {
        nome: {type: 'string'},
        cpfCnpj: {type: 'string'},
        inscricaoEstadual: {type: 'string'},
        nomeFantasia: {type: 'string'},
        rua: {type: 'string'},
        bairro: {type: 'string'},
        numero: {type: 'string'},
        email: {type: 'string', format: 'email'},
        telefone: {type: 'string'},
        celular: {type: 'string'},
        tipoPessoa: {
          type: 'string',
          enum: ['Cliente', 'Fornecedor', 'Pessoa Física', 'Pessoa Jurídica']
        }
      }
    }
  }
}, async (request, reply) => {
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
    celular,
    tipoPessoa
  } = request.body;

  const is_cliente = tipoPessoa === 'Cliente';
  const is_fornecedor = tipoPessoa === 'Fornecedor';
  const is_pessoa_fisica = tipoPessoa === 'Pessoa Física';
  const is_pessoa_juridica = tipoPessoa === 'Pessoa Jurídica';

  try {
    await pool.query(`
      INSERT INTO pessoas
      (nome, cpf_cnpj, inscricao_estadual, nome_fantasia, rua, bairro, numero, email, telefone, celular,
       is_cliente, is_fornecedor, is_pessoa_fisica, is_pessoa_juridica)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
    `, [
      nome, cpfCnpj, inscricaoEstadual, nomeFantasia, rua, bairro, numero,
      email, telefone, celular,
      is_cliente, is_fornecedor, is_pessoa_fisica, is_pessoa_juridica
    ]);

    reply.send({ message: 'Cadastrado' });
  } catch (erro) {
    console.error('Erro', erro);
    reply.code(500).send({ erro: erro });
  }
});


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