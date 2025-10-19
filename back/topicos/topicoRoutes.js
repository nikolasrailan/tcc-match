const express = require("express");
const router = express.Router();
const topicoController = require("../controllers/topicoController");
const authMiddleware = require("../middleware/authToken");

router.use(authMiddleware.authenticateToken);

router.get("/:id_orientacao", topicoController.listarTopicos);
router.post("/:id_orientacao", topicoController.criarTopico);
router.get("/:id_topico/view", topicoController.getAndMarkAsRead);
router.patch("/:id_topico", topicoController.atualizarTopico);
router.delete("/:id_topico", topicoController.deletarTopico);

module.exports = router;
