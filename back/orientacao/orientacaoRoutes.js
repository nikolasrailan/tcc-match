const express = require("express");
const router = express.Router();
const orientacaoController = require("../controllers/orientacaoController");
const authMiddleware = require("../middleware/authToken");

router.use(authMiddleware.authenticateToken);

router.get("/", orientacaoController.getOrientacao);

router.patch("/:id", orientacaoController.updateOrientacao);

// Rotas de cancelamento Aluno
router.patch(
  "/:id/solicitar-cancelamento",
  orientacaoController.solicitarCancelamento
);

// Rotas de cancelamento Professor
router.patch(
  "/:id/confirmar-cancelamento", // Professor confirma cancelamento solicitado pelo aluno
  orientacaoController.confirmarCancelamento
);
router.patch(
  "/:id/cancelar-direto", // Professor cancela diretamente
  orientacaoController.cancelarOrientacaoProfessor
);

module.exports = router;
