const express = require("express");
const router = express.Router();
const alunoController = require("../controllers/alunoController");
const { authenticateToken, isAdmin } = require("../middleware/authToken");

// Rota para criar um perfil de aluno (protegida para admin)
router.post("/", authenticateToken, isAdmin, alunoController.criarAluno);

// Rota para listar todos os alunos (protegida para admin)
router.get("/", authenticateToken, isAdmin, alunoController.listarAlunos);

// Rota para deletar um perfil de aluno (protegida para admin)
router.delete("/:id", authenticateToken, isAdmin, alunoController.deletarAluno);

// A rota de atualização foi centralizada em /usuarios/:id e esta pode ser removida
// router.patch("/:id", authenticateToken, alunoController.atualizarAluno);

module.exports = router;
