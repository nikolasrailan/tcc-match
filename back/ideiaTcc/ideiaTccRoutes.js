const express = require("express");
const router = express.Router();
const ideiaTccController = require("../controllers/ideiaTccController");
const { authenticateToken } = require("../middleware/authToken");

router.use(authenticateToken);

router.get("/minha-ideia", ideiaTccController.getMinhaIdeiaTcc);
router.post("/", ideiaTccController.criarIdeiaTcc);
router.patch("/:id", ideiaTccController.atualizarIdeiaTcc);
router.delete("/:id", ideiaTccController.deletarIdeiaTcc);

module.exports = router;
