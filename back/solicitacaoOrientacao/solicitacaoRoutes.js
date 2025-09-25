const express = require("express");
const router = express.Router();
const solicitacaoController = require("../controllers/solicitacaoController");
const authMiddleware = require("../middleware/authToken");

router.use(authMiddleware.authenticateToken);

router.post("/", solicitacaoController.criarSolicitacao);
router.get("/minhas-solicitacoes", solicitacaoController.getMinhasSolicitacoes);
router.patch("/:id/cancelar", solicitacaoController.cancelarSolicitacao);

module.exports = router;
