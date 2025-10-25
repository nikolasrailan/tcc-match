const express = require("express");
const router = express.Router();
const orientacaoController = require("../controllers/orientacaoController");
const authMiddleware = require("../middleware/authToken");

router.use(authMiddleware.authenticateToken);

router.get("/", orientacaoController.getOrientacao);

router.patch("/:id", orientacaoController.updateOrientacao);

// --- Rotas de Finalização e Cancelamento ---
// Rota PATCH para o Professor finalizar a orientação
router.patch("/:id/finalizar", orientacaoController.finalizarOrientacao);

router.patch(
  "/:id/solicitar-cancelamento",
  orientacaoController.solicitarCancelamento
);

// Rota PATCH para o Professor confirmar cancelamento solicitado pelo aluno
router.patch(
  "/:id/confirmar-cancelamento",
  orientacaoController.confirmarCancelamento
);

router.patch(
  "/:id/solicitar-finalizacao",
  orientacaoController.solicitarFinalizacao
);

router.patch(
  "/:id/confirmar-finalizacao",
  orientacaoController.confirmarFinalizacao
);

// Rota PATCH para o Professor cancelar diretamente (sem solicitação do aluno)
router.patch(
  "/:id/cancelar-direto",
  orientacaoController.cancelarOrientacaoProfessor
);

module.exports = router;
