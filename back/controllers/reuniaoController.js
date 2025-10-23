const { Reuniao, Orientacao, Aluno, Professor, Usuario } = require("../models");
const { Op, Sequelize } = require("sequelize"); // Importa Op e Sequelize

const reuniaoController = {
  // Lista reuniões de UMA orientação específica
  async listarReunioes(req, res) {
    try {
      const { id_orientacao } = req.params;
      const reunioes = await Reuniao.findAll({
        where: { id_orientacao },
        order: [["data_horario", "DESC"]],
      });
      res.status(200).json(reunioes);
    } catch (error) {
      console.error("Erro ao listar reuniões:", error);
      res.status(500).json({ error: "Erro ao listar reuniões." });
    }
  },

  // Lista TODAS as reuniões futuras de um PROFESSOR
  async listarReunioesProfessor(req, res) {
    try {
      const idUsuario = req.user.id;
      const professor = await Professor.findOne({
        where: { id_usuario: idUsuario },
      });

      if (!professor) {
        return res.status(403).json({ error: "Usuário não é um professor." });
      }

      const reunioes = await Reuniao.findAll({
        include: [
          {
            model: Orientacao,
            as: "orientacao",
            where: { id_professor: professor.id_professor },
            attributes: [], // Não precisa dos dados da orientação aqui
            include: [
              {
                model: Aluno,
                as: "aluno",
                include: {
                  model: Usuario,
                  as: "dadosUsuario",
                  attributes: ["nome"], // Pega o nome do aluno
                },
              },
            ],
          },
        ],
        where: {
          data_horario: {
            [Op.gte]: new Date(), // Apenas reuniões futuras
          },
          status: "marcada", // Apenas reuniões marcadas
        },
        order: [["data_horario", "ASC"]], // Ordena pela data mais próxima
      });

      res.status(200).json(reunioes);
    } catch (error) {
      console.error("Erro ao listar reuniões do professor:", error);
      res.status(500).json({ error: "Erro ao listar reuniões do professor." });
    }
  },

  async criarReuniao(req, res) {
    try {
      const { id_orientacao } = req.params;
      const { data_horario, pauta } = req.body;
      const idUsuario = req.user.id; // Assume que o usuário logado está agendando

      // Verifica se a orientação existe
      const orientacao = await Orientacao.findByPk(id_orientacao, {
        include: [
          { model: Aluno, as: "aluno" },
          { model: Professor, as: "professor" },
        ],
      });
      if (!orientacao) {
        return res.status(404).json({ error: "Orientação não encontrada." });
      }

      // Verifica se o usuário logado é o aluno ou o professor da orientação
      const isAluno = orientacao.aluno.id_usuario === idUsuario;
      const isProfessor = orientacao.professor.id_usuario === idUsuario;
      if (!isAluno && !isProfessor) {
        return res
          .status(403)
          .json({
            error: "Você não tem permissão para agendar nesta orientação.",
          });
      }

      const id_professor = orientacao.id_professor;
      const dataInicio = new Date(data_horario);
      const dataFim = new Date(dataInicio.getTime() + 60 * 60 * 1000); // Adiciona 1 hora

      // Verifica conflito de horário para o PROFESSOR
      const conflito = await Reuniao.findOne({
        include: [
          {
            model: Orientacao,
            as: "orientacao",
            where: { id_professor },
            attributes: [], // Não precisa trazer dados da orientação
          },
        ],
        where: {
          status: "marcada",
          [Op.or]: [
            // Verifica se a nova reunião começa durante outra
            {
              data_horario: {
                [Op.lt]: dataFim, // Menor que o fim da nova
                [Op.gte]: dataInicio, // Maior ou igual ao início da nova
              },
            },
            // Verifica se a nova reunião termina durante outra (considera 1h de duração)
            {
              [Op.and]: [
                Sequelize.where(
                  Sequelize.fn(
                    "DATE_ADD",
                    Sequelize.col("data_horario"),
                    Sequelize.literal("INTERVAL 1 HOUR")
                  ),
                  {
                    [Op.gt]: dataInicio, // Fim da existente > Início da nova
                    [Op.lte]: dataFim, // Fim da existente <= Fim da nova
                  }
                ),
              ],
            },
            // Verifica se a nova reunião envolve completamente outra
            {
              [Op.and]: [
                { data_horario: { [Op.lte]: dataInicio } }, // Existente começa antes ou no mesmo horário
                Sequelize.where(
                  Sequelize.fn(
                    "DATE_ADD",
                    Sequelize.col("data_horario"),
                    Sequelize.literal("INTERVAL 1 HOUR")
                  ),
                  { [Op.gte]: dataFim } // Existente termina depois ou no mesmo horário
                ),
              ],
            },
          ],
        },
      });

      if (conflito) {
        return res.status(409).json({
          error:
            "Conflito de horário. O professor já possui uma reunião marcada neste período.",
        });
      }

      const novaReuniao = await Reuniao.create({
        id_orientacao,
        data_horario: dataInicio, // Salva a data de início
        pauta,
        status: "marcada",
      });
      res.status(201).json(novaReuniao);
    } catch (error) {
      console.error("Erro ao criar reunião:", error);
      res.status(500).json({ error: "Erro ao criar reunião." });
    }
  },

  async atualizarReuniao(req, res) {
    try {
      const { id_reuniao } = req.params;
      const { data_horario, pauta, status } = req.body;
      const idUsuario = req.user.id; // Assume que o usuário logado está editando

      const reuniao = await Reuniao.findByPk(id_reuniao, {
        include: {
          model: Orientacao,
          as: "orientacao",
          include: ["aluno", "professor"],
        },
      });
      if (!reuniao) {
        return res.status(404).json({ message: "Reunião não encontrada." });
      }

      // Verifica permissão
      const isAluno = reuniao.orientacao.aluno.id_usuario === idUsuario;
      const isProfessor = reuniao.orientacao.professor.id_usuario === idUsuario;
      if (!isAluno && !isProfessor) {
        return res
          .status(403)
          .json({ error: "Você não tem permissão para editar esta reunião." });
      }

      // Se a data/hora está sendo alterada, verifica conflito
      if (
        data_horario &&
        data_horario !== reuniao.data_horario.toISOString().slice(0, 16)
      ) {
        const id_professor = reuniao.orientacao.id_professor;
        const dataInicio = new Date(data_horario);
        const dataFim = new Date(dataInicio.getTime() + 60 * 60 * 1000); // Adiciona 1 hora

        const conflito = await Reuniao.findOne({
          include: [
            {
              model: Orientacao,
              as: "orientacao",
              where: { id_professor },
              attributes: [],
            },
          ],
          where: {
            id_reuniao: { [Op.ne]: id_reuniao }, // Exclui a própria reunião da verificação
            status: "marcada",
            [Op.or]: [
              { data_horario: { [Op.lt]: dataFim, [Op.gte]: dataInicio } },
              {
                [Op.and]: [
                  Sequelize.where(
                    Sequelize.fn(
                      "DATE_ADD",
                      Sequelize.col("data_horario"),
                      Sequelize.literal("INTERVAL 1 HOUR")
                    ),
                    { [Op.gt]: dataInicio, [Op.lte]: dataFim }
                  ),
                ],
              },
              {
                [Op.and]: [
                  { data_horario: { [Op.lte]: dataInicio } },
                  Sequelize.where(
                    Sequelize.fn(
                      "DATE_ADD",
                      Sequelize.col("data_horario"),
                      Sequelize.literal("INTERVAL 1 HOUR")
                    ),
                    { [Op.gte]: dataFim }
                  ),
                ],
              },
            ],
          },
        });

        if (conflito) {
          return res.status(409).json({
            error:
              "Conflito de horário. O professor já possui outra reunião marcada neste período.",
          });
        }
      }

      const dataToUpdate = {};
      if (data_horario) dataToUpdate.data_horario = data_horario;
      if (pauta !== undefined) dataToUpdate.pauta = pauta; // Permite pauta vazia
      if (status) dataToUpdate.status = status;

      await reuniao.update(dataToUpdate);

      res.status(200).json(reuniao);
    } catch (error) {
      console.error("Erro ao atualizar reunião:", error);
      res.status(500).json({ error: "Erro ao atualizar reunião." });
    }
  },
};

module.exports = reuniaoController;
