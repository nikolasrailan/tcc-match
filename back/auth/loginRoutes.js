const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const { Usuario } = require("../models");
const bcrypt = require("bcryptjs");

router.post("/", async (req, res) => {
  const { email, senha } = req.body;

  try {
    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
      return res.status(404).send("Usuário não encontrado");
    }

    const senhaValida = await bcrypt.compare(senha, usuario.senha);

    if (!senhaValida) {
      return res.status(401).send("Senha incorreta");
    }

    const token = jwt.sign(
      {
        id: usuario.id_usuario,
        role: usuario.isAdmin ? "admin" : "aluno", // Define papel baseado no isAdmin
      },
      "seu-segredo", // Substitua por um segredo mais forte
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).send("Erro no login");
  }
});

module.exports = router;
