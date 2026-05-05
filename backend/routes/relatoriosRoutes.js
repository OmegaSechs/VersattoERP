// ─────────────────────────────────────────────────────────────
//  relatoriosRoutes.js  —  Relatório de faturamento e estoque
// ─────────────────────────────────────────────────────────────
const pool = require('../database');
const { apenasInteiro } = require('../validators');

async function relatoriosRoutes(fastify, opts) {

  // GET /relatorios/faturamento?de=YYYY-MM-DD&ate=YYYY-MM-DD&status=concluida
  fastify.get('/relatorios/faturamento', async (request, reply) => {
    const { de, ate, status } = request.query;
    const where = [];
    const vals  = [];

    if (de)     { vals.push(de);     where.push(`os.os_dt_entrada >= $${vals.length}`); }
    if (ate)    { vals.push(ate);    where.push(`os.os_dt_entrada <= $${vals.length}`); }
    if (status) { vals.push(status); where.push(`os.status = $${vals.length}`); }

    const wClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    try {
      // Totais gerais
      const { rows: totais } = await pool.query(`
        SELECT
          COUNT(*)                          AS total_os,
          COALESCE(SUM(os.valor_total), 0)  AS faturamento_bruto,
          COALESCE(AVG(os.valor_total), 0)  AS ticket_medio
        FROM ordem_servico os
        ${wClause}`, vals);

      // Faturamento por mês
      const { rows: porMes } = await pool.query(`
        SELECT
          TO_CHAR(os.os_dt_entrada, 'YYYY-MM') AS mes,
          COUNT(*)                              AS total_os,
          COALESCE(SUM(os.valor_total), 0)      AS faturamento
        FROM ordem_servico os
        ${wClause}
        GROUP BY mes ORDER BY mes`, vals);

      // Top 10 serviços/produtos mais faturados
      const { rows: topItens } = await pool.query(`
        SELECT
          oi.nome,
          SUM(oi.quantidade)   AS qtd_total,
          SUM(oi.subtotal)     AS faturamento
        FROM os_itens oi
        JOIN ordem_servico os ON os.os_id = oi.os_id
        ${wClause}
        GROUP BY oi.nome
        ORDER BY faturamento DESC
        LIMIT 10`, vals);

      // Top 10 clientes
      const { rows: topClientes } = await pool.query(`
        SELECT
          p.nome                            AS cliente,
          COUNT(os.os_id)                   AS total_os,
          COALESCE(SUM(os.valor_total), 0)  AS faturamento
        FROM ordem_servico os
        LEFT JOIN pessoas p ON p.pessoa_id = os.cliente_id
        ${wClause}
        GROUP BY p.nome
        ORDER BY faturamento DESC
        LIMIT 10`, vals);

      // Lista detalhada das OS
      const { rows: lista } = await pool.query(`
        SELECT
          os.os_id, os.os_dt_entrada, os.status, os.tipo,
          os.veiculo, os.placa, os.valor_total,
          p.nome AS cliente_nome
        FROM ordem_servico os
        LEFT JOIN pessoas p ON p.pessoa_id = os.cliente_id
        ${wClause}
        ORDER BY os.os_dt_entrada DESC, os.os_id DESC`, vals);

      reply.send({
        periodo: { de: de || null, ate: ate || null, status: status || null },
        resumo: {
          total_os: parseInt(totais[0].total_os),
          faturamento_bruto: parseFloat(totais[0].faturamento_bruto),
          ticket_medio: parseFloat(totais[0].ticket_medio),
        },
        por_mes: porMes,
        top_itens: topItens,
        top_clientes: topClientes,
        lista,
      });
    } catch (erro) {
      reply.code(500).send({ erro: erro.message });
    }
  });

  // GET /relatorios/estoque  —  itens abaixo do mínimo + visão geral
  fastify.get('/relatorios/estoque', async (request, reply) => {
    try {
      const { rows: geral } = await pool.query(`
        SELECT
          id, nome, tipo, quantidade_estoque,
          quantidade_minima, quantidade_maxima,
          preco_custo, preco_padrao,
          CASE
            WHEN quantidade_estoque <= 0              THEN 'zerado'
            WHEN quantidade_estoque < quantidade_minima THEN 'abaixo_minimo'
            WHEN quantidade_estoque > quantidade_maxima THEN 'acima_maximo'
            ELSE 'normal'
          END AS situacao
        FROM catalogo_itens
        WHERE tipo IN (2, 3)
        ORDER BY situacao, nome`);

      const abaixo  = geral.filter(i => i.situacao === 'abaixo_minimo' || i.situacao === 'zerado');
      const normais = geral.filter(i => i.situacao === 'normal');

      reply.send({
        resumo: {
          total_itens: geral.length,
          abaixo_minimo: abaixo.length,
          zerados: geral.filter(i => i.situacao === 'zerado').length,
          normais: normais.length,
        },
        alertas: abaixo,
        todos: geral,
      });
    } catch (erro) {
      reply.code(500).send({ erro: erro.message });
    }
  });

  // GET /relatorios/os-abertas  —  OS em aberto para dashboard
  fastify.get('/relatorios/os-abertas', async (request, reply) => {
    try {
      const { rows } = await pool.query(`
        SELECT os.*, p.nome AS cliente_nome
        FROM ordem_servico os
        LEFT JOIN pessoas p ON p.pessoa_id = os.cliente_id
        WHERE os.status IN ('aberta','em_andamento')
        ORDER BY os.os_dt_entrada ASC`);
      reply.send(rows);
    } catch (erro) {
      reply.code(500).send({ erro: erro.message });
    }
  });
}

module.exports = relatoriosRoutes;
