const { Curso } = require("../models");

const cursoController = {
  async listarCursos(req, res) {
    try {
      const cursos = await Curso.findAll({
        order: [["nome", "ASC"]],
      });
      return res.status(200).json(cursos);
    } catch (error) {
      console.error("Erro ao listar cursos:", error);
      return res
        .status(500)
        .json({ error: "Ocorreu um erro ao listar os cursos." });
    }
  },

  async criarCurso(req, res) {
    try {
      const { nome } = req.body;
      const novoCurso = await Curso.create({ nome });
      return res.status(201).json(novoCurso);
    } catch (error) {
      if (error.name === "SequelizeUniqueConstraintError") {
        return res.status(409).json({ message: "O nome do curso já existe." });
      }
      console.error("Erro ao criar curso:", error);
      return res
        .status(500)
        .json({ error: "Ocorreu um erro ao criar o curso." });
    }
  },

  async deletarCurso(req, res) {
    try {
      const { id } = req.params;
      const numLinhasAfetadas = await Curso.destroy({
        where: { id_curso: id },
      });

      if (numLinhasAfetadas === 0) {
        return res.status(404).json({ message: "Curso não encontrado." });
      }
      return res.status(200).json({ message: "Curso deletado com sucesso!" });
    } catch (error) {
      console.error("Erro ao deletar curso:", error);
      return res
        .status(500)
        .json({ error: "Ocorreu um erro ao deletar o curso." });
    }
  },
};

module.exports = cursoController;
