const express = require("express");
const router = express.Router();
const solicitacaoController = require("../controllers/solicitacaoController");
const { authenticateToken } = require("../middleware/authToken");

router.use(authenticateToken);

router.post("/", solicitacaoController.criarSolicitacao);

module.exports = router;
