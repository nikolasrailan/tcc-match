const express = require("express");
const router = express.Router();
const ideiaTcc = require("../controllers/ideiaTcc");
const { authenticateToken } = require("../middleware/authToken");

router.use(authenticateToken);

router.get("/", ideiaTcc.listarTodasIdeias);
router.get("/minha-ideia", ideiaTcc.getMinhaIdeiaTcc);
router.post("/", ideiaTcc.criarIdeiaTcc);
router.patch("/:id", ideiaTcc.atualizarIdeiaTcc);
router.delete("/:id", ideiaTcc.deletarIdeiaTcc);

module.exports = router;
