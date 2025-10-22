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
          // Se não encontrou aluno, retorna vazio (ou null como antes)
          return res.status(200).json([]);
        }
      } else if (role === "professor") {
        const professor = await Professor.findOne({
          where: { id_usuario: idUsuario },
        });
        if (professor) {
          where.id_professor = professor.id_professor;
        } else {
          // Se não encontrou professor, retorna vazio
          return res.status(200).json([]);
        }
      } else {
        // Se não for aluno nem professor (ex: admin sem perfil), retorna vazio
        return res.status(200).json([]);
      }

      // Excluir orientações já canceladas ou encerradas da busca principal,
      // a menos que queiramos um filtro específico para elas no futuro.
      where.status = { [Op.notIn]: ["cancelado", "encerrado"] };

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
        order: [["data_inicio", "DESC"]], // Ordenar
      });

      // Retorna array vazio se não houver orientações ativas
      res.status(200).json(orientacoes);
    } catch (error) {
      console.error("Erro ao buscar orientação:", error);
      res
        .status(500)
        .json({ error: "Ocorreu um erro ao buscar a orientação." });
    }
  },

  async updateOrientacao(req, res) {
    // Mantém a lógica original para editar detalhes gerais
    try {
      const { id } = req.params;
      const { url_projeto, observacoes, status } = req.body; // Status geral pode ser atualizado aqui também
      const idUsuario = req.user.id;
      const role = req.user.role;

      const orientacao = await Orientacao.findByPk(id);

      if (!orientacao) {
        return res.status(404).json({ error: "Orientação não encontrada." });
      }

      // Check permissions: only student or professor involved can update
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

      // Não permitir alterar status para cancelado/encerrado diretamente aqui
      const allowedStatusUpdates = [
        "em desenvolvimento",
        "finalizado",
        "pausado",
      ];
      if (status && !allowedStatusUpdates.includes(status)) {
        return res.status(400).json({
          error: `Atualização de status inválida por esta rota. Use as rotas de cancelamento.`,
        });
      }

      const toUpdate = {};
      if (url_projeto !== undefined) toUpdate.url_projeto = url_projeto;
      if (observacoes !== undefined) toUpdate.observacoes = observacoes;
      if (status !== undefined) toUpdate.status = status; // Apenas status permitidos

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
      const { id } = req.params; // id_orientacao
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

      // Verifica se já não foi solicitado ou cancelado/encerrado
      if (
        orientacao.solicitacao_cancelamento !== "nenhuma" ||
        ["cancelado", "encerrado"].includes(orientacao.status)
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

  // Nova função para professor confirmar cancelamento
  async confirmarCancelamento(req, res) {
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

      // Verifica se houve uma solicitação do aluno
      if (orientacao.solicitacao_cancelamento !== "aluno") {
        return res.status(400).json({
          error:
            "Não há solicitação de cancelamento pendente do aluno para esta orientação.",
        });
      }

      await orientacao.update({
        status: "encerrado", // Novo status final
        data_fim: new Date(),
        feedback_cancelamento: feedback_cancelamento || null, // Salva o feedback ou null
        solicitacao_cancelamento: "nenhuma", // Limpa a solicitação
      });

      res.status(200).json({ message: "Orientação encerrada com sucesso." });
    } catch (error) {
      console.error("Erro ao confirmar cancelamento:", error);
      res
        .status(500)
        .json({ error: "Ocorreu um erro ao confirmar o cancelamento." });
    }
  },
};

module.exports = orientacaoController;
