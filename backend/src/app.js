const express = require('express');
const pessoasRoutes = require('./routes/pessoas');
const OrdemServicoRoutes = require('./routes/os');
const app = express();

app.use(express.json());

app.use('/pessoas', pessoasRoutes);

app.use('/OrdemServico', OrdemServicoRoutes);

module.exports = app;
// This code sets up an Express application that uses JSON middleware to parse incoming requests and defines a route for handling requests related to the `pessoas` resource.
//  The `pessoasRoutes` module is imported and used to handle requests to the `/pessoas` endpoint. The application is then exported for use in other parts of the application, such as the main server file.