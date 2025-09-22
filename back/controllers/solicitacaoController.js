const { SolicitacaoOrientacao, Aluno, Usuario } = require("../models");

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

  // Outros métodos como listar, aceitar, rejeitar podem ser adicionados aqui
};

module.exports = solicitacaoController;
