const express = require("express");
const router = express.Router();
const Usuario = require("../models/usuario");
const bcrypt = require("bcryptjs");

router.get("/", async (req, res) => {
  try {
    const usuarios = await Usuario.findAll();
    res.json(usuarios);
  } catch (error) {
    console.error("Erro ao buscar usuários: ", error);
    res.status(500).send("Erro ao buscar usuários");
  }
});

router.post("/", async (req, res) => {
  const { nome, email, senha, isAdmin = 0 } = req.body;

  try {
    const senhaHash = await bcrypt.hash(senha, 10);

    const novoUsuario = await Usuario.create({
      nome,
      email,
      senha: senhaHash,
      isAdmin,
    });

    res.status(201).json(novoUsuario);
  } catch (error) {
    console.error("Erro ao adicionar usuário: ", error);
    res.status(500).send("Erro ao adicionar usuário");
  }
});

router.patch("/:id/role", async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    const usuario = await Usuario.update(
      { isAdmin: role === "admin" ? 1 : 0 }, // Atualiza conforme o papel
      { where: { id_usuario: id } }
    );

    if (usuario[0] === 0) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    res.status(200).json({ message: "Papel atualizado com sucesso!" });
  } catch (error) {
    console.error("Erro ao atualizar papel do usuário:", error);
    res.status(500).json({ message: "Erro ao atualizar papel do usuário" });
  }
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { nome, email, senha, isAdmin } = req.body;

  try {
    const usuario = await Usuario.update(
      { nome, email, senha, isAdmin },
      { where: { id_usuario: id } }
    );

    if (usuario[0] === 0) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    res.status(200).json({ message: "Usuário atualizado com sucesso!" });
  } catch (error) {
    console.error("Erro ao editar usuário:", error);
    res.status(500).json({ message: "Erro ao editar usuário" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const usuario = await Usuario.destroy({
      where: { id_usuario: id },
    });

    if (usuario === 0) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    res.status(200).json({ message: "Usuário deletado com sucesso!" });
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    res.status(500).json({ message: "Erro ao deletar usuário" });
  }
});

module.exports = router;
