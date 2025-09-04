const express = require("express");
const router = express.Router();
const alunoController = require("../controllers/alunoController");
const { authenticateToken, isAdmin } = require("../middleware/authToken");

router.get("/", alunoController.listarAlunos);
router.post("/", alunoController.criarAluno);

module.exports = router;
