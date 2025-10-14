const express = require("express");
const router = express.Router();
const areaInteresseController = require("../controllers/areaInteresseController");
const { authenticateToken, isAdmin } = require("../middleware/authToken");

// Rotas para todos os usuários autenticados
router.get("/", authenticateToken, areaInteresseController.listar);
router.post("/sugerir", authenticateToken, areaInteresseController.sugerir);

// Rotas exclusivas do Admin
router.get(
  "/pendentes",
  authenticateToken,
  isAdmin,
  areaInteresseController.listarPendentes
);

router.patch(
  "/:id/aprovar",
  authenticateToken,
  isAdmin,
  areaInteresseController.aprovar
);

router.delete(
  "/:id/rejeitar",
  authenticateToken,
  isAdmin,
  areaInteresseController.rejeitar
);

router.post("/", authenticateToken, isAdmin, areaInteresseController.criar);

router.patch(
  "/:id",
  authenticateToken,
  isAdmin,
  areaInteresseController.atualizar
);

router.delete(
  "/:id",
  authenticateToken,
  isAdmin,
  areaInteresseController.deletar
);

module.exports = router;
