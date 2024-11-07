const express = require("express");
const router = express.Router();
const Usuario = require("../models/usuario"); // Importa o modelo Sequelize

// Rota GET para buscar todos os usuários
router.get("/", async (req, res) => {
  try {
    const usuarios = await Usuario.findAll(); // Usa o Sequelize para buscar todos os registros
    res.json(usuarios);
  } catch (error) {
    console.error("Erro ao buscar usuários: ", error);
    res.status(500).send("Erro ao buscar usuários");
  }
});

// Rota POST para adicionar um novo usuário
router.post("/", async (req, res) => {
  const { nome, email, senha, isAdmin = 0 } = req.body;

  try {
    const novoUsuario = await Usuario.create({ nome, email, senha, isAdmin }); // Usa o Sequelize para criar um novo registro
    res.status(201).json(novoUsuario);
  } catch (error) {
    console.error("Erro ao adicionar usuário: ", error);
    res.status(500).send("Erro ao adicionar usuário");
  }
});

module.exports = router;
