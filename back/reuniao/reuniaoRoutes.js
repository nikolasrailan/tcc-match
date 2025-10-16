const express = require("express");
const router = express.Router();
const reuniaoController = require("../controllers/reuniaoController");
const authMiddleware = require("../middleware/authToken");

router.use(authMiddleware.authenticateToken);

router.get("/:id_orientacao", reuniaoController.listarReunioes);
router.post("/:id_orientacao", reuniaoController.criarReuniao);
router.patch("/:id_reuniao", reuniaoController.atualizarReuniao);

module.exports = router;
