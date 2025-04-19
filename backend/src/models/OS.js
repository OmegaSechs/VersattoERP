const pool = require('../config/db');

class OrdemServico {
    static async listarTodas() {
        const res = await pool.query('SELECT * FROM ordem_servico');
        return res.rows;
    }

    static async criar({
        os_id,
        cliente_id,
        veiculo,
        placa,
        os_dt_entrada,
        os_dt_saida,
        os_hr_entrada,
        os_hr_saida,
        tipo
    }) {
        // 1. Buscar os dados do cliente pelo ID
        const clienteQuery = 'SELECT nome, cpf_cnpj, celular, rua, numero, bairro, cidade, estado FROM pessoas WHERE id = $1';
        const clienteResult = await pool.query(clienteQuery, [cliente_id]);
    
        if (clienteResult.rows.length === 0) {
            throw new Error('Cliente não encontrado');
        }
    
        const cliente = clienteResult.rows[0];
    
        // 2. Montar o endereço completo
        const endereco = `${cliente.rua}, ${cliente.numero} - ${cliente.bairro}, ${cliente.cidade} - ${cliente.estado}`;
    
        // 3. Inserir a OS com os dados do cliente embutidos
        const insertQuery = `
            INSERT INTO ordem_servico (
                cliente_id, 
                cliente_nome, 
                endereco, 
                cliente_cpf_cnpj, 
                cliente_celular, 
                veiculo, 
                placa, 
                os_dt_entrada, 
                os_dt_saida, 
                os_hr_entrada, 
                os_hr_saida, 
                tipo)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *;
        `;
    
        const values = [
            cliente_id,
            cliente.nome,
            endereco,
            cliente.cpf_cnpj,
            cliente.celular,
            veiculo,
            placa,
            os_dt_entrada,
            os_dt_saida,
            os_hr_entrada,
            os_hr_saida,
            tipo
        ];
    
        const res = await pool.query(insertQuery, values);
        return res.rows[0];
    }
    

}

module.exports = OrdemServico;
// This code defines a class `OrdemServico` that interacts with a PostgreSQL database to manage records in the `ordens_servico` table. It includes methods to list all records and create a new record with various attributes such as order ID, client information, vehicle details, and timestamps for entry and exit.