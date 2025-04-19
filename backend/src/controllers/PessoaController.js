const Pessoa = require('../models/Pessoa');

class PessoaController {
    static async listarTodas(req, res) {
        try {
            const pessoas = await Pessoa.listarTodas();
            res.json(pessoas);
        } catch(err) {
            res.status(500).json({ error: 'Erro ao listar pessoas: ' + err.message });
        }
    }

static async criar(req, res) {
    try {
        const novaPessoa = await Pessoa.criar(req.body);
        res.status(201).json(novaPessoa);
    } catch (err) {
        res.status(500).json({ error: 'Erro ao criar pessoa: ' + err.message });
    }
}
}

module.exports = PessoaController;
// // This code defines a `PessoaController` class that handles HTTP requests related to the `Pessoa` model. It includes methods to list all records and create a new record. The methods handle errors and respond with appropriate status codes and messages. The `listarTodas` method retrieves all records from the database, while the `criar` method creates a new record based on the request body.
// // The `criar` method uses the `req.body` to get the data for the new record and responds with a 201 status code upon successful creation. If an error occurs, it responds with a 500 status code and an error message.
// // The `module.exports` statement exports the `PessoaController` class so it can be used in other parts of the application.
