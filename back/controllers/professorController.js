const { Professor, Usuario } = require("../models");

const professorController = {
  async criarProfessor(req, res) {
    try {
      const { disponibilidade, especializacao, id_usuario } = req.body;

      const usuarioExiste = await Usuario.findByPk(id_usuario);
      if (!usuarioExiste) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      const professorJaExiste = await Professor.findOne({
        where: { id_usuario },
      });
      if (professorJaExiste) {
        return res
          .status(400)
          .json({ error: "Este usuário já é um professor." });
      }

      const novoProfessor = await Professor.create({
        disponibilidade,
        especializacao,
        id_usuario,
      });

      return res.status(201).json(novoProfessor);
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ error: "Ocorreu um erro ao criar o perfil do professor." });
    }
  },
  async listarProfessores(req, res) {
    try {
      const professores = await Professor.findAll({
        include: {
          model: Usuario,
          as: "usuario",
          attributes: ["id_usuario", "nome", "email"], // Apenas campos úteis
        },
      });
      return res.status(200).json(professores);
    } catch (error) {
      console.error("Erro ao listar professores:", error);
      return res
        .status(500)
        .json({ error: "Ocorreu um erro ao processar a requisição." });
    }
  },

  // - listarProfessores
  // - atualizarProfessor
  // - deletarProfessor
};

module.exports = professorController;
