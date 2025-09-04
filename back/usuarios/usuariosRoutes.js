const express = require("express");
const router = express.Router();

const { Usuario, Professor, Aluno } = require("../models");
const bcrypt = require("bcryptjs");

router.get("/", async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      include: [
        {
          model: Professor,
          as: "dadosProfessor",
          attributes: ["id_professor", "especializacao"],
        },
        {
          model: Aluno,
          as: "dadosAluno",
          attributes: ["id_aluno", "matricula", "curso"],
        },
      ],
      attributes: { exclude: ["senha"] },
    });
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
    const [numLinhasAfetadas] = await Usuario.update(
      { isAdmin: role === "admin" ? 1 : 0 },
      { where: { id_usuario: id } }
    );

    if (numLinhasAfetadas === 0) {
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
    const dadosParaAtualizar = {};
    if (nome) dadosParaAtualizar.nome = nome;
    if (email) dadosParaAtualizar.email = email;
    if (isAdmin !== undefined) dadosParaAtualizar.isAdmin = isAdmin;

    if (senha) {
      dadosParaAtualizar.senha = await bcrypt.hash(senha, 10);
    }

    const [numLinhasAfetadas] = await Usuario.update(dadosParaAtualizar, {
      where: { id_usuario: id },
    });

    if (numLinhasAfetadas === 0) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    res.status(200).json({ message: "Usuário atualizado com sucesso!" });
  } catch (error) {
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        message: "O e-mail informado já está em uso por outro usuário.",
      });
    }

    console.error("Erro ao editar usuário:", error);
    res.status(500).json({ message: "Ocorreu um erro ao editar o usuário." });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const numLinhasAfetadas = await Usuario.destroy({
      where: { id_usuario: id },
    });

    if (numLinhasAfetadas === 0) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    res.status(200).json({ message: "Usuário deletado com sucesso!" });
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    res.status(500).json({ message: "Erro ao deletar usuário" });
  }
});

module.exports = router;
