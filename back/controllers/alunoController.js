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
};

module.exports = alunoController;
