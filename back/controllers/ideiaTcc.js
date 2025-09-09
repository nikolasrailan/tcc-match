const { IdeiaTcc, Aluno } = require("../models");

const ideiaTccController = {
  async criarIdeiaTcc(req, res) {
    try {
      const { titulo, descricao } = req.body;
      const idUsuario = req.user.id;

      const aluno = await Aluno.findOne({ where: { id_usuario: idUsuario } });
      if (!aluno) {
        return res
          .status(403)
          .json({ error: "Apenas alunos podem criar propostas." });
      }

      const novaIdeia = await IdeiaTcc.create({
        titulo,
        descricao,
        id_aluno: aluno.id_aluno,
        data_submissao: new Date(),
        status: 0,
      });

      res.status(201).json(novaIdeia);
    } catch (error) {
      console.error("Erro ao criar ideia de TCC:", error);
      res
        .status(500)
        .json({ error: "Ocorreu um erro ao criar a ideia de TCC." });
    }
  },

  async getMinhaIdeiaTcc(req, res) {
    try {
      const idUsuario = req.user.id;
      const aluno = await Aluno.findOne({ where: { id_usuario: idUsuario } });

      if (!aluno) {
        return res
          .status(404)
          .json({ message: "Perfil de aluno não encontrado." });
      }

      const ideiasTcc = await IdeiaTcc.findAll({
        where: { id_aluno: aluno.id_aluno },
        order: [["data_submissao", "DESC"]],
      });

      res.status(200).json(ideiasTcc);
    } catch (error) {
      console.error("Erro ao buscar ideias de TCC:", error);
      res.status(500).json({ error: "Erro ao buscar ideias de TCC." });
    }
  },

  async atualizarIdeiaTcc(req, res) {
    try {
      const { id: idIdeia } = req.params;
      const { titulo, descricao } = req.body;
      const idUsuario = req.user.id;

      const aluno = await Aluno.findOne({ where: { id_usuario: idUsuario } });
      if (!aluno) {
        return res.status(403).json({ error: "Acesso negado." });
      }

      const ideiaTcc = await IdeiaTcc.findByPk(idIdeia);
      if (!ideiaTcc || ideiaTcc.id_aluno !== aluno.id_aluno) {
        return res.status(404).json({
          error: "Ideia de TCC não encontrada ou não pertence a você.",
        });
      }

      if (ideiaTcc.status !== 0) {
        return res.status(403).json({
          error: "Não é possível editar uma proposta que já foi avaliada.",
        });
      }

      await ideiaTcc.update({ titulo, descricao });
      res.status(200).json(ideiaTcc);
    } catch (error) {
      console.error("Erro ao atualizar ideia de TCC:", error);
      res.status(500).json({ error: "Erro ao atualizar ideia de TCC." });
    }
  },

  async deletarIdeiaTcc(req, res) {
    try {
      const { id: idIdeia } = req.params;
      const idUsuario = req.user.id;

      const aluno = await Aluno.findOne({ where: { id_usuario: idUsuario } });
      if (!aluno) {
        return res.status(403).json({ error: "Acesso negado." });
      }

      const ideiaTcc = await IdeiaTcc.findByPk(idIdeia);
      if (!ideiaTcc || ideiaTcc.id_aluno !== aluno.id_aluno) {
        return res.status(404).json({
          error: "Ideia de TCC não encontrada ou não pertence a você.",
        });
      }

      if (ideiaTcc.status !== 0) {
        return res.status(403).json({
          error: "Não é possível excluir uma proposta que já foi avaliada.",
        });
      }

      await ideiaTcc.destroy();
      res.status(200).json({ message: "Ideia de TCC excluída com sucesso." });
    } catch (error) {
      console.error("Erro ao deletar ideia de TCC:", error);
      res.status(500).json({ error: "Erro ao deletar ideia de TCC." });
    }
  },
};

module.exports = ideiaTccController;
