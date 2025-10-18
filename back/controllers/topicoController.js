const { Topico, Aluno, Professor, Orientacao } = require("../models");

const topicoController = {
  async listarTopicos(req, res) {
    try {
      const { id_orientacao } = req.params;
      const topicos = await Topico.findAll({
        where: { id_orientacao },
        order: [["data_criacao", "DESC"]],
      });
      res.status(200).json(topicos);
    } catch (error) {
      console.error("Erro ao listar tópicos:", error);
      res.status(500).json({ error: "Erro ao listar tópicos." });
    }
  },

  async criarTopico(req, res) {
    try {
      const { id_orientacao } = req.params;
      const { titulo, descricao } = req.body;
      const idUsuario = req.user.id;

      const aluno = await Aluno.findOne({ where: { id_usuario: idUsuario } });
      const orientacao = await Orientacao.findByPk(id_orientacao);

      if (!aluno || aluno.id_aluno !== orientacao.id_aluno) {
        return res
          .status(403)
          .json({ error: "Apenas o aluno da orientação pode criar tópicos." });
      }

      const novoTopico = await Topico.create({
        id_orientacao,
        titulo,
        descricao,
      });
      res.status(201).json(novoTopico);
    } catch (error) {
      console.error("Erro ao criar tópico:", error);
      res.status(500).json({ error: "Erro ao criar tópico." });
    }
  },

  async atualizarTopico(req, res) {
    try {
      const { id_topico } = req.params;
      const { titulo, descricao, status, comentario_professor } = req.body;
      const idUsuario = req.user.id;
      const role = req.user.role;

      const topico = await Topico.findByPk(id_topico, {
        include: { model: Orientacao, as: "orientacao" },
      });

      if (!topico) {
        return res.status(404).json({ message: "Tópico não encontrado." });
      }

      // Verifica permissões
      if (role === "aluno") {
        const aluno = await Aluno.findOne({
          where: { id_usuario: idUsuario },
        });
        if (
          !aluno ||
          aluno.id_aluno !== topico.orientacao.id_aluno ||
          topico.status !== "enviado"
        ) {
          return res.status(403).json({
            error:
              "Você só pode editar tópicos enviados que ainda não foram vistos.",
          });
        }
      } else if (role === "professor") {
        const professor = await Professor.findOne({
          where: { id_usuario: idUsuario },
        });
        if (
          !professor ||
          professor.id_professor !== topico.orientacao.id_professor
        ) {
          return res.status(403).json({
            error: "Apenas o professor da orientação pode atualizar o status.",
          });
        }
      }

      await topico.update({
        titulo,
        descricao,
        status,
        comentario_professor,
      });

      res.status(200).json(topico);
    } catch (error) {
      console.error("Erro ao atualizar tópico:", error);
      res.status(500).json({ error: "Erro ao atualizar tópico." });
    }
  },

  async deletarTopico(req, res) {
    try {
      const { id_topico } = req.params;
      const idUsuario = req.user.id;

      const aluno = await Aluno.findOne({ where: { id_usuario: idUsuario } });
      const topico = await Topico.findByPk(id_topico, {
        include: { model: Orientacao, as: "orientacao" },
      });

      if (!aluno || !topico || aluno.id_aluno !== topico.orientacao.id_aluno) {
        return res
          .status(403)
          .json({ error: "Você não tem permissão para deletar este tópico." });
      }

      const deleted = await Topico.destroy({ where: { id_topico } });
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Tópico não encontrado." });
      }
    } catch (error) {
      console.error("Erro ao deletar tópico:", error);
      res.status(500).json({ error: "Erro ao deletar tópico." });
    }
  },
};

module.exports = topicoController;
