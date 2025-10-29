const express = require("express");
const router = express.Router();
const bancaController = require("../controllers/bancaController");
const { authenticateToken, isAdmin } = require("../middleware/authToken");

router.use(authenticateToken, isAdmin);

router.post("/gerar", bancaController.gerarBancas);

router.get("/", bancaController.listarBancas);

router.patch("/:id_banca", bancaController.atualizarDetalhesBanca);

router.patch("/:id_banca/ata", bancaController.salvarConceitoAta);

module.exports = router;
