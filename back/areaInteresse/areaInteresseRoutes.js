const express = require("express");
const router = express.Router();
const areaInteresseController = require("../controllers/areaInteresseController");
const { authenticateToken, isAdmin } = require("../middleware/authToken");

router.get("/", authenticateToken, areaInteresseController.listar);

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
