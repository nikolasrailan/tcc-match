// usuarios/usuariosRoutes.js
const express = require("express");
const router = express.Router();
const connection = require("../config/db"); // Caminho para a conexão com o banco de dados

// Rota GET para buscar todos os usuários
router.get("/", (req, res) => {
  connection.query("SELECT * FROM usuarios", (error, results) => {
    if (error) {
      console.error("Erro ao buscar usuários: ", error);
      res.status(500).send("Erro ao buscar usuários");
    } else {
      res.json(results);
    }
  });
});

// Rota POST para adicionar um novo usuário
router.post("/", (req, res) => {
  const { nome, email } = req.body; // Exemplo de campos nome e email

  connection.query(
    "INSERT INTO usuarios (nome, email) VALUES (?, ?)",
    [nome, email],
    (error, results) => {
      if (error) {
        console.error("Erro ao adicionar usuário: ", error);
        res.status(500).send("Erro ao adicionar usuário");
      } else {
        res.status(201).send("Usuário adicionado com sucesso");
      }
    }
  );
});

module.exports = router;
