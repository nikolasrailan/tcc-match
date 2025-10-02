const express = require("express");
const router = express.Router();
const cursoController = require("../controllers/cursoController");
const { authenticateToken, isAdmin } = require("../middleware/authToken");

router.use(authenticateToken, isAdmin);

router.get("/", cursoController.listarCursos);
router.post("/", cursoController.criarCurso);
router.delete("/:id", cursoController.deletarCurso);
router.patch("/:id", cursoController.atualizarCurso);

module.exports = router;
