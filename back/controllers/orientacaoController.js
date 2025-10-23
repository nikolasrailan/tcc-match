const {
  Orientacao,
  Aluno,
  Professor,
  IdeiaTcc,
  Usuario,
} = require("../models");
const { Op } = require("sequelize");

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
          return res.status(200).json([]);
        }
      } else if (role === "professor") {
        const professor = await Professor.findOne({
          where: { id_usuario: idUsuario },
        });
        if (professor) {
          where.id_professor = professor.id_professor;
        } else {
          return res.status(200).json([]);
        }
      } else {
        return res.status(200).json([]);
      }

      // Busca todas as orientações (ativas e inativas) para o usuário
      // O frontend vai filtrar/separar se necessário
      const orientacoes = await Orientacao.findAll({
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
        order: [
          // Ordena para mostrar ativas primeiro, depois por data
          Sequelize.literal(
            "CASE status WHEN 'em desenvolvimento' THEN 1 WHEN 'pausado' THEN 2 WHEN 'finalizado' THEN 3 WHEN 'encerrado' THEN 4 ELSE 5 END"
          ),
          ["data_inicio", "DESC"],
        ],
      });

      res.status(200).json(orientacoes);
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

      let hasPermission = false;
      const aluno = await Aluno.findOne({ where: { id_usuario: idUsuario } });
      const professor = await Professor.findOne({
        where: { id_usuario: idUsuario },
      });

      if (aluno && aluno.id_aluno === orientacao.id_aluno) {
        hasPermission = true;
      }
      if (professor && professor.id_professor === orientacao.id_professor) {
        hasPermission = true;
      }

      if (!hasPermission) {
        return res.status(403).json({
          error: "Você não tem permissão para editar esta orientação.",
        });
      }

      const allowedStatusUpdates = [
        "em desenvolvimento",
        "finalizado",
        "pausado",
      ];
      if (status && !allowedStatusUpdates.includes(status)) {
        return res.status(400).json({
          error: `Atualização de status inválida por esta rota. Use as rotas de cancelamento/encerramento.`,
        });
      }
      // Não permitir edição se já foi encerrada ou cancelada
      if (["cancelado", "encerrado"].includes(orientacao.status)) {
        return res
          .status(400)
          .json({ error: "Não é possível editar uma orientação encerrada." });
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

  async solicitarCancelamento(req, res) {
    try {
      const { id } = req.params;
      const idUsuario = req.user.id;

      const aluno = await Aluno.findOne({ where: { id_usuario: idUsuario } });
      if (!aluno) {
        return res
          .status(403)
          .json({ error: "Apenas alunos podem solicitar cancelamento." });
      }

      const orientacao = await Orientacao.findOne({
        where: { id_orientacao: id, id_aluno: aluno.id_aluno },
      });
      if (!orientacao) {
        return res.status(404).json({
          error: "Orientação não encontrada ou não pertence a este aluno.",
        });
      }

      if (
        orientacao.solicitacao_cancelamento !== "nenhuma" ||
        ["cancelado", "encerrado", "finalizado"].includes(orientacao.status)
      ) {
        return res.status(400).json({
          error: "Não é possível solicitar cancelamento nesta orientação.",
        });
      }

      await orientacao.update({ solicitacao_cancelamento: "aluno" });

      res
        .status(200)
        .json({ message: "Solicitação de cancelamento enviada ao professor." });
    } catch (error) {
      console.error("Erro ao solicitar cancelamento:", error);
      res
        .status(500)
        .json({ error: "Ocorreu um erro ao solicitar o cancelamento." });
    }
  },

  async confirmarCancelamento(req, res) {
    try {
      const { id } = req.params;
      const { feedback_cancelamento } = req.body;
      const idUsuario = req.user.id;

      const professor = await Professor.findOne({
        where: { id_usuario: idUsuario },
      });
      if (!professor) {
        return res
          .status(403)
          .json({ error: "Apenas professores podem confirmar cancelamento." });
      }

      const orientacao = await Orientacao.findOne({
        where: { id_orientacao: id, id_professor: professor.id_professor },
      });
      if (!orientacao) {
        return res.status(404).json({
          error: "Orientação não encontrada ou não pertence a este professor.",
        });
      }

      if (orientacao.solicitacao_cancelamento !== "aluno") {
        return res.status(400).json({
          error:
            "Não há solicitação de cancelamento pendente do aluno para esta orientação.",
        });
      }
      if (
        ["cancelado", "encerrado", "finalizado"].includes(orientacao.status)
      ) {
        return res.status(400).json({
          error: "Esta orientação já foi finalizada ou encerrada.",
        });
      }

      await orientacao.update({
        status: "encerrado",
        data_fim: new Date(),
        feedback_cancelamento: feedback_cancelamento || null,
        solicitacao_cancelamento: "nenhuma",
      });

      res.status(200).json({ message: "Orientação encerrada com sucesso." });
    } catch (error) {
      console.error("Erro ao confirmar cancelamento:", error);
      res
        .status(500)
        .json({ error: "Ocorreu um erro ao confirmar o cancelamento." });
    }
  },

  // Nova função para cancelamento direto pelo professor
  async cancelarOrientacaoProfessor(req, res) {
    try {
      const { id } = req.params; // id_orientacao
      const { feedback_cancelamento } = req.body; // Feedback opcional
      const idUsuario = req.user.id;

      const professor = await Professor.findOne({
        where: { id_usuario: idUsuario },
      });
      if (!professor) {
        return res
          .status(403)
          .json({ error: "Apenas professores podem cancelar orientações." });
      }

      const orientacao = await Orientacao.findOne({
        where: { id_orientacao: id, id_professor: professor.id_professor },
      });
      if (!orientacao) {
        return res.status(404).json({
          error: "Orientação não encontrada ou não pertence a este professor.",
        });
      }

      // Verifica se a orientação já não está encerrada/finalizada
      if (
        ["cancelado", "encerrado", "finalizado"].includes(orientacao.status)
      ) {
        return res.status(400).json({
          error: "Esta orientação já foi finalizada ou encerrada.",
        });
      }

      await orientacao.update({
        status: "encerrado",
        data_fim: new Date(),
        feedback_cancelamento: feedback_cancelamento || null,
        solicitacao_cancelamento: "professor", // Indica que foi o professor quem cancelou
      });

      res
        .status(200)
        .json({ message: "Orientação encerrada com sucesso pelo professor." });
    } catch (error) {
      console.error("Erro ao cancelar orientação pelo professor:", error);
      res
        .status(500)
        .json({ error: "Ocorreu um erro ao encerrar a orientação." });
    }
  },
};

module.exports = orientacaoController;
