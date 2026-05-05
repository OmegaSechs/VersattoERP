// ─────────────────────────────────────────────────────────────
//  ordensServicoRoutes.js  —  OS + itens + movimentação estoque
// ─────────────────────────────────────────────────────────────
const pool = require('../database');
const { apenasInteiro, apenasDecimal, sanitizarString,
        validarData, validarHora, exigir } = require('../validators');

async function ordensServicoRoutes(fastify, opts) {

  // ── GET /ordens-servico ───────────────────────────────────
  fastify.get('/ordens-servico', async (request, reply) => {
    try {
      const { status, tipo, cliente_id } = request.query;
      const where = [];
      const vals  = [];

      if (status)     { vals.push(status);     where.push(`os.status = $${vals.length}`); }
      if (tipo)       { vals.push(tipo);        where.push(`os.tipo = $${vals.length}`); }
      if (cliente_id) { vals.push(apenasInteiro(cliente_id)); where.push(`os.cliente_id = $${vals.length}`); }

      const sql = `
        SELECT os.*,
               p.nome AS cliente_nome
        FROM ordem_servico os
        LEFT JOIN pessoas p ON p.pessoa_id = os.cliente_id
        ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
        ORDER BY os.os_id DESC`;

      const { rows } = await pool.query(sql, vals);
      reply.send(rows);
    } catch (erro) { reply.code(500).send({ erro: erro.message }); }
  });

  // ── GET /ordens-servico/:id  (OS + itens) ────────────────
  fastify.get('/ordens-servico/:id', async (request, reply) => {
    const id = apenasInteiro(request.params.id);
    if (!id) return reply.code(400).send({ erro: 'ID inválido' });
    try {
      const { rows: osRows } = await pool.query(`
        SELECT os.*, p.nome AS cliente_nome, p.cpf_cnpj, p.telefone, p.celular,
               p.rua, p.numero, p.bairro, p.cidade, p.estado,
               v.marca, v.modelo, v.ano, v.cor, v.quilometragem
        FROM ordem_servico os
        LEFT JOIN pessoas p ON p.pessoa_id = os.cliente_id
        LEFT JOIN veiculos v ON v.id = os.veiculo_id
        WHERE os.os_id = $1`, [id]);

      if (!osRows.length) return reply.code(404).send({ erro: 'OS não encontrada' });

      const { rows: itens } = await pool.query(
        'SELECT * FROM os_itens WHERE os_id = $1 ORDER BY id', [id]);

      reply.send({ ...osRows[0], itens });
    } catch (erro) { reply.code(500).send({ erro: erro.message }); }
  });

  // ── POST /ordens-servico ──────────────────────────────────
  fastify.post('/ordens-servico', async (request, reply) => {
    const body = request.body || {};
    if (!exigir(['os_dt_entrada', 'os_hr_entrada', 'tipo'], body, reply)) return;

    const {
      cliente_id, veiculo_id, veiculo, placa,
      os_dt_entrada, os_dt_saida, os_hr_entrada, os_hr_saida,
      tipo, status, observacoes,
      itens    = [],  // { catalogo_id, nome, quantidade, valor_unitario }
      parcelas = [],  // { descricao, valor, vencimento } — apenas para ordem_servico
    } = body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Calcula valor total a partir dos itens
      const valorTotal = itens.reduce((acc, it) => {
        const q = apenasDecimal(it.quantidade) || 1;
        const v = apenasDecimal(it.valor_unitario) || 0;
        return acc + q * v;
      }, 0);

      // Insere a OS
      const { rows } = await client.query(`
        INSERT INTO ordem_servico
          (cliente_id, veiculo_id, veiculo, placa,
           os_dt_entrada, os_dt_saida, os_hr_entrada, os_hr_saida,
           tipo, status, valor_total, observacoes)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        RETURNING os_id`,
        [
          apenasInteiro(cliente_id), apenasInteiro(veiculo_id),
          sanitizarString(veiculo), sanitizarString(placa, 10),
          validarData(os_dt_entrada), validarData(os_dt_saida),
          validarHora(os_hr_entrada), validarHora(os_hr_saida),
          sanitizarString(tipo, 50), status || 'aberta',
          valorTotal, sanitizarString(observacoes, 500)
        ]
      );
      const os_id = rows[0].os_id;

      // Insere itens e baixa estoque (apenas produtos/materiais — tipo 2 ou 3)
      for (const it of itens) {
        const qtd = apenasDecimal(it.quantidade) || 1;
        const val = apenasDecimal(it.valor_unitario) || 0;
        const sub = qtd * val;
        const cat_id = apenasInteiro(it.catalogo_id);

        await client.query(`
          INSERT INTO os_itens (os_id, catalogo_id, nome, quantidade, valor_unitario, subtotal)
          VALUES ($1,$2,$3,$4,$5,$6)`,
          [os_id, cat_id, sanitizarString(it.nome), qtd, val, sub]
        );

        // Baixa estoque só para tipo 2 (Produto) e 3 (Material)
        if (cat_id) {
          await client.query(`
            UPDATE catalogo_itens
            SET quantidade_estoque = GREATEST(0, quantidade_estoque - $1),
                atualizado_em = NOW()
            WHERE id = $2 AND tipo IN (2, 3)`,
            [qtd, cat_id]
          );
        }
      }

      // Insere parcelas a receber (somente para ordem_servico)
      if (tipo === 'ordem_servico' && Array.isArray(parcelas) && parcelas.length > 0) {
        for (const parc of parcelas) {
          await client.query(`
            INSERT INTO contas_receber (os_id, descricao, valor, vencimento, status)
            VALUES ($1, $2, $3, $4, 'pendente')`,
            [os_id, sanitizarString(parc.descricao, 200),
             apenasDecimal(parc.valor), validarData(parc.vencimento)]);
        }
      }

      await client.query('COMMIT');
      reply.code(201).send({ message: 'OS cadastrada com sucesso', os_id, valor_total: valorTotal });
    } catch (erro) {
      await client.query('ROLLBACK');
      reply.code(500).send({ erro: erro.message });
    } finally {
      client.release();
    }
  });

  // ── PUT /ordens-servico/:id ───────────────────────────────
  fastify.put('/ordens-servico/:id', async (request, reply) => {
    const id = apenasInteiro(request.params.id);
    if (!id) return reply.code(400).send({ erro: 'ID inválido' });

    const body = request.body || {};
    const {
      cliente_id, veiculo_id, veiculo, placa,
      os_dt_entrada, os_dt_saida, os_hr_entrada, os_hr_saida,
      tipo, status, observacoes,
      itens   // se enviado, substitui itens anteriores
    } = body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Se itens forem fornecidos, reverter estoque dos itens antigos e aplicar novos
      if (Array.isArray(itens)) {
        // Reverte estoque dos itens anteriores
        const { rows: itensAntigos } = await client.query(
          'SELECT * FROM os_itens WHERE os_id = $1', [id]);
        for (const it of itensAntigos) {
          if (it.catalogo_id) {
            await client.query(`
              UPDATE catalogo_itens
              SET quantidade_estoque = quantidade_estoque + $1, atualizado_em = NOW()
              WHERE id = $2 AND tipo IN (2, 3)`,
              [it.quantidade, it.catalogo_id]
            );
          }
        }

        // Remove itens antigos
        await client.query('DELETE FROM os_itens WHERE os_id = $1', [id]);

        // Insere novos itens e baixa estoque
        let valorTotal = 0;
        for (const it of itens) {
          const qtd = apenasDecimal(it.quantidade) || 1;
          const val = apenasDecimal(it.valor_unitario) || 0;
          const sub = qtd * val;
          const cat_id = apenasInteiro(it.catalogo_id);
          valorTotal += sub;

          await client.query(`
            INSERT INTO os_itens (os_id, catalogo_id, nome, quantidade, valor_unitario, subtotal)
            VALUES ($1,$2,$3,$4,$5,$6)`,
            [id, cat_id, sanitizarString(it.nome), qtd, val, sub]
          );

          if (cat_id) {
            await client.query(`
              UPDATE catalogo_itens
              SET quantidade_estoque = GREATEST(0, quantidade_estoque - $1), atualizado_em = NOW()
              WHERE id = $2 AND tipo IN (2, 3)`,
              [qtd, cat_id]
            );
          }
        }

        // Atualiza OS com novo valor total
        await client.query(`
          UPDATE ordem_servico SET
            cliente_id=$1, veiculo_id=$2, veiculo=$3, placa=$4,
            os_dt_entrada=$5, os_dt_saida=$6, os_hr_entrada=$7, os_hr_saida=$8,
            tipo=$9, status=$10, valor_total=$11, observacoes=$12
          WHERE os_id=$13`,
          [
            apenasInteiro(cliente_id), apenasInteiro(veiculo_id),
            sanitizarString(veiculo), sanitizarString(placa, 10),
            validarData(os_dt_entrada), validarData(os_dt_saida),
            validarHora(os_hr_entrada), validarHora(os_hr_saida),
            sanitizarString(tipo, 50), status || 'aberta',
            valorTotal, sanitizarString(observacoes, 500), id
          ]
        );
      } else {
        // Atualiza apenas campos da OS sem mexer nos itens
        await client.query(`
          UPDATE ordem_servico SET
            cliente_id=$1, veiculo_id=$2, veiculo=$3, placa=$4,
            os_dt_entrada=$5, os_dt_saida=$6, os_hr_entrada=$7, os_hr_saida=$8,
            tipo=$9, status=$10, observacoes=$11
          WHERE os_id=$12`,
          [
            apenasInteiro(cliente_id), apenasInteiro(veiculo_id),
            sanitizarString(veiculo), sanitizarString(placa, 10),
            validarData(os_dt_entrada), validarData(os_dt_saida),
            validarHora(os_hr_entrada), validarHora(os_hr_saida),
            sanitizarString(tipo, 50), status || 'aberta',
            sanitizarString(observacoes, 500), id
          ]
        );
      }

      await client.query('COMMIT');
      reply.send({ message: 'OS atualizada com sucesso' });
    } catch (erro) {
      await client.query('ROLLBACK');
      reply.code(500).send({ erro: erro.message });
    } finally {
      client.release();
    }
  });

  // ── DELETE /ordens-servico/:id ────────────────────────────
  fastify.delete('/ordens-servico/:id', async (request, reply) => {
    const id = apenasInteiro(request.params.id);
    if (!id) return reply.code(400).send({ erro: 'ID inválido' });

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Reverte estoque antes de deletar
      const { rows: itens } = await client.query(
        'SELECT * FROM os_itens WHERE os_id = $1', [id]);
      for (const it of itens) {
        if (it.catalogo_id) {
          await client.query(`
            UPDATE catalogo_itens
            SET quantidade_estoque = quantidade_estoque + $1, atualizado_em = NOW()
            WHERE id = $2 AND tipo IN (2, 3)`,
            [it.quantidade, it.catalogo_id]
          );
        }
      }

      await client.query('DELETE FROM ordem_servico WHERE os_id = $1', [id]);
      await client.query('COMMIT');
      reply.send({ message: 'OS removida e estoque revertido' });
    } catch (erro) {
      await client.query('ROLLBACK');
      reply.code(500).send({ erro: erro.message });
    } finally {
      client.release();
    }
  });
}

module.exports = ordensServicoRoutes;
