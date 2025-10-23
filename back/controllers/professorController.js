const {
  Professor,
  Usuario,
  AreaInteresse,
  SolicitacaoOrientacao,
  sequelize,
  Aluno,
  IdeiaTcc,
  Curso,
} = require("../models");
const { Op } = require("sequelize");

const professorController = {
  async getDashboardData(req, res) {
    try {
      const idUsuario = req.user.id;
      const professor = await Professor.findOne({
        where: { id_usuario: idUsuario },
      });

      if (!professor) {
        return res.status(403).json({ error: "Usuário não é um professor." });
      }

      const solicitacoesPendentes = await SolicitacaoOrientacao.findAll({
        where: { id_professor: professor.id_professor, status: 0 },
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
            include: [
              {
                model: AreaInteresse,
                as: "areasDeInteresse",
                attributes: ["id_area", "nome"],
                through: { attributes: [] },
              },
            ],
          },
        ],
        order: [["data_solicitacao", "DESC"]],
      });

      const orientandosAtuais = await SolicitacaoOrientacao.findAll({
        where: { id_professor: professor.id_professor, status: 1 },
        include: [
          {
            model: Aluno,
            as: "aluno",
            include: [
              {
                model: Usuario,
                as: "dadosUsuario",
                attributes: ["nome", "email"],
              },
              { model: Curso, as: "cursoInfo" },
            ],
          },
          {
            model: IdeiaTcc,
            as: "ideiaTcc",
            include: [
              {
                model: AreaInteresse,
                as: "areasDeInteresse",
                attributes: ["id_area", "nome"],
                through: { attributes: [] },
              },
            ],
          },
        ],
        order: [["data_solicitacao", "DESC"]],
      });

      const vagasDisponiveis =
        professor.limite_orientacoes - orientandosAtuais.length;

      const stats = {
        pendentes: solicitacoesPendentes.length,
        orientandos: orientandosAtuais.length,
        vagas: vagasDisponiveis < 0 ? 0 : vagasDisponiveis,
      };

      res.status(200).json({
        stats,
        solicitacoesPendentes,
        orientandosAtuais,
      });
    } catch (error) {
      console.error("Erro ao buscar dados do dashboard do professor:", error);
      res.status(500).json({ error: "Ocorreu um erro ao buscar os dados." });
    }
  },

  async criarProfessor(req, res) {
    try {
      const {
        disponibilidade,
        id_usuario,
        areasDeInteresse,
        limite_orientacoes,
      } = req.body;

      const usuarioExiste = await Usuario.findByPk(id_usuario);
      if (!usuarioExiste) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }

      const professorJaExiste = await Professor.findOne({
        where: { id_usuario },
      });
      if (professorJaExiste) {
        return res
          .status(400)
          .json({ error: "Este usuário já é um professor." });
      }

      const novoProfessor = await Professor.create({
        disponibilidade,
        id_usuario,
        limite_orientacoes,
      });

      if (areasDeInteresse && areasDeInteresse.length > 0) {
        await novoProfessor.setAreasDeInteresse(areasDeInteresse);
      }

      const professorCompleto = await Professor.findByPk(
        novoProfessor.id_professor,
        {
          include: ["usuario", "areasDeInteresse"],
        }
      );

      return res.status(201).json(professorCompleto);
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .json({ error: "Ocorreu um erro ao criar o perfil do professor." });
    }
  },
  async listarProfessores(req, res) {
    try {
      const professores = await Professor.findAll({
        include: [
          {
            model: Usuario,
            as: "usuario",
            attributes: ["id_usuario", "nome", "email"], // Apenas campos úteis
          },
          {
            model: AreaInteresse,
            as: "areasDeInteresse",
            attributes: ["id_area", "nome"],
            through: { attributes: [] },
          },
        ],
      });
      return res.status(200).json(professores);
    } catch (error) {
      console.error("Erro ao listar professores:", error);
      return res
        .status(500)
        .json({ error: "Ocorreu um erro ao processar a requisição." });
    }
  },

  async atualizarProfessor(req, res) {
    const { id } = req.params;
    const { disponibilidade, areasDeInteresse } = req.body;
    const userId = req.user.id;
    const isAdmin = req.user.role === "admin";

    try {
      const professor = await Professor.findByPk(id);

      if (!professor) {
        return res
          .status(404)
          .json({ error: "Perfil de professor não encontrado." });
      }

      if (professor.id_usuario !== userId && !isAdmin) {
        return res.status(403).json({
          error: "Permissão negada. Você só pode editar seu próprio perfil.",
        });
      }

      // Atualiza os campos se eles foram fornecidos
      if (disponibilidade !== undefined) {
        professor.disponibilidade = disponibilidade;
      }

      await professor.save();

      if (areasDeInteresse) {
        await professor.setAreasDeInteresse(areasDeInteresse);
      }

      const professorAtualizado = await Professor.findByPk(id, {
        include: ["usuario", "areasDeInteresse"],
      });

      return res.status(200).json(professorAtualizado);
    } catch (error) {
      console.error("Erro ao atualizar professor:", error);
      return res
        .status(500)
        .json({ error: "Ocorreu um erro ao atualizar o perfil do professor." });
    }
  },

  async deletarProfessor(req, res) {
    const { id } = req.params; // id_professor

    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Acesso negado." });
    }

    try {
      const numLinhasAfetadas = await Professor.destroy({
        where: { id_professor: id },
      });

      if (numLinhasAfetadas === 0) {
        return res
          .status(404)
          .json({ message: "Perfil de professor não encontrado." });
      }

      res
        .status(200)
        .json({ message: "Perfil de professor deletado com sucesso!" });
    } catch (error) {
      console.error("Erro ao deletar professor:", error);
      res.status(500).json({ message: "Erro ao deletar perfil de professor." });
    }
  },
  async listarProfessoresPublic(req, res) {
    try {
      const where = {};
      if (req.query.disponivel === "true") {
        where.disponibilidade = true;
      }

      const professores = await Professor.findAll({
        where,
        attributes: {
          include: [
            [
              sequelize.literal(`(
                SELECT COUNT(*)
                FROM solicitacao_orientacao AS so
                WHERE
                  so.id_professor = Professor.id_professor
                  AND so.status = 1
              )`),
              "orientandos_atuais",
            ],
          ],
        },
        include: [
          {
            model: Usuario,
            as: "usuario",
            attributes: ["nome", "email"],
          },
          {
            model: AreaInteresse,
            as: "areasDeInteresse",
            attributes: ["id_area", "nome"],
            through: { attributes: [] },
          },
        ],
        order: [
          ["disponibilidade", "DESC"],
          [{ model: Usuario, as: "usuario" }, "nome", "ASC"],
        ],
      });
      return res.status(200).json(professores);
    } catch (error) {
      console.error("Erro ao listar professores:", error);
      return res
        .status(500)
        .json({ error: "Ocorreu um erro ao processar a requisição." });
    }
  },

  async findMatchForIdeia(req, res) {
    try {
      const { id_ideia_tcc } = req.params;
      const idUsuario = req.user.id; // Garante que só o aluno logado pode fazer isso

      // Verifica se o requisitante é aluno
      const aluno = await Aluno.findOne({ where: { id_usuario: idUsuario } });
      if (!aluno) {
        return res.status(403).json({ error: "Acesso negado." });
      }

      // Busca a ideia e suas áreas de interesse
      const ideia = await IdeiaTcc.findByPk(id_ideia_tcc, {
        include: [
          {
            model: AreaInteresse,
            as: "areasDeInteresse",
            attributes: ["id_area"],
            through: { attributes: [] }, // Não trazer dados da tabela de junção
            required: false, // Inclui mesmo que não tenha áreas associadas
          },
        ],
      });

      if (!ideia || ideia.id_aluno !== aluno.id_aluno) {
        return res.status(404).json({
          error: "Ideia de TCC não encontrada ou não pertence a este aluno.",
        });
      }

      if (ideia.status !== 0) {
        return res
          .status(400)
          .json({ error: "Esta ideia não está disponível para match." });
      }

      const ideiaAreaIds = new Set(
        ideia.areasDeInteresse?.map((area) => area.id_area) || []
      );

      if (ideiaAreaIds.size === 0) {
        return res.status(400).json({
          error:
            "Sua ideia precisa ter áreas de interesse definidas para encontrar um match.",
        });
      }

      // Busca todos os professores disponíveis com suas áreas de interesse
      const professores = await Professor.findAll({
        where: { disponibilidade: true }, // Apenas professores disponíveis
        include: [
          {
            model: Usuario,
            as: "usuario",
            attributes: ["id_usuario", "nome"],
          },
          {
            model: AreaInteresse,
            as: "areasDeInteresse",
            attributes: ["id_area", "nome"], // Pega o nome aqui para exibir depois
            through: { attributes: [] },
            required: false, // Inclui mesmo que o professor não tenha áreas
          },
        ],
        // Adiciona contagem de orientações ativas para filtrar professores com vagas
        attributes: {
          include: [
            [
              sequelize.literal(`(
                SELECT COUNT(*)
                FROM orientacao AS o
                WHERE
                  o.id_professor = Professor.id_professor
                  AND o.status IN ('em desenvolvimento', 'pausado')
              )`),
              "orientacoes_ativas_count",
            ],
          ],
        },
      });

      if (!professores || professores.length === 0) {
        return res
          .status(404)
          .json({ error: "Nenhum professor disponível encontrado." });
      }

      let bestMatch = null;
      let maxScore = -1;

      for (const professor of professores) {
        // Verifica se o professor tem vagas
        const orientacoesAtivas =
          professor.dataValues.orientacoes_ativas_count || 0;
        if (orientacoesAtivas >= professor.limite_orientacoes) {
          continue; // Pula professor sem vagas
        }

        const professorAreaIds = new Set(
          professor.areasDeInteresse?.map((area) => area.id_area) || []
        );

        let currentScore = 0;
        for (const ideiaAreaId of ideiaAreaIds) {
          if (professorAreaIds.has(ideiaAreaId)) {
            currentScore++;
          }
        }

        if (currentScore > maxScore) {
          maxScore = currentScore;
          bestMatch = professor;
        }
      }

      if (maxScore === 0 || !bestMatch) {
        // Se maxScore for 0, significa que nenhum professor tinha áreas em comum OU
        // todos os professores com áreas em comum não tinham vagas.
        // Retornamos 404 para indicar que não há um match adequado *com vagas*.
        return res.status(404).json({
          error:
            "Nenhum professor com áreas de interesse compatíveis e vagas disponíveis foi encontrado.",
        });
      }

      // Retorna o melhor match encontrado
      res.status(200).json({
        id_professor: bestMatch.id_professor,
        nome: bestMatch.usuario.nome,
        areasDeInteresse: bestMatch.areasDeInteresse || [], // Retorna as áreas com nome
        matchScore: maxScore,
      });
    } catch (error) {
      console.error("Erro ao encontrar match:", error);
      res
        .status(500)
        .json({ error: "Ocorreu um erro ao tentar encontrar o match." });
    }
  },
};

module.exports = professorController;
