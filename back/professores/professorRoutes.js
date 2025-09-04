const express = require("express");
const router = express.Router();
const professorController = require("../controllers/professorController");

router.post("/", professorController.criarProfessor);

module.exports = router;
