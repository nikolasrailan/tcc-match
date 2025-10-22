const express = require("express");
const router = express.Router();
const orientacaoController = require("../controllers/orientacaoController");
const authMiddleware = require("../middleware/authToken");

router.use(authMiddleware.authenticateToken);

router.get("/", orientacaoController.getOrientacao);

router.patch("/:id", orientacaoController.updateOrientacao);

router.patch(
  "/:id/solicitar-cancelamento",
  orientacaoController.solicitarCancelamento
);

router.patch(
  "/:id/confirmar-cancelamento",
  orientacaoController.confirmarCancelamento
);

module.exports = router;
