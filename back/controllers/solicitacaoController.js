const {
  SolicitacaoOrientacao,
  Aluno,
  Usuario,
  Professor,
  IdeiaTcc,
} = require("../models");

const solicitacaoController = {
  async criarSolicitacao(req, res) {
    try {
      const { id_professor, id_ideia_tcc } = req.body;
      const idUsuario = req.user.id;

      // Verifica se o usuário é um aluno
      const aluno = await Aluno.findOne({ where: { id_usuario: idUsuario } });
      if (!aluno) {
        return res
          .status(403)
          .json({ error: "Apenas alunos podem enviar solicitações." });
      }

      // Verifica se já existe uma solicitação pendente para a mesma ideia
      const solicitacaoExistente = await SolicitacaoOrientacao.findOne({
        where: {
          id_ideia_tcc,
          status: 0, // Pendente
        },
      });

      if (solicitacaoExistente) {
        return res.status(409).json({
          error: "Já existe uma solicitação pendente para esta ideia de TCC.",
        });
      }

      const novaSolicitacao = await SolicitacaoOrientacao.create({
        id_aluno: aluno.id_aluno,
        id_professor,
        id_ideia_tcc,
      });

      res.status(201).json(novaSolicitacao);
    } catch (error) {
      console.error("Erro ao criar solicitação:", error);
      res
        .status(500)
        .json({ error: "Ocorreu um erro ao criar a solicitação." });
    }
  },

  async getMinhasSolicitacoes(req, res) {
    try {
      const idUsuario = req.user.id;
      const aluno = await Aluno.findOne({ where: { id_usuario: idUsuario } });

      if (!aluno) {
        return res.status(403).json({ error: "Usuário não é um aluno." });
      }

      const solicitacoes = await SolicitacaoOrientacao.findAll({
        where: { id_aluno: aluno.id_aluno },
        include: [
          {
            model: Professor,
            as: "professor",
            include: {
              model: Usuario,
              as: "usuario",
              attributes: ["nome"],
            },
          },
          {
            model: IdeiaTcc,
            as: "ideiaTcc",
            attributes: ["titulo"],
          },
        ],
        order: [["data_solicitacao", "DESC"]],
      });

      res.status(200).json(solicitacoes);
    } catch (error) {
      console.error("Erro ao buscar solicitações:", error);
      res
        .status(500)
        .json({ error: "Ocorreu um erro ao buscar as solicitações." });
    }
  },

  async cancelarSolicitacao(req, res) {
    try {
      const { id } = req.params;
      const idUsuario = req.user.id;

      const aluno = await Aluno.findOne({ where: { id_usuario: idUsuario } });
      if (!aluno) {
        return res.status(403).json({ error: "Acesso negado." });
      }

      const solicitacao = await SolicitacaoOrientacao.findOne({
        where: { id_solicitacao: id, id_aluno: aluno.id_aluno },
      });

      if (!solicitacao) {
        return res.status(404).json({ error: "Solicitação não encontrada." });
      }

      if (solicitacao.status !== 0) {
        return res
          .status(400)
          .json({
            error: "Apenas solicitações pendentes podem ser canceladas.",
          });
      }

      solicitacao.status = 3; // Cancelada
      await solicitacao.save();

      res.status(200).json({ message: "Solicitação cancelada com sucesso." });
    } catch (error) {
      console.error("Erro ao cancelar solicitação:", error);
      res
        .status(500)
        .json({ error: "Ocorreu um erro ao cancelar a solicitação." });
    }
  },
};

module.exports = solicitacaoController;
