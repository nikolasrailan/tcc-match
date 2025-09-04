const express = require("express");
const router = express.Router();
const alunoController = require("../controllers/alunoController");
const { authenticateToken, isAdmin } = require("../middleware/authToken");

router.post("/", authenticateToken, isAdmin, alunoController.criarAluno);

module.exports = router;
