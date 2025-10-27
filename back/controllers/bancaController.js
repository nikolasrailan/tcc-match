const { Op, Sequelize } = require("sequelize");
const {
  Orientacao,
  Professor,
  AreaInteresse,
  IdeiaTcc,
  Banca, // Importa o model Banca
  Usuario, // Importa o model Usuario para buscar o nome
  sequelize,
} = require("../models");

// Função auxiliar para embaralhar um array (Fisher-Yates shuffle)
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]]; // Troca elementos
  }
}

const bancaController = {
  // Função para gerar as bancas
  async gerarBancas(req, res) {
    const t = await sequelize.transaction(); // Inicia transação
    try {
      // 1. Buscar todas as orientações finalizadas que ainda não têm banca
      const orientacoesFinalizadas = await Orientacao.findAll({
        where: {
          status: "finalizado",
          // Verifica se não existe uma banca associada
          "$banca.id_banca$": { [Op.is]: null },
        },
        include: [
          {
            model: IdeiaTcc,
            as: "ideiaTcc",
            required: true,
            include: [
              {
                model: AreaInteresse,
                as: "areasDeInteresse",
                attributes: ["id_area"], // Apenas IDs das áreas da ideia
                through: { attributes: [] },
              },
            ],
          },
          {
            model: Banca, // Inclui a associação com Banca para o filtro WHERE
            as: "banca",
            attributes: [], // Não precisa trazer dados da banca aqui
            required: false, // LEFT JOIN para permitir o filtro IS NULL
          },
        ],
        transaction: t, // Adiciona a transação
      });

      if (orientacoesFinalizadas.length === 0) {
        await t.rollback(); // Desfaz a transação se não há nada a fazer
        return res
          .status(200)
          .json({
            message: "Nenhuma orientação finalizada sem banca encontrada.",
          });
      }

      // 2. Buscar todos os professores com suas áreas de interesse
      const todosProfessores = await Professor.findAll({
        include: [
          {
            model: AreaInteresse,
            as: "areasDeInteresse",
            attributes: ["id_area"], // Apenas IDs das áreas do professor
            through: { attributes: [] },
          },
        ],
        transaction: t, // Adiciona a transação
      });

      const bancasCriadas = [];
      const erros = [];

      // 3. Iterar sobre cada orientação finalizada
      for (const orientacao of orientacoesFinalizadas) {
        const idOrientador = orientacao.id_professor;
        const areasIdeiaSet = new Set(
          orientacao.ideiaTcc.areasDeInteresse.map((a) => a.id_area)
        );

        // 4. Filtrar professores elegíveis
        let professoresElegiveis = todosProfessores.filter((prof) => {
          // Não pode ser o orientador
          if (prof.id_professor === idOrientador) return false;

          // Verifica se há pelo menos uma área de interesse em comum
          const areasProfSet = new Set(
            prof.areasDeInteresse.map((a) => a.id_area)
          );
          const intersection = new Set(
            [...areasIdeiaSet].filter((x) => areasProfSet.has(x))
          );
          return intersection.size > 0;
        });

        // 5. Sortear 3 professores (se houver suficientes)
        shuffleArray(professoresElegiveis); // Embaralha para aleatoriedade
        const avaliadoresSelecionados = professoresElegiveis.slice(0, 3);

        // 6. Criar a entrada na tabela Banca
        try {
          const novaBanca = await Banca.create(
            {
              id_orientacao: orientacao.id_orientacao,
              id_avaliador1: avaliadoresSelecionados[0]?.id_professor || null,
              id_avaliador2: avaliadoresSelecionados[1]?.id_professor || null,
              id_avaliador3: avaliadoresSelecionados[2]?.id_professor || null,
              // data_defesa e local_defesa podem ser definidos depois
            },
            { transaction: t }
          ); // Adiciona a transação
          bancasCriadas.push(novaBanca.id_banca); // Guarda ID da banca criada

          // Adiciona alerta se não encontrou 3 professores
          if (avaliadoresSelecionados.length < 3) {
            erros.push(
              `Orientação ID ${orientacao.id_orientacao}: Encontrados apenas ${avaliadoresSelecionados.length} avaliadores compatíveis.`
            );
          }
        } catch (error) {
          // Verifica se o erro é de violação de chave única (banca já existe)
          if (error.name === "SequelizeUniqueConstraintError") {
            erros.push(
              `Orientação ID ${orientacao.id_orientacao}: Banca já existe.`
            );
          } else {
            erros.push(
              `Erro ao criar banca para Orientação ID ${orientacao.id_orientacao}: ${error.message}`
            );
          }
          // Continua para a próxima orientação mesmo se uma falhar
        }
      }

      await t.commit(); // Confirma a transação

      res.status(201).json({
        message: `Processo finalizado. ${bancasCriadas.length} bancas criadas/atualizadas.`,
        bancasCriadasIds: bancasCriadas,
        alertas: erros, // Retorna os erros/alertas ocorridos
      });
    } catch (error) {
      await t.rollback(); // Desfaz a transação em caso de erro geral
      console.error("Erro ao gerar bancas:", error);
      res
        .status(500)
        .json({ error: "Ocorreu um erro interno ao gerar as bancas." });
    }
  },

  // Função para listar as bancas geradas (para o admin visualizar)
  async listarBancas(req, res) {
    try {
      const bancas = await Banca.findAll({
        include: [
          {
            model: Orientacao,
            as: "orientacao",
            attributes: ["id_orientacao"], // Apenas ID da orientação
            include: [
              {
                model: Aluno,
                as: "aluno",
                include: {
                  model: Usuario,
                  as: "dadosUsuario",
                  attributes: ["nome"],
                },
              },
              {
                model: Professor,
                as: "professor",
                include: {
                  model: Usuario,
                  as: "usuario",
                  attributes: ["nome"],
                },
              }, // Orientador
              { model: IdeiaTcc, as: "ideiaTcc", attributes: ["titulo"] },
            ],
          },
          {
            model: Professor,
            as: "avaliador1",
            include: { model: Usuario, as: "usuario", attributes: ["nome"] },
          },
          {
            model: Professor,
            as: "avaliador2",
            include: { model: Usuario, as: "usuario", attributes: ["nome"] },
          },
          {
            model: Professor,
            as: "avaliador3",
            include: { model: Usuario, as: "usuario", attributes: ["nome"] },
          },
        ],
        order: [["createdAt", "DESC"]],
      });
      res.status(200).json(bancas);
    } catch (error) {
      console.error("Erro ao listar bancas:", error);
      res.status(500).json({ error: "Ocorreu um erro ao listar as bancas." });
    }
  },

  // Função para atualizar data e local da defesa (pelo Admin)
  async atualizarDetalhesBanca(req, res) {
    try {
      const { id_banca } = req.params;
      const { data_defesa, local_defesa } = req.body;

      const banca = await Banca.findByPk(id_banca);
      if (!banca) {
        return res.status(404).json({ error: "Banca não encontrada." });
      }

      const dadosAtualizar = {};
      if (data_defesa !== undefined)
        dadosAtualizar.data_defesa = data_defesa || null; // Permite limpar a data
      if (local_defesa !== undefined)
        dadosAtualizar.local_defesa = local_defesa || null; // Permite limpar o local

      await banca.update(dadosAtualizar);

      res.status(200).json(banca);
    } catch (error) {
      console.error("Erro ao atualizar detalhes da banca:", error);
      res
        .status(500)
        .json({ error: "Ocorreu um erro ao atualizar os detalhes da banca." });
    }
  },
};

module.exports = bancaController;
