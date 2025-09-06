const express = require("express");
const router = express.Router();
const alunoController = require("../controllers/alunoController");
const { authenticateToken, isAdmin } = require("../middleware/authToken");

router.get("/", alunoController.listarAlunos);
router.post("/", alunoController.criarAluno);

router.patch("/:id", authenticateToken, alunoController.atualizarAluno);
router.delete("/:id", authenticateToken, alunoController.deletarAluno);
module.exports = router;
