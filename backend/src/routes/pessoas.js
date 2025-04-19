const express = require('express');
const router = express.Router();
const PessoaController = require('../controllers/PessoaController');

router.get('/', PessoaController.listarTodas);
router.post('/', PessoaController.criar);

module.exports = router;
// // This code sets up an Express router for handling HTTP requests related to the `Pessoa` model. It defines two routes: a GET route to list all records and a POST route to create a new record. The routes are handled by methods from the `PessoaController` class, which is imported at the beginning of the file. The router is then exported for use in other parts of the application.
// // The `listar` method is expected to handle GET requests to the root URL of this router, while the `criar` method handles POST requests to create a new record. The `module.exports` statement exports the router so it can be used in the main application file or other parts of the application.
// // The `express.Router()` method creates a new router object that can be used to define routes and middleware for the application. The `router.get()` and `router.post()` methods define the specific routes and associate them with the corresponding controller methods.