const { Aluno, Usuario, Professor } = require("../models");

const alunoController = {
  async criarAluno(req, res) {
    try {
      const { matricula, curso, id_usuario } = req.body;

      if (!matricula || !curso || !id_usuario) {
        return res.status(400).json({
          error:
            "Todos os campos são obrigatórios: matrícula, curso e id_usuario.",
        });
      }

      const usuario = await Usuario.findByPk(id_usuario);
      if (!usuario) {
        return res
          .status(404)
          .json({ error: "Usuário não encontrado com o ID fornecido." });
      }

      const alunoExistente = await Aluno.findOne({ where: { id_usuario } });
      const professorExistente = await Professor.findOne({
        where: { id_usuario },
      });

      if (alunoExistente || professorExistente) {
        return res.status(409).json({
          error: "Este usuário já possui um perfil de aluno ou professor.",
        });
      }

      const novoAluno = await Aluno.create({
        matricula,
        curso,
        id_usuario,
      });

      return res.status(201).json(novoAluno);
    } catch (error) {
      console.error("Erro ao criar aluno:", error);
      return res
        .status(500)
        .json({ error: "Ocorreu um erro ao processar a requisição." });
    }
  },

  async listarAlunos(req, res) {
    try {
      const alunos = await Aluno.findAll({
        include: {
          model: Usuario,
          as: "dadosUsuario",
          attributes: ["id_usuario", "nome", "email"],
        },
      });
      return res.status(200).json(alunos);
    } catch (error) {
      console.error("Erro ao listar alunos:", error);
      return res
        .status(500)
        .json({ error: "Ocorreu um erro ao processar a requisição." });
    }
  },

  async atualizarAluno(req, res) {
    const { id } = req.params;
    const { matricula, curso } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";

    try {
      const aluno = await Aluno.findByPk(id);

      if (!aluno) {
        return res
          .status(404)
          .json({ error: "Perfil de aluno não encontrado." });
      }

      if (aluno.id_usuario !== userId && !isAdmin) {
        return res
          .status(403)
          .json({
            error: "Permissão negada. Você só pode editar seu próprio perfil.",
          });
      }

      aluno.matricula = matricula ?? aluno.matricula;
      aluno.curso = curso ?? aluno.curso;

      await aluno.save();

      return res.status(200).json(aluno);
    } catch (error) {
      console.error("Erro ao atualizar aluno:", error);
      return res
        .status(500)
        .json({ error: "Ocorreu um erro ao atualizar o perfil do aluno." });
    }
  },

  async deletarAluno(req, res) {
    const { id } = req.params;

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Acesso negado." });
    }

    try {
      const numLinhasAfetadas = await Aluno.destroy({
        where: { id_aluno: id },
      });

      if (numLinhasAfetadas === 0) {
        return res
          .status(404)
          .json({ message: "Perfil de aluno não encontrado." });
      }

      res
        .status(200)
        .json({ message: "Perfil de aluno deletado com sucesso!" });
    } catch (error) {
      console.error("Erro ao deletar aluno:", error);
      res.status(500).json({ message: "Erro ao deletar perfil de aluno." });
    }
  },
};

module.exports = alunoController;
