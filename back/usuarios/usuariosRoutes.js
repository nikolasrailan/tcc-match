const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { Usuario, Professor, Aluno, Curso, sequelize } = require("../models");
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
          // O retorno do cursoInfo com o nome do curso para o front-end
          include: {
            model: Curso,
            as: "cursoInfo",
            attributes: ["id_curso", "nome"],
          },
          attributes: ["id_aluno", "matricula"],
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

      const usuarioSemSenha = novoUsuario.toJSON();
      delete usuarioSemSenha.senha;

      res.status(201).json(usuarioSemSenha);
    } catch (error) {
      console.error("Erro ao adicionar usuário: ", error);
      res.status(500).send("Erro ao adicionar usuário");
    }
  }
);

// Rota de atualização consolidada para lidar com todos os tipos de perfil
router.patch("/:id", authenticateToken, async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      nome,
      email,
      senha,
      isAdmin: newIsAdmin,
      matricula,
      id_curso,
      especializacao,
      disponibilidade,
    } = req.body;

    const isSelf = req.user.id.toString() === id.toString();
    const isUserAdmin = req.user.role === "admin";
    if (!isSelf && !isUserAdmin) {
      await t.rollback();
      return res.status(403).json({
        message:
          "Acesso proibido. Você não tem permissão para editar este usuário.",
      });
    }

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
    // Permite que apenas admins mudem o isAdmin
    if (isUserAdmin && newIsAdmin !== undefined) {
      dadosUsuarioParaAtualizar.isAdmin = newIsAdmin;
    }
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
      if (id_curso !== undefined) dadosAlunoParaAtualizar.id_curso = id_curso;
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

    // Retorna o usuário atualizado para o frontend
    const usuarioAtualizado = await Usuario.findByPk(id, {
      include: [
        { model: Aluno, as: "dadosAluno", include: ["cursoInfo"] },
        { model: Professor, as: "dadosProfessor" },
      ],
      attributes: { exclude: ["senha"] },
    });

    res.status(200).json({
      message: "Usuário atualizado com sucesso!",
      user: usuarioAtualizado,
    });
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
