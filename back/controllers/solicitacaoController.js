const {
  SolicitacaoOrientacao,
  Aluno,
  Usuario,
  Professor,
  IdeiaTcc,
  Orientacao,
  sequelize,
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

      // Verifica se o aluno já tem uma orientação ativa
      const orientacaoAtiva = await Orientacao.findOne({
        where: {
          id_aluno: aluno.id_aluno,
          status: ["em desenvolvimento", "pausado"],
        },
      });

      if (orientacaoAtiva) {
        return res.status(403).json({
          error:
            "Você já possui uma orientação ativa e não pode criar uma nova solicitação.",
        });
      }

      // Verifica se o aluno já possui alguma solicitação pendente
      const solicitacaoPendenteAluno = await SolicitacaoOrientacao.findOne({
        where: {
          id_aluno: aluno.id_aluno,
          status: 0, // Pendente
        },
      });

      if (solicitacaoPendenteAluno) {
        return res.status(409).json({
          error:
            "Você já possui uma solicitação de orientação pendente. Aguarde a resposta antes de enviar outra.",
        });
      }

      // Mantém a verificação para a ideia específica, garantindo a integridade
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
        return res.status(400).json({
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

  async getSolicitacoesParaProfessor(req, res) {
    try {
      const idUsuario = req.user.id;
      const professor = await Professor.findOne({
        where: { id_usuario: idUsuario },
      });

      if (!professor) {
        return res.status(403).json({ error: "Usuário não é um professor." });
      }

      const solicitacoes = await SolicitacaoOrientacao.findAll({
        where: { id_professor: professor.id_professor },
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
            model: IdeiaTcc,
            as: "ideiaTcc",
            attributes: ["titulo", "descricao"],
          },
        ],
        order: [["data_solicitacao", "DESC"]],
      });

      res.status(200).json(solicitacoes);
    } catch (error) {
      console.error("Erro ao buscar solicitações para o professor:", error);
      res
        .status(500)
        .json({ error: "Ocorreu um erro ao buscar as solicitações." });
    }
  },

  async responderSolicitacao(req, res) {
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { aceito } = req.body; // true para aceitar, false para rejeitar
      const idUsuario = req.user.id;

      const professor = await Professor.findOne({
        where: { id_usuario: idUsuario },
      });
      if (!professor) {
        await t.rollback();
        return res.status(403).json({ error: "Acesso negado." });
      }

      const solicitacao = await SolicitacaoOrientacao.findOne({
        where: { id_solicitacao: id, id_professor: professor.id_professor },
      });

      if (!solicitacao) {
        await t.rollback();
        return res.status(404).json({ error: "Solicitação não encontrada." });
      }

      if (solicitacao.status !== 0) {
        await t.rollback();
        return res
          .status(400)
          .json({ error: "Esta solicitação já foi respondida." });
      }

      // Se estiver aceitando, verifica o limite
      if (aceito) {
        const orientandosAtuais = await Orientacao.count({
          where: {
            id_professor: professor.id_professor,
            status: "em desenvolvimento",
          },
        });

        if (orientandosAtuais >= professor.limite_orientacoes) {
          await t.rollback();
          return res
            .status(403)
            .json({ error: "Limite de orientações atingido." });
        }

        // Inicia a orientação
        await Orientacao.create(
          {
            id_aluno: solicitacao.id_aluno,
            id_professor: solicitacao.id_professor,
            id_ideia_tcc: solicitacao.id_ideia_tcc,
            data_inicio: new Date(),
            status: "em desenvolvimento",
          },
          { transaction: t }
        );
      }

      solicitacao.status = aceito ? 1 : 2; // 1: Aceito, 2: Rejeitado
      await solicitacao.save({ transaction: t });

      await t.commit();

      res.status(200).json({ message: "Solicitação respondida com sucesso." });
    } catch (error) {
      await t.rollback();
      console.error("Erro ao responder solicitação:", error);
      res
        .status(500)
        .json({ error: "Ocorreu um erro ao responder a solicitação." });
    }
  },
};

module.exports = solicitacaoController;
