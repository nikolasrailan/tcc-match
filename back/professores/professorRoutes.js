const express = require("express");
const router = express.Router();
const professorController = require("../controllers/professorController");
// const authMiddleware = require('../middlewares/authMiddleware'); // Exemplo: Middleware de autenticação
// const adminMiddleware = require('../middlewares/adminMiddleware'); // Exemplo: Middleware que verifica se o usuário é admin

// Define a rota POST para criar um novo professor
// A rota seria acessada via: POST http://localhost:3000/api/professores

// O ideal é proteger esta rota para que apenas administradores possam acessá-la.
// Se você tiver middlewares de autenticação e verificação de admin, a rota ficaria assim:
// router.post('/', authMiddleware, adminMiddleware, professorController.criarProfessor);

// Por enquanto, vamos deixar sem os middlewares para simplificar:
router.post("/", professorController.criarProfessor);

// Você pode adicionar outras rotas aqui no futuro
// router.get('/', professorController.listarProfessores);

module.exports = router;
