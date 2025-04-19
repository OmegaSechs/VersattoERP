const pool = require('../config/db');

class Pessoa {
    static async listarTodas() {
        const res = await pool.query('SELECT * FROM pessoas');
        return res.rows;
    }


static async criar({ 
    nome, 
    cpf_cnpj, 
    email, 
    telefone, 
    is_cliente, 
    is_fornecedor, 
    is_pessoa_fisica, 
    criado_em, 
    atualizado_em, 
    nome_fantasia, 
    is_pessoa_juridica, 
    rua, 
    bairro, 
    numero, 
    celular, 
    cidade, 
    estado, 
    cep }) {
    const query = `
        INSERT INTO pessoas (
        nome, 
        cpf_cnpj, 
        email, 
        telefone, 
        is_cliente, 
        is_fornecedor, 
        is_pessoa_fisica, 
        criado_em, 
        atualizado_em, 
        nome_fantasia, 
        is_pessoa_juridica, 
        rua, 
        bairro, 
        numero, 
        celular, 
        cidade, 
        estado, 
        cep)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *;
        `;
        const values = [nome, cpf_cnpj, email, telefone, is_cliente, is_fornecedor, is_pessoa_fisica, criado_em, atualizado_em, nome_fantasia, is_pessoa_juridica, rua, bairro, numero, celular, cidade, estado, cep];
        const res = await pool.query(query, values);
        return res.rows[0];
    }

}

module.exports = Pessoa;
// This code defines a class `Pessoa` that interacts with a PostgreSQL database to manage records in the `pessoas` table. It includes methods to list all records and create a new record with various attributes such as name, CPF/CNPJ, email, phone number, and address details. 
// The `criar` method uses parameterized queries to prevent SQL injection attacks.