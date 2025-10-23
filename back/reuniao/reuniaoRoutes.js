const express = require("express");
const router = express.Router();
const reuniaoController = require("../controllers/reuniaoController");
const authMiddleware = require("../middleware/authToken");

router.use(authMiddleware.authenticateToken);

router.get("/orientacao/:id_orientacao", reuniaoController.listarReunioes);

router.get("/professor", reuniaoController.listarReunioesProfessor);

router.post("/orientacao/:id_orientacao", reuniaoController.criarReuniao);

router.patch("/:id_reuniao", reuniaoController.atualizarReuniao);

module.exports = router;
