const express = require("express");
const router = express.Router();
const alunoController = require("../controllers/alunoController");
const { authenticateToken, isAdmin } = require("../middleware/authToken");

router.get("/", alunoController.listarAlunos);
router.post("/", alunoController.criarAluno);

router.patch("/:id", alunoController.atualizarAluno);
router.delete("/:id", alunoController.deletarAluno);
module.exports = router;
