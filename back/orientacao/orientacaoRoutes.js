const express = require("express");
const router = express.Router();
const orientacaoController = require("../controllers/orientacaoController");
const authMiddleware = require("../middleware/authToken");

router.use(authMiddleware.authenticateToken);

router.get("/", orientacaoController.getOrientacao);
router.patch("/:id", orientacaoController.updateOrientacao);

module.exports = router;
