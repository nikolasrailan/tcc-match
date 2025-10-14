const { AreaInteresse } = require("../models");
const { Op } = require("sequelize");

const areaInteresseController = {
  // Lista apenas áreas APROVADAS para o uso geral
  async listar(req, res) {
    try {
      const areas = await AreaInteresse.findAll({
        where: { status: "aprovada" },
        order: [["nome", "ASC"]],
      });
      res.status(200).json(areas);
    } catch (error) {
      res.status(500).json({ error: "Erro ao listar áreas de interesse." });
    }
  },

  // Lista apenas áreas PENDENTES para o admin
  async listarPendentes(req, res) {
    try {
      const areas = await AreaInteresse.findAll({
        where: { status: "pendente" },
        order: [["createdAt", "ASC"]],
      });
      res.status(200).json(areas);
    } catch (error) {
      res
        .status(500)
        .json({ error: "Erro ao listar áreas de interesse pendentes." });
    }
  },

  // Admin cria uma área já aprovada
  async criar(req, res) {
    try {
      const { nome } = req.body;
      const novaArea = await AreaInteresse.create({ nome, status: "aprovada" });
      res.status(201).json(novaArea);
    } catch (error) {
      res.status(500).json({ error: "Erro ao criar área de interesse." });
    }
  },

  // Professor sugere uma nova área (status pendente)
  async sugerir(req, res) {
    try {
      const { nome } = req.body;
      // Verifica se já não existe uma área aprovada ou pendente com o mesmo nome
      const areaExistente = await AreaInteresse.findOne({
        where: {
          nome,
          status: { [Op.or]: ["aprovada", "pendente"] },
        },
      });

      if (areaExistente) {
        return res
          .status(409)
          .json({
            error:
              "Esta área de interesse já existe ou está aguardando aprovação.",
          });
      }

      const novaArea = await AreaInteresse.create({ nome, status: "pendente" });
      res.status(201).json(novaArea);
    } catch (error) {
      res.status(500).json({ error: "Erro ao sugerir área de interesse." });
    }
  },

  // Admin aprova uma área
  async aprovar(req, res) {
    try {
      const { id } = req.params;
      const [updated] = await AreaInteresse.update(
        { status: "aprovada" },
        { where: { id_area: id, status: "pendente" } }
      );
      if (updated) {
        res.status(200).json({ message: "Área aprovada com sucesso." });
      } else {
        res.status(404).json({ message: "Área pendente não encontrada." });
      }
    } catch (error) {
      res.status(500).json({ error: "Erro ao aprovar área de interesse." });
    }
  },

  // Admin rejeita (deleta) uma área
  async rejeitar(req, res) {
    try {
      const { id } = req.params;
      const deleted = await AreaInteresse.destroy({
        where: { id_area: id, status: "pendente" },
      });
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Área pendente não encontrada." });
      }
    } catch (error) {
      res.status(500).json({ error: "Erro ao rejeitar área de interesse." });
    }
  },

  async atualizar(req, res) {
    try {
      const { id } = req.params;
      const { nome } = req.body;
      const [updated] = await AreaInteresse.update(
        { nome },
        { where: { id_area: id } }
      );
      if (updated) {
        const areaAtualizada = await AreaInteresse.findByPk(id);
        res.status(200).json(areaAtualizada);
      } else {
        res.status(404).json({ message: "Área de interesse não encontrada." });
      }
    } catch (error) {
      res.status(500).json({ error: "Erro ao atualizar área de interesse." });
    }
  },

  async deletar(req, res) {
    try {
      const { id } = req.params;
      const deleted = await AreaInteresse.destroy({ where: { id_area: id } });
      if (deleted) {
        res.status(204).send();
      } else {
        res.status(404).json({ message: "Área de interesse não encontrada." });
      }
    } catch (error) {
      res.status(500).json({ error: "Erro ao deletar área de interesse." });
    }
  },
};

module.exports = areaInteresseController;
