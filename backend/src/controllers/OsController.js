const OrdemServico = require('../models/OS');

class OrdemServicoController {
    static async listarTodas(req, res) {
        try {
            const ordensServico = await OrdemServico.listarTodas();
            res.json(ordensServico);
        } catch (err) {
            res.status(500).json({ error: 'Erro ao listar ordens de serviço: ' + err.message });
        }
    }

    static async criar(req, res) {
        try {
            const novaOrdemServico = await OrdemServico.criar(req.body);
            res.status(201).json(novaOrdemServico);
        } catch (err) {
            res.status(500).json({ error: 'Erro ao criar ordem de serviço: ' + err.message });
        }
    }
}

module.exports = OrdemServicoController;
// This code defines a `OrdemServicoController` class that handles HTTP requests related to the `OrdemServico` model. 
// It includes methods to list all records and create a new record. 
// The methods handle errors and respond with appropriate status codes and messages. 
// The `listarTodas` method retrieves all records from the database, 
// while the `criar` method creates a new record based on the request body.