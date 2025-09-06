const express = require("express");
const router = express.Router();
const professorController = require("../controllers/professorController");
const { authenticateToken, isAdmin } = require("../middleware/authToken");

router.get("/", professorController.listarProfessores);
router.post("/", professorController.criarProfessor);

router.patch("/:id", authenticateToken, professorController.atualizarProfessor);
router.delete("/:id", authenticateToken, professorController.deletarProfessor);

module.exports = router;
