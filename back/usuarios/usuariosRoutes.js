const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { Usuario, Professor, Aluno, sequelize } = require("../models");
const bcrypt = require("bcryptjs");
const { authenticateToken, isAdmin } = require("../middleware/authToken");

router.get("/", authenticateToken, isAdmin, async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      include: [
        {
          model: Professor,
          as: "dadosProfessor",
          attributes: ["id_professor", "especializacao", "disponibilidade"],
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

router.post(
  "/",
  [
    body("nome").notEmpty().withMessage("O campo nome é obrigatório."),
    body("email")
      .isEmail()
      .withMessage("Por favor, insira um e-mail válido.")
      .custom(async (email) => {
        const usuario = await Usuario.findOne({ where: { email } });
        if (usuario) {
          return Promise.reject("O e-mail informado já está em uso.");
        }
      }),
    body("senha")
      .isLength({ min: 6 })
      .withMessage("A senha deve ter no mínimo 6 caracteres."),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { nome, email, senha, isAdmin = 0 } = req.body;

    try {
      const senhaHash = await bcrypt.hash(senha, 10);

      const novoUsuario = await Usuario.create({
        nome,
        email,
        senha: senhaHash,
        isAdmin,
      });

      // Remove a senha do objeto de resposta
      const usuarioSemSenha = novoUsuario.toJSON();
      delete usuarioSemSenha.senha;

      res.status(201).json(usuarioSemSenha);
    } catch (error) {
      console.error("Erro ao adicionar usuário: ", error);
      res.status(500).send("Erro ao adicionar usuário");
    }
  }
);

router.patch("/:id", authenticateToken, isAdmin, async (req, res) => {
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

router.patch("/:id", authenticateToken, isAdmin, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      nome,
      email,
      senha,
      isAdmin,
      matricula,
      curso,
      especializacao,
      disponibilidade,
    } = req.body;

    const usuario = await Usuario.findByPk(id, {
      include: ["dadosAluno", "dadosProfessor"],
      transaction: t,
    });

    if (!usuario) {
      await t.rollback();
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    // Atualiza dados do usuário base
    const dadosUsuarioParaAtualizar = {};
    if (nome !== undefined) dadosUsuarioParaAtualizar.nome = nome;
    if (email !== undefined) dadosUsuarioParaAtualizar.email = email;
    if (isAdmin !== undefined) dadosUsuarioParaAtualizar.isAdmin = isAdmin;
    if (senha) {
      dadosUsuarioParaAtualizar.senha = await bcrypt.hash(senha, 10);
    }

    if (Object.keys(dadosUsuarioParaAtualizar).length > 0) {
      await usuario.update(dadosUsuarioParaAtualizar, { transaction: t });
    }

    // Atualiza perfil de Aluno, se existir
    if (usuario.dadosAluno) {
      const dadosAlunoParaAtualizar = {};
      if (matricula !== undefined)
        dadosAlunoParaAtualizar.matricula = matricula;
      if (curso !== undefined) dadosAlunoParaAtualizar.curso = curso;
      if (Object.keys(dadosAlunoParaAtualizar).length > 0) {
        await usuario.dadosAluno.update(dadosAlunoParaAtualizar, {
          transaction: t,
        });
      }
    }

    // Atualiza perfil de Professor, se existir
    if (usuario.dadosProfessor) {
      const dadosProfessorParaAtualizar = {};
      if (especializacao !== undefined)
        dadosProfessorParaAtualizar.especializacao = especializacao;
      if (disponibilidade !== undefined)
        dadosProfessorParaAtualizar.disponibilidade = disponibilidade;
      if (Object.keys(dadosProfessorParaAtualizar).length > 0) {
        await usuario.dadosProfessor.update(dadosProfessorParaAtualizar, {
          transaction: t,
        });
      }
    }

    await t.commit();
    res.status(200).json({ message: "Usuário atualizado com sucesso!" });
  } catch (error) {
    await t.rollback();
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({
        message: "O e-mail ou matrícula informado já está em uso.",
      });
    }
    console.error("Erro ao editar usuário:", error);
    res.status(500).json({ message: "Ocorreu um erro ao editar o usuário." });
  }
});

router.delete("/:id", authenticateToken, isAdmin, async (req, res) => {
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
