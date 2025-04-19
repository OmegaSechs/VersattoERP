const express = require('express');
const router = express.Router();
const OrdemServicoController = require('../controllers/OsController');

router.get('/', OrdemServicoController.listarTodas);
router.post('/', OrdemServicoController.criar);

module.exports = router;

// This code sets up an Express router for handling HTTP requests related to the `OrdemServico` model.
// It defines two routes: a GET route to list all records and a POST route to create a new record.  
