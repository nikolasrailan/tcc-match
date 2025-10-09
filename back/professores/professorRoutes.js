const express = require("express");
const router = express.Router();
const professorController = require("../controllers/professorController");
const { authenticateToken, isAdmin } = require("../middleware/authToken");

// Rota para criar um perfil de professor (geralmente usada pelo admin)
router.post(
  "/",
  authenticateToken,
  isAdmin,
  professorController.criarProfessor
);

// Rota para listar todos os professores (protegida para admin)
router.get(
  "/",
  authenticateToken,
  isAdmin,
  professorController.listarProfessores
);

// Rota para deletar um perfil de professor (protegida para admin)
router.delete(
  "/:id",
  authenticateToken,
  isAdmin,
  professorController.deletarProfessor
);

router.get(
  "/public-list",
  authenticateToken,
  professorController.listarProfessoresPublic
);

router.get(
  "/dashboard",
  authenticateToken,
  professorController.getDashboardData
);

module.exports = router;
