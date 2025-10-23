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
    // Inicia a transação
    const t = await sequelize.transaction();
    try {
      const { id_professor, id_ideia_tcc } = req.body;
      const idUsuario = req.user.id;

      // Verifica se o usuário é um aluno
      const aluno = await Aluno.findOne({ where: { id_usuario: idUsuario } });
      if (!aluno) {
        await t.rollback(); // Desfaz a transação
        return res
          .status(403)
          .json({ error: "Apenas alunos podem enviar solicitações." });
      }

      // Verifica se a ideia existe e pertence ao aluno
      const ideia = await IdeiaTcc.findOne({
        where: { id_ideia_tcc: id_ideia_tcc, id_aluno: aluno.id_aluno },
      });
      if (!ideia) {
        await t.rollback();
        return res
          .status(404)
          .json({
            error: "Ideia de TCC não encontrada ou não pertence a você.",
          });
      }
      // Verifica se a ideia já está em avaliação ou aprovada
      if (ideia.status !== 0) {
        await t.rollback();
        return res.status(400).json({
          error: "Esta ideia já está em avaliação ou foi aprovada.",
        });
      }

      // Verifica se o aluno já tem uma orientação ativa
      const orientacaoAtiva = await Orientacao.findOne({
        where: {
          id_aluno: aluno.id_aluno,
          status: ["em desenvolvimento", "pausado"],
        },
      });

      if (orientacaoAtiva) {
        await t.rollback();
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
        await t.rollback();
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
        await t.rollback();
        return res.status(409).json({
          error: "Já existe uma solicitação pendente para esta ideia de TCC.",
        });
      }

      // Cria a solicitação dentro da transação
      const novaSolicitacao = await SolicitacaoOrientacao.create(
        {
          id_aluno: aluno.id_aluno,
          id_professor,
          id_ideia_tcc,
        },
        { transaction: t }
      );

      // Atualiza o status da ideia para 'Em avaliação' (1) dentro da transação
      await ideia.update({ status: 1 }, { transaction: t });

      // Confirma a transação
      await t.commit();

      res.status(201).json(novaSolicitacao);
    } catch (error) {
      // Desfaz a transação em caso de erro
      await t.rollback();
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
    // Inicia a transação
    const t = await sequelize.transaction();
    try {
      const { id } = req.params;
      const idUsuario = req.user.id;

      const aluno = await Aluno.findOne({ where: { id_usuario: idUsuario } });
      if (!aluno) {
        await t.rollback();
        return res.status(403).json({ error: "Acesso negado." });
      }

      const solicitacao = await SolicitacaoOrientacao.findOne({
        where: { id_solicitacao: id, id_aluno: aluno.id_aluno },
      });

      if (!solicitacao) {
        await t.rollback();
        return res.status(404).json({ error: "Solicitação não encontrada." });
      }

      if (solicitacao.status !== 0) {
        await t.rollback();
        return res.status(400).json({
          error: "Apenas solicitações pendentes podem ser canceladas.",
        });
      }

      // Encontra a ideia associada
      const ideia = await IdeiaTcc.findByPk(solicitacao.id_ideia_tcc);
      if (!ideia) {
        // Embora improvável, é bom verificar
        await t.rollback();
        return res
          .status(404)
          .json({ error: "Ideia de TCC associada não encontrada." });
      }

      // Atualiza o status da solicitação para Cancelada (3)
      solicitacao.status = 3;
      await solicitacao.save({ transaction: t });

      // Volta o status da ideia para Pendente (0)
      await ideia.update({ status: 0 }, { transaction: t });

      // Confirma a transação
      await t.commit();

      res.status(200).json({ message: "Solicitação cancelada com sucesso." });
    } catch (error) {
      // Desfaz a transação em caso de erro
      await t.rollback();
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
        include: [{ model: IdeiaTcc, as: "ideiaTcc" }], // Inclui a ideia para atualizar status
      });

      if (!solicitacao) {
        await t.rollback();
        return res.status(404).json({ error: "Solicitação não encontrada." });
      }

      if (solicitacao.status !== 0) {
        // Verifica se está pendente (0)
        await t.rollback();
        return res
          .status(400)
          .json({ error: "Esta solicitação já foi respondida." });
      }

      const ideia = solicitacao.ideiaTcc;
      if (!ideia) {
        await t.rollback();
        return res
          .status(404)
          .json({ error: "Ideia de TCC associada não encontrada." });
      }

      // Se estiver aceitando
      if (aceito) {
        // Verifica o limite
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

        // Atualiza o status da ideia para Aprovado (2)
        await ideia.update({ status: 2 }, { transaction: t });
        solicitacao.status = 1; // Aceito
      } else {
        // Se estiver rejeitando
        // Volta o status da ideia para Pendente (0)
        await ideia.update({ status: 0 }, { transaction: t });
        solicitacao.status = 2; // Rejeitado
      }

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
