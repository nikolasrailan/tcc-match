const express = require("express");
const router = express.Router();
const orientacaoController = require("../controllers/orientacaoController");
const authMiddleware = require("../middleware/authToken");

router.use(authMiddleware.authenticateToken);

router.get("/", orientacaoController.getOrientacao);

router.patch("/:id", orientacaoController.updateOrientacao);

// --- Rotas de Cancelamento/Encerramento ---

// Rota para o ALUNO solicitar cancelamento
router.patch(
  "/:id/solicitar-cancelamento",
  orientacaoController.solicitarCancelamento
);

// Rota para o PROFESSOR confirmar o cancelamento solicitado pelo aluno
router.patch(
  "/:id/confirmar-cancelamento",
  orientacaoController.confirmarCancelamento
);

// Rota para o PROFESSOR cancelar/encerrar diretamente a orientação
router.patch(
  "/:id/cancelar-direto",
  orientacaoController.cancelarOrientacaoProfessor
);

module.exports = router;
