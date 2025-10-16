const {
  Orientacao,
  Aluno,
  Professor,
  IdeiaTcc,
  Usuario,
} = require("../models");

const orientacaoController = {
  async getOrientacao(req, res) {
    try {
      const idUsuario = req.user.id;
      const role = req.user.role;
      let where = {};

      if (role === "aluno") {
        const aluno = await Aluno.findOne({ where: { id_usuario: idUsuario } });
        if (aluno) {
          where.id_aluno = aluno.id_aluno;
        } else {
          return res.status(200).json(null);
        }
      } else if (role === "professor") {
        const professor = await Professor.findOne({
          where: { id_usuario: idUsuario },
        });
        if (professor) {
          where.id_professor = professor.id_professor;
        } else {
          return res.status(200).json(null);
        }
      }

      const orientacao = await Orientacao.findAll({
        where,
        include: [
          {
            model: Aluno,
            as: "aluno",
            include: {
              model: Usuario,
              as: "dadosUsuario",
              attributes: ["nome", "email"],
            },
          },
          {
            model: Professor,
            as: "professor",
            include: {
              model: Usuario,
              as: "usuario",
              attributes: ["nome", "email"],
            },
          },
          {
            model: IdeiaTcc,
            as: "ideiaTcc",
          },
        ],
      });

      res.status(200).json(orientacao.length > 0 ? orientacao : null);
    } catch (error) {
      console.error("Erro ao buscar orientação:", error);
      res
        .status(500)
        .json({ error: "Ocorreu um erro ao buscar a orientação." });
    }
  },

  async updateOrientacao(req, res) {
    try {
      const { id } = req.params;
      const { url_projeto, observacoes, status } = req.body;
      const idUsuario = req.user.id;
      const role = req.user.role;

      const orientacao = await Orientacao.findByPk(id);

      if (!orientacao) {
        return res.status(404).json({ error: "Orientação não encontrada." });
      }

      // Check permissions: only student or professor involved can update
      let hasPermission = false;
      if (role === "aluno") {
        const aluno = await Aluno.findOne({ where: { id_usuario: idUsuario } });
        if (aluno && aluno.id_aluno === orientacao.id_aluno) {
          hasPermission = true;
        }
      } else if (role === "professor") {
        const professor = await Professor.findOne({
          where: { id_usuario: idUsuario },
        });
        if (professor && professor.id_professor === orientacao.id_professor) {
          hasPermission = true;
        }
      }

      if (!hasPermission) {
        return res
          .status(403)
          .json({
            error: "Você não tem permissão para editar esta orientação.",
          });
      }

      const toUpdate = {};
      if (url_projeto !== undefined) toUpdate.url_projeto = url_projeto;
      if (observacoes !== undefined) toUpdate.observacoes = observacoes;
      if (status !== undefined) toUpdate.status = status;

      await orientacao.update(toUpdate);

      res.status(200).json(orientacao);
    } catch (error) {
      console.error("Erro ao atualizar orientação:", error);
      res
        .status(500)
        .json({ error: "Ocorreu um erro ao atualizar a orientação." });
    }
  },
};

module.exports = orientacaoController;
