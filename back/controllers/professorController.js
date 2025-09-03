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

  // - listarProfessores
  // - atualizarProfessor
  // - deletarProfessor
};

module.exports = professorController;
